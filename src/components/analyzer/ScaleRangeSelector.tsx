"use client";

import { useState, useMemo } from "react";
import { useAnalyzerStore } from "@/store/analyzerStore";

// ── Inline OLS ────────────────────────────────────────────────────────────────
function computeFilteredOLS(
  x: number[], // log_inverse_sizes filtered to enabledIndices
  y: number[]  // log_counts filtered to enabledIndices
): { slope: number; rSquared: number } {
  const n = x.length;
  if (n < 2) return { slope: NaN, rSquared: NaN };
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumXX = x.reduce((s, xi) => s + xi * xi, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: NaN, rSquared: NaN };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const yMean = sumY / n;
  const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  const ssRes = y.reduce(
    (s, yi, i) => s + (yi - (slope * x[i] + intercept)) ** 2,
    0
  );
  return { slope, rSquared: ssTot === 0 ? 1 : 1 - ssRes / ssTot };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val: number, digits = 4): string {
  if (!isFinite(val) || isNaN(val)) return "—";
  return val.toFixed(digits);
}

function deltaColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.05) return "text-emerald-400";
  if (abs < 0.15) return "text-amber-400";
  return "text-red-400";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScaleRangeSelector() {
  const result = useAnalyzerStore((s) => s.result);

  // Track which indices are enabled — default all enabled, reset when result changes
  const [enabledIndices, setEnabledIndices] = useState<Set<number>>(
    () => new Set()
  );
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // If result is null, render nothing
  if (!result || !result.box_sizes || result.box_sizes.length === 0) return null;

  const { box_sizes, log_inverse_sizes, log_counts, fractal_dimension, r_squared } = result;
  const total = box_sizes.length;

  // Treat empty set as "all enabled"
  const effectiveEnabled: Set<number> =
    enabledIndices.size === 0
      ? new Set(box_sizes.map((_, i) => i))
      : enabledIndices;

  const allEnabled = effectiveEnabled.size === total;

  // ── Toggle handler ────────────────────────────────────────────────────────
  function toggleIndex(idx: number) {
    // Start from current effective set
    const next = new Set(effectiveEnabled);

    if (next.has(idx)) {
      // Don't allow disabling if it would leave fewer than 2 enabled
      if (next.size <= 2) return;
      next.delete(idx);
    } else {
      next.add(idx);
    }

    // If the result is back to all enabled, reset to empty set (canonical all-on)
    if (next.size === total) {
      setEnabledIndices(new Set());
    } else {
      setEnabledIndices(next);
    }
  }

  // ── Filtered OLS ──────────────────────────────────────────────────────────
  const filteredOLS = useMemo(() => {
    if (allEnabled) return null; // nothing to show when all are on
    const enabledArr = Array.from(effectiveEnabled).sort((a, b) => a - b);
    const fx = enabledArr.map((i) => log_inverse_sizes[i]);
    const fy = enabledArr.map((i) => log_counts[i]);
    return computeFilteredOLS(fx, fy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledIndices, log_inverse_sizes, log_counts, allEnabled]);

  const delta =
    filteredOLS && !isNaN(filteredOLS.slope)
      ? filteredOLS.slope - fractal_dimension
      : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-100">
          Scale Range Sensitivity
        </h3>
        {/* Info icon + tooltip */}
        <div className="relative">
          <button
            id="scale-range-info-btn"
            aria-label="About Scale Range Sensitivity"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onFocus={() => setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            className="text-gray-500 hover:text-sky-400 transition-colors duration-150 focus:outline-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>
          {tooltipVisible && (
            <div
              role="tooltip"
              className="absolute right-0 top-6 z-20 w-64 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2.5 text-xs text-gray-300 shadow-xl leading-relaxed"
            >
              Toggle box sizes to see how the fractal dimension changes when
              individual scales are included or excluded.
            </div>
          )}
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {box_sizes.map((size, idx) => {
          const enabled = effectiveEnabled.has(idx);
          const isLastTwo = effectiveEnabled.size === 2 && enabled;

          return (
            <button
              key={size}
              id={`scale-chip-${size}`}
              aria-pressed={enabled}
              aria-label={`Box size ε=${size}, ${enabled ? "enabled" : "disabled"}`}
              onClick={() => toggleIndex(idx)}
              title={
                isLastTwo
                  ? "At least 2 box sizes must remain enabled"
                  : undefined
              }
              className={[
                "px-3 py-1.5 rounded-full text-xs font-mono font-semibold border transition-all duration-150 select-none",
                enabled
                  ? "border-sky-400 bg-sky-400/20 text-sky-400 hover:brightness-90"
                  : "border-zinc-600 bg-zinc-800 text-zinc-500 hover:brightness-125",
                isLastTwo ? "cursor-not-allowed opacity-70" : "cursor-pointer",
              ].join(" ")}
            >
              ε={size}
            </button>
          );
        })}
      </div>

      {/* Comparison rows — only shown when at least one chip is disabled */}
      {!allEnabled && filteredOLS && (
        <div className="rounded-lg bg-gray-900/60 border border-gray-700 divide-y divide-gray-700/60 overflow-hidden text-sm">
          {/* Full range row */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-400 font-medium">Full range</span>
            <div className="flex items-center gap-5 font-mono">
              <span className="text-gray-200">
                D&nbsp;=&nbsp;
                <span className="text-white font-semibold">
                  {fmt(fractal_dimension)}
                </span>
              </span>
              <span className="text-gray-400">
                R²&nbsp;=&nbsp;
                <span className="text-gray-200">{fmt(r_squared)}</span>
              </span>
            </div>
          </div>

          {/* Filtered row */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sky-400 font-medium">Filtered</span>
            <div className="flex items-center gap-5 font-mono">
              <span className="text-gray-200">
                D&nbsp;=&nbsp;
                <span className="text-white font-semibold">
                  {fmt(filteredOLS.slope)}
                </span>
              </span>
              <span className="text-gray-400">
                R²&nbsp;=&nbsp;
                <span className="text-gray-200">{fmt(filteredOLS.rSquared)}</span>
              </span>
              {/* Delta */}
              {delta !== null && isFinite(delta) && (
                <span className={`font-semibold ${deltaColor(delta)}`}>
                  {delta >= 0 ? "↑" : "↓"}&nbsp;
                  {delta >= 0 ? "+" : ""}
                  {fmt(delta)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
