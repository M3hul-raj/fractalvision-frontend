/**
 * Hardcoded dissertation results — used as static fallback when Supabase is unavailable.
 */
import type { Specimen } from "@/types/specimen";

export const DISSERTATION_SPECIMENS: Specimen[] = [
  { id: "spc_guava",     name: "Guava",              category: "leaf",      fractalDimension: 1.8110, rSquared: 0.9976, complexityClass: "High",              interpretation: "High complexity", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_lamiaceae", name: "Lamiaceae",          category: "leaf",      fractalDimension: 1.9493, rSquared: 0.9999, complexityClass: "Near space-filling", interpretation: "Highest leaf complexity", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_mango",     name: "Mango",             category: "leaf",      fractalDimension: 1.7599, rSquared: 0.9953, complexityClass: "Complex",            interpretation: "Complex leaf structure", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_monoon",    name: "Monoon Longifolium", category: "leaf",      fractalDimension: 1.7505, rSquared: 0.9961, complexityClass: "Complex",            interpretation: "Complex elongated leaf", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_peepal",    name: "Peepal",            category: "leaf",      fractalDimension: 1.8043, rSquared: 0.9977, complexityClass: "High",              interpretation: "High complexity", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_maple",     name: "Maple",             category: "leaf",      fractalDimension: 1.5061, rSquared: 0.9815, complexityClass: "Complex",            interpretation: "Lower score due to noisy background", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_akondo",    name: "Akondo",            category: "leaf",      fractalDimension: 1.8727, rSquared: 0.9988, complexityClass: "High",              interpretation: "High complexity", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_coast1",    name: "Coastline 1",       category: "coastline", fractalDimension: 1.7613, rSquared: 0.9991, complexityClass: "Complex",            interpretation: "Complex coastline", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_coast2",    name: "Coastline 2",       category: "coastline", fractalDimension: 1.9141, rSquared: 0.9999, complexityClass: "Highly irregular",   interpretation: "Highly irregular coastline", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_coast3",    name: "Coastline 3",       category: "coastline", fractalDimension: 1.9626, rSquared: 1.0000, complexityClass: "Near space-filling", interpretation: "Highest coastline complexity", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_coast4",    name: "Coastline 4",       category: "coastline", fractalDimension: 1.7108, rSquared: 0.9996, complexityClass: "Complex",            interpretation: "Lower coastline complexity", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
  { id: "spc_coast5",    name: "Coastline 5",       category: "coastline", fractalDimension: 1.9531, rSquared: 1.0000, complexityClass: "Highly irregular",   interpretation: "Highly irregular coastline", imageUrl: "", boxSizes: [4,8,16,32,64,128,256], boxCounts: [] },
];
