"use client";

import { useAnalyzerStore } from "@/store/analyzerStore";

export default function ComparisonPanel() {
  const { result, comparisonSpecimen, setComparisonSpecimen } = useAnalyzerStore();

  if (!result || !comparisonSpecimen) return null;

  const delta = result.fractal_dimension - comparisonSpecimen.fractal_dimension;
  const absDelta = Math.abs(delta);

  const interpretation =
    absDelta < 0.02
      ? "Nearly identical complexity"
      : delta > 0
      ? `Your image is more complex than ${comparisonSpecimen.name}`
      : `${comparisonSpecimen.name} is more complex than your image`;

  const deltaColor = absDelta < 0.02 ? "text-gray-300" : delta > 0 ? "text-blue-400" : "text-amber-400";

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-amber-700/40 shadow-md space-y-5">
      <h3 className="text-xl font-bold text-gray-100">Comparison</h3>

      {/* Row 1 — Side-by-side stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Your image */}
        <div className="bg-gray-900/60 border border-blue-800/40 rounded-lg p-4">
          <span className="block text-[10px] uppercase tracking-wider text-blue-400 mb-2 font-semibold">
            Your Image
          </span>
          <div className="space-y-1.5 font-mono">
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 text-xs w-4">D</span>
              <span className="text-blue-400 font-bold text-lg">{result.fractal_dimension.toFixed(4)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 text-xs w-4">R²</span>
              <span className="text-green-400 font-semibold">{result.r_squared.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Comparison specimen */}
        <div className="bg-gray-900/60 border border-amber-700/40 rounded-lg p-4">
          <span className="block text-[10px] uppercase tracking-wider text-amber-400 mb-2 font-semibold truncate">
            {comparisonSpecimen.name}
          </span>
          <div className="space-y-1.5 font-mono">
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 text-xs w-4">D</span>
              <span className="text-amber-400 font-bold text-lg">{comparisonSpecimen.fractal_dimension.toFixed(4)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 text-xs w-4">R²</span>
              <span className="text-green-400 font-semibold">{comparisonSpecimen.r_squared.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Delta summary */}
      <div className="bg-gray-900/40 rounded-lg px-4 py-3 border border-gray-700/60 space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="text-gray-400 text-sm font-medium">ΔD</span>
          <span className={`font-mono font-bold text-xl ${deltaColor}`}>
            {delta >= 0 ? "+" : ""}{delta.toFixed(4)}
          </span>
        </div>
        <p className="text-sm text-gray-400 leading-snug">{interpretation}</p>
      </div>

      {/* Row 3 — Clear button */}
      <div className="flex justify-end">
        <button
          onClick={() => setComparisonSpecimen(null)}
          className="text-sm text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-500/50 px-4 py-2 rounded-lg transition-colors"
        >
          Clear Comparison
        </button>
      </div>
    </div>
  );
}
