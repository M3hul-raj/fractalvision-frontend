# WebAssembly vs JavaScript Box-Counting Benchmark

## How to Reproduce

Run from `fractalvision-frontend`:

```bash
npm run benchmark
```

The script (`scripts/benchmark-wasm.mjs`) loads:
- **JavaScript:** `src/lib/wasm/boxCountingJs.ts` (transpiled and loaded in the main V8 realm to avoid cross-realm `TypedArray` deoptimization).
- **WebAssembly:** `public/wasm/box_counting.js` + `public/wasm/box_counting.wasm` (compiled from `wasm/box_counting.cpp` with Emscripten `6.0.0`, `-O2`, `-s ALLOW_MEMORY_GROWTH=1`).

**Protocol:** `10` warm-up runs followed by `30` alternating JS/WASM runs per case, reporting median execution time, JS/WASM ratio, numerical parity (`|D_js - D_wasm| < 1e-9` and exact `box_counts` match), and a per-phase WASM boundary breakdown.

## Environment

- **Runtime:** Node `v24.13.0` (V8 `13.6.233.17-node.37`)
- **OS:** Windows (`win32 10.0.26300 x64`)
- **CPU:** 12th Gen Intel(R) Core(TM) i5-12500H (16 logical cores)
- **WASM Binary:** `142,163` bytes (`2.65 ms` local instantiation; browser first-run also includes network fetch of `.js` + `.wasm`)

## Measured Results

### Synthetic Multi-Size Sweep

- `sparse` (`~1.03%` foreground): models boundary/curve patterns where most grid boxes must scan every pixel before confirming empty.
- `dense` (`100%` foreground): triggers the inner-loop `break` on pixel 0 of every box, isolating fixed JS↔WASM boundary/marshaling cost.

| Case | JS Median | WASM Median | JS / WASM | Winner |
|---|---:|---:|---:|---|
| `128×128 (sparse)` | 0.040 ms | 0.073 ms | 0.55× | **JS (1.83× faster)** |
| `128×128 (dense)` | 0.008 ms | 0.032 ms | 0.25× | **JS (4.02× faster)** |
| `256×256 (sparse)` | 0.162 ms | 0.120 ms | 1.35× | WASM (1.35× faster) |
| `256×256 (dense)` | 0.029 ms | 0.041 ms | 0.71× | **JS (1.42× faster)** |
| `512×512 (sparse)` | 0.591 ms | 0.352 ms | 1.68× | WASM (1.68× faster) |
| `512×512 (dense)` | 0.087 ms | 0.066 ms | 1.32× | WASM (1.32× faster) |
| `1024×1024 (sparse)` | 2.402 ms | 1.426 ms | 1.68× | WASM (1.68× faster) |
| `1024×1024 (dense)` | 0.392 ms | 0.245 ms | 1.60× | WASM (1.60× faster) |
| `2048×2048 (sparse)` | 10.121 ms | 6.208 ms | 1.63× | WASM (1.63× faster) |
| `2048×2048 (dense)` | 1.569 ms | 0.970 ms | 1.62× | WASM (1.62× faster) |

### Real `1024×1024` Mathematical Fractal Fixtures (`tests/fixtures/*.json`)

| Fixture | Foreground % | JS Median | WASM Median | Speedup |
|---|---:|---:|---:|---|
| `cantor_set` | 0.049% | 6.358 ms | 4.197 ms | WASM 1.51× |
| `koch_curve` | 0.338% | 6.012 ms | 4.156 ms | WASM 1.45× |
| `koch_snowflake` | 0.817% | 5.125 ms | 3.648 ms | WASM 1.40× |
| `sierpinski_triangle` | 5.904% | 4.733 ms | 3.317 ms | WASM 1.43× |
| `sierpinski_carpet` | 25.000% | 3.848 ms | 2.587 ms | WASM 1.49× |

### `1024×1024` WASM Call Breakdown (Median)

| Workload | `malloc` + `HEAPU8.set` | `_wasm_run_analysis` (C++ + JSON build/re-parse) | `UTF8ToString` + `free` + `JSON.parse` |
|---|---:|---:|---:|
| `1024×1024 sparse` | 0.042 ms | 1.334 ms | 0.005 ms |
| `1024×1024 dense` | 0.038 ms | 0.184 ms | 0.003 ms |

## Why WASM Is Slower on Small/Dense Inputs (and Only ~1.4×–1.7× Faster at 1024×1024)

1. **V8 TurboFan JIT is already fast on flat typed arrays:** `boxCountingJs.ts` runs a tight loop over a contiguous `Uint8Array` with no heap allocations in the hot loop, which V8 compiles to near-native machine code.
2. **Per-call JS↔WASM marshaling and JSON round-tripping:** Every `runBoxCountingWasm` invocation allocates linear memory (`_malloc`), copies the pixel buffer (`HEAPU8.set`), serializes `box_counts` inside C++ using `std::ostringstream`, **parses that JSON back inside C++** (`compute_fractal_dimension` via `std::istringstream` + `std::stod`), serializes a merged JSON string, decodes UTF-8 back to JS, and calls `JSON.parse()`. On small (`128×128`) or early-exiting (`256×256 dense`) inputs, this fixed overhead exceeds JS compute time, making WASM **1.4×–4.0× slower**.
3. **Early-exit work asymmetry:** On dense patterns, `if (pixel === 255) break` exits almost immediately on each box; only sparse/fractal patterns at `≥512×512` perform enough inner-loop scanning for C++ (`-O2`) to beat V8 by ~`1.4×–1.7×` end-to-end.

## Accurate Resume Sentence

> Built and benchmarked a C++ WebAssembly (Emscripten `-O2`) box-counting engine against pure TypeScript in V8 across 128×128–2048×2048 images (10 warm-up, median of 30 runs), achieving 1.40×–1.51× speedup on 1024×1024 fractal fixtures while identifying JS–WASM boundary and JSON-serialization overhead that makes JS 1.4×–4.0× faster on small/early-exit inputs.
