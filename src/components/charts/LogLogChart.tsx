"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useAnalyzerStore } from "@/store/analyzerStore";

export default function LogLogChart() {
  const { result } = useAnalyzerStore();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!result || !svgRef.current) return;

    const { logInverseSizes, logCounts, fittedValues } = result;

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([d3.min(logInverseSizes) as number, d3.max(logInverseSizes) as number])
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(logCounts) as number, d3.max(logCounts) as number])
      .nice()
      .range([innerHeight, 0]);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("color", "#9ca3af")
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "#9ca3af")
      .text("log(1/s)");

    // Y Axis
    g.append("g")
      .attr("color", "#9ca3af")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -innerHeight / 2)
      .attr("fill", "#9ca3af")
      .text("log(N(s))");

    // Regression Line
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    const lineData = logInverseSizes.map((xVal, i) => ({
      x: xVal,
      y: fittedValues[i],
    }));

    g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6") // blue-500
      .attr("stroke-width", 2)
      .attr("d", line);

    // Scatter Points
    g.selectAll("circle")
      .data(logInverseSizes.map((xVal, i) => ({ x: xVal, y: logCounts[i] })))
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 4)
      .attr("fill", "#ef4444"); // red-500

  }, [result]);

  if (!result) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md">
      <h3 className="text-xl font-bold mb-4 text-gray-100">Log-Log Plot</h3>
      <div className="flex justify-center text-gray-300">
        <svg ref={svgRef} width="500" height="300" viewBox="0 0 500 300" className="max-w-full h-auto" />
      </div>
    </div>
  );
}
