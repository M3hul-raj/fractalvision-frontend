/**
 * boxCountingWasm.ts
 *
 * Async singleton loader and runner for the Emscripten-compiled
 * box_counting WebAssembly module.
 *
 * The module is injected into the page once and cached; subsequent calls
 * reuse the same instance.
 */

import type { JsAnalysisResult } from "./boxCountingJs";

// ---------------------------------------------------------------------------
// Emscripten module typings
// ---------------------------------------------------------------------------

interface EmscriptenBoxCountingModule {
  _wasm_run_analysis: (
    pixelPtr: number,
    width: number,
    height: number,
  ) => number;
  _wasm_free: (ptr: number) => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;
  UTF8ToString: (ptr: number) => string;
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

// ---------------------------------------------------------------------------
// Private — module initialiser
// ---------------------------------------------------------------------------

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Skip injection if the script tag is already present
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
  // Already initialised — return immediately
  if (_module !== null) return _module;

  // Initialisation already in-flight — join the existing promise
  if (_loadPromise !== null) return _loadPromise;

  _loadPromise = (async () => {
    // 1. Inject the Emscripten JS glue file
    await injectScript("/wasm/box_counting.js");

    // 2. Instantiate the WASM module; tell Emscripten where to find the .wasm
    const mod = await createBoxCountingModule({
      locateFile: (path: string) => "/wasm/" + path,
    });

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
 * Allocates a WASM heap buffer, copies the pixel data in, calls
 * _wasm_run_analysis, reads back the JSON string, then frees both pointers.
 */
export async function runBoxCountingWasm(
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<JsAnalysisResult> {
  const mod = await getModule();

  // Allocate input buffer on the WASM heap
  const ptr = mod._malloc(pixels.length);
  if (ptr === 0) throw new Error("WASM malloc failed (out of memory)");

  // NOTE: HEAPU8 must be accessed AFTER malloc — memory growth may have
  // reallocated the backing ArrayBuffer, so we read mod.HEAPU8 fresh here.
  mod.HEAPU8.set(pixels, ptr);

  // Run analysis — returns a malloc'd char* inside WASM memory
  const resultPtr = mod._wasm_run_analysis(ptr, width, height);

  // Copy result string out before freeing
  const json = mod.UTF8ToString(resultPtr);

  // Free WASM-owned pointers
  mod._wasm_free(resultPtr);
  mod._free(ptr);

  return JSON.parse(json) as JsAnalysisResult;
}
