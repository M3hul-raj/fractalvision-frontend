"use client";

import { useAnalyzerStore } from "@/store/analyzerStore";

export default function BoxSizeSlider() {
  const { result, selectedBoxSize, setSelectedBoxSize } = useAnalyzerStore();

  if (!result || !result.box_sizes || result.box_sizes.length === 0) return null;

  // Map the slider to the index of the boxSizes array
  const minIdx = 0;
  const maxIdx = result.box_sizes.length - 1;
  const currentIdx = result.box_sizes.indexOf(selectedBoxSize || result.box_sizes[0]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedBoxSize(result.box_sizes[idx]);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Grid Overlay Control</h3>
        <span className="text-blue-400 font-mono bg-blue-900/30 px-3 py-1 rounded-full text-sm">
          Box Size: {selectedBoxSize}px
        </span>
      </div>
      <input
        type="range"
        min={minIdx}
        max={maxIdx}
        step={1}
        value={currentIdx !== -1 ? currentIdx : 0}
        onChange={onChange}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
        <span>{result.box_sizes[0]}px</span>
        <span>{result.box_sizes[result.box_sizes.length - 1]}px</span>
      </div>
    </div>
  );
}
