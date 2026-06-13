/**
 * Zustand store for Compare Mode — manages two fully isolated analysis slots (A and B).
 * Does NOT import or modify analyzerStore.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
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

/**
 * Custom storage engine that routes compare slot state to the appropriate browser storage:
 * - Settings (analysisMode, thresholdMethod, thresholdValue, sourceType, selectedSpecimen)
 *   → localStorage  (survives tab close)
 * - Results  (result, binaryImageUrl)
 *   → sessionStorage (clears on tab close)
 * File objects are never serialized.
 */
const splitCompareStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    const settingsStr = localStorage.getItem(`${name}-settings`);
    const sessionStr = sessionStorage.getItem(`${name}-session`);

    const parsedSettings = settingsStr ? JSON.parse(settingsStr) : { state: {} };
    const parsedSession = sessionStr ? JSON.parse(sessionStr) : { state: {} };

    const settingsState = parsedSettings.state ?? {};
    const sessionState = parsedSession.state ?? {};

    // Deep merge slots: settings first, then session overlays result fields
    const mergeSlot = (key: 'A' | 'B') => ({
      ...defaultSlot,
      ...(settingsState[key] ?? {}),
      ...(sessionState[key] ?? {}),
    });

    return JSON.stringify({
      state: {
        A: mergeSlot('A'),
        B: mergeSlot('B'),
      },
      version: parsedSettings.version || 0,
    });
  },

  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    const parsed = JSON.parse(value);
    const state = parsed.state;

    const pickSlotSettings = (slot: SlotState) => ({
      sourceType: slot.sourceType,
      thresholdMethod: slot.thresholdMethod,
      thresholdValue: slot.thresholdValue,
      analysisMode: slot.analysisMode,
      selectedSpecimen: slot.selectedSpecimen,
    });

    const pickSlotSession = (slot: SlotState) => ({
      result: slot.result,
      binaryImageUrl: slot.binaryImageUrl,
    });

    const settingsState = {
      A: pickSlotSettings(state.A),
      B: pickSlotSettings(state.B),
    };

    const sessionState = {
      A: pickSlotSession(state.A),
      B: pickSlotSession(state.B),
    };

    localStorage.setItem(
      `${name}-settings`,
      JSON.stringify({ state: settingsState, version: parsed.version })
    );
    sessionStorage.setItem(
      `${name}-session`,
      JSON.stringify({ state: sessionState, version: parsed.version })
    );
  },

  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${name}-settings`);
    sessionStorage.removeItem(`${name}-session`);
  },
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
      name: 'fractalvision-compare-store',
      storage: createJSONStorage(() => splitCompareStorage),
    }
  )
);
