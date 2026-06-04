"use client";

import { useAnalyzerStore } from "@/store/analyzerStore";

export default function ResultCard() {
  const { result } = useAnalyzerStore();

  if (!result) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md flex flex-col justify-center">
      <h3 className="text-xl font-bold mb-6 text-gray-100">Analysis Result</h3>
      <div className="grid grid-cols-2 gap-6 text-gray-300">
        <div>
          <span className="block text-sm text-gray-400 uppercase tracking-wider mb-1">Fractal Dimension</span>
          <span className="text-4xl font-mono font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            {result.fractalDimension.toFixed(4)}
          </span>
        </div>
        <div>
          <span className="block text-sm text-gray-400 uppercase tracking-wider mb-1">R² Score</span>
          <span className="text-4xl font-mono font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
            {result.rSquared.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
