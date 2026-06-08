"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { AnalysisResult } from "@/types/analysis";

interface DualLogLogChartProps {
  resultA: AnalysisResult;
  resultB: AnalysisResult;
}

export default function DualLogLogChart({ resultA, resultB }: DualLogLogChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width || 560;
    const height = 340;
    const margin = { top: 20, right: 24, bottom: 48, left: 56 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xA = resultA.log_inverse_sizes;
    const yA = resultA.log_counts;
    const xB = resultB.log_inverse_sizes;
    const yB = resultB.log_counts;

    const allX = [...xA, ...xB];
    const allY = [...yA, ...yB];

    const svg = d3.select(svgRef.current);
    svg.attr("width", containerWidth).attr("height", height).attr("viewBox", `0 0 ${containerWidth} ${height}`);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // ── Scales ────────────────────────────────────────────────────────────────
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

    // ── Grid lines ────────────────────────────────────────────────────────────
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#1f2937")
      .attr("stroke-dasharray", "3 3");
    g.select(".grid .domain").remove();

    // ── Axes ──────────────────────────────────────────────────────────────────
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("color", "#6b7280")
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".1f")));

    xAxis.select(".domain").attr("stroke", "#374151");
    xAxis.selectAll(".tick line").attr("stroke", "#374151");

    xAxis
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .attr("fill", "#9ca3af")
      .attr("font-size", "12")
      .text("log(1 / box size)");

    const yAxis = g
      .append("g")
      .attr("color", "#6b7280")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".1f")));

    yAxis.select(".domain").attr("stroke", "#374151");
    yAxis.selectAll(".tick line").attr("stroke", "#374151");

    yAxis
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -44)
      .attr("x", -innerHeight / 2)
      .attr("fill", "#9ca3af")
      .attr("font-size", "12")
      .attr("text-anchor", "middle")
      .text("log(count)");

    // ── Line generator ────────────────────────────────────────────────────────
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    // ── Series renderer ───────────────────────────────────────────────────────
    function drawSeries(
      xVals: number[],
      yVals: number[],
      fittedVals: number[],
      stroke: string,
      dotFill: string,
      dotClass: string
    ) {
      // Regression line
      const lineData = xVals.map((xv, i) => ({ x: xv, y: fittedVals[i] }));
      g.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", 2.5)
        .attr("stroke-linecap", "round")
        .attr("d", line);

      // Scatter dots
      g.selectAll(`.${dotClass}`)
        .data(xVals.map((xv, i) => ({ x: xv, y: yVals[i] })))
        .enter()
        .append("circle")
        .attr("class", dotClass)
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .attr("r", 5)
        .attr("fill", dotFill)
        .attr("fill-opacity", 0.85)
        .attr("stroke", "#0f111a")
        .attr("stroke-width", 1.5);
    }

    // Draw B underneath A
    drawSeries(xB, yB, resultB.fitted_values, "#fb923c", "#fb923c", "dot-b");
    drawSeries(xA, yA, resultA.fitted_values, "#38bdf8", "#38bdf8", "dot-a");
  }, [resultA, resultB]);

  return (
    <div ref={containerRef} className="w-full">
      {/* Tailwind legend */}
      <div className="flex flex-wrap gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-0.5 bg-sky-400 rounded" />
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
          <span className="text-gray-300">
            Image A — D = <span className="text-sky-400 font-semibold">{resultA.fractal_dimension.toFixed(4)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-0.5 bg-orange-400 rounded" />
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
          <span className="text-gray-300">
            Image B — D = <span className="text-orange-400 font-semibold">{resultB.fractal_dimension.toFixed(4)}</span>
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-auto"
        style={{ minHeight: 340 }}
      />
    </div>
  );
}
