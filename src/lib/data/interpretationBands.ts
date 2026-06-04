/**
 * D-value interpretation bands.
 */
import type { InterpretationBand } from "@/types/analysis";

export const INTERPRETATION_BANDS: InterpretationBand[] = [
  { min: 0.0, max: 1.0, label: "Sparse / point-like or line fragments" },
  { min: 1.0, max: 1.2, label: "Smooth line-like structure" },
  { min: 1.2, max: 1.5, label: "Slightly irregular curve" },
  { min: 1.5, max: 1.8, label: "Complex natural pattern" },
  { min: 1.8, max: 2.0, label: "Highly irregular / near space-filling" },
  { min: 2.0, max: null, label: "Invalid for 2D binary box-counting; check preprocessing" },
];
