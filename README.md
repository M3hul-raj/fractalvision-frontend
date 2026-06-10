# FractalVision Lab

**Next.js 16 · TypeScript · FastAPI · Supabase · Deployed on Vercel**

Interactive scientific tool for computing fractal dimensions of natural patterns — built on original Mathematics dissertation research in fractal geometry.

## Live Application

🌐 https://fractalvision-frontend.vercel.app

## Overview

The fractal dimension D quantifies the structural complexity of natural patterns — leaves, coastlines, snowflakes — that defy integer-dimensional classification. FractalVision Lab implements the box-counting method to estimate D from uploaded images: the image is binarized, covered with grids at multiple scales, and the slope of the resulting log-log regression yields D ∈ [1, 2]. The tool accompanies every result with R², confidence intervals, quality scoring, and threshold sensitivity analysis. It is a full-stack production application supporting a Mathematics dissertation on fractal dimensions of natural patterns.

## Features

### Analysis Engine

- Upload any image (JPG, PNG, WEBP, up to 10 MB) and compute its fractal dimension in seconds
- Three analysis modes: Full Mask (entire binary structure), Boundary (Canny edge extraction), Texture (morphological gradient)
- Three threshold methods: Otsu (automatic), Adaptive (Gaussian, local), Manual (user-specified 0–255)
- Auto-reanalysis on any parameter change with 600 ms debounce
- Pipeline Viewer showing the binary image with a box-counting grid overlay at the selected scale
- Box Size Slider to step through each counting scale interactively

### Visualisation

- Interactive D3.js log-log regression chart with data points, fitted regression line, and axis labels (log(1/s) vs log(N(s)))
- Selected box size highlighted with enlarged point and white ring on the chart
- Comparison overlay: specimen's regression line (amber, dashed) superimposed on the user's data with auto-scaled axes and dual-series legend
- ΔD (difference in fractal dimension) computed and displayed when comparing

### Specimen Gallery

- 11 dissertation specimens (7 leaves, 4 coastlines) stored in Supabase PostgreSQL with images in Supabase Storage
- Client-side filtering by category (All / Leaves / Coastlines) and sorting (D high→low, D low→high, name A→Z)
- Each specimen card shows fractal dimension, R², complexity class, and interpretation text

### Compare Mode

- Dual-slot (A / B) comparison: upload images or select gallery specimens into each slot
- Side-by-side analysis results with overlaid log-log charts and computed ΔD between specimens

### Fractal Explorer

- Five standard mathematical fractals with known theoretical dimensions: Cantor Set (D ≈ 0.6309), Koch Curve (D ≈ 1.2619), Koch Snowflake (D ≈ 1.2619), Sierpiński Triangle (D ≈ 1.5850), Sierpiński Carpet (D ≈ 1.8928)
- Iteration depth slider with per-fractal max clamping and numbered step buttons
- Generated fractal image with full-resolution lightbox (scroll-to-zoom, drag-to-pan, 0.25×–8× range, pixel-perfect rendering at ≥2×)
- Results table showing computed vs theoretical dimension, error %, R², box counts, and scale range

### Report Export

- Client-side PDF generation via jsPDF (no server round-trip)
- Page 1: original + binary images, fractal dimension, R², quality score, reliability badge, analysis parameters, interpretation with complexity class badge, statistical summary (standard error, 95% CI, foreground coverage)
- Page 2: high-DPI log-log chart captured from the live D3 SVG via XMLSerializer, sensitivity analysis with stability conclusion

### Scientific Pages

- **Methodology** — fractal dimension theory, box-counting algorithm, log-log regression, preprocessing pipeline (3 stages), quality and reliability metrics
- **Limitations** — rasterization constraints, finite scale range, threshold sensitivity, image quality factors, method-level limitations

### In Progress

- **WebAssembly (WASM) Benchmark Engine** — C++ box-counting algorithm compiled via Emscripten, with a /benchmarks page comparing JS vs WASM performance on identical inputs

## Architecture

```
┌─────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│  Browser (SPA)  │──────▸│  FastAPI Backend     │──────▸│   Supabase   │
│                 │       │  DigitalOcean App    │       │  PostgreSQL  │
│  Next.js 16     │◂──────│  Platform            │       │  + Storage   │
│  React 19       │       │                     │       └──────────────┘
│  Zustand        │       │  OpenCV · NumPy     │              ▲
│  D3.js          │       │  SciPy · Python 3.14│              │
│  Framer Motion  │       └─────────────────────┘              │
│  jsPDF          │                                            │
│                 │────────────────────────────────────────────▸│
│  @supabase/js   │   Gallery data + specimen images (direct)  │
└─────────────────┘                                            │
```

- **State management:** Zustand stores for Analyzer Lab (`analyzerStore`) and Compare Mode (`compareStore`)
- **Charts:** D3.js with SVG rendering, auto-scaled axes, comparison overlays
- **Gallery data:** Supabase JS client reads specimens table directly (no backend proxy)
- **Analysis:** All image processing and box-counting runs server-side on FastAPI

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.7 | React framework with App Router, server components |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Static typing across the entire codebase |
| Tailwind CSS | v4 | Utility-first CSS with `@tailwindcss/postcss` |
| D3.js | ^7.9.0 | SVG-based log-log regression charts |
| Zustand | ^5.0.14 | Lightweight state management |
| Framer Motion | ^12.40.0 | Page transitions and micro-animations |
| jsPDF | ^4.2.1 | Client-side PDF report generation |
| html2canvas | ^1.4.1 | DOM-to-canvas capture (chart export support) |
| @supabase/supabase-js | ^2.107.0 | Gallery data and specimen image fetching |
| @vercel/analytics | ^2.0.1 | Production analytics dashboard |

## Mathematical Background

The box-counting (Minkowski–Bouligand) dimension is estimated by covering a binary image with a grid of square boxes of side length ε, counting the number of occupied boxes N(ε), and repeating across decreasing scales (powers of 2: ε ∈ {4, 8, 16, 32, …, image_size/4}). The fractal dimension is defined as:

```
D = lim(ε→0) log N(ε) / log(1/ε)
```

In practice, D is the slope of the ordinary least-squares regression line fitted to the points (log(1/ε), log N(ε)). The coefficient of determination R² measures how well the data conforms to a power law across all measured scales. FractalVision Lab uses `scipy.stats.linregress` on the backend and reports D with a 95% confidence interval (D ± 1.96 · SE).

## Local Development

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

> **Note:** The Analyzer Lab, Fractal Explorer, and Compare Mode require the [fractalvision-backend](https://github.com/M3hul-raj/fractalvision-backend) running on port 8000 for image analysis and fractal generation. The Gallery page works independently via Supabase.

## Deployment

Deployed on **Vercel** with GitHub auto-deploy on push to `main`.

- **Framework preset:** Next.js (auto-detected)
- **Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`
- **Analytics:** Vercel Analytics enabled via `@vercel/analytics`

## Backend

**Repository:** [fractalvision-backend](https://github.com/M3hul-raj/fractalvision-backend)

FastAPI backend handling all image processing (OpenCV), box-counting, log-log regression (SciPy), quality scoring, sensitivity analysis, fractal generation, and complexity classification. Deployed on DigitalOcean App Platform.
