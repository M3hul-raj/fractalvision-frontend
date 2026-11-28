/**
 * Shared typed-array ABI constants and decoder for the C++ WASM box-counting module.
 *
 * Keeps zero DOM/Node dependencies so browser code, Vitest tests, and the CLI
 * benchmark script read the exact same Float64 buffer layout.
 */

import type { JsAnalysisResult } from "./boxCountingJs";

export const WASM_MAX_SCALES = 32;
export const WASM_HEADER_DOUBLES = 4;
export const WASM_OUT_DOUBLES = WASM_HEADER_DOUBLES + 4 * WASM_MAX_SCALES;
export const WASM_OUT_BYTES = WASM_OUT_DOUBLES * Float64Array.BYTES_PER_ELEMENT;

export function readWasmResult(
  heapF64: Float64Array,
  outPtr: number,
  scaleCount: number,
): JsAnalysisResult {
  if (scaleCount < 0 || scaleCount > WASM_MAX_SCALES) {
    throw new Error(`Invalid WASM scale count returned: ${scaleCount}`);
  }
  if (outPtr % Float64Array.BYTES_PER_ELEMENT !== 0) {
    throw new Error(`Unaligned WASM output pointer: ${outPtr}`);
  }

  const base = outPtr >> 3;
  const n = scaleCount;

  const box_sizes = new Array<number>(n);
  const box_counts = new Array<number>(n);
  const log_inverse_sizes = new Array<number>(n);
  const log_counts = new Array<number>(n);

  const sizesStart = base + WASM_HEADER_DOUBLES;
  const countsStart = sizesStart + n;
  const logInvStart = countsStart + n;
  const logCntStart = logInvStart + n;

  for (let i = 0; i < n; i++) {
    box_sizes[i] = heapF64[sizesStart + i];
    box_counts[i] = heapF64[countsStart + i];
    log_inverse_sizes[i] = heapF64[logInvStart + i];
    log_counts[i] = heapF64[logCntStart + i];
  }

  return {
    fractal_dimension: heapF64[base + 1],
    r_squared: heapF64[base + 2],
    intercept: heapF64[base + 3],
    box_sizes,
    box_counts,
    log_inverse_sizes,
    log_counts,
  };
}
