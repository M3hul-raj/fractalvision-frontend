/**
 * Zustand store for the Analyzer Lab — manages image state, processing pipeline, and results.
 */

import { create } from "zustand";
import type { AnalysisResult, ProcessingState } from "@/types/analysis";

export interface AnalyzerStore {
  // --- State ---
  originalFile: File | null;
  originalImageUrl: string | null;
  binaryImageUrl: string | null;
  result: AnalysisResult | null;
  processing: ProcessingState;
  isAnalyzing: boolean;
  selectedBoxSize: number | null;

  // --- Actions ---
  setFile: (file: File) => void;
  setResult: (result: AnalysisResult) => void;
  setProcessing: (updates: Partial<ProcessingState>) => void;
  setIsAnalyzing: (value: boolean) => void;
  setSelectedBoxSize: (size: number | null) => void;
  setBinaryImageUrl: (url: string | null) => void;
  reset: () => void;
}

const initialProcessing: ProcessingState = {
  originalImage: null,
  grayscaleImage: null,
  binaryImage: null,
  width: 0,
  height: 0,
  thresholdMethod: "otsu",
  manualThreshold: 128,
  invert: false,
  denoise: false,
  blurLevel: 0,
  analysisMode: "full-mask",
};

export const useAnalyzerStore = create<AnalyzerStore>((set) => ({
  // --- Initial State ---
  originalFile: null,
  originalImageUrl: null,
  binaryImageUrl: null,
  result: null,
  processing: { ...initialProcessing },
  isAnalyzing: false,
  selectedBoxSize: null,

  // --- Actions ---
  setFile: (file: File) => {
    const url = URL.createObjectURL(file);
    set({
      originalFile: file,
      originalImageUrl: url,
      binaryImageUrl: null,
      result: null,
      selectedBoxSize: null,
    });
  },

  setResult: (result: AnalysisResult) => {
    set({ 
      result, 
      isAnalyzing: false,
      selectedBoxSize: result.box_sizes && result.box_sizes.length > 0 ? result.box_sizes[0] : null
    });
  },

  setProcessing: (updates: Partial<ProcessingState>) => {
    set((state) => ({
      processing: { ...state.processing, ...updates },
    }));
  },

  setIsAnalyzing: (value: boolean) => {
    set({ isAnalyzing: value });
  },

  setSelectedBoxSize: (size: number | null) => {
    set({ selectedBoxSize: size });
  },

  setBinaryImageUrl: (url: string | null) => {
    set({ binaryImageUrl: url });
  },

  reset: () => {
    set({
      originalFile: null,
      originalImageUrl: null,
      binaryImageUrl: null,
      result: null,
      processing: { ...initialProcessing },
      isAnalyzing: false,
      selectedBoxSize: null,
    });
  },
}));
