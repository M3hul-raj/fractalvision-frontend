/**
 * boxCountingWasm.ts
 *
 * Async singleton loader and runner for the Emscripten-compiled
 * box_counting WebAssembly module.
 *
 * Uses a pre-allocated Float64 output buffer instead of JSON strings to avoid
 * UTF-8 decoding and JSON serialization overhead across the JS-WASM boundary.
 */

import type { JsAnalysisResult } from "./boxCountingJs";
import { readWasmResult, WASM_MAX_SCALES, WASM_OUT_BYTES } from "./wasmAbi";

// ---------------------------------------------------------------------------
// Emscripten module typings
// ---------------------------------------------------------------------------

interface EmscriptenBoxCountingModule {
  _wasm_run_analysis: (
    pixelPtr: number,
    width: number,
    height: number,
    outPtr: number,
    maxScales: number,
  ) => number;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;
  HEAPF64: Float64Array;
}

declare global {
  function createBoxCountingModule(options?: {
    locateFile?: (path: string) => string;
  }): Promise<EmscriptenBoxCountingModule>;
}

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let _module: EmscriptenBoxCountingModule | null = null;
let _loadPromise: Promise<EmscriptenBoxCountingModule> | null = null;
let _outPtr = 0;

// ---------------------------------------------------------------------------
// Private — module initialiser
// ---------------------------------------------------------------------------

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Failed to load WASM glue script: ${src}`));
    document.head.appendChild(script);
  });
}

async function getModule(): Promise<EmscriptenBoxCountingModule> {
  if (_module !== null) return _module;
  if (_loadPromise !== null) return _loadPromise;

  _loadPromise = (async () => {
    await injectScript("/wasm/box_counting.js");
    const mod = await createBoxCountingModule({
      locateFile: (path: string) => "/wasm/" + path,
    });
    _outPtr = mod._malloc(WASM_OUT_BYTES);
    if (_outPtr === 0) {
      throw new Error("WASM output buffer malloc failed");
    }
    _module = mod;
    return mod;
  })();

  return _loadPromise;
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Run the box-counting + OLS regression pipeline via WebAssembly.
 *
 * Copies pixel bytes into WASM linear memory, executes _wasm_run_analysis
 * writing directly into a reusable Float64 output buffer, reads back the
 * numeric fields from HEAPF64, and frees the input buffer.
 */
export async function runBoxCountingWasm(
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<JsAnalysisResult> {
  const mod = await getModule();

  const pixelPtr = mod._malloc(pixels.length);
  if (pixelPtr === 0) throw new Error("WASM malloc failed (out of memory)");

  try {
    // Re-read HEAPU8/HEAPF64 fresh after malloc and WASM calls in case
    // ALLOW_MEMORY_GROWTH reallocated the underlying WebAssembly.Memory buffer.
    mod.HEAPU8.set(pixels, pixelPtr);

    const scaleCount = mod._wasm_run_analysis(
      pixelPtr,
      width,
      height,
      _outPtr,
      WASM_MAX_SCALES,
    );
    if (scaleCount < 0) {
      throw new Error("WASM analysis failed: invalid dimensions or scale capacity");
    }

    return readWasmResult(mod.HEAPF64, _outPtr, scaleCount);
  } finally {
    mod._free(pixelPtr);
  }
}
