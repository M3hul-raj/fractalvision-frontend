# FractalVision Lab — Frontend

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?logo=vercel)](https://fractalvision-frontend.vercel.app)
[![Backend API](https://img.shields.io/badge/API-Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://fractalvision-backend-43382945646.us-central1.run.app/api/v1/health)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.7-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![FractalVision Lab Preview](public/preview.png)

Interactive scientific web application for estimating the box-counting (Minkowski–Bouligand) fractal dimension of natural patterns and standard mathematical fractals.

**Live Application:** [https://fractalvision-frontend.vercel.app](https://fractalvision-frontend.vercel.app)  
**Backend Repository:** [M3hul-raj/fractalvision-backend](https://github.com/M3hul-raj/fractalvision-backend)

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser["Browser (Next.js 16 · React 19 · TypeScript)"]
        UI["6 Interactive Modules\n/lab · /compare · /explorer\n/benchmarks · /coastline-paradox · /gallery"]
        State["Zustand Stores + D3.js + jsPDF"]
        WASM["Emscripten C++ WASM Engine\n(/benchmarks only)"]
        UI --> State
        UI --> WASM
    end

    subgraph CloudRun["Google Cloud Run (us-central1)"]
        API["FastAPI + OpenCV + SciPy\nPOST /api/v1/analyze\nPOST /api/v1/fractals/{id}/generate"]
    end

    subgraph Supabase["Supabase (Managed PostgreSQL + Storage)"]
        DB["specimens (12 rows)\nstandard_fractals (5 rows)"]
        STR["Specimen Image Bucket"]
    end

    UI -->|"Multipart image upload / JSON"| API
    UI -->|"Direct read-only queries (@supabase/supabase-js)"| DB
    UI -->|"Public specimen images"| STR
```

---

## Application Modules (6 Interactive + 3 Static)

The app exposes **9 Next.js App Router pages**: **6 interactive modules** and **3 informational/documentation pages**.

| # | Route | Kind | What It Does |
|---:|---|---|---|
| 1 | `/lab` | Interactive | Upload an image, configure 3 analysis modes × 3 thresholding methods + blur/denoise/sensitivity, inspect grid overlays (`PipelineViewer` + `BoxSizeSlider`), toggle scales (`ScaleRangeSelector` live client OLS), overlay specimens, and export a 2-page PDF. |
| 2 | `/compare` | Interactive | Side-by-side dual-slot (`A`/`B`) comparison of uploaded images or gallery specimens with independent preprocessing, overlaid `DualLogLogChart`, $\Delta D$ metrics, and Comparison PDF export. |
| 3 | `/explorer` | Interactive | Generate 5 standard mathematical fractals (Cantor Set, Koch Curve, Koch Snowflake, Sierpiński Triangle, Sierpiński Carpet) across configurable iterations, inspect in a pan/zoom lightbox, and compare computed vs theoretical $D$. |
| 4 | `/benchmarks` | Interactive | Client-side Otsu preprocessing and `performance.now()` comparison between pure TypeScript (`boxCountingJs.ts`) and Emscripten C++ WebAssembly (`box_counting.wasm`). |
| 5 | `/coastline-paradox` | Interactive | Client-side Richardson coastline paradox simulation (~25,601-point fractal coastline, greedy ruler walker 5–100 px, interactive HTML5 Canvas zoom/pan + minimap, D3 power-law curve). |
| 6 | `/gallery` | Interactive | Browse, filter (`All`/`Leaves`/`Coastlines`), and sort 12 dissertation specimens stored in Supabase Postgres, with modal inspection and inline D3 log-log plots. |
| — | `/`, `/methodology`, `/limitations` | Static | Landing overview and 2 scientific documentation pages. |

---

## Tech Stack (Actual)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| UI Library | React | 19.2.4 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | v4 |
| Visualization | D3.js + HTML5 Canvas | ^7.9.0 |
| State Management | Zustand | ^5.0.14 |
| Animation | Framer Motion | ^12.40.0 |
| PDF Export | jsPDF | ^4.2.1 |
| Database Client | `@supabase/supabase-js` | ^2.107.0 |
| WASM Toolchain | Emscripten (`emcc`) | 6.0.0 |
| Testing | Vitest | ^4.1.10 |

---

## WASM vs JavaScript Benchmark

Reproducible benchmark running `src/lib/wasm/boxCountingJs.ts` against `public/wasm/box_counting.{js,wasm}` (using a flat `Float64Array` ABI in `src/lib/wasm/wasmAbi.ts`, `13,114`-byte `.wasm`) in Node `v24.13.0` (`V8 13.6.233.17-node.37`, `win32 x64`, `Intel i5-12500H`, 10 warm-up runs, median of 30 alternating runs):

| Case | JS Median | WASM Median | Ratio (JS / WASM) | Winner |
|---|---:|---:|---:|---|
| `128×128 (sparse 1%)` | 0.054 ms | 0.052 ms | 1.03× | Tied (~1.0×) |
| `128×128 (dense 100%)` | 0.010 ms | 0.005 ms | 1.96× | WASM (1.96×) |
| `256×256 (dense 100%)` | 0.034 ms | 0.017 ms | 2.00× | WASM (2.00×) |
| `512×512 (sparse 1%)` | 0.724 ms | 0.346 ms | 2.09× | WASM (2.09×) |
| `1024×1024 (sparse 1%)` | 2.998 ms | 1.560 ms | 1.92× | WASM (1.92×) |
| `2048×2048 (sparse 1%)` | 15.845 ms | 9.285 ms | 1.71× | WASM (1.71×) |
| `cantor_set (1024×1024)` | 7.289 ms | 3.932 ms | 1.85× | WASM (1.85×) |
| `koch_curve (1024×1024)` | 7.173 ms | 3.822 ms | 1.88× | WASM (1.88×) |
| `sierpinski_triangle (1024×1024)` | 6.320 ms | 3.398 ms | 1.86× | WASM (1.86×) |
| `sierpinski_carpet (1024×1024)` | 5.545 ms | 3.320 ms | 1.67× | WASM (1.67×) |

**Key takeaway:** Switching from JSON strings to a reusable `Float64Array` (`HEAPF64`) output buffer shrank `box_counting.wasm` from `142,163` B to `13,114` B, flipped small dense runs from slower to `~2.0×` faster, and improved `1024×1024` fractal fixture speedups from `1.46×–1.51×` to `1.67×–1.90×` (with `128×128 sparse` tied at `1.03×` due to fixed buffer copy vs V8 JIT). Full before/after tables: [docs/BENCHMARK.md](docs/BENCHMARK.md).

---

## How to Run Locally

```bash
git clone https://github.com/M3hul-raj/fractalvision-frontend.git
cd fractalvision-frontend
npm install
cp .env.example .env.local
npm run dev
# http://localhost:3000
```

Environment variables (`.env.local`):

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (`http://localhost:8000/api/v1` for local dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL (needed only for `/gallery` and specimen picker) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase public read-only anon key |

---

## Test, Quality, Benchmark & Smoke Commands

```bash
npm run lint       # ESLint (0 errors, 0 warnings)
npm run typecheck  # tsc --noEmit
npm run test       # Vitest (12 tests across 4 files: boxCountingJs, wasmConsistency, apiClient, smokeLive)
npm run build      # Next.js production build
npm run benchmark  # Reproducible JS vs WASM benchmark across sizes & fixtures
npm run smoke      # Post-deploy live check (frontend 200, /health, CORS, 415 disguised file, /analyze fixture)
```

---

## Scientific & Engineering Limitations

- **Raster quantization & finite scale range:** Box-counting operates on pixel grids resized to max `1024 px` across powers of 2 (`4..min(w,h)/4`). Diagonal aliasing and finite iteration depths produce 1–5% error vs continuous Hausdorff/theoretical dimensions; client-side JS/WASM uses a single grid origin (causing ~0.10 underestimation on `sierpinski_carpet`), whereas the backend uses 4 grid offsets.
- **Preprocessing sensitivity:** Computed $D$ describes the *binarized mask*, not the raw physical specimen; illumination gradients, noise, or manual threshold choices shift $D$.
- **WASM scope:** WASM is used only on `/benchmarks`; while the typed-array ABI eliminated JSON overhead, V8 TurboFan executes flat `Uint8Array` loops fast enough that realistic WASM gains are `~1.7×–2.1×` (tied on tiny `128×128` sparse inputs).
- **No server-side analysis persistence:** Results live only in browser Zustand/session storage and PDF exports; `/gallery` reads a static 12-specimen dataset.
- **Backend cold starts / hosting constraints:** Cloud Run scales to zero when idle; keep-alive cron pings reduce cold starts, while Vercel Hobby requires strictly non-commercial usage.
