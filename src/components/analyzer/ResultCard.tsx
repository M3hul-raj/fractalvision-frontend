"use client";

import { useAnalyzerStore } from "@/store/analyzerStore";

export default function ResultCard() {
  const { result, lastResponse, isAnalyzing } = useAnalyzerStore();

  if (!result || !lastResponse) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md flex flex-col justify-center">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-100">Analysis Result</h3>
        {isAnalyzing && <span className="text-xs font-mono text-blue-400 animate-pulse bg-blue-900/30 px-2 py-1 rounded">Re-computing...</span>}
      </div>
      <div className="grid grid-cols-2 gap-6 text-gray-300 mb-6">
        <div>
          <span className="block text-sm text-gray-400 uppercase tracking-wider mb-1">Fractal Dimension</span>
          <span className={`text-4xl font-mono font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-opacity duration-300 ${isAnalyzing ? 'opacity-30' : 'opacity-100'}`}>
            {result?.fractal_dimension != null ? result.fractal_dimension.toFixed(4) : '—'}
          </span>
        </div>
        <div>
          <span className="block text-sm text-gray-400 uppercase tracking-wider mb-1">R² Score</span>
          <span className={`text-4xl font-mono font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] transition-opacity duration-300 ${isAnalyzing ? 'opacity-30' : 'opacity-100'}`}>
            {result?.r_squared != null ? result.r_squared.toFixed(4) : '—'}
          </span>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-4 mt-2">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Parameters Used</h4>
        <div className="flex flex-wrap gap-4 text-xs font-mono">
          <div className="bg-gray-900 rounded px-3 py-2 border border-gray-600">
            <span className="text-gray-500 block uppercase tracking-wider mb-1" style={{ fontSize: '10px' }}>Mode</span>
            <span className="text-gray-200 capitalize">{lastResponse.analysis_mode.replace('_', ' ')}</span>
          </div>
          <div className="bg-gray-900 rounded px-3 py-2 border border-gray-600">
            <span className="text-gray-500 block uppercase tracking-wider mb-1" style={{ fontSize: '10px' }}>Threshold</span>
            <span className="text-gray-200 capitalize">
              {lastResponse.threshold_method} 
              {lastResponse.threshold_method === 'manual' && ` (${lastResponse.threshold_value})`}
            </span>
          </div>
          <div className="bg-gray-900 rounded px-3 py-2 border border-gray-600">
            <span className="text-gray-500 block uppercase tracking-wider mb-1" style={{ fontSize: '10px' }}>Scales</span>
            <span className="text-gray-200">{result?.box_sizes ? result.box_sizes.length : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
