/**
 * FastAPI client — typed fetch wrapper for the backend compute API.
 */

import type { AnalyzeApiResponse, BatchAnalyzeApiResponse, GenerateFractalApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Analyze a single image server-side. */
export async function analyzeImage(
  file: File,
  options?: {
    analysisMode?: string;
    thresholdMethod?: string;
    manualThreshold?: number;
    invert?: boolean;
    denoise?: boolean;
    blurLevel?: number;
    boxSizes?: string;
    gridOffsets?: string;
    runSensitivity?: boolean;
  }
): Promise<AnalyzeApiResponse> {
  // TODO: Phase 1 — build FormData and POST to /analyze
  throw new Error("Not implemented");
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
