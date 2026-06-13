"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ImageUploader from "@/components/analyzer/ImageUploader";
import { useCompareStore } from "@/store/compareStore";
import { analyzeImage } from "@/lib/api/client";
import { getSpecimens } from "@/lib/supabase/queries";
import type { SlotKey } from "@/store/compareStore";
import type { Specimen } from "@/types/specimen";
import type { AnalysisResult } from "@/types/analysis";

interface ComparePanelProps {
  slot: SlotKey;
}

// Accent colors per slot
const ACCENT: Record<SlotKey, { border: string; text: string; badge: string; ring: string }> = {
  A: {
    border: "border-l-[3px] border-l-sky-400",
    text: "text-sky-400",
    badge: "bg-sky-400/15 text-sky-300 border border-sky-500/30",
    ring: "ring-sky-500/40",
  },
  B: {
    border: "border-l-[3px] border-l-orange-400",
    text: "text-orange-400",
    badge: "bg-orange-400/15 text-orange-300 border border-orange-500/30",
    ring: "ring-orange-500/40",
  },
};

/** Map a Specimen directly to AnalysisResult — no API call. */
function specimenToResult(sp: Specimen): AnalysisResult {
  return {
    fractal_dimension: sp.fractal_dimension,
    r_squared: sp.r_squared,
    intercept: sp.intercept ?? 0,
    standard_error: sp.standard_error ?? undefined,
    confidence_interval:
      sp.confidence_interval_low != null && sp.confidence_interval_high != null
        ? [sp.confidence_interval_low, sp.confidence_interval_high]
        : undefined,
    box_sizes: sp.box_sizes,
    box_counts: sp.box_counts,
    log_inverse_sizes: sp.log_inverse_sizes ?? sp.box_sizes.map((s) => -Math.log(s)),
    log_counts: sp.log_counts ?? sp.box_counts.map((n) => Math.log(n)),
    fitted_values: (() => {
      const xs = sp.log_inverse_sizes ?? sp.box_sizes.map((s) => -Math.log(s));
      const ys = sp.log_counts ?? sp.box_counts.map((n) => Math.log(n));
      const n = xs.length;
      if (n === 0) return [];
      const meanX = xs.reduce((a, b) => a + b, 0) / n;
      const meanY = ys.reduce((a, b) => a + b, 0) / n;
      const slope =
        xs.reduce((acc, xi, i) => acc + (xi - meanX) * (ys[i] - meanY), 0) /
        xs.reduce((acc, xi) => acc + (xi - meanX) ** 2, 0);
      const intercept = meanY - slope * meanX;
      return xs.map((xi) => slope * xi + intercept);
    })(),
    residuals: [],
    foreground_ratio: 0,
    complexity_class: sp.complexity_class ?? "",
    interpretation: sp.interpretation,
    warnings: [],
    sensitivity: null,
  };
}

export default function ComparePanel({ slot }: ComparePanelProps) {
  const store = useCompareStore();
  const slotState = store[slot];
  const accent = ACCENT[slot];

  const [mode, setMode] = useState<"upload" | "specimen">("upload");
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [specimensLoading, setSpecimensLoading] = useState(false);
  // Controls whether the drop zone is shown after a file is already loaded
  const [showDropzone, setShowDropzone] = useState(false);

  // Stable ref to latest slot state for the auto-reanalyze effect
  const slotRef = useRef(slotState);
  useEffect(() => {
    slotRef.current = slotState;
  });

  // Load specimens when mode switches to specimen
  useEffect(() => {
    if (mode !== "specimen" || specimens.length > 0) return;
    setSpecimensLoading(true);
    getSpecimens()
      .then(setSpecimens)
      .catch(console.error)
      .finally(() => setSpecimensLoading(false));
  }, [mode, specimens.length]);

  // ── Core analysis runner ──────────────────────────────────────────────────
  const runAnalysis = useCallback(
    async (file: File, opts: { analysisMode: string; thresholdMethod: string; thresholdValue: number }) => {
      store.setSlotIsAnalyzing(slot, true);
      store.setSlotError(slot, null);
      try {
        const res = await analyzeImage(file, {
          analysisMode: opts.analysisMode,
          thresholdMethod: opts.thresholdMethod,
          thresholdValue: opts.thresholdValue,
          runSensitivity: false,
        });
        store.setSlotResult(slot, { ...res.result, sensitivity: res.sensitivity ?? null });
        if (res.binary_image_b64) {
          store.setSlotBinaryImageUrl(slot, `data:image/png;base64,${res.binary_image_b64}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to analyze image";
        store.setSlotError(slot, message);
      } finally {
        store.setSlotIsAnalyzing(slot, false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slot]
  );

  // ── Handle file drop ──────────────────────────────────────────────────────
  const handleFileDrop = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      store.setSlotFile(slot, file, url);
      const s = slotRef.current;
      await runAnalysis(file, {
        analysisMode: s.analysisMode,
        thresholdMethod: s.thresholdMethod,
        thresholdValue: s.thresholdValue,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slot, runAnalysis]
  );

  // ── Auto re-analyze on mode/method change (immediate) ────────────────────
  useEffect(() => {
    const s = slotRef.current;
    if (s.sourceType !== "upload" || !s.file) return;
    runAnalysis(s.file, {
      analysisMode: slotState.analysisMode,
      thresholdMethod: slotState.thresholdMethod,
      thresholdValue: slotState.thresholdValue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotState.analysisMode, slotState.thresholdMethod]);

  // ── Auto re-analyze on threshold value change (600ms debounce) ───────────
  useEffect(() => {
    const s = slotRef.current;
    if (s.sourceType !== "upload" || !s.file || s.thresholdMethod !== "manual") return;
    const timer = setTimeout(() => {
      runAnalysis(s.file!, {
        analysisMode: s.analysisMode,
        thresholdMethod: s.thresholdMethod,
        thresholdValue: slotState.thresholdValue,
      });
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotState.thresholdValue]);

  // ── Handle specimen selection ─────────────────────────────────────────────
  const handleSpecimenSelect = (sp: Specimen) => {
    store.setSlotSpecimen(slot, sp);
    const result = specimenToResult(sp);
    store.setSlotResult(slot, result);
    store.setSlotBinaryImageUrl(slot, sp.binary_image_url ?? null);
    store.setSlotSourceType(slot, "specimen");
  };

  // ── Result badges helpers ─────────────────────────────────────────────────
  const reliabilityColor = (r?: string) => {
    if (r === "High") return "text-emerald-400 bg-emerald-900/20 border-emerald-700/30";
    if (r === "Medium") return "text-yellow-400 bg-yellow-900/20 border-yellow-700/30";
    return "text-red-400 bg-red-900/20 border-red-700/30";
  };

  const { result } = slotState;

  // ── Dynamic header label ─────────────────────────────────────────────────
  const headerLabel = (() => {
    if (slotState.sourceType === "upload" && slotState.file) {
      const name = slotState.file.name;
      return `File: ${name.length > 30 ? name.slice(0, 30) + "…" : name}`;
    }
    if (slotState.sourceType === "upload" && slotState.binaryImageUrl) {
      // file was lost on refresh but result survived
      return "Uploaded image (refreshed)";
    }
    if (slotState.sourceType === "specimen" && slotState.selectedSpecimen) {
      return `Specimen: ${slotState.selectedSpecimen.name}`;
    }
    // No source yet — reflect active tab
    return mode === "upload" ? "Upload Image" : "Gallery Specimen";
  })();

  // Group specimens by category
  const leaves = specimens.filter((s) => s.category === "leaf");
  const coastlines = specimens.filter((s) => s.category === "coastline");

  // True if a file was uploaded OR if results survived a refresh (file lost but binaryImageUrl intact)
  const hasActiveImage = !!(slotState.file || slotState.binaryImageUrl);

  return (
    <div className={`bg-[#0f111a] rounded-2xl border border-gray-800 ${accent.border} overflow-hidden`}>
      {/* Slot header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${accent.badge}`}>
          Slot {slot}
        </span>
        <h2 className={`text-base font-semibold ${accent.text} truncate max-w-[220px]`} title={headerLabel}>
          {headerLabel}
        </h2>
        <button
          className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
          onClick={() => store.resetSlot(slot)}
        >
          Reset
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Segmented mode control */}
        <div className="flex rounded-lg overflow-hidden border border-gray-700 w-fit">
          {(["upload", "specimen"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === m
                  ? `${accent.badge} font-semibold`
                  : "bg-gray-900 text-gray-400 hover:text-gray-200"
              }`}
            >
              {m === "upload" ? "Upload Image" : "Gallery Specimen"}
            </button>
          ))}
        </div>

        {/* ── MODE 1: Upload ── */}
        {mode === "upload" && (
          <div className="space-y-4">
            {/* Show drop zone when: no active image, OR user clicked Replace Image */}
            {(!hasActiveImage || showDropzone) && (
              <ImageUploader
                onFileDrop={async (file) => {
                  setShowDropzone(false);
                  await handleFileDrop(file);
                }}
                isAnalyzing={slotState.isAnalyzing}
                error={slotState.error}
              />
            )}

            {/* Thumbnails — shown prominently once an image is active and drop zone is collapsed */}
            {hasActiveImage && !showDropzone && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {/* Original image — unavailable after refresh when file is null */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Original</p>
                    {slotState.file && slotState.originalImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slotState.originalImageUrl}
                        alt="Original upload"
                        className="w-full h-36 object-cover rounded-lg border border-gray-700"
                      />
                    ) : (
                      <div className="w-full h-36 rounded-lg border border-gray-700 bg-gray-900/70 flex items-center justify-center">
                        <p className="text-[10px] text-gray-500 text-center px-2 leading-relaxed">
                          Original image<br />unavailable after refresh
                        </p>
                      </div>
                    )}
                  </div>

                  {slotState.binaryImageUrl && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Binary mask</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slotState.binaryImageUrl}
                        alt="Binary mask"
                        className="w-full h-36 object-cover rounded-lg border border-gray-700"
                      />
                    </div>
                  )}
                </div>

                {/* Replace Image button */}
                <button
                  onClick={() => setShowDropzone(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 text-xs font-medium transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                  </svg>
                  Replace Image
                </button>
              </>
            )}

            {/* Settings — shown after an image is active */}
            {hasActiveImage && (
              <div className="space-y-4 bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                {/* Analysis Mode */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Analysis Mode</p>
                  <div className="flex flex-wrap gap-2">
                    {(["full_mask", "boundary", "texture"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => store.setSlotAnalysisMode(slot, m)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                          slotState.analysisMode === m
                            ? `${accent.badge} font-semibold`
                            : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                        }`}
                        disabled={!slotState.file}
                        title={!slotState.file ? "Re-upload image to change settings" : undefined}
                      >
                        {m === "full_mask" ? "Full Mask" : m === "boundary" ? "Boundary" : "Texture"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Threshold Method — only for full_mask */}
                {slotState.analysisMode === "full_mask" && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Threshold Method</p>
                    <div className="flex flex-wrap gap-2">
                      {(["otsu", "manual", "adaptive"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => store.setSlotThresholdMethod(slot, t)}
                          className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                            slotState.thresholdMethod === t
                              ? `${accent.badge} font-semibold`
                              : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                          }`}
                          disabled={!slotState.file}
                          title={!slotState.file ? "Re-upload image to change settings" : undefined}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual threshold slider */}
                {slotState.analysisMode === "full_mask" && slotState.thresholdMethod === "manual" && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Threshold: {slotState.thresholdValue}
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={slotState.thresholdValue}
                      onChange={(e) => store.setSlotThresholdValue(slot, Number(e.target.value))}
                      className="w-full accent-sky-400"
                      disabled={!slotState.file}
                    />
                  </div>
                )}

                {/* Hint when file is missing after refresh */}
                {!slotState.file && (
                  <p className="text-[10px] text-gray-600 italic">
                    Settings locked — re-upload to run a new analysis.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MODE 2: Gallery Specimen ── */}
        {mode === "specimen" && (
          <div className="space-y-3">
            {specimensLoading ? (
              <p className="text-sm text-gray-500">Loading specimens…</p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-700 divide-y divide-gray-800">
                {[
                  { label: "Leaves", items: leaves },
                  { label: "Coastlines", items: coastlines },
                ].map(({ label, items }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 bg-gray-900/70 sticky top-0">
                      {label}
                    </p>
                    {items.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => handleSpecimenSelect(sp)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-800/60 transition-colors ${
                          slotState.selectedSpecimen?.id === sp.id ? "bg-gray-800" : ""
                        }`}
                      >
                        <span className="text-sm text-gray-200 font-medium">{sp.name}</span>
                        <span className={`text-xs font-mono ${accent.text}`}>
                          D = {sp.fractal_dimension.toFixed(4)}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Specimen preview */}
            {slotState.selectedSpecimen && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Specimen image</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slotState.selectedSpecimen.image_url}
                    alt={slotState.selectedSpecimen.name}
                    className="w-full h-28 object-cover rounded-lg border border-gray-700"
                  />
                </div>
                {slotState.binaryImageUrl && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Binary mask</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slotState.binaryImageUrl}
                      alt="Binary mask"
                      className="w-full h-28 object-cover rounded-lg border border-gray-700"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Compact result card ── */}
        {result && (
          <div className={`rounded-xl border border-gray-700 bg-gray-900/40 p-4 space-y-3 ring-1 ${accent.ring}`}>
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-extrabold ${accent.text}`}>
                D = {result.fractal_dimension.toFixed(4)}
              </span>
              <span className="text-sm text-gray-400">
                R² = {result.r_squared.toFixed(4)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.reliability && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${reliabilityColor(result.reliability)}`}>
                  {result.reliability} reliability
                </span>
              )}
              {result.quality_score !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-400">
                  Quality {result.quality_score}/100
                </span>
              )}
              {result.complexity_class && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-400">
                  {result.complexity_class}
                </span>
              )}
            </div>

            {slotState.isAnalyzing && (
              <p className="text-xs text-gray-500 animate-pulse">Re-analyzing…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
