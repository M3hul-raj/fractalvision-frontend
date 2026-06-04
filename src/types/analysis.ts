/**
 * Core analysis types — the contract between frontend computation and API responses.
 */

/** Result of a fractal dimension analysis. */
export type AnalysisResult = {
  fractalDimension: number;
  rSquared: number;
  intercept: number;
  standardError: number;
  confidenceInterval: [number, number];
  boxSizes: number[];
  boxCounts: number[];
  logInverseSizes: number[];
  logCounts: number[];
  fittedValues: number[];
  residuals: number[];
  foregroundRatio: number;
  qualityScore: number;
  reliability: "High" | "Medium" | "Low";
  interpretation: string;
  complexityClass: string;
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
  analysisMode: "full-mask" | "boundary" | "texture" | "edge" | "grayscale";
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
