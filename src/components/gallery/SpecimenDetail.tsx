"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Specimen } from "@/types/specimen";

// ─── Inline log-log chart for a specimen ─────────────────────────────────────
interface SpecimenLogLogChartProps {
  logInverseSizes: number[];
  logCounts: number[];
  fractalDimension: number;
  rSquared: number;
}

function SpecimenLogLogChart({
  logInverseSizes,
  logCounts,
  fractalDimension,
  rSquared,
}: SpecimenLogLogChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || logInverseSizes.length < 2) return;

    const x = logInverseSizes;
    const y = logCounts;

    // ── OLS regression ─────────────────────────────────────────────────────
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
    const sumXX = x.reduce((s, xi) => s + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // ── Dimensions ─────────────────────────────────────────────────────────
    const width = 480;
    const height = 240;
    const margin = { top: 20, right: 30, bottom: 45, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ── Scales ─────────────────────────────────────────────────────────────
    const xExtent = d3.extent(x) as [number, number];
    const yExtent = d3.extent(y) as [number, number];
    const yPad = (yExtent[1] - yExtent[0]) * 0.05;

    const xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .nice()
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad])
      .nice()
      .range([innerHeight, 0]);

    // ── Grid lines (horizontal, dashed) ────────────────────────────────────
    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "rgb(55,65,81)")
      .attr("stroke-dasharray", "3 3")
      .attr("opacity", 0.5);
    g.selectAll(".grid .domain").remove();

    // ── Axes ───────────────────────────────────────────────────────────────
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("color", "rgb(156,163,175)")
      .call(d3.axisBottom(xScale));
    xAxis.select(".domain").attr("stroke", "rgb(75,85,99)");
    xAxis
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 38)
      .attr("fill", "rgb(156,163,175)")
      .attr("font-size", "12")
      .attr("text-anchor", "middle")
      .text("log(1/ε)");

    const yAxis = g
      .append("g")
      .attr("color", "rgb(156,163,175)")
      .call(d3.axisLeft(yScale));
    yAxis.select(".domain").attr("stroke", "rgb(75,85,99)");
    yAxis
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -42)
      .attr("x", -innerHeight / 2)
      .attr("fill", "rgb(156,163,175)")
      .attr("font-size", "12")
      .attr("text-anchor", "middle")
      .text("log N(ε)");

    // ── Regression line (dashed yellow) ────────────────────────────────────
    const xDomain = xScale.domain();
    g.append("line")
      .attr("x1", xScale(xDomain[0]))
      .attr("y1", yScale(slope * xDomain[0] + intercept))
      .attr("x2", xScale(xDomain[1]))
      .attr("y2", yScale(slope * xDomain[1] + intercept))
      .attr("stroke", "rgb(250,204,21)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5 3");

    // ── Data points ────────────────────────────────────────────────────────
    g.selectAll(".data-dot")
      .data(x.map((xi, i) => ({ x: xi, y: y[i] })))
      .enter()
      .append("circle")
      .attr("class", "data-dot")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 5)
      .attr("fill", "rgb(96,165,250)")
      .attr("stroke", "rgb(147,197,253)")
      .attr("stroke-width", 1);
  }, [logInverseSizes, logCounts]);

  if (logInverseSizes.length < 2) return null;

  return (
    <div>
      <svg
        ref={svgRef}
        width="480"
        height="240"
        viewBox="0 0 480 240"
        preserveAspectRatio="xMidYMid meet"
        className="max-w-full h-auto"
      />
      <p className="text-xs text-gray-400 mt-2 text-center">
        D = {fractalDimension.toFixed(4)} · R² = {rSquared.toFixed(4)}
      </p>
    </div>
  );
}

// ─── Main detail component ───────────────────────────────────────────────────
interface SpecimenDetailProps {
  specimen: Specimen;
  onClose: () => void;
}

export default function SpecimenDetail({ specimen, onClose }: SpecimenDetailProps) {
  const categoryColor =
    specimen.category === "leaf"
      ? "bg-teal-600/80 text-teal-100"
      : specimen.category === "coastline"
      ? "bg-blue-600/80 text-blue-100"
      : "bg-purple-600/80 text-purple-100";

  const categoryLabel =
    specimen.category === "leaf"
      ? "Leaf"
      : specimen.category === "coastline"
      ? "Coastline"
      : "Fractal";

  // Parse log arrays — Supabase sends string arrays
  const parsedX = specimen.log_inverse_sizes?.map((v) => (typeof v === "string" ? parseFloat(v) : v)) ?? [];
  const parsedY = specimen.log_counts?.map((v) => (typeof v === "string" ? parseFloat(v) : v)) ?? [];

  const hasValidX = parsedX.length >= 2 && parsedX.every((v) => !isNaN(v));
  const hasValidY = parsedY.length >= 2 && parsedY.every((v) => !isNaN(v));
  const canRenderChart = hasValidX && hasValidY;

  const hasImage = specimen.image_url != null && specimen.image_url !== "";

  return (
    // Overlay backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl leading-none"
          aria-label="Close detail"
        >
          ✕
        </button>

        {/* Section 1 — Header */}
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-100">{specimen.name}</h2>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${categoryColor}`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Section 2 — Image */}
        {hasImage && (
          <img
            src={specimen.image_url}
            alt={specimen.name}
            className="w-full max-h-64 object-contain rounded-lg"
          />
        )}

        {/* Section 3 — Metrics row */}
        <div className="flex items-baseline gap-6 flex-wrap">
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              Fractal Dimension
            </span>
            <span className="text-xl font-mono font-bold text-cyan-400">
              {specimen.fractal_dimension.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              R²
            </span>
            <span className="text-xl font-mono font-bold text-green-400">
              {specimen.r_squared.toFixed(4)}
            </span>
          </div>
          {specimen.complexity_class && (
            <span className="text-xs font-medium text-amber-400/90 bg-amber-900/30 border border-amber-700/40 px-2.5 py-0.5 rounded-full">
              {specimen.complexity_class}
            </span>
          )}
        </div>

        {/* Section 4 — Interpretation */}
        <p className="text-gray-300 text-sm leading-relaxed">
          {specimen.interpretation}
        </p>

        {/* Section 5 — Notes */}
        {specimen.notes && (
          <p className="text-xs text-gray-500 italic">{specimen.notes}</p>
        )}

        {/* Section 6 — Log-Log Chart */}
        {canRenderChart && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              Log-Log Regression Plot
            </h4>
            <SpecimenLogLogChart
              logInverseSizes={parsedX}
              logCounts={parsedY}
              fractalDimension={specimen.fractal_dimension}
              rSquared={specimen.r_squared}
            />
          </div>
        )}

        {/* Section 7 — No-data message */}
        {!canRenderChart && (
          <p className="text-sm text-gray-500 italic">
            Box-counting data unavailable for this specimen.
          </p>
        )}
      </div>
    </div>
  );
}
