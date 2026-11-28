#!/usr/bin/env node
/**
 * Post-deploy live smoke check for FractalVision Lab.
 *
 * Verifies:
 *   1. Frontend URL returns 200 OK
 *   2. Backend /api/v1/health returns 200 {"status": "healthy"}
 *   3. CORS preflight allows FRONTEND_URL (and blocks untrusted origins)
 *   4. Disguised non-image upload (fake.png) is rejected cleanly with 415
 *   5. /api/v1/analyze succeeds (200) on the sierpinski_triangle fixture PNG
 *
 * Exits 0 only if every check passes; exits 1 on any failure.
 *
 * Usage:
 *   npm run smoke
 *   node scripts/smoke-live.mjs --api-url http://localhost:8000/api/v1 --frontend-url http://localhost:3000
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "..");

const DEFAULT_FRONTEND_URL = "https://fractalvision-frontend.vercel.app";
const DEFAULT_API_URL =
  "https://fractalvision-backend-43382945646.us-central1.run.app/api/v1";

// Standard IEEE 802.3 CRC-32 table for PNG chunks.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

/** Encode an 8-bit grayscale pixel array into a valid PNG buffer (no external deps). */
export function encodeGrayscalePng(pixels, width, height) {
  if (pixels.length !== width * height) {
    throw new Error(`Expected ${width * height} pixels, got ${pixels.length}`);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter type 0 (None)
    const srcOffset = y * width;
    for (let x = 0; x < width; x++) {
      raw[y * stride + 1 + x] = pixels[srcOffset + x];
    }
  }
  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    makePngChunk("IHDR", ihdr),
    makePngChunk("IDAT", compressed),
    makePngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export function loadFixturePng(
  fixturePath = path.join(
    FRONTEND_ROOT,
    "tests/fixtures/sierpinski_triangle.json",
  ),
) {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const fgWhite = new Uint8Array(Buffer.from(fixture.pixels_base64, "base64"));
  // Backend Otsu uses THRESH_BINARY_INV (dark foreground on light background).
  const darkOnLight = new Uint8Array(fgWhite.length);
  for (let i = 0; i < fgWhite.length; i++) {
    darkOnLight[i] = 255 - fgWhite[i];
  }
  return {
    png: encodeGrayscalePng(darkOnLight, fixture.width, fixture.height),
    theoreticalDimension: fixture.theoretical_dimension,
    width: fixture.width,
    height: fixture.height,
  };
}

export function parseSmokeArgs(argv) {
  const opts = {
    frontendUrl: (process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL).replace(/\/+$/, ""),
    apiUrl: (
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_API_URL
    ).replace(/\/+$/, ""),
    timeoutMs: Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "25000", 10),
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--frontend-url" && argv[i + 1]) {
      opts.frontendUrl = argv[++i].replace(/\/+$/, "");
    } else if (argv[i] === "--api-url" && argv[i + 1]) {
      opts.apiUrl = argv[++i].replace(/\/+$/, "");
    } else if (argv[i] === "--timeout-ms" && argv[i + 1]) {
      opts.timeoutMs = Number.parseInt(argv[++i], 10);
    }
  }
  return opts;
}

export async function runSmokeChecks({
  frontendUrl = DEFAULT_FRONTEND_URL,
  apiUrl = DEFAULT_API_URL,
  timeoutMs = 25000,
  fetchImpl = fetch,
  fixture = loadFixturePng(),
} = {}) {
  const results = [];

  async function runCheck(name, fn) {
    const start = performance.now();
    try {
      const detail = await fn();
      results.push({
        name,
        ok: true,
        durationMs: Math.round(performance.now() - start),
        detail,
      });
    } catch (err) {
      results.push({
        name,
        ok: false,
        durationMs: Math.round(performance.now() - start),
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const withSignal = (init = {}) => ({
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });

  await runCheck("frontend", async () => {
    const res = await fetchImpl(frontendUrl, withSignal());
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    const html = await res.text();
    if (!html.includes("FractalVision")) {
      throw new Error("Frontend HTML missing expected FractalVision brand text");
    }
    return `200 OK (${frontendUrl})`;
  });

  await runCheck("health", async () => {
    const res = await fetchImpl(`${apiUrl}/health`, withSignal());
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    const data = await res.json();
    if (data?.status !== "healthy") {
      throw new Error(`Unexpected health payload: ${JSON.stringify(data)}`);
    }
    return `200 healthy (version=${data.version})`;
  });

  await runCheck("cors_preflight", async () => {
    const allowed = await fetchImpl(
      `${apiUrl}/analyze`,
      withSignal({
        method: "OPTIONS",
        headers: {
          Origin: frontendUrl,
          "Access-Control-Request-Method": "POST",
        },
      }),
    );
    if (allowed.status !== 200 && allowed.status !== 204) {
      throw new Error(`Expected 200/204 preflight, got ${allowed.status}`);
    }
    const acao = allowed.headers.get("access-control-allow-origin");
    if (acao !== frontendUrl) {
      throw new Error(`Expected ACAO=${frontendUrl}, got ${acao}`);
    }

    const untrusted = await fetchImpl(
      `${apiUrl}/health`,
      withSignal({
        headers: { Origin: "https://evil.example.com" },
      }),
    );
    const evilAcao = untrusted.headers.get("access-control-allow-origin");
    if (evilAcao) {
      throw new Error(`Untrusted origin received ACAO=${evilAcao}`);
    }
    return `allowed=${acao}; untrusted origin blocked`;
  });

  await runCheck("disguised_file_rejection", async () => {
    const form = new FormData();
    form.append(
      "file",
      new Blob(["not-an-image"], { type: "image/png" }),
      "fake.png",
    );
    const res = await fetchImpl(
      `${apiUrl}/analyze`,
      withSignal({ method: "POST", body: form }),
    );
    if (res.status !== 415) {
      const text = await res.text();
      throw new Error(`Expected 415, got ${res.status}: ${text}`);
    }
    return "415 Unsupported Media Type";
  });

  await runCheck("analyze_fixture", async () => {
    const form = new FormData();
    form.append(
      "file",
      new Blob([fixture.png], { type: "image/png" }),
      "sierpinski_triangle.png",
    );
    form.append("analysis_mode", "full_mask");
    form.append("threshold_method", "otsu");

    const res = await fetchImpl(
      `${apiUrl}/analyze`,
      withSignal({ method: "POST", body: form }),
    );
    if (res.status !== 200) {
      const text = await res.text();
      throw new Error(`Expected 200, got ${res.status}: ${text}`);
    }
    const body = await res.json();
    const d = body?.result?.fractal_dimension;
    const r2 = body?.result?.r_squared;
    if (typeof d !== "number" || Math.abs(d - fixture.theoreticalDimension) > 0.15) {
      throw new Error(
        `Unexpected D=${d} (expected within ±0.15 of ${fixture.theoreticalDimension})`,
      );
    }
    if (typeof r2 !== "number" || r2 < 0.98) {
      throw new Error(`Unexpected R²=${r2} (expected >= 0.98)`);
    }
    return `200 OK (D=${d.toFixed(4)}, R²=${r2.toFixed(4)})`;
  });

  const passed = results.every((r) => r.ok);
  return { passed, results };
}

async function main() {
  const opts = parseSmokeArgs(process.argv.slice(2));
  console.log("=== FractalVision Post-Deploy Smoke Checks ===");
  console.log(`Frontend: ${opts.frontendUrl}`);
  console.log(`API:      ${opts.apiUrl}\n`);

  const { passed, results } = await runSmokeChecks(opts);
  for (const r of results) {
    const tag = r.ok ? "PASS" : "FAIL";
    console.log(`[${tag}] ${r.name.padEnd(24)} (${r.durationMs}ms) — ${r.detail}`);
  }

  if (!passed) {
    console.error("\nSmoke check FAILED.");
    process.exit(1);
  }
  console.log("\nAll post-deploy smoke checks passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Smoke runner crashed:", err);
    process.exit(1);
  });
}
