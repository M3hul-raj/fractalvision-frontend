"use client";

import { useRef, useState, useCallback } from "react";
import PageShell from "@/components/layout/PageShell";
import BenchmarkChart from "@/components/benchmarks/BenchmarkChart";
import { loadImageAsBinary } from "@/lib/wasm/imageProcessor";
import { runBoxCountingJs, type JsAnalysisResult } from "@/lib/wasm/boxCountingJs";
import { runBoxCountingWasm } from "@/lib/wasm/boxCountingWasm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BenchmarkStatus = "idle" | "preprocessing" | "running" | "done" | "error";

interface RunResult {
  result: JsAnalysisResult;
  timeMs: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BenchmarksPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<BenchmarkStatus>("idle");
  const [jsRun, setJsRun] = useState<RunResult | null>(null);
  const [wasmRun, setWasmRun] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [pixelCount, setPixelCount] = useState<number | null>(null);

  // -------------------------------------------------------------------------
  // Core handler
  // -------------------------------------------------------------------------

  const handleFile = useCallback(async (file: File) => {
    setStatus("preprocessing");
    setImageName(file.name);
    setError(null);
    setJsRun(null);
    setWasmRun(null);

    try {
      const { pixels, width, height } = await loadImageAsBinary(file);
      setImageDimensions({ width, height });
      setPixelCount(pixels.length);

      setStatus("running");

      // --- JavaScript run ---
      const t0 = performance.now();
      const jsResult = runBoxCountingJs(pixels, width, height);
      const jsTime = performance.now() - t0;

      // --- WebAssembly run ---
      const t1 = performance.now();
      const wasmResult = await runBoxCountingWasm(pixels, width, height);
      const wasmTime = performance.now() - t1;

      setJsRun({ result: jsResult, timeMs: jsTime });
      setWasmRun({ result: wasmResult, timeMs: wasmTime });
      setStatus("done");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      setStatus("error");
    }
  }, []);

  // -------------------------------------------------------------------------
  // Upload zone interaction
  // -------------------------------------------------------------------------

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  // -------------------------------------------------------------------------
  // Derived values (only valid when status === 'done')
  // -------------------------------------------------------------------------

  const resultsMatch =
    jsRun && wasmRun
      ? Math.abs(
          jsRun.result.fractal_dimension - wasmRun.result.fractal_dimension,
        ) < 0.0001
      : false;

  const speedup =
    jsRun && wasmRun && wasmRun.timeMs > 0
      ? jsRun.timeMs / wasmRun.timeMs
      : null;

  const speedupLabel = (() => {
    if (speedup === null) return null;
    if (speedup >= 1.05)
      return `WebAssembly is ${speedup.toFixed(1)}× faster`;
    if (speedup <= 0.95)
      return `JavaScript is ${(1 / speedup).toFixed(1)}× faster`;
    return "Roughly equal performance";
  })();

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const isProcessing = status === "preprocessing" || status === "running";

  const statusLabel: Record<BenchmarkStatus, string> = {
    idle: "",
    preprocessing: "Preprocessing image…",
    running: "Running benchmarks…",
    done: "",
    error: "",
  };

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto space-y-10">
        {/* ── Heading ── */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            WebAssembly Benchmark
          </h1>
          <p className="mt-3 text-lg text-gray-300 max-w-2xl">
            Client-side fractal dimension analysis: JavaScript vs WebAssembly
          </p>
        </div>

        {/* ── Upload zone ── */}
        <div
          id="benchmark-upload-zone"
          role="button"
          tabIndex={0}
          aria-label="Upload an image to benchmark"
          onClick={openFilePicker}
          onKeyDown={(e) => e.key === "Enter" && openFilePicker()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-12 cursor-pointer transition-all duration-200 ${
            isProcessing
              ? "border-blue-500/40 bg-blue-950/20 pointer-events-none"
              : "border-white/20 bg-white/5 hover:border-blue-400/50 hover:bg-blue-950/10"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Image file input"
          />

          {/* Icon */}
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
              isProcessing
                ? "border-blue-500/30 bg-blue-900/20 text-blue-400"
                : "border-white/10 bg-white/5 text-gray-400"
            }`}
            aria-hidden="true"
          >
            {isProcessing ? (
              /* Spinner */
              <svg
                className="h-6 w-6 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  className="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  strokeLinecap="round"
                  className="opacity-75"
                />
              </svg>
            ) : (
              /* Upload icon */
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>

          {/* Text */}
          {isProcessing ? (
            <div className="text-center">
              <p className="text-sm font-medium text-blue-300">
                {statusLabel[status]}
              </p>
              {imageName && (
                <p className="mt-1 text-xs text-gray-500 truncate max-w-xs">
                  {imageName}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">
                {imageName && status === "done"
                  ? imageName
                  : "Drop an image here, or click to upload"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                JPEG, PNG, or WebP · Max 1024 px (auto-scaled)
              </p>
              {status === "done" && (
                <p className="mt-2 text-xs text-blue-400">
                  Click or drop another image to re-run
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Error state ── */}
        {status === "error" && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-950/20 px-5 py-4 text-sm text-red-300"
          >
            <span className="font-semibold">Error: </span>
            {error}
          </div>
        )}

        {/* ── Results ── */}
        {status === "done" && jsRun && wasmRun && (
          <div className="space-y-6">
            {/* Row 1 — Agreement + dimensions */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  resultsMatch
                    ? "bg-green-900/40 text-green-300 ring-1 ring-green-500/30"
                    : "bg-amber-900/40 text-amber-300 ring-1 ring-amber-500/30"
                }`}
              >
                {resultsMatch ? "Results match ✓" : "Results differ ⚠"}
              </span>
              {imageDimensions && pixelCount !== null && (
                <span className="text-xs text-gray-500">
                  {imageDimensions.width}×{imageDimensions.height}px ·{" "}
                  {pixelCount.toLocaleString()} pixels
                </span>
              )}
            </div>

            {/* Row 2 — Metric cards */}
            <div
              id="benchmark-metric-cards"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {/* JS card */}
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 px-6 py-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-sky-300">
                    JavaScript
                  </span>
                </div>
                <dl className="space-y-1.5">
                  <MetricRow
                    label="D"
                    value={jsRun.result.fractal_dimension.toFixed(4)}
                    accent="text-sky-200"
                  />
                  <MetricRow
                    label="R²"
                    value={jsRun.result.r_squared.toFixed(4)}
                    accent="text-sky-200"
                  />
                  <MetricRow
                    label="Time"
                    value={`${jsRun.timeMs.toFixed(1)} ms`}
                    accent="text-sky-400"
                    bold
                  />
                </dl>
              </div>

              {/* WASM card */}
              <div className="rounded-2xl border border-orange-500/20 bg-orange-950/20 px-6 py-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-orange-300">
                    WebAssembly
                  </span>
                </div>
                <dl className="space-y-1.5">
                  <MetricRow
                    label="D"
                    value={wasmRun.result.fractal_dimension.toFixed(4)}
                    accent="text-orange-200"
                  />
                  <MetricRow
                    label="R²"
                    value={wasmRun.result.r_squared.toFixed(4)}
                    accent="text-orange-200"
                  />
                  <MetricRow
                    label="Time"
                    value={`${wasmRun.timeMs.toFixed(1)} ms`}
                    accent="text-orange-400"
                    bold
                  />
                </dl>
              </div>
            </div>

            {/* Row 3 — Speedup banner */}
            {speedupLabel && (
              <div
                id="benchmark-speedup-banner"
                className="rounded-2xl border border-white/10 bg-white/5 py-6 text-center"
              >
                <p className="text-2xl font-extrabold tracking-tight text-white">
                  {speedupLabel}
                </p>
                {speedup !== null && speedup >= 1.05 && (
                  <p className="mt-1 text-sm text-gray-400">
                    WASM completed in{" "}
                    <span className="text-orange-300 font-medium">
                      {wasmRun.timeMs.toFixed(1)} ms
                    </span>{" "}
                    vs JS in{" "}
                    <span className="text-sky-300 font-medium">
                      {jsRun.timeMs.toFixed(1)} ms
                    </span>
                  </p>
                )}
                {speedup !== null && speedup <= 0.95 && (
                  <p className="mt-1 text-sm text-gray-400">
                    JS completed in{" "}
                    <span className="text-sky-300 font-medium">
                      {jsRun.timeMs.toFixed(1)} ms
                    </span>{" "}
                    vs WASM in{" "}
                    <span className="text-orange-300 font-medium">
                      {wasmRun.timeMs.toFixed(1)} ms
                    </span>
                  </p>
                )}
                {speedup !== null &&
                  speedup > 0.95 &&
                  speedup < 1.05 && (
                    <p className="mt-1 text-sm text-gray-400">
                      JS:{" "}
                      <span className="text-sky-300 font-medium">
                        {jsRun.timeMs.toFixed(1)} ms
                      </span>{" "}
                      · WASM:{" "}
                      <span className="text-orange-300 font-medium">
                        {wasmRun.timeMs.toFixed(1)} ms
                      </span>
                    </p>
                  )}
              </div>
            )}

            {/* Row 4 — Chart */}
            <BenchmarkChart
              jsTimeMs={jsRun.timeMs}
              wasmTimeMs={wasmRun.timeMs}
            />

            {/* Row 5 — Technical note */}
            <p className="text-xs text-gray-500 leading-relaxed">
              Both implementations run entirely in the browser. The WebAssembly
              module compiles the identical box-counting algorithm written in
              C++ via Emscripten 6.0.0. No server requests are made during
              benchmarking.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Small helper component — avoids repetition in the metric cards
// ---------------------------------------------------------------------------

function MetricRow({
  label,
  value,
  accent,
  bold = false,
}: {
  label: string;
  value: string;
  accent: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`text-sm ${accent} ${bold ? "font-bold" : "font-mono"}`}>
        {value}
      </dd>
    </div>
  );
}
