/**
 * Specimen types — dissertation dataset items and standard fractals.
 */

/** A specimen from the dissertation dataset (leaf, coastline, or standard fractal).
 *  Field names match the Supabase/Postgres column names (snake_case).
 */
export type Specimen = {
  id: string;
  name: string;
  category: "leaf" | "coastline" | "standard-fractal";
  description: string | null;
  image_url: string;
  binary_image_url: string | null;
  fractal_dimension: number;
  r_squared: number;
  intercept: number | null;
  standard_error: number | null;
  confidence_interval_low: number | null;
  confidence_interval_high: number | null;
  complexity_class: string | null;
  interpretation: string;
  notes: string | null;
  box_sizes: number[];
  box_counts: number[];
  log_inverse_sizes: number[] | null;
  log_counts: number[] | null;
  display_order: number;
  created_at: string;
};

/** Standard mathematical fractal metadata. */
export type StandardFractal = {
  id: string;
  name: string;
  theoretical_dimension: number;
  max_iterations: number;
  description: string;
  formula: string | null;
  display_order: number;
};

/** Category summary for gallery filtering. */
export type GalleryCategory = {
  category: string;
  count: number;
  label: string;
};
