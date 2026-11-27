# Resume Facts — Proof & Verification Ledger

Every claim below is tied to a command you can re-run locally or in CI. Observed outputs are from branch `feat/engineering-hardening` (before PR merge).

## 1. Real Frontend Stack
- **Claim:** Frontend is built with **Next.js 16.2.7 (App Router), React 19.2.4, TypeScript 5 (strict), Tailwind CSS v4, D3.js 7.9, Zustand 5, jsPDF 4.2, and Emscripten WebAssembly** (not plain React/JavaScript).
- **Proof command:** `node -e "const p=require('./package.json'); console.log({next:p.dependencies.next, react:p.dependencies.react, ts:p.devDependencies.typescript, d3:p.dependencies.d3, zustand:p.dependencies.zustand})"` (in `fractalvision-frontend/`)
- **Also see:** `tsconfig.json` (`"strict": true`) and `src/app/**/page.tsx` (all `.tsx`).

## 2. Real Interactive Module Count
- **Claim:** **6 interactive analysis/visualization modules** across **9 total App Router routes**.
- **Interactive modules (6):**
  1. `/lab` (`src/app/lab/page.tsx`) — Analyzer Lab (image upload, 3 modes × 3 thresholds, box-counting grid microscope, live client-side scale-range OLS filter, quality/sensitivity diagnostics, PDF export)
  2. `/compare` (`src/app/compare/page.tsx`) — Compare Mode (dual-slot image/specimen comparison, overlaid D3 log-log chart, $\Delta D$, Comparison PDF export)
  3. `/explorer` (`src/app/explorer/page.tsx`) — Fractal Explorer (5 mathematical fractal generators, pan/zoom lightbox, theoretical vs computed $D$)
  4. `/benchmarks` (`src/app/benchmarks/page.tsx`) — WebAssembly Benchmark (client-side JS vs Emscripten C++ WASM timing & parity)
  5. `/coastline-paradox` (`src/app/coastline-paradox/page.tsx`) — Coastline Paradox Demo (~25,601-pt procedural coastline, greedy ruler walker, HTML5 Canvas zoom/pan, Richardson D3 plot)
  6. `/gallery` (`src/app/gallery/page.tsx`) — Dissertation Gallery (filter/sort/inspect 12 Supabase specimens with inline D3 charts)
- **Static pages (3):** `/` (`src/app/page.tsx`), `/methodology` (`src/app/methodology/page.tsx`), `/limitations` (`src/app/limitations/page.tsx`).
- **Proof command:** `find src/app -name page.tsx | sort` (or `Get-ChildItem -Recurse -Filter page.tsx src\app` on Windows).

## 3. WASM vs JavaScript Benchmark
- **Claim:** End-to-end benchmark (10 warm-up runs, median of 30 alternating runs, same-realm Node `v24.13.0` / V8 `13.6.233.17-node.37`, Windows x64 i5-12500H) shows C++ WASM (`-O2`, `142,163` bytes) is **1.40×–1.51× faster** on `1024×1024` fractal fixtures (`2.59–4.20 ms` vs `3.85–6.36 ms`) and **1.32×–1.68× faster** on `512×512`–`2048×2048` synthetic inputs, while **JS is 1.42×–4.02× faster** on small/early-exit images (`128×128`, `256×256 dense`) due to V8 TurboFan speed and JS–WASM buffer/JSON marshaling overhead.
- **Proof command:** `npm run benchmark` (in `fractalvision-frontend/`). See [docs/BENCHMARK.md](BENCHMARK.md).
- **Accurate resume sentence:**
  > Built and benchmarked a C++ WebAssembly (Emscripten `-O2`) box-counting engine against pure TypeScript in V8 across 128×128–2048×2048 images (10 warm-up, median of 30 runs), achieving 1.40×–1.51× speedup on 1024×1024 fractal fixtures while identifying JS–WASM boundary and JSON-serialization overhead that makes JS 1.4×–4.0× faster on small/early-exit inputs.

## 4. Test Counts & CI Checks
- **Frontend:** `9` Vitest tests across `3` files (`tests/boxCountingJs.test.ts`: 5, `tests/wasmConsistency.test.ts`: 1, `tests/apiClient.test.ts`: 3), plus ESLint (`0` errors, `0` warnings), `tsc --noEmit` (`0` errors), and `next build`.
  - **Proof commands (in `fractalvision-frontend/`):** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
- **Backend:** `52` pytest tests (`51` unit/API/security tests + `1` live PostgreSQL migration test when `DATABASE_URL` is set) and Ruff lint (`0` errors).
  - **Proof commands (in `fractalvision-backend/`):** `ruff check .` and `pytest tests/ -v`

## 5. Backend Security Hardening & Local Container Stack
- **Upload validation & timeouts:** Streaming 64 KiB reader aborting >`10 MB` (`413`), magic-byte detection (`PNG`/`JPEG`/`WEBP` only, ignoring extensions/MIME, `415`/`400`), pre-decode header bounds (`MAX_IMAGE_DIMENSION=4096`, `MAX_IMAGE_PIXELS=16,777,216` blocking decompression bombs before `cv2.imdecode`, `413`), off-event-loop thread execution with read (`408`) and compute (`504`) timeouts, and restricted CORS (`ALLOWED_ORIGINS` without `*`).
- **Docker image & Compose:** Measured local backend image size is `847 MB`; `docker compose up --build` starts Postgres 16, runs idempotent SQL migrations (`migrations/`), and serves `/api/v1/health` and `/api/v1/analyze` locally.
  - **Proof commands (in `fractalvision-backend/`):** `docker compose up --build` and `docker images fractalvision-backend:local`

## 6. "$0/month" Hosting Reality Check
- **What fits free tiers on paper:** Vercel Hobby (free for strictly non-commercial/personal use; 100 GB bandwidth, 1M requests), Cloud Run compute free tier (180k vCPU-s, 360k GiB-s, 2M req/mo; 5-min keep-alive = ~8,640 req/mo), Supabase Free (500 MB DB, 1 GB storage, 5 GB egress, daily keep-alive avoids 7-day auto-pause), cron-job.org Free.
- **Important caveats:**
  1. The measured backend Docker image is **847 MB**, which exceeds Google Artifact Registry's **0.5 GB (512 MB)** free tier limit per billing account (`$0.10/GB-month` overage, compounding if old image revisions aren't cleaned up).
  2. Vercel Hobby prohibits commercial/monetized usage (`$20/month` Pro required if commercial).
  3. Actual billing dashboards on Vercel, GCP, and Supabase were **not inspected** (prohibited by task ground rules).
