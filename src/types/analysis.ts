/**
 * Core analysis types — the contract between frontend computation and API responses.
 */

/** Result of a fractal dimension analysis. */
export type AnalysisResult = {
  fractal_dimension: number;
  r_squared: number;
  intercept: number;
  standard_error: number;
  confidence_interval: [number, number];
  box_sizes: number[];
  box_counts: number[];
  log_inverse_sizes: number[];
  log_counts: number[];
  fitted_values: number[];
  residuals: number[];
  foreground_ratio: number;
  quality_score: number;
  reliability: "High" | "Medium" | "Low";
  interpretation: string;
  complexity_class: string;
  warnings: string[];
};

/** Current state of the image processing pipeline. */
export type ProcessingState = {
  originalImage: ImageData | null;
  grayscaleImage: ImageData | null;
  binaryImage: Uint8Array | null;
  width: number;
  height: number;
  thresholdMethod: "otsu" | "manual" | "adaptive";
  manualThreshold: number;
  invert: boolean;
  denoise: boolean;
  blurLevel: number;
  analysisMode: "full_mask" | "boundary" | "texture" | "edge" | "grayscale";
};

/** Result of a single sensitivity test. */
export type SensitivityResult = {
  thresholdsTested?: number[];
  anglesTested?: number[];
  offsetsTested?: number[];
  dimensions: number[];
  stdDeviation: number;
  isStable: boolean;
};

/** Aggregated sensitivity report. */
export type SensitivityReport = {
  threshold?: SensitivityResult;
  rotation?: SensitivityResult;
  gridOrigin?: SensitivityResult;
};

/** Quality score components. */
export type QualityComponents = {
  rSquaredScore: number;
  boxSizeScore: number;
  resolutionScore: number;
  foregroundScore: number;
  thresholdStabilityScore: number;
  rotationStabilityScore: number;
  gridOriginStabilityScore: number;
  noiseScore: number;
};

/** D-value interpretation band. */
export type InterpretationBand = {
  min: number;
  max: number | null;
  label: string;
};
