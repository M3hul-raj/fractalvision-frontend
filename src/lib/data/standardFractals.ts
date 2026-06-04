/**
 * Standard fractal reference data.
 */
import type { StandardFractal } from "@/types/specimen";

export const STANDARD_FRACTALS: StandardFractal[] = [
  { fractalId: "cantor_set",          name: "Cantor Set",          theoreticalDimension: 0.6309, maxIterations: 8, description: "Created by repeatedly removing the middle third of line segments" },
  { fractalId: "koch_curve",          name: "Koch Curve",          theoreticalDimension: 1.2619, maxIterations: 7, description: "Each line segment is replaced by four segments of one-third length" },
  { fractalId: "koch_snowflake",      name: "Koch Snowflake",      theoreticalDimension: 1.2619, maxIterations: 7, description: "Three Koch curves forming a closed snowflake boundary" },
  { fractalId: "sierpinski_triangle", name: "Sierpiński Triangle",  theoreticalDimension: 1.5850, maxIterations: 8, description: "Equilateral triangle subdivided recursively, removing central triangle" },
  { fractalId: "sierpinski_carpet",   name: "Sierpiński Carpet",    theoreticalDimension: 1.8928, maxIterations: 6, description: "Square subdivided into 9, removing center square recursively" },
];
