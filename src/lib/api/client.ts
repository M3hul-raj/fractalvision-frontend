/**
 * FastAPI client — typed fetch wrapper for the backend compute API.
 */

import type { AnalyzeApiResponse, BatchAnalyzeApiResponse, GenerateFractalApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function analyzeImage(
  file: File,
  options?: {
    analysisMode?: string;
    thresholdMethod?: string;
    thresholdValue?: number;
    invert?: boolean;
    denoise?: boolean;
    blurLevel?: number;
    boxSizes?: string;
    gridOffsets?: string;
    runSensitivity?: boolean;
  }
): Promise<AnalyzeApiResponse> {
  const formData = new FormData();
  formData.append("file", file);
  
  if (options) {
    if (options.analysisMode) formData.append("analysis_mode", options.analysisMode);
    if (options.thresholdMethod) formData.append("threshold_method", options.thresholdMethod);
    if (options.thresholdValue !== undefined) formData.append("threshold_value", options.thresholdValue.toString());
    if (options.invert !== undefined) formData.append("invert", options.invert.toString());
    if (options.denoise !== undefined) formData.append("denoise", options.denoise.toString());
    if (options.blurLevel !== undefined) formData.append("blur_level", options.blurLevel.toString());
    if (options.boxSizes) formData.append("box_sizes", options.boxSizes);
    if (options.gridOffsets) formData.append("grid_offsets", options.gridOffsets);
    if (options.runSensitivity === true) formData.append("run_sensitivity", "true");
  }

  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    try {
      const errJson = JSON.parse(errText);
      throw new Error(errJson.detail || errJson.message || `Analyze failed: ${res.status}`);
    } catch {
      throw new Error(`Analyze failed: ${res.status} - ${errText}`);
    }
  }
  return res.json();
}

/** Batch-analyze multiple images server-side. */
export async function analyzeBatch(
  files: File[],
  options?: {
    analysisMode?: string;
    thresholdMethod?: string;
  }
): Promise<BatchAnalyzeApiResponse> {
  // TODO: Phase 1
  throw new Error("Not implemented");
}

/** Generate a standard fractal and compute its dimension. */
export async function generateFractal(
  fractalId: string,
  options?: {
    iterations?: number;
    imageSize?: number;
    boxSizes?: number[];
  }
): Promise<GenerateFractalApiResponse> {
  // TODO: Phase 7
  throw new Error("Not implemented");
}

/** Fetch health status. */
export async function getHealth(): Promise<{ status: string; version: string; uptimeSeconds: number }> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}
