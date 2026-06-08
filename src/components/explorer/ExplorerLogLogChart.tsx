"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface ExplorerLogLogChartProps {
  log_inverse_sizes: number[];
  log_counts: number[];
  fitted_values: number[];
  fractal_dimension: number;
  r_squared: number;
}

export default function ExplorerLogLogChart({
  log_inverse_sizes,
  log_counts,
  fitted_values,
  fractal_dimension,
  r_squared,
}: ExplorerLogLogChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (log_inverse_sizes.length < 2) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width || 480;
    const height = 300;
    const margin = { top: 16, right: 20, bottom: 48, left: 54 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.attr("width", containerWidth).attr("height", height).attr("viewBox", `0 0 ${containerWidth} ${height}`);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const allX = log_inverse_sizes;
    const allY = [...log_counts, ...fitted_values];

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

    // Grid
    g.append("g")
      .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ""))
      .selectAll("line")
      .attr("stroke", "#1f2937")
      .attr("stroke-dasharray", "3 3");
    g.select(".domain").remove();

    // Axes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("color", "#6b7280")
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".1f")));
    xAxis.select(".domain").attr("stroke", "#374151");
    xAxis.selectAll(".tick line").attr("stroke", "#374151");
    xAxis
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .attr("fill", "#9ca3af")
      .attr("font-size", "12")
      .attr("text-anchor", "middle")
      .text("log(1 / box size)");

    const yAxis = g
      .append("g")
      .attr("color", "#6b7280")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".1f")));
    yAxis.select(".domain").attr("stroke", "#374151");
    yAxis.selectAll(".tick line").attr("stroke", "#374151");
    yAxis
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -42)
      .attr("x", -innerHeight / 2)
      .attr("fill", "#9ca3af")
      .attr("font-size", "12")
      .attr("text-anchor", "middle")
      .text("log(count)");

    // Line generator
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    // Regression line
    const lineData = log_inverse_sizes.map((xv, i) => ({ x: xv, y: fitted_values[i] }));
    g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("d", line);

    // Scatter dots
    g.selectAll(".dot")
      .data(log_inverse_sizes.map((xv, i) => ({ x: xv, y: log_counts[i] })))
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 5)
      .attr("fill", "#38bdf8")
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#0f111a")
      .attr("stroke-width", 1.5);

    // Annotation in top-left
    g.append("text")
      .attr("x", 8)
      .attr("y", 14)
      .attr("fill", "#94a3b8")
      .attr("font-size", "11")
      .text(`D = ${fractal_dimension.toFixed(4)}   R² = ${r_squared.toFixed(4)}`);
  }, [log_inverse_sizes, log_counts, fitted_values, fractal_dimension, r_squared]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full h-auto" style={{ minHeight: 300 }} />
    </div>
  );
}
