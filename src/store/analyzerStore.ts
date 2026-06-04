/**
 * Zustand store for the Analyzer Lab — manages image state, processing pipeline, and results.
 */

import { create } from "zustand";
import type { AnalysisResult, ProcessingState } from "@/types/analysis";

/** Shape of the analyzer store. */
export interface AnalyzerStore {
  // --- State ---
  originalFile: File | null;
  originalImageUrl: string | null;
  binaryImageUrl: string | null;
  result: AnalysisResult | null;
  processing: ProcessingState;
  isAnalyzing: boolean;

  // --- Actions ---
  setFile: (file: File) => void;
  setResult: (result: AnalysisResult) => void;
  setProcessing: (updates: Partial<ProcessingState>) => void;
  setIsAnalyzing: (value: boolean) => void;
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

  // --- Actions ---
  setFile: (file: File) => {
    const url = URL.createObjectURL(file);
    set({
      originalFile: file,
      originalImageUrl: url,
      binaryImageUrl: null,
      result: null,
    });
  },

  setResult: (result: AnalysisResult) => {
    set({ result, isAnalyzing: false });
  },

  setProcessing: (updates: Partial<ProcessingState>) => {
    set((state) => ({
      processing: { ...state.processing, ...updates },
    }));
  },

  setIsAnalyzing: (value: boolean) => {
    set({ isAnalyzing: value });
  },

  reset: () => {
    set({
      originalFile: null,
      originalImageUrl: null,
      binaryImageUrl: null,
      result: null,
      processing: { ...initialProcessing },
      isAnalyzing: false,
    });
  },
}));
