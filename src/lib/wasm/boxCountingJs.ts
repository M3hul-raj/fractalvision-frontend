/**
 * boxCountingJs.ts
 *
 * Pure TypeScript implementation of the box-counting fractal dimension
 * algorithm. Mirrors box_counting.cpp exactly so both can be benchmarked
 * against each other on identical inputs.
 *
 * No imports — fully self-contained.
 */

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface JsAnalysisResult {
  fractal_dimension: number;
  r_squared: number;
  intercept: number;
  box_sizes: number[];
  box_counts: number[];
  log_inverse_sizes: number[];
  log_counts: number[];
}

// ---------------------------------------------------------------------------
// Private helpers — mirrors C++ static functions
// ---------------------------------------------------------------------------

/** Powers of 2 from 4 up to Math.floor(min(width, height) / 4). */
function autoSelectBoxSizes(width: number, height: number): number[] {
  const minDim = Math.min(width, height);
  const maxBox = Math.floor(minDim / 4);
  const sizes: number[] = [];
  let bs = 4;
  while (bs <= maxBox) {
    sizes.push(bs);
    bs *= 2;
  }
  return sizes;
}

/**
 * Count grid boxes of side `boxSize` that contain at least one pixel === 255.
 * Partial edge boxes are handled via Math.min (matches C++ logic).
 */
function boxCount(
  pixels: Uint8Array,
  width: number,
  height: number,
  boxSize: number,
): number {
  let count = 0;

  for (let by = 0; by < height; by += boxSize) {
    for (let bx = 0; bx < width; bx += boxSize) {
      let occupied = false;

      const yEnd = Math.min(by + boxSize, height);
      const xEnd = Math.min(bx + boxSize, width);

      outer: for (let y = by; y < yEnd; y++) {
        for (let x = bx; x < xEnd; x++) {
          if (pixels[y * width + x] === 255) {
            occupied = true;
            break outer;
          }
        }
      }

      if (occupied) count++;
    }
  }

  return count;
}

/**
 * OLS linear regression — returns slope, intercept, r_squared.
 * Mirrors the C++ compute_fractal_dimension formulas exactly.
 */
function olsRegression(
  x: number[],
  y: number[],
): { slope: number; intercept: number; rSquared: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    ssXY += dx * dy;
    ssXX += dx * dx;
  }

  if (ssXX === 0) return { slope: 0, intercept: 0, rSquared: 0 };

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * x[i] + intercept;
    ssRes += (y[i] - yPred) ** 2;
    ssTot += (y[i] - meanY) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Run the full box-counting pipeline in pure TypeScript.
 * Produces identical results to the C++ WASM implementation.
 */
export function runBoxCountingJs(
  pixels: Uint8Array,
  width: number,
  height: number,
): JsAnalysisResult {
  const box_sizes = autoSelectBoxSizes(width, height);
  const box_counts: number[] = [];
  const log_inverse_sizes: number[] = [];
  const log_counts: number[] = [];

  for (const bs of box_sizes) {
    const c = boxCount(pixels, width, height, bs);
    box_counts.push(c);
    // log(1 / bs) === -log(bs) — matches Python: x = -np.log(box_sizes)
    log_inverse_sizes.push(-Math.log(bs));
    log_counts.push(Math.log(Math.max(c, 1)));
  }

  const { slope, intercept, rSquared } = olsRegression(
    log_inverse_sizes,
    log_counts,
  );

  return {
    fractal_dimension: slope,
    r_squared: rSquared,
    intercept,
    box_sizes,
    box_counts,
    log_inverse_sizes,
    log_counts,
  };
}
