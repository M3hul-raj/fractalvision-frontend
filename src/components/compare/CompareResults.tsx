"use client";

import DualLogLogChart from "@/components/compare/DualLogLogChart";
import type { AnalysisResult } from "@/types/analysis";

interface CompareResultsProps {
  resultA: AnalysisResult;
  resultB: AnalysisResult;
}

export default function CompareResults({ resultA, resultB }: CompareResultsProps) {
  const dA = resultA.fractal_dimension;
  const dB = resultB.fractal_dimension;

  const deltaD = Math.abs(dA - dB);
  const deltaR2 = Math.abs(resultA.r_squared - resultB.r_squared);
  const maxD = Math.max(dA, dB);
  const minD = Math.min(dA, dB);
  const relDelta = minD > 0 ? ((maxD - minD) / minD) * 100 : 0;

  const winner: "A" | "B" | "equal" =
    deltaD < 0.005 ? "equal" : dA > dB ? "A" : "B";

  // ΔD color
  const deltaDColor =
    deltaD < 0.01 ? "text-emerald-400" : deltaD < 0.1 ? "text-yellow-400" : "text-red-400";

  // Winner accent
  const winnerColor = winner === "A" ? "text-sky-400" : winner === "B" ? "text-orange-400" : "text-gray-300";
  const winnerLabel = winner === "equal" ? "Equal" : `Image ${winner}`;

  // D-bar mapping: D ∈ [1.0, 2.0] → [0%, 100%]
  const dToBar = (d: number) => Math.min(100, Math.max(0, ((d - 1.0) / 1.0) * 100));

  // Conclusion text
  const conclusionText =
    winner === "equal"
      ? `Image A and Image B have essentially identical fractal complexity (ΔD = ${deltaD.toFixed(4)}). Both patterns exhibit similar structural irregularity across scales.`
      : `Image ${winner} is ${relDelta.toFixed(2)}% more complex than Image ${winner === "A" ? "B" : "A"} (D = ${maxD.toFixed(4)} vs D = ${minD.toFixed(4)}). Image ${winner} exhibits greater space-filling behaviour and structural irregularity across scales.`;

  const metricCards = [
    {
      label: "ΔD (Dimension gap)",
      value: deltaD.toFixed(4),
      color: deltaDColor,
      sub: deltaD < 0.01 ? "Nearly identical" : deltaD < 0.1 ? "Moderate difference" : "Large difference",
    },
    {
      label: "More Complex",
      value: winnerLabel,
      color: winnerColor,
      sub: winner === "equal" ? "ΔD < 0.005" : `by ${relDelta.toFixed(2)}%`,
    },
    {
      label: "ΔR² (Fit quality gap)",
      value: deltaR2.toFixed(4),
      color: "text-gray-200",
      sub: "lower is better",
    },
    {
      label: "Relative Δ",
      value: `${relDelta.toFixed(2)}%`,
      color: "text-gray-200",
      sub: "% complexity difference",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Section heading */}
      <div className="border-t border-gray-800 pt-8">
        <h2 className="text-2xl font-bold text-white mb-1">Comparison Results</h2>
        <p className="text-gray-400 text-sm">Computed from both slot results</p>
      </div>

      {/* Section 1 — Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#0f111a] border border-gray-800 rounded-xl p-5 flex flex-col gap-1"
          >
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-600">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Section 2 — Dual chart */}
      <div className="bg-[#0f111a] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-6">Log-Log Plot Overlay</h3>
        <DualLogLogChart resultA={resultA} resultB={resultB} />
      </div>

      {/* Section 3 — Conclusion */}
      <div className="bg-[#0f111a] border border-gray-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-100">Conclusion</h3>

        <p className="text-gray-300 leading-relaxed">{conclusionText}</p>

        {/* D-value bar chart */}
        <div className="space-y-4">
          {[
            { label: "Image A", d: dA, color: "bg-sky-400", textColor: "text-sky-400" },
            { label: "Image B", d: dB, color: "bg-orange-400", textColor: "text-orange-400" },
          ].map(({ label, d, color, textColor }) => (
            <div key={label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
                <span className={`text-sm font-mono ${textColor}`}>D = {d.toFixed(4)}</span>
              </div>
              <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-700`}
                  style={{ width: `${dToBar(d)}%` }}
                />
              </div>
            </div>
          ))}
          {/* Scale labels */}
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>D = 1.0 (line)</span>
            <span>D = 2.0 (plane)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
