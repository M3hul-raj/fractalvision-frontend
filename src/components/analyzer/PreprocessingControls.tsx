"use client";

import { useAnalyzerStore } from "@/store/analyzerStore";

export default function PreprocessingControls() {
  const {
    thresholdMethod,
    setThresholdMethod,
    thresholdValue,
    setThresholdValue,
    analysisMode,
    setAnalysisMode,
    isAnalyzing
  } = useAnalyzerStore();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md">
      <h3 className="text-xl font-bold mb-6 text-gray-100">Preprocessing Controls</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Analysis Mode Section */}
        <div>
          <h4 className="text-md font-semibold text-gray-300 mb-3">Analysis Mode</h4>
          <div className="space-y-4">
            <label className={`block p-3 rounded-lg border cursor-pointer transition-colors ${analysisMode === "full_mask" ? "bg-blue-900/30 border-blue-500" : "border-gray-600 hover:border-gray-500"} ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center">
                <input type="radio" name="analysisMode" value="full_mask" checked={analysisMode === "full_mask"} onChange={() => setAnalysisMode("full_mask")} className="mr-3 accent-blue-500" disabled={isAnalyzing} />
                <span className="font-medium text-gray-200">Full Mask</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-6">Analyzes the total area of the shape.</p>
            </label>
            
            <label className={`block p-3 rounded-lg border cursor-pointer transition-colors ${analysisMode === "boundary" ? "bg-blue-900/30 border-blue-500" : "border-gray-600 hover:border-gray-500"} ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center">
                <input type="radio" name="analysisMode" value="boundary" checked={analysisMode === "boundary"} onChange={() => setAnalysisMode("boundary")} className="mr-3 accent-blue-500" disabled={isAnalyzing} />
                <span className="font-medium text-gray-200">Boundary (Edge)</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-6">Extracts outline complexity using Canny edge detection.</p>
            </label>
            
            <label className={`block p-3 rounded-lg border cursor-pointer transition-colors ${analysisMode === "texture" ? "bg-blue-900/30 border-blue-500" : "border-gray-600 hover:border-gray-500"} ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center">
                <input type="radio" name="analysisMode" value="texture" checked={analysisMode === "texture"} onChange={() => setAnalysisMode("texture")} className="mr-3 accent-blue-500" disabled={isAnalyzing} />
                <span className="font-medium text-gray-200">Texture</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-6">Captures texture complexity using morphological gradients.</p>
            </label>
          </div>
        </div>

        {/* Threshold Method Section */}
        <div>
          <h4 className="text-md font-semibold text-gray-300 mb-3">Threshold Method</h4>
          <div className="space-y-4">
            <label className={`block p-3 rounded-lg border cursor-pointer transition-colors ${thresholdMethod === "otsu" ? "bg-blue-900/30 border-blue-500" : "border-gray-600 hover:border-gray-500"} ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center">
                <input type="radio" name="thresholdMethod" value="otsu" checked={thresholdMethod === "otsu"} onChange={() => setThresholdMethod("otsu")} className="mr-3 accent-blue-500" disabled={isAnalyzing} />
                <span className="font-medium text-gray-200">Otsu (Auto)</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-6">Automatically calculates the optimal threshold value.</p>
            </label>
            
            <label className={`block p-3 rounded-lg border cursor-pointer transition-colors ${thresholdMethod === "adaptive" ? "bg-blue-900/30 border-blue-500" : "border-gray-600 hover:border-gray-500"} ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center">
                <input type="radio" name="thresholdMethod" value="adaptive" checked={thresholdMethod === "adaptive"} onChange={() => setThresholdMethod("adaptive")} className="mr-3 accent-blue-500" disabled={isAnalyzing} />
                <span className="font-medium text-gray-200">Adaptive</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-6">Handles uneven lighting by calculating localized thresholds.</p>
            </label>
            
            <label className={`block p-3 rounded-lg border cursor-pointer transition-colors ${thresholdMethod === "manual" ? "bg-blue-900/30 border-blue-500" : "border-gray-600 hover:border-gray-500"} ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center">
                <input type="radio" name="thresholdMethod" value="manual" checked={thresholdMethod === "manual"} onChange={() => setThresholdMethod("manual")} className="mr-3 accent-blue-500" disabled={isAnalyzing} />
                <span className="font-medium text-gray-200">Manual</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-6">Set a specific integer threshold value (0-255).</p>
            </label>
            
            {thresholdMethod === "manual" && (
              <div className="mt-4 px-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-300">Threshold Value</span>
                  <span className="text-sm text-blue-400 font-mono">{thresholdValue}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="255" 
                  value={thresholdValue} 
                  onChange={(e) => setThresholdValue(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  disabled={isAnalyzing}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
