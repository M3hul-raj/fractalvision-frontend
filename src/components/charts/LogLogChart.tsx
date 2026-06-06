"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useAnalyzerStore } from "@/store/analyzerStore";
import type { Specimen } from "@/types/specimen";

interface LogLogChartProps {
  comparisonSpecimen?: Specimen | null;
}

export default function LogLogChart({ comparisonSpecimen }: LogLogChartProps) {
  const { result, selectedBoxSize } = useAnalyzerStore();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!result || !svgRef.current) return;

    const { log_inverse_sizes, log_counts, fitted_values, box_sizes } = result;

    // ── Derive comparison log arrays ──────────────────────────────────────────
    let cmpX: number[] = [];
    let cmpY: number[] = [];
    const hasCmp =
      comparisonSpecimen != null &&
      Array.isArray(comparisonSpecimen.box_counts) &&
      comparisonSpecimen.box_counts.length > 0;

    if (hasCmp) {
      const sp = comparisonSpecimen!;
      // Use stored log values if available; otherwise compute from raw arrays
      if (sp.log_inverse_sizes && sp.log_inverse_sizes.length > 0) {
        cmpX = sp.log_inverse_sizes;
      } else {
        cmpX = sp.box_sizes.map((s) => -Math.log(s));
      }
      if (sp.log_counts && sp.log_counts.length > 0) {
        cmpY = sp.log_counts;
      } else {
        cmpY = sp.box_counts.map((n) => Math.log(n));
      }
    }

    // ── Dimensions ────────────────────────────────────────────────────────────
    const width = 500;
    const height = 320;
    const margin = { top: hasCmp ? 52 : 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ── CRITICAL AUTO-SCALING: domain across BOTH datasets ────────────────────
    const allX = [...log_inverse_sizes, ...cmpX];
    const allY = [...log_counts, ...cmpY];

    const x = d3
      .scaleLinear()
      .domain([d3.min(allX) as number, d3.max(allX) as number])
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(allY) as number, d3.max(allY) as number])
      .nice()
      .range([innerHeight, 0]);

    // ── Axes ──────────────────────────────────────────────────────────────────
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("color", "#9ca3af")
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "#9ca3af")
      .text("log(1/s)");

    g.append("g")
      .attr("color", "#9ca3af")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -innerHeight / 2)
      .attr("fill", "#9ca3af")
      .text("log(N(s))");

    // ── Line generator ────────────────────────────────────────────────────────
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    // ── Comparison series (drawn first, underneath) ───────────────────────────
    if (hasCmp) {
      // Compute comparison regression line via simple least-squares
      const n = cmpX.length;
      const meanX = cmpX.reduce((a, b) => a + b, 0) / n;
      const meanY = cmpY.reduce((a, b) => a + b, 0) / n;
      const slope =
        cmpX.reduce((acc, xi, i) => acc + (xi - meanX) * (cmpY[i] - meanY), 0) /
        cmpX.reduce((acc, xi) => acc + (xi - meanX) ** 2, 0);
      const intercept = meanY - slope * meanX;

      const cmpLineData = cmpX.map((xVal) => ({ x: xVal, y: slope * xVal + intercept }));

      // Dashed regression line
      g.append("path")
        .datum(cmpLineData)
        .attr("fill", "none")
        .attr("stroke", "#f59e0b") // amber-500
        .attr("stroke-width", 1.75)
        .attr("stroke-dasharray", "5 3")
        .attr("d", line);

      // Scatter points
      g.selectAll(".cmp-dot")
        .data(cmpX.map((xVal, i) => ({ x: xVal, y: cmpY[i] })))
        .enter()
        .append("circle")
        .attr("class", "cmp-dot")
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .attr("r", 4)
        .attr("fill", "#f59e0b")
        .attr("fill-opacity", 0.7)
        .attr("stroke", "#78350f")
        .attr("stroke-width", 1);
    }

    // ── Primary series ────────────────────────────────────────────────────────
    const primaryLineData = log_inverse_sizes.map((xVal, i) => ({ x: xVal, y: fitted_values[i] }));

    g.append("path")
      .datum(primaryLineData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6") // blue-500
      .attr("stroke-width", 2)
      .attr("d", line);

    g.selectAll(".primary-dot")
      .data(
        log_inverse_sizes.map((xVal, i) => ({
          x: xVal,
          y: log_counts[i],
          boxSize: box_sizes[i],
        }))
      )
      .enter()
      .append("circle")
      .attr("class", "primary-dot")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", (d) => (d.boxSize === selectedBoxSize ? 8 : 4))
      .attr("fill", (d) => (d.boxSize === selectedBoxSize ? "#60a5fa" : "#ef4444"))
      .attr("stroke", (d) => (d.boxSize === selectedBoxSize ? "#fff" : "none"))
      .attr("stroke-width", (d) => (d.boxSize === selectedBoxSize ? 2 : 0))
      .style("transition", "all 0.2s ease-in-out");

    // ── Legend (only when comparison is active) ───────────────────────────────
    if (hasCmp) {
      const legend = g.append("g").attr("transform", "translate(0,-42)");

      // Primary row
      legend.append("line")
        .attr("x1", 0).attr("y1", 6).attr("x2", 18).attr("y2", 6)
        .attr("stroke", "#3b82f6").attr("stroke-width", 2);
      legend.append("circle").attr("cx", 9).attr("cy", 6).attr("r", 3).attr("fill", "#ef4444");
      legend.append("text")
        .attr("x", 24).attr("y", 10)
        .attr("fill", "#cbd5e1")
        .attr("font-size", "11")
        .text(`Your image   D = ${result.fractal_dimension.toFixed(4)}`);

      // Comparison row
      const row2 = legend.append("g").attr("transform", "translate(0,18)");
      row2.append("line")
        .attr("x1", 0).attr("y1", 6).attr("x2", 18).attr("y2", 6)
        .attr("stroke", "#f59e0b").attr("stroke-width", 1.75).attr("stroke-dasharray", "4 2");
      row2.append("circle").attr("cx", 9).attr("cy", 6).attr("r", 3).attr("fill", "#f59e0b").attr("fill-opacity", 0.8);
      row2.append("text")
        .attr("x", 24).attr("y", 10)
        .attr("fill", "#cbd5e1")
        .attr("font-size", "11")
        .text(`${comparisonSpecimen!.name}   D = ${comparisonSpecimen!.fractal_dimension.toFixed(4)}`);
    }
  }, [result, selectedBoxSize, comparisonSpecimen]);

  if (!result) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md">
      <h3 className="text-xl font-bold mb-4 text-gray-100">Log-Log Plot</h3>
      <div className="flex justify-center text-gray-300">
        <svg
          ref={svgRef}
          width="500"
          height="320"
          viewBox="0 0 500 320"
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
}
