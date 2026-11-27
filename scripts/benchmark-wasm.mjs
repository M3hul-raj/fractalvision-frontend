#!/usr/bin/env node
/**
 * Reproducible JS vs WebAssembly box-counting benchmark.
 *
 * Executes the actual TypeScript implementation (src/lib/wasm/boxCountingJs.ts)
 * and the committed Emscripten WASM build (public/wasm/box_counting.{js,wasm})
 * in the same V8 realm, with warm-up iterations and median-of-N timings.
 *
 * Usage:
 *   npm run benchmark
 *   node scripts/benchmark-wasm.mjs --runs 30 --warmup 10 --json
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const opts = { warmup: 10, runs: 30, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--warmup" && argv[i + 1]) {
      opts.warmup = Math.max(1, Number.parseInt(argv[++i], 10));
    } else if (argv[i] === "--runs" && argv[i + 1]) {
      opts.runs = Math.max(3, Number.parseInt(argv[++i], 10));
    } else if (argv[i] === "--json") {
      opts.json = true;
    }
  }
  return opts;
}

function loadRunBoxCountingJs() {
  const tsPath = path.join(FRONTEND_ROOT, "src/lib/wasm/boxCountingJs.ts");
  const tsSource = fs.readFileSync(tsPath, "utf8");
  const { outputText } = ts.transpileModule(tsSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  // Load inside a temp CJS file in the main V8 realm (avoids vm.runInNewContext TypedArray deopts).
  const tmpPath = path.join(
    os.tmpdir(),
    `fractalvision-bc-js-${process.pid}-${Date.now()}.cjs`,
  );
  fs.writeFileSync(tmpPath, outputText, "utf8");
  try {
    return require(tmpPath).runBoxCountingJs;
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return {
    median,
    p95: sorted[p95Idx],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function makeSyntheticPattern(size, densityMode) {
  const pixels = new Uint8Array(size * size);
  if (densityMode === "dense") {
    pixels.fill(255); // immediate break in boxCount -> isolates boundary/marshaling overhead
  } else {
    for (let i = 0; i < pixels.length; i += 97) {
      pixels[i] = 255; // ~1.03% sparse pattern -> exercises inner scan loops
    }
  }
  return pixels;
}

function benchmarkCase({ name, width, height, pixels, warmup, runs, runBoxCountingJs, runWasm }) {
  for (let i = 0; i < warmup; i++) {
    runBoxCountingJs(pixels, width, height);
    runWasm(pixels, width, height);
  }

  const jsTimes = [];
  const wasmTimes = [];
  let jsRes;
  let wasmRes;

  for (let i = 0; i < runs; i++) {
    // Alternate order to reduce thermal/GC bias across runs
    if (i % 2 === 0) {
      const t0 = performance.now();
      jsRes = runBoxCountingJs(pixels, width, height);
      jsTimes.push(performance.now() - t0);

      const t1 = performance.now();
      wasmRes = runWasm(pixels, width, height);
      wasmTimes.push(performance.now() - t1);
    } else {
      const t1 = performance.now();
      wasmRes = runWasm(pixels, width, height);
      wasmTimes.push(performance.now() - t1);

      const t0 = performance.now();
      jsRes = runBoxCountingJs(pixels, width, height);
      jsTimes.push(performance.now() - t0);
    }
  }

  const dDiff = Math.abs(jsRes.fractal_dimension - wasmRes.fractal_dimension);
  const countsMatch =
    jsRes.box_counts.length === wasmRes.box_counts.length &&
    jsRes.box_counts.every((v, idx) => v === wasmRes.box_counts[idx]);
  if (!countsMatch || dDiff > 1e-9) {
    throw new Error(
      `Mismatch on ${name}: countsMatch=${countsMatch}, dDiff=${dDiff}`,
    );
  }

  const jsStats = summarize(jsTimes);
  const wasmStats = summarize(wasmTimes);
  return {
    name,
    width,
    height,
    pixels: pixels.length,
    jsMedianMs: jsStats.median,
    jsP95Ms: jsStats.p95,
    wasmMedianMs: wasmStats.median,
    wasmP95Ms: wasmStats.p95,
    speedupJsOverWasm: jsStats.median / wasmStats.median,
    dDiff,
  };
}

function measureWasmBreakdown({ width, height, pixels, wasm, warmup, runs }) {
  const copyTimes = [];
  const kernelTimes = [];
  const decodeTimes = [];

  const runOnce = (record) => {
    const t0 = performance.now();
    const ptr = wasm._malloc(pixels.length);
    wasm.HEAPU8.set(pixels, ptr);
    const t1 = performance.now();

    const resPtr = wasm._wasm_run_analysis(ptr, width, height);
    const t2 = performance.now();

    const json = wasm.UTF8ToString(resPtr);
    wasm._wasm_free(resPtr);
    wasm._free(ptr);
    JSON.parse(json);
    const t3 = performance.now();

    if (record) {
      copyTimes.push(t1 - t0);
      kernelTimes.push(t2 - t1);
      decodeTimes.push(t3 - t2);
    }
  };

  for (let i = 0; i < warmup; i++) runOnce(false);
  for (let i = 0; i < runs; i++) runOnce(true);

  return {
    copyMedianMs: summarize(copyTimes).median,
    kernelAndCppJsonMedianMs: summarize(kernelTimes).median,
    utf8AndParseMedianMs: summarize(decodeTimes).median,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const runBoxCountingJs = loadRunBoxCountingJs();
  const createBoxCountingModule = require(
    path.join(FRONTEND_ROOT, "public/wasm/box_counting.js"),
  );
  const wasmPath = path.join(FRONTEND_ROOT, "public/wasm/box_counting.wasm");
  const wasmBinary = fs.readFileSync(wasmPath);

  const tInit0 = performance.now();
  const wasm = await createBoxCountingModule({ wasmBinary });
  const wasmInitMs = performance.now() - tInit0;

  function runWasm(pixels, width, height) {
    const ptr = wasm._malloc(pixels.length);
    if (ptr === 0) throw new Error("WASM malloc failed");
    wasm.HEAPU8.set(pixels, ptr);
    const resultPtr = wasm._wasm_run_analysis(ptr, width, height);
    const json = wasm.UTF8ToString(resultPtr);
    wasm._wasm_free(resultPtr);
    wasm._free(ptr);
    return JSON.parse(json);
  }

  const syntheticResults = [];
  for (const size of [128, 256, 512, 1024, 2048]) {
    for (const mode of ["sparse", "dense"]) {
      const pixels = makeSyntheticPattern(size, mode);
      syntheticResults.push(
        benchmarkCase({
          name: `${size}x${size} (${mode})`,
          width: size,
          height: size,
          pixels,
          warmup: opts.warmup,
          runs: opts.runs,
          runBoxCountingJs,
          runWasm,
        }),
      );
    }
  }

  const fixtureNames = [
    "cantor_set",
    "koch_curve",
    "koch_snowflake",
    "sierpinski_triangle",
    "sierpinski_carpet",
  ];
  const fixtureResults = [];
  for (const name of fixtureNames) {
    const fixPath = path.join(FRONTEND_ROOT, "tests/fixtures", `${name}.json`);
    const fixture = JSON.parse(fs.readFileSync(fixPath, "utf8"));
    const pixels = new Uint8Array(Buffer.from(fixture.pixels_base64, "base64"));
    const res = benchmarkCase({
      name: `${name} (${fixture.foreground_pct}%)`,
      width: fixture.width,
      height: fixture.height,
      pixels,
      warmup: opts.warmup,
      runs: opts.runs,
      runBoxCountingJs,
      runWasm,
    });
    res.foregroundPct = fixture.foreground_pct;
    fixtureResults.push(res);
  }

  const breakdown1024Sparse = measureWasmBreakdown({
    width: 1024,
    height: 1024,
    pixels: makeSyntheticPattern(1024, "sparse"),
    wasm,
    warmup: opts.warmup,
    runs: opts.runs,
  });
  const breakdown1024Dense = measureWasmBreakdown({
    width: 1024,
    height: 1024,
    pixels: makeSyntheticPattern(1024, "dense"),
    wasm,
    warmup: opts.warmup,
    runs: opts.runs,
  });

  const cpus = os.cpus();
  const env = {
    nodeVersion: process.version,
    v8Version: process.versions.v8,
    platform: `${os.platform()} ${os.release()} (${os.arch()})`,
    cpuModel: cpus[0]?.model ?? "unknown",
    cpuCores: cpus.length,
    wasmBytes: wasmBinary.length,
    warmup: opts.warmup,
    runs: opts.runs,
    wasmInitMs,
  };

  const report = {
    environment: env,
    synthetic: syntheticResults,
    fixtures: fixtureResults,
    wasmBreakdown1024: {
      sparse: breakdown1024Sparse,
      dense: breakdown1024Dense,
    },
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("=== FractalVision WASM vs JS Benchmark ===");
  console.log(
    `Environment: Node ${env.nodeVersion} (V8 ${env.v8Version}) | ${env.platform} | ${env.cpuModel} (${env.cpuCores} cores)`,
  );
  console.log(
    `WASM binary: ${env.wasmBytes.toLocaleString("en-US")} bytes | Instantiation (local buffer): ${wasmInitMs.toFixed(2)} ms`,
  );
  console.log(`Protocol: ${opts.warmup} warm-up runs, median of ${opts.runs} alternating runs\n`);

  const printTable = (title, rows) => {
    console.log(title);
    console.log(
      "Case".padEnd(30) +
        "JS med".padStart(10) +
        "WASM med".padStart(11) +
        "JS/WASM".padStart(10) +
        "Winner".padStart(12),
    );
    console.log("-".repeat(73));
    for (const r of rows) {
      const winner =
        r.speedupJsOverWasm >= 1.05
          ? `WASM ${r.speedupJsOverWasm.toFixed(2)}x`
          : r.speedupJsOverWasm <= 0.95
            ? `JS ${(1 / r.speedupJsOverWasm).toFixed(2)}x`
            : "Tied (~1.0x)";
      console.log(
        r.name.padEnd(30) +
          `${r.jsMedianMs.toFixed(3)}ms`.padStart(10) +
          `${r.wasmMedianMs.toFixed(3)}ms`.padStart(11) +
          `${r.speedupJsOverWasm.toFixed(2)}x`.padStart(10) +
          winner.padStart(12),
      );
    }
    console.log();
  };

  printTable("--- Synthetic Multi-Size Sweep ---", syntheticResults);
  printTable("--- Real 1024x1024 Fractal Fixtures ---", fixtureResults);

  console.log("--- 1024x1024 WASM Call Time Breakdown (median ms) ---");
  for (const [label, b] of [
    ["1024x1024 sparse", breakdown1024Sparse],
    ["1024x1024 dense ", breakdown1024Dense],
  ]) {
    console.log(
      `${label}: malloc+HEAPU8.set=${b.copyMedianMs.toFixed(3)}ms | _wasm_run_analysis(C+++JSON)=${b.kernelAndCppJsonMedianMs.toFixed(3)}ms | UTF8ToString+free+JSON.parse=${b.utf8AndParseMedianMs.toFixed(3)}ms`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
