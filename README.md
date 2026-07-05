# FractalVision Lab

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?logo=vercel)](https://fractalvision-frontend.vercel.app)
[![Backend API](https://img.shields.io/badge/API-Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://fractalvision-backend-43382945646.us-central1.run.app/api/v1/health)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=ffdd54)](https://www.python.org/)
[![Tests](https://img.shields.io/badge/Tests-16%20passing-success?logo=pytest&logoColor=white)](#test-coverage)

An interactive scientific tool for computing fractal dimensions of natural patterns using the box-counting method — built on original Mathematics dissertation research in fractal geometry.

> Upload leaves, coastlines, or any natural texture and watch its fractal dimension emerge through live box-counting, log-log regression, and mathematical visualization.

---

## Live Application

🌐 **https://fractalvision-frontend.vercel.app**

| Page | Description |
|------|-------------|
| [Analyzer Lab](https://fractalvision-frontend.vercel.app/lab) | Upload an image → get its fractal dimension |
| [Gallery](https://fractalvision-frontend.vercel.app/gallery) | Browse 12 dissertation specimens (leaves + coastlines) |
| [Compare](https://fractalvision-frontend.vercel.app/compare) | Side-by-side comparison of two analyses |
| [Fractal Explorer](https://fractalvision-frontend.vercel.app/explorer) | Generate and analyze 5 standard mathematical fractals |
| [Benchmarks](https://fractalvision-frontend.vercel.app/benchmarks) | JS vs WebAssembly performance comparison |
| [Coastline Paradox](https://fractalvision-frontend.vercel.app/coastline-paradox) | Interactive demonstration of the Richardson effect |
| [Methodology](https://fractalvision-frontend.vercel.app/methodology) | Theory behind the analysis pipeline |
| [Limitations](https://fractalvision-frontend.vercel.app/limitations) | Scientific constraints and caveats |

---

## Features

### Analyzer Lab — Core Analysis Engine

- Upload any image (JPG, PNG, WEBP, up to 10 MB) and compute its fractal dimension in seconds
- **Three analysis modes:** Full Mask (entire binary structure), Boundary (Canny edge extraction), Texture (morphological gradient)
- **Three threshold methods:** Otsu (automatic), Adaptive (Gaussian, configurable block size and C), Manual (user-specified 0–255)
- Optional Gaussian blur (3 levels) and non-local means denoising
- Auto-reanalysis on any parameter change with 600 ms debounce — no "Re-analyze" button needed
- **Pipeline Viewer** — renders the binary image on canvas with a box-counting grid overlay at the selected scale
- **Box Size Slider** — step through each counting scale interactively; the corresponding data point highlights on the log-log chart

### Interactive Visualization

- **Log-log regression chart** (D3.js) — scatter plot with fitted regression line, axis labels (log(1/ε) vs log N(ε)), and hover tooltips
- **Comparison overlay** — a specimen's regression line (amber, dashed) superimposed on the user's data with auto-scaled axes and dual-series legend
- **Residual chart** (D3.js) — residual scatter plot with zero line and hover tooltips for diagnosing fit quality
- **Scale Range Selector** — toggle individual box sizes on/off to see how D changes; inline OLS recomputation shows sensitivity to scale selection

### Reliability Dashboard

- **Quality Score gauge** — SVG semicircular arc (0–100) with color-coded reliability badge (High / Medium / Low)
- **Precision panel** — fractal dimension D ± margin, 95% confidence interval, standard error
- **Threshold sensitivity** — optional test varying the threshold by ±15; sparkline visualization with ±0.10 Y-window and stability verdict (σ < 0.05 = Stable)
- **Rotation sensitivity** — tests at 0°, 15°, 30°, 45°, 90° rotations with stability verdict
- Quality score incorporates R², scale count, foreground ratio, sensitivity σ, and rotation σ

### Specimen Gallery

- **12 dissertation specimens** (7 leaves, 5 coastlines) stored in Supabase PostgreSQL with original images in Supabase Storage
- Client-side filtering by category (All / Leaves / Coastlines) and sorting (D high→low, D low→high, name A→Z)
- Each specimen card shows fractal dimension, R², complexity class badge, and interpretation text
- **Specimen Detail** — expandable panel with inline D3 log-log chart showing the specimen's original regression data

### Compare Mode

- **Dual-slot (A / B) comparison** — upload images or select gallery specimens into each slot
- Full independent preprocessing controls per slot (mode, threshold, sensitivity toggles)
- **Overlaid log-log chart** (D3.js) — shared axes, color-coded series (sky-400 / orange-400), HTML legend
- **Metric cards** — ΔD, R² comparison, quality scores, conclusion text with D-value bars
- **Comparison PDF export** — 2-page jsPDF report with side-by-side metrics and dual chart

### Fractal Explorer

- **Five standard mathematical fractals** with known theoretical dimensions:

  | Fractal | Theoretical D |
  |---------|:---:|
  | Cantor Set | 0.6309 |
  | Koch Curve | 1.2619 |
  | Koch Snowflake | 1.2619 |
  | Sierpiński Triangle | 1.5850 |
  | Sierpiński Carpet | 1.8928 |

- Iteration depth slider with per-fractal max clamping and numbered step buttons
- Generated fractal image with **full-resolution lightbox** — scroll-to-zoom (cursor-focal), drag-to-pan, 0.25×–8× range, pixel-perfect rendering at ≥2× zoom
- Results table showing computed vs theoretical D, error %, R², box counts, and scale range

### Report Export

- Client-side **2-page PDF** via jsPDF (no server round-trip):
  - **Page 1:** Original + binary images, D, R², quality score, reliability badge, parameters, interpretation with complexity class, statistical summary (SE, 95% CI, foreground ratio), warnings
  - **Page 2:** High-DPI log-log chart captured from the live D3 SVG via `XMLSerializer` → 2× canvas, sensitivity analysis with stability conclusion
- Saves as `FractalVision_Report_{timestamp}.pdf`

### Coastline Paradox — Interactive Educational Demo

- Demonstrates the **Richardson coastline paradox** — measuring a coastline with smaller rulers yields a longer total length, forming the intuitive foundation for fractal dimension
- **High-resolution fractal coastline** — ~25,601 points generated via multi-frequency sinusoidal base + 7 levels of midpoint displacement
- **Ruler walking algorithm** — greedy walker at configurable ruler size (5–100px slider)
- **Interactive HTML5 Canvas** with full zoom/pan:
  - Scroll-wheel zoom (centered on cursor), mouse drag to pan, touch support (pinch-to-zoom)
  - Minimap, zoom badge, scale bar, and "Reset View" button
- **D3 Richardson chart** — log-log plot of ruler size vs measured length with power-law curve fit

### WASM Benchmark Engine

- **C++ box-counting algorithm** compiled to WebAssembly via Emscripten 6.0.0
- `/benchmarks` page: drag-and-drop image upload → runs both JS and WASM implementations with `performance.now()` timing
- Agreement badge, metric cards, speedup banner, and SVG bar chart
- First WASM run ~200ms (cold start — module initialization); subsequent runs typically ~1ms
- **Entirely client-side** — no server requests during benchmarking

### Scientific Documentation

- **Methodology page** — 5 academic sections: fractal dimension theory, box-counting algorithm, log-log regression, preprocessing pipeline, quality metrics
- **Limitations page** — 5 sections with amber accent: rasterization constraints, finite scale range, threshold sensitivity, image quality, method-level limitations. Includes fractal dimension estimator comparison table.

---

## Architecture

```
┌─────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│  Browser (SPA)  │──────▸│  FastAPI Backend     │──────▸│   Supabase   │
│                 │       │  Google Cloud Run    │       │  PostgreSQL  │
│  Next.js 16     │◂──────│  (us-central1)       │       │  + Storage   │
│  React 19       │       │                     │       └──────────────┘
│  TypeScript 5   │       │  OpenCV · NumPy     │              ▲
│  Zustand        │       │  SciPy · Python 3.14│              │
│  D3.js          │       └─────────────────────┘              │
│  Framer Motion  │                                            │
│  Emscripten WASM│                                            │
│  jsPDF          │                                            │
│                 │────────────────────────────────────────────▸│
│  @supabase/js   │   Gallery data + specimen images (direct)  │
└─────────────────┘                                            │
```

- **State management:** Zustand stores — `analyzerStore` (lab page) and `compareStore` (compare page, fully isolated)
- **Charts:** D3.js with SVG rendering, auto-scaled axes, comparison overlays, residual plots
- **Gallery data:** Supabase JS client reads `specimens` and `standard_fractals` tables directly (no backend proxy)
- **Analysis:** All image processing and box-counting runs server-side on FastAPI — OpenCV provides Otsu, adaptive threshold, Canny, morphological ops
- **WASM benchmark:** Entirely client-side — C++ box-counting compiled via Emscripten, compared against pure TypeScript implementation

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js (App Router) | 16.2.7 | React framework with server components |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Static typing across the entire codebase |
| Tailwind CSS | v4 | Utility-first CSS with `@tailwindcss/postcss` |
| D3.js | ^7.9.0 | SVG-based log-log, residual, and Richardson charts |
| Zustand | ^5.0.14 | Lightweight state management (2 stores) |
| Framer Motion | ^12.40.0 | Page transitions and micro-animations |
| jsPDF | ^4.2.1 | Client-side PDF report generation |
| @supabase/supabase-js | ^2.107.0 | Gallery data and specimen image fetching |
| @vercel/analytics | ^2.0.1 | Production analytics |
| Emscripten (emcc) | 6.0.0 | C++ → WebAssembly compiler for benchmark engine |

### Backend ([fractalvision-backend](https://github.com/M3hul-raj/fractalvision-backend))

| Technology | Purpose |
|------------|---------|
| FastAPI | ASGI web framework |
| Python 3.14 | Runtime |
| opencv-python-headless | Image processing, thresholding, edge detection |
| numpy + scipy | Array operations, OLS regression |
| slowapi | IP-based rate limiting |
| pydantic-settings | Typed configuration |
| supabase | Database client (migration scripts) |

### Infrastructure

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Frontend CDN (auto-deploy on push to `main`) | Free |
| Google Cloud Run | Backend API (us-central1, 1 GiB RAM, scales to zero) | Free |
| Supabase | PostgreSQL database + Storage | Free |
| cron-job.org | Keep-alive pings (backend every 5 min, Supabase daily) | Free |
| GitHub | Version control ([M3hul-raj](https://github.com/M3hul-raj)) | Free |

**Total hosting cost: $0/month**

---

## Mathematical Background

The **box-counting (Minkowski–Bouligand) dimension** is estimated by covering a binary image with a grid of square boxes of side length ε, counting the number of occupied boxes N(ε), and repeating across decreasing scales (powers of 2: ε ∈ {4, 8, 16, 32, …, image_size/4}).

The fractal dimension is defined as:

```
D = lim(ε→0) log N(ε) / log(1/ε)
```

In practice, D is the **slope of the ordinary least-squares regression line** fitted to the points (log(1/ε), log N(ε)). The coefficient of determination R² measures how well the data conforms to a power law.

FractalVision Lab uses `scipy.stats.linregress` on the backend and reports D with:
- **95% confidence interval** (D ± 1.96 · SE)
- **Standard error** of the slope
- **Quality score** (0–100) incorporating R², scale count, foreground ratio, and sensitivity
- **Reliability classification** (High ≥ 85, Medium ≥ 70, Low < 70)

---

## Project Structure

```
src/
├── app/                              # Next.js App Router (9 routes)
│   ├── layout.tsx                    # Root layout — Navbar, Footer, Analytics, SEO metadata
│   ├── globals.css                   # Global styles (Tailwind v4)
│   ├── page.tsx                      # Landing page (hero, stats, features, tech stack)
│   ├── lab/page.tsx                  # Analyzer Lab (main tool)
│   ├── gallery/page.tsx              # Specimen Gallery (filter, sort, detail panels)
│   ├── compare/page.tsx              # Compare Mode (dual upload/specimen slots)
│   ├── explorer/page.tsx             # Fractal Explorer (generator + lightbox + results)
│   ├── benchmarks/page.tsx           # WASM Benchmark (JS vs WASM comparison)
│   ├── methodology/page.tsx          # Methodology (5 academic sections)
│   ├── coastline-paradox/page.tsx    # Coastline Paradox (interactive ruler demo)
│   └── limitations/page.tsx          # Scientific Limitations (5 sections)
│
├── components/
│   ├── layout/                       # Navbar (9 links + mobile menu), Footer, PageShell
│   ├── analyzer/                     # ImageUploader, PreprocessingControls, ResultCard,
│   │                                 # ReportButton, PipelineViewer, BoxSizeSlider,
│   │                                 # GridOverlay, QualityScore, ScaleRangeSelector
│   ├── charts/                       # LogLogChart, ResidualChart (D3.js)
│   ├── benchmarks/                   # BenchmarkChart (SVG bar chart)
│   ├── compare/                      # ComparePanel, CompareResults, DualLogLogChart,
│   │                                 # ComparisonPanel, SpecimenPickerModal
│   ├── explorer/                     # ExplorerLogLogChart (prop-based D3)
│   └── gallery/                      # SpecimenCard, SpecimenDetail (inline D3 chart)
│
├── hooks/
│   └── useAutoAnalyze.ts             # Auto re-analyze on settings change (600ms debounce)
│
├── store/
│   ├── analyzerStore.ts              # Zustand — file, result, settings, error, sensitivity
│   └── compareStore.ts               # Zustand — two independent slots (A+B)
│
├── lib/
│   ├── api/client.ts                 # analyzeImage(), generateFractal(), listFractals()
│   ├── supabase/                     # Supabase client + queries (specimens, fractals)
│   ├── data/                         # Static fallback data, interpretation bands
│   ├── report/                       # PDF generators (single analysis + comparison)
│   └── wasm/                         # WASM loader, JS box-counting, image preprocessor
│
└── types/                            # TypeScript types (analysis, specimen, api)

wasm/                                 # C++ source (NOT in src/)
├── box_counting.cpp                  # C++ box-counting + OLS regression
├── compile.bat                       # Windows build script
└── compile.sh                        # Unix/Mac build script

public/wasm/                          # Compiled WASM output (committed to git)
├── box_counting.js                   # Emscripten glue code (~12 KB)
└── box_counting.wasm                 # Compiled WebAssembly binary (~139 KB)
```

---

## WASM Build System

The `/benchmarks` page uses a C++ box-counting engine compiled to WebAssembly. The compiled files are **committed to git** because Vercel's build environment does not include Emscripten.

**To recompile** (requires [Emscripten 6.0.0](https://emscripten.org/) in PATH):

```powershell
# Windows
cd fractalvision-frontend
wasm\compile.bat

# macOS / Linux
cd fractalvision-frontend
chmod +x wasm/compile.sh && wasm/compile.sh
```

Output: `public/wasm/box_counting.js` + `public/wasm/box_counting.wasm`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [fractalvision-backend](https://github.com/M3hul-raj/fractalvision-backend) running on port 8000 (required for Analyzer Lab, Fractal Explorer, and Compare Mode — Gallery works independently via Supabase)

### Installation

```bash
# 1. Clone
git clone https://github.com/M3hul-raj/fractalvision-frontend.git
cd fractalvision-frontend

# 2. Install dependencies
npm install

# 3. Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
EOF

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public, read-only) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (default: `http://localhost:8000/api/v1`) |

---

## Deployment

Deployed on **Vercel** with GitHub auto-deploy on push to `main`.

| Setting | Value |
|---------|-------|
| Framework preset | Next.js (auto-detected) |
| Build command | `next build` |
| Environment variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
| Analytics | Vercel Analytics via `@vercel/analytics` |

---

## Backend

**Repository:** [fractalvision-backend](https://github.com/M3hul-raj/fractalvision-backend)

FastAPI backend handling all image processing (OpenCV), box-counting, log-log regression (SciPy), quality scoring, threshold and rotation sensitivity analysis, fractal generation, and complexity classification. Deployed on Google Cloud Run (free tier, us-central1).

---

## Acknowledgments

This project is part of a **Mathematics dissertation** on fractal dimensions of natural patterns — leaves and coastlines analyzed through the box-counting method.

Built with Next.js, FastAPI, OpenCV, D3.js, Supabase, and Emscripten.
