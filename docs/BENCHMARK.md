# WebAssembly vs JavaScript Box-Counting Benchmark

## How to Reproduce

Run from `fractalvision-frontend`:

```bash
npm run benchmark
```

The script (`scripts/benchmark-wasm.mjs`) loads:
- **JavaScript:** `src/lib/wasm/boxCountingJs.ts` (transpiled and loaded in the main V8 realm to avoid cross-realm `TypedArray` deoptimization).
- **WebAssembly:** `public/wasm/box_counting.js` (`7,136` bytes) + `public/wasm/box_counting.wasm` (`13,114` bytes), compiled from `wasm/box_counting.cpp` with Emscripten `6.0.0`, `-O2`, `-s ALLOW_MEMORY_GROWTH=1`, using a flat `Float64Array` (`HEAPF64`) output ABI (`src/lib/wasm/wasmAbi.ts`) instead of JSON strings.

**Protocol:** `10` warm-up runs followed by `30` alternating JS/WASM runs per case, reporting median execution time, JS/WASM ratio, numerical parity (`|D_js - D_wasm| < 1e-9` and exact `box_counts` match), and a per-phase WASM boundary breakdown.

## Environment

- **Runtime:** Node `v24.13.0` (V8 `13.6.233.17-node.37`)
- **OS:** Windows (`win32 10.0.26300 x64`)
- **CPU:** 12th Gen Intel(R) Core(TM) i5-12500H (16 logical cores)
- **WASM Binary:** `13,114` bytes (reduced from `142,163` bytes after removing C++ `<sstream>`/`<string>` JSON serialization; `3.77 ms` local buffer instantiation)

## Before vs After Removing JSON Boundary Overhead

Baseline ("Before") was measured on `main` right before switching the ABI from JSON strings (`std::ostringstream` → `UTF8ToString` → `JSON.parse`) to a reusable `Float64Array` (`HEAPF64`) output buffer.

### Synthetic Multi-Size Sweep

| Case | Before: JS / WASM (Winner) | After: JS Median | After: WASM Median | After: JS / WASM | After Winner |
|---|---|---:|---:|---:|---|
| `128×128 (sparse)` | `0.054` / `0.118 ms` (**JS 2.19×**) | 0.054 ms | 0.052 ms | 1.03× | **Tied (~1.0×)** |
| `128×128 (dense)` | `0.011` / `0.046 ms` (**JS 4.07×**) | 0.010 ms | 0.005 ms | 1.96× | **WASM (1.96×)** |
| `256×256 (sparse)` | `0.195` / `0.151 ms` (WASM 1.29×) | 0.186 ms | 0.087 ms | 2.15× | **WASM (2.15×)** |
| `256×256 (dense)` | `0.036` / `0.056 ms` (**JS 1.55×**) | 0.034 ms | 0.017 ms | 2.00× | **WASM (2.00×)** |
| `512×512 (sparse)` | `0.736` / `0.448 ms` (WASM 1.64×) | 0.724 ms | 0.346 ms | 2.09× | **WASM (2.09×)** |
| `512×512 (dense)` | `0.123` / `0.094 ms` (WASM 1.31×) | 0.123 ms | 0.062 ms | 1.98× | **WASM (1.98×)** |
| `1024×1024 (sparse)` | `3.020` / `1.962 ms` (WASM 1.54×) | 2.998 ms | 1.560 ms | 1.92× | **WASM (1.92×)** |
| `1024×1024 (dense)` | `0.692` / `0.458 ms` (WASM 1.51×) | 0.481 ms | 0.271 ms | 1.77× | **WASM (1.77×)** |
| `2048×2048 (sparse)` | `13.802` / `8.574 ms` (WASM 1.61×) | 15.845 ms | 9.285 ms | 1.71× | **WASM (1.71×)** |
| `2048×2048 (dense)` | `2.047` / `1.451 ms` (WASM 1.41×) | 1.997 ms | 1.472 ms | 1.36× | **WASM (1.36×)** |

### Real `1024×1024` Mathematical Fractal Fixtures (`tests/fixtures/*.json`)

| Fixture | Foreground % | Before (JSON ABI) | After: JS Median | After: WASM Median | After Speedup |
|---|---:|---|---:|---:|---|
| `cantor_set` | 0.049% | `6.738` / `4.455 ms` (1.51×) | 7.289 ms | 3.932 ms | **WASM 1.85×** |
| `koch_curve` | 0.338% | `6.493` / `4.390 ms` (1.48×) | 7.173 ms | 3.822 ms | **WASM 1.88×** |
| `koch_snowflake` | 0.817% | `6.680` / `4.575 ms` (1.46×) | 6.595 ms | 3.472 ms | **WASM 1.90×** |
| `sierpinski_triangle` | 5.904% | `6.258` / `4.249 ms` (1.47×) | 6.320 ms | 3.398 ms | **WASM 1.86×** |
| `sierpinski_carpet` | 25.000% | `5.240` / `3.483 ms` (1.50×) | 5.545 ms | 3.320 ms | **WASM 1.67×** |

### `1024×1024` WASM Call Breakdown (Median)

| Workload | `malloc` + `HEAPU8.set` | `_wasm_run_analysis` (C++) | `HEAPF64` read + `_free` |
|---|---:|---:|---:|
| `1024×1024 sparse` | 0.197 ms | 2.489 ms | 0.009 ms |
| `1024×1024 dense` | 0.056 ms | 0.216 ms | 0.001 ms |

## Key Engineering Takeaways

1. **Removing JSON strings flipped small/early-exit inputs:** Eliminating `std::ostringstream` / `std::istringstream` inside C++, `UTF8ToString`, and `JSON.parse()` in JS cut `128×128 (dense)` WASM latency from `0.046 ms` down to `0.005 ms` (flipping from `4.07×` slower to `1.96×` faster) and `256×256 (dense)` from `0.056 ms` down to `0.017 ms` (`2.00×` faster), while shrinking `box_counting.wasm` by **90.8%** (`142,163` → `13,114` bytes).
2. **Why `128×128 (sparse)` is still roughly tied (`1.03×`):** At `16 KiB`, per-call input marshaling (`_malloc` + `HEAPU8.set` + `_free`) still costs nearly as much as the `~0.05 ms` pixel loop, while V8 TurboFan already compiles contiguous `Uint8Array` loops efficiently.
3. **Why speedup settles at `~1.7×–2.1×` (not `10×`):** Both C++ and JS run the same tight loop over raw bytes with early exit; V8 TurboFan is fast enough on flat typed arrays that WASM's advantage is a realistic `~1.7×–2.1×` once boundary serialization is removed.

## Accurate Resume Sentence

> Replaced JSON string marshaling with a shared Float64 typed-array ABI in a C++ WebAssembly (Emscripten `-O2`) box-counting engine, shrinking the `.wasm` binary by 91% (`142 KB` → `13 KB`), eliminating the small-image regression (`128×128 dense`: `0.046 ms` → `0.005 ms`), and achieving `1.67×–1.90×` median speedup over V8 TypeScript on `1024×1024` fractal fixtures.
