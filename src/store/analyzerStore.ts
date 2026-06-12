/**
 * Zustand store for the Analyzer Lab — manages image state, processing pipeline, and results.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisResult, ProcessingState } from "@/types/analysis";
import type { AnalyzeApiResponse } from "@/types/api";
import type { Specimen } from "@/types/specimen";

export interface AnalyzerStore {
  // --- State ---
  originalFile: File | null;
  originalImageUrl: string | null;
  binaryImageUrl: string | null;
  result: AnalysisResult | null;
  processing: ProcessingState;
  isAnalyzing: boolean;
  selectedBoxSize: number | null;
  thresholdMethod: 'otsu' | 'adaptive' | 'manual';
  thresholdValue: number;
  analysisMode: 'full_mask' | 'boundary' | 'texture';
  lastResponse: AnalyzeApiResponse | null;
  error: string | null;
  runSensitivity: boolean;
  comparisonSpecimen: Specimen | null;

  // --- Actions ---
  setFile: (file: File) => void;
  setResult: (result: AnalysisResult) => void;
  setProcessing: (updates: Partial<ProcessingState>) => void;
  setIsAnalyzing: (value: boolean) => void;
  setSelectedBoxSize: (size: number | null) => void;
  setBinaryImageUrl: (url: string | null) => void;
  setThresholdMethod: (method: 'otsu' | 'adaptive' | 'manual') => void;
  setThresholdValue: (value: number) => void;
  setAnalysisMode: (mode: 'full_mask' | 'boundary' | 'texture') => void;
  setLastResponse: (response: AnalyzeApiResponse | null) => void;
  setError: (error: string | null) => void;
  setRunSensitivity: (value: boolean) => void;
  setComparisonSpecimen: (specimen: Specimen | null) => void;
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
  analysisMode: "full_mask",
};

export const useAnalyzerStore = create<AnalyzerStore>()(
  persist(
    (set) => ({
      // --- Initial State ---
      originalFile: null,
      originalImageUrl: null,
      binaryImageUrl: null,
      result: null,
      processing: { ...initialProcessing },
      isAnalyzing: false,
      selectedBoxSize: null,
      thresholdMethod: 'otsu',
      thresholdValue: 128,
      analysisMode: 'full_mask',
      lastResponse: null,
      error: null,
      runSensitivity: false,
      comparisonSpecimen: null,

      // --- Actions ---
      setFile: (file: File) => {
        const url = URL.createObjectURL(file);
        set({
          originalFile: file,
          originalImageUrl: url,
          binaryImageUrl: null,
          result: null,
          selectedBoxSize: null,
          lastResponse: null,
          error: null,
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

      setThresholdMethod: (method) => {
        set({ thresholdMethod: method });
      },

      setThresholdValue: (value) => {
        set({ thresholdValue: value });
      },

      setAnalysisMode: (mode) => {
        set({ analysisMode: mode });
      },

      setLastResponse: (response) => {
        set({ lastResponse: response });
      },

      setError: (error) => {
        set({ error });
      },

      setRunSensitivity: (value) => {
        set({ runSensitivity: value });
      },

      setComparisonSpecimen: (specimen) => {
        set({ comparisonSpecimen: specimen });
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
          lastResponse: null,
          error: null,
        });
      },
    }),
    {
      name: 'fractalvision-analyzer',
      partialize: (state) => ({
        result: state.result,
        binaryImageUrl: state.binaryImageUrl,
        lastResponse: state.lastResponse,
        analysisMode: state.analysisMode,
        thresholdMethod: state.thresholdMethod,
        thresholdValue: state.thresholdValue,
        selectedBoxSize: state.selectedBoxSize,
        runSensitivity: state.runSensitivity,
        comparisonSpecimen: state.comparisonSpecimen,
      }),
    }
  )
);
