/**
 * Standard fractal reference data.
 */
import type { StandardFractal } from "@/types/specimen";

export const STANDARD_FRACTALS: StandardFractal[] = [
  { id: "cantor_set",          name: "Cantor Set",          theoretical_dimension: 0.6309, max_iterations: 8, description: "Created by repeatedly removing the middle third of line segments", formula: "D = log(2) / log(3) ≈ 0.6309", display_order: 1 },
  { id: "koch_curve",          name: "Koch Curve",          theoretical_dimension: 1.2619, max_iterations: 7, description: "Each line segment is replaced by four segments of one-third length", formula: "D = log(4) / log(3) ≈ 1.2619", display_order: 2 },
  { id: "koch_snowflake",      name: "Koch Snowflake",      theoretical_dimension: 1.2619, max_iterations: 7, description: "Three Koch curves forming a closed snowflake boundary", formula: "D = log(4) / log(3) ≈ 1.2619", display_order: 3 },
  { id: "sierpinski_triangle", name: "Sierpiński Triangle",  theoretical_dimension: 1.5850, max_iterations: 8, description: "Equilateral triangle subdivided recursively, removing central triangle", formula: "D = log(3) / log(2) ≈ 1.5850", display_order: 4 },
  { id: "sierpinski_carpet",   name: "Sierpiński Carpet",    theoretical_dimension: 1.8928, max_iterations: 6, description: "Square subdivided into 9, removing center square recursively", formula: "D = log(8) / log(3) ≈ 1.8928", display_order: 5 },
];
