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
    runSensitivity,
    setRunSensitivity,
    blurLevel,
    setBlurLevel,
    denoise,
    setDenoise,
    runRotationSensitivity,
    setRunRotationSensitivity,
    isAnalyzing
  } = useAnalyzerStore();

  const sensitivityAvailable = analysisMode === "full_mask" && thresholdMethod !== "adaptive";

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

      {/* Sensitivity Test Toggle */}
      <div className={`mt-6 pt-5 border-t border-gray-700 flex items-center justify-between ${!sensitivityAvailable ? "opacity-40" : ""}`}>
        <div>
          <span className="text-sm font-semibold text-gray-300">Sensitivity Test</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {sensitivityAvailable
              ? "Measures D stability across threshold ±15 (~1s extra)"
              : analysisMode !== "full_mask"
              ? "Only available in Full Mask mode"
              : "Not available with Adaptive threshold"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={runSensitivity}
          disabled={!sensitivityAvailable || isAnalyzing}
          onClick={() => sensitivityAvailable && !isAnalyzing && setRunSensitivity(!runSensitivity)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
            ${runSensitivity && sensitivityAvailable ? "bg-blue-600" : "bg-gray-600"}
            ${!sensitivityAvailable || isAnalyzing ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${runSensitivity && sensitivityAvailable ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {/* Gaussian Blur Slider */}
      <div className="mt-6 pt-5 border-t border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-gray-300">Gaussian Blur</span>
          <p className="text-xs text-gray-500 mt-0.5">
            Smooths image before thresholding. Higher = stronger blur.
          </p>
        </div>
        <div className="flex items-center gap-3 min-w-[150px]">
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="1"
            value={blurLevel} 
            onChange={(e) => setBlurLevel(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            disabled={isAnalyzing}
          />
          <span className="text-sm text-blue-400 font-mono shrink-0 min-w-[50px] text-right">
            {blurLevel === 0 ? "Off" : `Level ${blurLevel}`}
          </span>
        </div>
      </div>

      {/* Denoise Toggle */}
      <div className="mt-6 pt-5 border-t border-gray-700 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-300">Denoise</span>
          <p className="text-xs text-gray-500 mt-0.5">
            Applies non-local means denoising before thresholding.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={denoise}
          disabled={isAnalyzing}
          onClick={() => !isAnalyzing && setDenoise(!denoise)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
            ${denoise ? "bg-blue-600" : "bg-gray-600"}
            ${isAnalyzing ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${denoise ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {/* Rotation Sensitivity Toggle */}
      <div className="mt-6 pt-5 border-t border-gray-700 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-300">Rotation Sensitivity</span>
          <p className="text-xs text-gray-500 mt-0.5">
            Tests D stability across 5 rotation angles (0°–90°). Adds ~2s.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={runRotationSensitivity}
          disabled={isAnalyzing}
          onClick={() => !isAnalyzing && setRunRotationSensitivity(!runRotationSensitivity)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
            ${runRotationSensitivity ? "bg-blue-600" : "bg-gray-600"}
            ${isAnalyzing ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${runRotationSensitivity ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );
}

