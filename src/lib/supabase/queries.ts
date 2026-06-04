/**
 * Supabase query helpers — typed wrappers around direct Supabase table queries.
 */

import { supabase } from "./client";
import type { Specimen } from "@/types/specimen";
import type { StandardFractal } from "@/types/specimen";

/** Fetch all specimens, optionally filtered by category. */
export async function getSpecimens(category?: string): Promise<Specimen[]> {
  // TODO: Phase 4 — implement Supabase query with camelCase mapping
  return [];
}

/** Fetch a single specimen by ID. */
export async function getSpecimenById(id: string): Promise<Specimen | null> {
  // TODO: Phase 4
  return null;
}

/** Fetch all standard fractal metadata. */
export async function getStandardFractals(): Promise<StandardFractal[]> {
  // TODO: Phase 7
  return [];
}
