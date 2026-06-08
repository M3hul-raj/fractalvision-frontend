"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PageShell from "@/components/layout/PageShell";
import ExplorerLogLogChart from "@/components/explorer/ExplorerLogLogChart";
import { generateFractal } from "@/lib/api/client";
import type { GenerateFractalResponse } from "@/types/api";

// ── Hardcoded fractal metadata (no fetch on every render) ────────────────────
const FRACTALS = [
  {
    fractal_id: "cantor_set",
    name: "Cantor Set",
    theoretical_dimension: 0.6309,
    max_iterations: 8,
    description: "Repeatedly removing middle thirds of line segments",
    formula: "D = log(2)/log(3) ≈ 0.6309",
  },
  {
    fractal_id: "koch_curve",
    name: "Koch Curve",
    theoretical_dimension: 1.2619,
    max_iterations: 7,
    description: "Each segment replaced by four segments of one-third length",
    formula: "D = log(4)/log(3) ≈ 1.2619",
  },
  {
    fractal_id: "koch_snowflake",
    name: "Koch Snowflake",
    theoretical_dimension: 1.2619,
    max_iterations: 7,
    description: "Three Koch curves forming a closed snowflake boundary",
    formula: "D = log(4)/log(3) ≈ 1.2619",
  },
  {
    fractal_id: "sierpinski_triangle",
    name: "Sierpiński Triangle",
    theoretical_dimension: 1.585,
    max_iterations: 8,
    description: "Equilateral triangle recursively subdivided",
    formula: "D = log(3)/log(2) ≈ 1.5850",
  },
  {
    fractal_id: "sierpinski_carpet",
    name: "Sierpiński Carpet",
    theoretical_dimension: 1.8928,
    max_iterations: 6,
    description: "Square subdivided into 9, center removed recursively",
    formula: "D = log(8)/log(3) ≈ 1.8928",
  },
] as const;

type FractalId = (typeof FRACTALS)[number]["fractal_id"];

/** Compute fitted regression values from log arrays + slope (computed_dimension). */
function computeFitted(log_inverse_sizes: number[], log_counts: number[], slope: number): number[] {
  if (log_inverse_sizes.length === 0) return [];
  const n = log_inverse_sizes.length;
  const meanX = log_inverse_sizes.reduce((a, b) => a + b, 0) / n;
  const meanY = log_counts.reduce((a, b) => a + b, 0) / n;
  const intercept = meanY - slope * meanX;
  return log_inverse_sizes.map((x) => slope * x + intercept);
}

/** Color class for the error percentage cell. */
function errorColor(pct: number): string {
  if (pct < 1) return "text-emerald-400";
  if (pct < 5) return "text-amber-400";
  return "text-red-400";
}

export default function ExplorerPage() {
  const [selectedId, setSelectedId] = useState<FractalId>("sierpinski_triangle");
  const [sliderValue, setSliderValue] = useState(4);
  const [apiIterations, setApiIterations] = useState(4);
  const [result, setResult] = useState<GenerateFractalResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  // ── Lightbox transform state ───────────────────────────────────────────────
  const [zoom, setZoom] = useState(0.5);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const currentPan = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref to current zoom/pan so the wheel handler closure never goes stale
  const zoomRef = useRef(zoom);
  const panRef = useRef(panOffset);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = panOffset; }, [panOffset]);

  const selectedFractal = FRACTALS.find((f) => f.fractal_id === selectedId)!;

  // ── API call ──────────────────────────────────────────────────────────────
  const runGenerate = useCallback(
    async (id: FractalId, iterations: number) => {
      setIsGenerating(true);
      setError(null);
      try {
        const data = await generateFractal(id, { iterations, imageSize: 1024 });
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  // Auto-generate on mount + whenever selectedId or apiIterations changes
  useEffect(() => {
    runGenerate(selectedId, apiIterations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, apiIterations]);

  // ── Fractal selection ─────────────────────────────────────────────────────
  const handleSelectFractal = (id: FractalId) => {
    const meta = FRACTALS.find((f) => f.fractal_id === id)!;
    const clamped = Math.min(sliderValue, meta.max_iterations);
    setSelectedId(id);
    setSliderValue(clamped);
    setApiIterations(clamped);
  };

  // ── Slider interaction ────────────────────────────────────────────────────
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  const commitIterations = () => {
    setApiIterations(sliderValue);
  };

  // ── Derived: fitted values ────────────────────────────────────────────────
  const fittedValues =
    result
      ? computeFitted(result.log_inverse_sizes, result.log_counts, result.computed_dimension)
      : [];

  // Compute the pan offset that centers a 1024×1024 image at the given zoom
  // inside the viewport container.
  const centeredPan = useCallback((zoomLevel: number): { x: number; y: number } => {
    const el = containerRef.current;
    const w = el ? el.clientWidth  : window.innerWidth;
    const h = el ? el.clientHeight : window.innerHeight;
    return {
      x: (w - 1024 * zoomLevel) / 2,
      y: (h - 1024 * zoomLevel) / 2,
    };
  }, []);

  const resetLightbox = useCallback(() => {
    const INITIAL_ZOOM = 0.5;
    const pan = centeredPan(INITIAL_ZOOM);
    setZoom(INITIAL_ZOOM);
    setPanOffset(pan);
    currentPan.current = pan;
  }, [centeredPan]);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    resetLightbox();
  }, [resetLightbox]);

  // Attach non-passive wheel listener AND set the centered initial position on open
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isLightboxOpen) return;

    // ── Center the image on first open ──────────────────────────────────────
    const INITIAL_ZOOM = 0.5;
    // Use requestAnimationFrame so the container has been painted and has real dimensions
    const rafId = requestAnimationFrame(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const initPan = {
        x: (w - 1024 * INITIAL_ZOOM) / 2,
        y: (h - 1024 * INITIAL_ZOOM) / 2,
      };
      setPanOffset(initPan);
      currentPan.current = initPan;
      zoomRef.current = INITIAL_ZOOM;
    });

    // ── Non-passive wheel handler ────────────────────────────────────────────
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const FACTOR = 1.12;
      const direction = e.deltaY < 0 ? FACTOR : 1 / FACTOR;
      const oldZoom = zoomRef.current;
      const newZoom = Math.max(0.25, Math.min(8.0, oldZoom * direction));

      // Mouse position relative to container's top-left corner
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Focal-point math with transformOrigin '0px 0px'
      const ratio = newZoom / oldZoom;
      const oldPan = panRef.current;
      const newPanX = mouseX - (mouseX - oldPan.x) * ratio;
      const newPanY = mouseY - (mouseY - oldPan.y) * ratio;

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
      currentPan.current = { x: newPanX, y: newPanY };
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [isLightboxOpen]);

  // ── Button zoom (toward viewport center) ──────────────────────────────────
  const buttonZoom = useCallback((direction: 1 | -1) => {
    const el = containerRef.current;
    const oldZoom = zoomRef.current;
    const STEP = 0.25;
    const newZoom = Math.max(0.25, Math.min(8.0, parseFloat((oldZoom + direction * STEP).toFixed(4))));
    const ratio = newZoom / oldZoom;

    // Zoom toward viewport center
    const viewW = el ? el.clientWidth : window.innerWidth;
    const viewH = el ? el.clientHeight : window.innerHeight;
    const cx = viewW / 2;
    const cy = viewH / 2;
    const oldPan = panRef.current;
    const newPanX = cx - (cx - oldPan.x) * ratio;
    const newPanY = cy - (cy - oldPan.y) * ratio;

    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
    currentPan.current = { x: newPanX, y: newPanY };
  }, []);

  // ── Drag-to-pan: mouse ────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { x: e.clientX - currentPan.current.x, y: e.clientY - currentPan.current.y };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - panStart.current.x;
    const newY = e.clientY - panStart.current.y;
    setPanOffset({ x: newX, y: newY });
    currentPan.current = { x: newX, y: newY };
  }, [isPanning]);

  const onMouseUp = useCallback(() => setIsPanning(false), []);

  // ── Drag-to-pan: touch ────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    setIsPanning(true);
    panStart.current = { x: t.clientX - currentPan.current.x, y: t.clientY - currentPan.current.y };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const newX = t.clientX - panStart.current.x;
    const newY = t.clientY - panStart.current.y;
    setPanOffset({ x: newX, y: newY });
    currentPan.current = { x: newX, y: newY };
  }, [isPanning]);

  const onTouchEnd = useCallback(() => setIsPanning(false), []);

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Fractal Explorer
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl">
            Validate the box-counting algorithm against mathematical fractals with known
            theoretical dimensions.
          </p>
        </div>

        {/* Section 1 — Fractal selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {FRACTALS.map((f) => {
            const isActive = f.fractal_id === selectedId;
            return (
              <button
                key={f.fractal_id}
                id={`fractal-card-${f.fractal_id}`}
                onClick={() => handleSelectFractal(f.fractal_id as FractalId)}
                className={`text-left rounded-xl p-4 border transition-all duration-200 ${
                  isActive
                    ? "border-sky-400 bg-sky-400/10 ring-1 ring-sky-400/30 shadow-[0_0_18px_rgba(56,189,248,0.15)]"
                    : "border-gray-700 bg-gray-900/60 hover:border-gray-500 hover:bg-gray-800/60"
                }`}
              >
                <p className={`text-sm font-bold leading-tight ${isActive ? "text-sky-300" : "text-gray-200"}`}>
                  {f.name}
                </p>
                <p className={`text-xs font-mono mt-1 ${isActive ? "text-sky-400" : "text-gray-400"}`}>
                  D = {f.theoretical_dimension.toFixed(4)}
                </p>
                <p className="text-[10px] text-gray-500 mt-2 leading-snug line-clamp-2">
                  {f.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Section 2 — Iteration control */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-900/60 border border-gray-800 rounded-xl px-6 py-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-gray-300">
              Iterations:{" "}
              <span className="text-sky-400 font-mono">{sliderValue}</span>
            </span>
            {isGenerating && (
              <span className="text-xs text-gray-500 animate-pulse ml-2">Generating…</span>
            )}
          </div>
          <input
            type="range"
            min={1}
            max={selectedFractal.max_iterations}
            step={1}
            value={sliderValue}
            onChange={handleSliderChange}
            onMouseUp={commitIterations}
            onTouchEnd={commitIterations}
            className="flex-1 min-w-[180px] accent-sky-400"
            aria-label="Iteration depth"
          />
          <div className="flex gap-1">
            {Array.from({ length: selectedFractal.max_iterations }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => {
                  setSliderValue(n);
                  setApiIterations(n);
                }}
                className={`w-6 h-6 text-[10px] rounded font-mono transition-colors ${
                  n === sliderValue
                    ? "bg-sky-400 text-gray-900 font-bold"
                    : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 w-full">
            {selectedFractal.formula}
          </p>
        </div>

        {/* Error card */}
        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Section 3 — Main output */}
        {(result || isGenerating) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: fractal image */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Generated Image
              </h3>
              <div className="relative">
                {result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:image/png;base64,${result.image_base64}`}
                    alt={`${result.name} at iteration ${result.iterations}`}
                    onClick={() => setIsLightboxOpen(true)}
                    className={`w-full aspect-square object-contain bg-black border border-gray-800 rounded-xl transition-opacity duration-300 cursor-pointer hover:ring-2 hover:ring-sky-400 ${
                      isGenerating ? "opacity-40" : "opacity-100"
                    }`}
                  />
                ) : (
                  // First-load skeleton
                  <div className="w-full aspect-square bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                )}
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="px-4 py-2 bg-gray-950/80 rounded-lg text-sky-400 text-sm font-medium animate-pulse">
                      Generating…
                    </div>
                  </div>
                )}
              </div>
              {result && (
                <p className="text-xs text-gray-500 text-center">
                  Iteration {result.iterations} · {result.processing_time_ms}ms · 1024 × 1024 px
                </p>
              )}
            </div>

            {/* Right: log-log chart */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Log-Log Regression Plot
              </h3>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
                {result && fittedValues.length > 0 ? (
                  <ExplorerLogLogChart
                    log_inverse_sizes={result.log_inverse_sizes}
                    log_counts={result.log_counts}
                    fitted_values={fittedValues}
                    fractal_dimension={result.computed_dimension}
                    r_squared={result.r_squared}
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-800/40 rounded-lg animate-pulse" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 4 — Results table */}
        {result && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-base font-semibold text-gray-100">Analysis Results</h3>
            </div>
            <div className="divide-y divide-gray-800/60">
              {[
                {
                  label: "Theoretical Dimension",
                  value: result.theoretical_dimension.toFixed(4),
                  mono: true,
                  colorClass: "text-gray-200",
                },
                {
                  label: "Computed Dimension",
                  value: result.computed_dimension.toFixed(4),
                  mono: true,
                  colorClass: "text-sky-400 font-bold",
                },
                {
                  label: "Error %",
                  value: `${result.error_percentage.toFixed(3)}%`,
                  mono: true,
                  colorClass: errorColor(result.error_percentage),
                },
                {
                  label: "R² (Goodness of Fit)",
                  value: result.r_squared.toFixed(6),
                  mono: true,
                  colorClass: result.r_squared > 0.99 ? "text-emerald-400" : "text-amber-400",
                },
                {
                  label: "Foreground Boxes (largest scale)",
                  value: result.box_counts[0]?.toLocaleString() ?? "—",
                  mono: false,
                  colorClass: "text-gray-300",
                },
                {
                  label: "Scales Analysed",
                  value: `${result.box_sizes.length} scales (${result.box_sizes[0]} → ${result.box_sizes[result.box_sizes.length - 1]} px)`,
                  mono: false,
                  colorClass: "text-gray-300",
                },
              ].map(({ label, value, mono, colorClass }) => (
                <div key={label} className="flex items-center justify-between px-6 py-3 hover:bg-gray-800/30 transition-colors">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className={`text-sm ${colorClass} ${mono ? "font-mono" : ""}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {isLightboxOpen && result?.image_base64 && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col select-none"
          onClick={closeLightbox}
        >
          {/* Header bar — stopPropagation so clicks here don't close the modal */}
          <div
            className="flex items-center justify-between px-5 py-3 bg-gray-950/90 border-b border-gray-800 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: name + iteration */}
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-white">{result.name}</span>
              <span className="text-gray-500 ml-2">· Iteration {result.iterations}</span>
            </div>

            {/* Center: zoom controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => buttonZoom(-1)}
                className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-gray-200 hover:bg-gray-700 text-sm font-bold transition-colors"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="text-xs font-mono text-sky-400 w-14 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => buttonZoom(1)}
                className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-gray-200 hover:bg-gray-700 text-sm font-bold transition-colors"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={resetLightbox}
                className="px-2.5 h-7 text-xs rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Right: hint + close */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-600 hidden sm:block">
                Scroll to zoom · Drag to pan
              </span>
              <button
                onClick={closeLightbox}
                className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
                aria-label="Close lightbox"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Image viewport — wheel + drag zone */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${result.image_base64}`}
              alt="Fractal full resolution"
              draggable={false}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transformOrigin: "0px 0px",
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transition: isPanning ? "none" : "transform 0.08s ease-out",
                imageRendering: zoom >= 2 ? "pixelated" : "auto",
              }}
              className="max-w-none pointer-events-none select-none"
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}
