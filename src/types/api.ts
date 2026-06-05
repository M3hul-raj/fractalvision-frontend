/**
 * API response types — shapes returned by the FastAPI backend.
 */

import type { AnalysisResult, SensitivityReport } from "./analysis";

/** Parameters echoed back in analysis response. */
export type AnalysisParameters = {
  analysis_mode: string;
  threshold_method: string;
  computed_threshold?: number;
  invert: boolean;
  denoise: boolean;
  blur_level: number;
  box_sizes_used: number[];
  image_width: number;
  image_height: number;
};

/** Response from POST /api/v1/analyze. */
export type AnalyzeApiResponse = {
  parameters: AnalysisParameters;
  result: AnalysisResult;
  sensitivity?: SensitivityReport;
  processing_time_ms: number;
  binary_image_b64: string;
  threshold_method: string;
  threshold_value: number;
  analysis_mode: string;
};

/** A single item in a batch analysis response. */
export type BatchResultItem = {
  filename: string;
  status: "completed" | "failed";
  result?: AnalysisResult;
  error?: string;
};

/** Response from POST /api/v1/analyze/batch. */
export type BatchAnalyzeApiResponse = {
  total: number;
  completed: number;
  failed: number;
  results: BatchResultItem[];
  processingTimeMs: number;
};

/** Response from POST /api/v1/fractals/{id}/generate. */
export type GenerateFractalApiResponse = {
  fractalId: string;
  name: string;
  iterations: number;
  theoreticalDimension: number;
  computedDimension: number;
  errorPercentage: number;
  rSquared: number;
  imageBase64: string;
  boxSizes: number[];
  boxCounts: number[];
  logInverseSizes: number[];
  logCounts: number[];
  processingTimeMs: number;
};

/** Standard API error response. */
export type ApiError = {
  code: string;
  message: string;
  details?: { field?: string; issue: string }[];
  requestId?: string;
};

/** Standard API envelope wrapping data or error. */
export type ApiEnvelope<T> = {
  data?: T;
  error?: ApiError;
  meta?: {
    requestId: string;
    timestamp: string;
  };
};
