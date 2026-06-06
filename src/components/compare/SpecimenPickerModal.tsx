"use client";

import { useEffect, useState } from "react";
import { getSpecimens } from "@/lib/supabase/queries";
import { useAnalyzerStore } from "@/store/analyzerStore";
import type { Specimen } from "@/types/specimen";

interface SpecimenPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Category badge ────────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: Specimen["category"] }) {
  const styles =
    category === "leaf"
      ? "bg-emerald-600/80 text-emerald-100"
      : category === "coastline"
      ? "bg-sky-600/80 text-sky-100"
      : "bg-purple-600/80 text-purple-100";
  const label =
    category === "leaf" ? "Leaf" : category === "coastline" ? "Coastline" : "Fractal";
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${styles}`}>
      {label}
    </span>
  );
}

// ─── Main modal ────────────────────────────────────────────────────────────────
export default function SpecimenPickerModal({ isOpen, onClose }: SpecimenPickerModalProps) {
  const { setComparisonSpecimen } = useAnalyzerStore();
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch on open
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setFetchError(null);
    getSpecimens()
      .then((data) => {
        // Filter out specimens with no backfilled box_counts
        const valid = data.filter((s) => Array.isArray(s.box_counts) && s.box_counts.length > 0);
        setSpecimens(valid);
      })
      .catch((err) => setFetchError(err.message ?? "Failed to load specimens"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (specimen: Specimen) => {
    setComparisonSpecimen(specimen);
    onClose();
  };

  const handleClear = () => {
    setComparisonSpecimen(null);
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Select comparison specimen"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Compare with Specimen</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select a dissertation specimen to overlay its log-log line on your chart
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-700"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-400 text-sm">Loading specimens…</span>
            </div>
          )}

          {fetchError && !loading && (
            <div className="text-center py-12 text-red-400 text-sm">{fetchError}</div>
          )}

          {!loading && !fetchError && specimens.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              No specimens with valid data found.
            </div>
          )}

          {!loading && !fetchError && specimens.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specimens.map((specimen) => (
                <button
                  key={specimen.id}
                  onClick={() => handleSelect(specimen)}
                  className="text-left bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-amber-500/60 hover:bg-gray-750 hover:shadow-[0_0_16px_rgba(245,158,11,0.12)] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="font-semibold text-white text-sm leading-snug group-hover:text-amber-300 transition-colors">
                      {specimen.name}
                    </span>
                    <CategoryBadge category={specimen.category} />
                  </div>
                  <div className="flex gap-5 font-mono">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">D</span>
                      <span className="text-blue-400 font-bold text-sm">{specimen.fractal_dimension.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">R²</span>
                      <span className="text-green-400 font-semibold text-sm">{specimen.r_squared.toFixed(4)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-500/60 px-4 py-2 rounded-lg transition-colors"
          >
            Clear comparison
          </button>
        </div>
      </div>
    </div>
  );
}
