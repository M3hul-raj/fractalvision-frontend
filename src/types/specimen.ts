/**
 * Specimen types — dissertation dataset items and standard fractals.
 */

/** A specimen from the dissertation dataset (leaf, coastline, or standard fractal). */
export type Specimen = {
  id: string;
  name: string;
  category: "leaf" | "coastline" | "standard-fractal";
  description?: string;
  imageUrl: string;
  binaryImageUrl?: string;
  fractalDimension: number;
  rSquared: number;
  intercept?: number;
  standardError?: number;
  confidenceIntervalLow?: number;
  confidenceIntervalHigh?: number;
  complexityClass?: string;
  interpretation: string;
  notes?: string;
  boxSizes: number[];
  boxCounts: number[];
  logInverseSizes?: number[];
  logCounts?: number[];
};

/** Standard mathematical fractal metadata. */
export type StandardFractal = {
  fractalId: string;
  name: string;
  theoreticalDimension: number;
  maxIterations: number;
  description: string;
};

/** Category summary for gallery filtering. */
export type GalleryCategory = {
  category: string;
  count: number;
  label: string;
};
