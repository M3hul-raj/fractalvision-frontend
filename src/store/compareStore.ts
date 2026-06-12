/**
 * Zustand store for Compare Mode — manages two fully isolated analysis slots (A and B).
 * Does NOT import or modify analyzerStore.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisResult } from "@/types/analysis";
import type { Specimen } from "@/types/specimen";

export type SlotKey = "A" | "B";

export type SlotState = {
  sourceType: "upload" | "specimen" | null;

  // Upload path
  file: File | null;
  originalImageUrl: string | null;
  binaryImageUrl: string | null;
  isAnalyzing: boolean;
  error: string | null;
  thresholdMethod: "otsu" | "adaptive" | "manual";
  thresholdValue: number;
  analysisMode: "full_mask" | "boundary" | "texture";

  // Specimen path
  selectedSpecimen: Specimen | null;

  // Common result
  result: AnalysisResult | null;
};

const defaultSlot: SlotState = {
  sourceType: null,
  file: null,
  originalImageUrl: null,
  binaryImageUrl: null,
  isAnalyzing: false,
  error: null,
  thresholdMethod: "otsu",
  thresholdValue: 128,
  analysisMode: "full_mask",
  selectedSpecimen: null,
  result: null,
};

export interface CompareStore {
  A: SlotState;
  B: SlotState;

  // Generic field setter for any slot key
  setSlotField: <K extends keyof SlotState>(slot: SlotKey, field: K, value: SlotState[K]) => void;

  // Convenience setters (keeps component code readable)
  setSlotFile: (slot: SlotKey, file: File, originalImageUrl: string) => void;
  setSlotResult: (slot: SlotKey, result: AnalysisResult) => void;
  setSlotBinaryImageUrl: (slot: SlotKey, url: string | null) => void;
  setSlotIsAnalyzing: (slot: SlotKey, value: boolean) => void;
  setSlotError: (slot: SlotKey, error: string | null) => void;
  setSlotSourceType: (slot: SlotKey, type: "upload" | "specimen" | null) => void;
  setSlotThresholdMethod: (slot: SlotKey, method: "otsu" | "adaptive" | "manual") => void;
  setSlotThresholdValue: (slot: SlotKey, value: number) => void;
  setSlotAnalysisMode: (slot: SlotKey, mode: "full_mask" | "boundary" | "texture") => void;
  setSlotSpecimen: (slot: SlotKey, specimen: Specimen | null) => void;
  resetSlot: (slot: SlotKey) => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set) => ({
      A: { ...defaultSlot },
      B: { ...defaultSlot },

      setSlotField: (slot, field, value) =>
        set((state) => ({
          [slot]: { ...state[slot], [field]: value },
        })),

      setSlotFile: (slot, file, originalImageUrl) =>
        set((state) => ({
          [slot]: {
            ...state[slot],
            file,
            originalImageUrl,
            sourceType: "upload",
            result: null,
            binaryImageUrl: null,
            error: null,
          },
        })),

      setSlotResult: (slot, result) =>
        set((state) => ({
          [slot]: { ...state[slot], result, isAnalyzing: false },
        })),

      setSlotBinaryImageUrl: (slot, url) =>
        set((state) => ({
          [slot]: { ...state[slot], binaryImageUrl: url },
        })),

      setSlotIsAnalyzing: (slot, value) =>
        set((state) => ({
          [slot]: { ...state[slot], isAnalyzing: value },
        })),

      setSlotError: (slot, error) =>
        set((state) => ({
          [slot]: { ...state[slot], error, isAnalyzing: false },
        })),

      setSlotSourceType: (slot, type) =>
        set((state) => ({
          [slot]: { ...state[slot], sourceType: type },
        })),

      setSlotThresholdMethod: (slot, method) =>
        set((state) => ({
          [slot]: { ...state[slot], thresholdMethod: method },
        })),

      setSlotThresholdValue: (slot, value) =>
        set((state) => ({
          [slot]: { ...state[slot], thresholdValue: value },
        })),

      setSlotAnalysisMode: (slot, mode) =>
        set((state) => ({
          [slot]: { ...state[slot], analysisMode: mode },
        })),

      setSlotSpecimen: (slot, specimen) =>
        set((state) => ({
          [slot]: {
            ...state[slot],
            selectedSpecimen: specimen,
            sourceType: specimen ? "specimen" : null,
          },
        })),

      resetSlot: (slot) =>
        set(() => ({
          [slot]: { ...defaultSlot },
        })),
    }),
    {
      name: 'fractalvision-compare',
      partialize: (state) => ({
        A: {
          sourceType: state.A.sourceType,
          binaryImageUrl: state.A.binaryImageUrl,
          thresholdMethod: state.A.thresholdMethod,
          thresholdValue: state.A.thresholdValue,
          analysisMode: state.A.analysisMode,
          selectedSpecimen: state.A.selectedSpecimen,
          result: state.A.result,
        },
        B: {
          sourceType: state.B.sourceType,
          binaryImageUrl: state.B.binaryImageUrl,
          thresholdMethod: state.B.thresholdMethod,
          thresholdValue: state.B.thresholdValue,
          analysisMode: state.B.analysisMode,
          selectedSpecimen: state.B.selectedSpecimen,
          result: state.B.result,
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CompareStore>;
        return {
          ...currentState,
          ...persisted,
          A: persisted?.A ? { ...currentState.A, ...persisted.A } : currentState.A,
          B: persisted?.B ? { ...currentState.B, ...persisted.B } : currentState.B,
        };
      },
    }
  )
);
