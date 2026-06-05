/**
 * Supabase query helpers — typed wrappers around direct Supabase table queries.
 */

import { supabase } from "./client";
import type { Specimen } from "@/types/specimen";
import type { StandardFractal } from "@/types/specimen";

/** Fetch all specimens, ordered by fractal_dimension descending. */
export async function getSpecimens(): Promise<Specimen[]> {
  const { data, error } = await supabase
    .from("specimens")
    .select("*")
    .order("fractal_dimension", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Specimen[];
}

/** Fetch specimens filtered by category. */
export async function getSpecimensByType(
  type: "leaf" | "coastline"
): Promise<Specimen[]> {
  const { data, error } = await supabase
    .from("specimens")
    .select("*")
    .eq("category", type)
    .order("fractal_dimension", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Specimen[];
}

/** Fetch a single specimen by ID. */
export async function getSpecimenById(
  id: string
): Promise<Specimen | null> {
  const { data, error } = await supabase
    .from("specimens")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data as Specimen;
}

/** Fetch all standard fractal metadata. */
export async function getStandardFractals(): Promise<StandardFractal[]> {
  const { data, error } = await supabase
    .from("standard_fractals")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StandardFractal[];
}
