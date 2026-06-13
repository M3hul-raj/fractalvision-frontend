"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

// ── Props ──────────────────────────────────────────────────────────────────────
interface ResidualChartProps {
  logInverseSizes: number[];
  residuals: number[];
  fractalDimension: number;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ResidualChart({
  logInverseSizes,
  residuals,
  fractalDimension,
}: ResidualChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || logInverseSizes.length < 2) return;

    // ── Dimensions ─────────────────────────────────────────────────────────────
    const width = 500;
    const height = 220;
    const margin = { top: 20, right: 30, bottom: 45, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // ── Symmetric Y domain ─────────────────────────────────────────────────────
    const maxAbs = Math.max(...residuals.map(Math.abs));
    const yExtent = maxAbs * 1.15;

    // ── Scales ─────────────────────────────────────────────────────────────────
    const x = d3
      .scaleLinear()
      .domain([
        d3.min(logInverseSizes) as number,
        d3.max(logInverseSizes) as number,
      ])
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([-yExtent, yExtent])
      .range([innerHeight, 0]);

    // ── SVG setup ──────────────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ── Horizontal grid lines ──────────────────────────────────────────────────
    const yTicks = y.ticks(5);
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "rgb(55,65,81)")
      .attr("stroke-dasharray", "3 3")
      .attr("stroke-opacity", 0.5);

    // ── X Axis ─────────────────────────────────────────────────────────────────
    const xAxisG = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5));

    xAxisG.selectAll("text").attr("fill", "rgb(156,163,175)").attr("font-size", "11");
    xAxisG.select(".domain").attr("stroke", "rgb(75,85,99)");
    xAxisG.selectAll(".tick line").attr("stroke", "rgb(75,85,99)");

    // X label
    xAxisG
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 36)
      .attr("fill", "rgb(156,163,175)")
      .attr("font-size", "12")
      .attr("text-anchor", "middle")
      .text("log(1/s)");

    // ── Y Axis ─────────────────────────────────────────────────────────────────
    const yAxisG = g.append("g").call(d3.axisLeft(y).ticks(5));

    yAxisG.selectAll("text").attr("fill", "rgb(156,163,175)").attr("font-size", "11");
    yAxisG.select(".domain").attr("stroke", "rgb(75,85,99)");
    yAxisG.selectAll(".tick line").attr("stroke", "rgb(75,85,99)");

    // Y label
    yAxisG
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -42)
      .attr("x", -innerHeight / 2)
      .attr("fill", "rgb(156,163,175)")
      .attr("font-size", "12")
      .attr("text-anchor", "middle")
      .text("Residual");

    // ── Zero reference line ────────────────────────────────────────────────────
    const zeroY = y(0);
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", zeroY)
      .attr("y2", zeroY)
      .attr("stroke", "rgb(248,113,113)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 2");

    // "y=0" label at right end of the line
    g.append("text")
      .attr("x", innerWidth + 3)
      .attr("y", zeroY + 4)
      .attr("fill", "rgb(156,163,175)")
      .attr("font-size", "10")
      .text("y=0");

    // ── Data points ────────────────────────────────────────────────────────────
    type Point = { x: number; y: number };
    const pointData: Point[] = logInverseSizes.map((xVal, i) => ({
      x: xVal,
      y: residuals[i],
    }));

    g.selectAll<SVGCircleElement, Point>(".residual-dot")
      .data(pointData)
      .enter()
      .append("circle")
      .attr("class", "residual-dot")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 5)
      .attr("fill", "rgb(96,165,250)")
      .attr("stroke", "rgb(147,197,253)")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .style("transition", "r 0.12s ease, fill 0.12s ease")
      .on("mouseenter", function () {
        d3.select(this).attr("r", 7).attr("fill", "rgb(147,197,253)");
      })
      .on("mouseleave", function () {
        d3.select(this).attr("r", 5).attr("fill", "rgb(96,165,250)");
      })
      .append("title")
      .text(
        (d) => `log(1/s) = ${d.x.toFixed(3)}, residual = ${d.y.toFixed(4)}`
      );
  }, [logInverseSizes, residuals, fractalDimension]);

  if (logInverseSizes.length < 2) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md">
      {/* Header */}
      <h3 className="text-xl font-bold text-gray-100">Residual Plot</h3>
      <p className="text-sm text-gray-400 mt-1">
        Deviations from D&nbsp;=&nbsp;{fractalDimension.toFixed(4)} regression line
      </p>

      {/* Chart */}
      <div className="mt-4 flex justify-center text-gray-300">
        <svg
          ref={svgRef}
          width="500"
          height="220"
          viewBox="0 0 500 220"
          preserveAspectRatio="xMidYMid meet"
          className="max-w-full h-auto"
        />
      </div>

      {/* Interpretation note */}
      <p className="text-xs text-gray-500 mt-3 italic">
        Random scatter around zero indicates a good power-law fit. Systematic
        curves suggest the fractal dimension varies across scales.
      </p>
    </div>
  );
}
