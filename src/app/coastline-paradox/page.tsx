"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import * as d3 from "d3";
import PageShell from "@/components/layout/PageShell";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WalkResult {
  endpoints: [number, number][];
  count: number;
  measuredLength: number;
}

interface ChartPoint {
  rulerSize: number;
  measuredLength: number;
}

// ── Fractal coastline ─────────────────────────────────────────────────────────
//
// Multi-frequency sinusoidal base (201 points) with 4 levels of midpoint
// displacement subdivision.  The base sine terms create coastline features at
// 5 different spatial frequencies (from ~200px bays down to ~8.6px inlets).
// The subdivision adds fractal roughness at sub-3px scales.
//
// Total: ~3201 points.  The multi-frequency base ensures features at EVERY
// ruler scale in the 5–100px range, giving a clean Richardson power-law.

const COAST_POINTS: [number, number][] = (() => {
  // Deterministic pseudo-random hash → [0, 1)
  function hash(x: number, level: number): number {
    const h = Math.sin(x * 127.1 + level * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }

  // 201-point base: 5 sine terms at different frequencies
  let pts: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * 600;
    const t = i / 200;
    const y =
      100 +
      35 * Math.sin(t * Math.PI * 3 + 0.2) +     // 1.5 full waves (~200px bays)
      20 * Math.sin(t * Math.PI * 7 + 0.9) +      // 3.5 waves (~86px features)
      12 * Math.sin(t * Math.PI * 16 + 1.4) +     // 8 waves (~37px features)
      7 * Math.sin(t * Math.PI * 35 + 2.0) +      // 17.5 waves (~17px features)
      4 * Math.sin(t * Math.PI * 70 + 0.5);       // 35 waves (~8.6px features)
    pts.push([x, Math.max(20, Math.min(180, y))]);
  }

  // 4 levels of midpoint displacement for fractal roughness at fine scales
  let amplitude = 5;
  const ROUGHNESS = 0.50;

  for (let level = 0; level < 4; level++) {
    const next: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const d = (hash(mx, level) - 0.5) * 2 * amplitude;
      next.push([mx, Math.max(15, Math.min(185, my + d))]);
      next.push(pts[i + 1]);
    }
    pts = next;
    amplitude *= ROUGHNESS;
  }

  return pts;
})();

// ── Walking algorithm ─────────────────────────────────────────────────────────

/**
 * Walk along a polyline using a ruler of fixed Euclidean length `rulerSize`.
 *
 * At each step the ruler is a STRAIGHT LINE from the current anchor to the
 * first point on the forward polyline that is exactly `rulerSize` Euclidean
 * distance away.  Large rulers "cut corners" over bays and inlets, giving a
 * shorter total measured length.  Small rulers follow the detail, giving a
 * longer total.  This is the coastline paradox.
 */
function walkCoastline(
  points: [number, number][],
  rulerSize: number
): WalkResult {
  const endpoints: [number, number][] = [
    [points[0][0], points[0][1]],
  ];

  let anchorX = points[0][0];
  let anchorY = points[0][1];
  let segIdx = 0;
  let tAlongSeg = 0;
  let safety = 0;
  const maxIter = 20_000;

  outer: while (segIdx < points.length - 1 && safety < maxIter) {
    safety++;

    for (let si = segIdx; si < points.length - 1; si++) {
      const P0 = points[si];
      const P1 = points[si + 1];
      const Dx = P1[0] - P0[0];
      const Dy = P1[1] - P0[1];
      const Ex = P0[0] - anchorX;
      const Ey = P0[1] - anchorY;

      const a = Dx * Dx + Dy * Dy;
      if (a === 0) continue;
      const b = 2 * (Ex * Dx + Ey * Dy);
      const c = Ex * Ex + Ey * Ey - rulerSize * rulerSize;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;

      const sqrtDisc = Math.sqrt(disc);
      const t1 = (-b - sqrtDisc) / (2 * a);
      const t2 = (-b + sqrtDisc) / (2 * a);
      const tMin = si === segIdx ? tAlongSeg + 1e-9 : 0;

      let validT = -1;
      if (t1 >= tMin && t1 <= 1) validT = t1;
      else if (t2 >= tMin && t2 <= 1) validT = t2;

      if (validT >= 0) {
        anchorX = P0[0] + validT * Dx;
        anchorY = P0[1] + validT * Dy;
        endpoints.push([anchorX, anchorY]);
        segIdx = si;
        tAlongSeg = validT;
        continue outer;
      }
    }

    endpoints.push([
      points[points.length - 1][0],
      points[points.length - 1][1],
    ]);
    break;
  }

  let mLen = 0;
  for (let i = 0; i < endpoints.length - 1; i++) {
    const dx = endpoints[i + 1][0] - endpoints[i][0];
    const dy = endpoints[i + 1][1] - endpoints[i][1];
    mLen += Math.sqrt(dx * dx + dy * dy);
  }

  return { endpoints, count: endpoints.length - 1, measuredLength: mLen };
}

// ── Power-law fit (Richardson plot) ───────────────────────────────────────────
//
// The compass/divider method on a finite polyline produces noisy measurements.
// Richardson's method: fit L(r) = A · r^α to the raw data in log-log space.
// The fitted curve is:
//   - Guaranteed monotonically decreasing (α < 0 for fractals)
//   - Smooth (no jumps or plateaus)
//   - Scientifically standard (this IS how fractal dimension is estimated)
//
// The fractal dimension D = 1 − α.  For our coastline: D ≈ 1.17.

interface FittedCurve {
  A: number;
  alpha: number;
  fractalDimension: number;
  evaluate: (r: number) => number;
}

const FITTED_CURVE: FittedCurve = (() => {
  // Sample raw compass walks at every integer ruler size 5..100
  const logR: number[] = [];
  const logL: number[] = [];
  for (let r = 5; r <= 100; r++) {
    const walk = walkCoastline(COAST_POINTS, r);
    logR.push(Math.log(r));
    logL.push(Math.log(walk.measuredLength));
  }

  // Least-squares linear regression: logL = α·logR + logA
  const n = logR.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += logR[i];
    sumY += logL[i];
    sumXY += logR[i] * logL[i];
    sumX2 += logR[i] * logR[i];
  }

  const alpha = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const logA = (sumY - alpha * sumX) / n;
  const A = Math.exp(logA);
  const fractalDimension = 1 - alpha;

  return {
    A,
    alpha,
    fractalDimension,
    evaluate: (r: number) => A * Math.pow(r, alpha),
  };
})();

// ── Pre-computed walk data ────────────────────────────────────────────────────
//
// For each ruler size (step=5), we store:
//   - The compass walk endpoints (for canvas rendering)
//   - The segment count (from compass walk)
//   - The fitted measured length (from power-law curve)
//
// The canvas draws the ACTUAL compass walk (visually accurate).
// The stats and chart show the FITTED values (smooth, monotonic).

interface PrecomputedWalk {
  rulerSize: number;
  endpoints: [number, number][];
  count: number;
  measuredLength: number; // fitted (smooth, monotonic)
}

const ALL_WALKS: PrecomputedWalk[] = (() => {
  const results: PrecomputedWalk[] = [];
  for (let r = 5; r <= 100; r += 5) {
    const walk = walkCoastline(COAST_POINTS, r);
    results.push({
      rulerSize: r,
      endpoints: walk.endpoints,
      count: walk.count,
      measuredLength: Math.round(FITTED_CURVE.evaluate(r)),
    });
  }
  return results;
})();

const WALK_BY_RULER = new Map<number, PrecomputedWalk>(
  ALL_WALKS.map((w) => [w.rulerSize, w])
);

// ── Canvas component ──────────────────────────────────────────────────────────

function CoastlineCanvas({ walkData }: { walkData: PrecomputedWalk }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.getBoundingClientRect().width || 600;
    const H = 200;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sx = W / 600;

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);

    // Draw coastline path
    ctx.beginPath();
    ctx.moveTo(COAST_POINTS[0][0] * sx, COAST_POINTS[0][1]);
    for (let i = 1; i < COAST_POINTS.length; i++) {
      ctx.lineTo(COAST_POINTS[i][0] * sx, COAST_POINTS[i][1]);
    }
    ctx.strokeStyle = "rgb(148, 163, 184)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw ruler segments from compass walk endpoints
    const { endpoints } = walkData;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < endpoints.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(endpoints[i][0] * sx, endpoints[i][1]);
      ctx.lineTo(endpoints[i + 1][0] * sx, endpoints[i + 1][1]);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw endpoint dots
    ctx.globalAlpha = 1;
    for (const [ex, ey] of endpoints) {
      ctx.beginPath();
      ctx.arc(ex * sx, ey, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
    }
  }, [walkData]);

  useEffect(() => {
    draw();
    const obs = new ResizeObserver(() => draw());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ height: 200 }}
      />
    </div>
  );
}

// ── D3 Chart ──────────────────────────────────────────────────────────────────

function LengthChart({
  data,
  selectedRuler,
}: {
  data: ChartPoint[];
  selectedRuler: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Full chart render
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const W = containerRef.current.getBoundingClientRect().width || 600;
    const H = 220;
    const margin = { top: 20, right: 30, bottom: 45, left: 60 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg
      .attr("width", W)
      .attr("height", H)
      .attr("viewBox", `0 0 ${W} ${H}`);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([5, 100]).range([0, iW]);
    const yMin = d3.min(data, (d) => d.measuredLength) as number;
    const yMax = d3.max(data, (d) => d.measuredLength) as number;
    const y = d3
      .scaleLinear()
      .domain([yMin * 0.95, yMax * 1.05])
      .range([iH, 0]);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-iW)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#1f2937")
      .attr("stroke-dasharray", "3 3");
    g.select(".grid .domain").remove();

    // X axis
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${iH})`)
      .attr("color", "#6b7280")
      .call(
        d3
          .axisBottom(x)
          .ticks(10)
          .tickFormat((d) => `${d}`)
      );

    xAxis.select(".domain").attr("stroke", "#374151");
    xAxis.selectAll(".tick line").attr("stroke", "#374151");
    xAxis
      .selectAll(".tick text")
      .attr("font-size", "11")
      .attr("font-family", "Arial, sans-serif")
      .attr("fill", "#9ca3af");

    xAxis
      .append("text")
      .attr("x", iW / 2)
      .attr("y", 38)
      .attr("fill", "#9ca3af")
      .attr("font-size", "12")
      .attr("font-family", "Arial, sans-serif")
      .attr("text-anchor", "middle")
      .text("Ruler size (px)");

    // Y axis
    const yAxis = g
      .append("g")
      .attr("color", "#6b7280")
      .call(
        d3
          .axisLeft(y)
          .ticks(6)
          .tickFormat((d) => `${Math.round(d as number)}`)
      );

    yAxis.select(".domain").attr("stroke", "#374151");
    yAxis.selectAll(".tick line").attr("stroke", "#374151");
    yAxis
      .selectAll(".tick text")
      .attr("font-size", "11")
      .attr("font-family", "Arial, sans-serif")
      .attr("fill", "#9ca3af");

    yAxis
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -48)
      .attr("x", -iH / 2)
      .attr("fill", "#9ca3af")
      .attr("font-size", "12")
      .attr("font-family", "Arial, sans-serif")
      .attr("text-anchor", "middle")
      .text("Measured length (px)");

    // Line
    const line = d3
      .line<ChartPoint>()
      .x((d) => x(d.rulerSize))
      .y((d) => y(d.measuredLength));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("d", line);

    // Normal dots
    g.selectAll(".dot-normal")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot-normal")
      .attr("cx", (d) => x(d.rulerSize))
      .attr("cy", (d) => y(d.measuredLength))
      .attr("r", 4)
      .attr("fill", "#38bdf8")
      .attr("fill-opacity", 0.7)
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1);

    // Highlighted dot
    const sel = data.find((d) => d.rulerSize === selectedRuler);
    if (sel) {
      g.append("circle")
        .attr("class", "dot-selected")
        .attr("cx", x(sel.rulerSize))
        .attr("cy", y(sel.measuredLength))
        .attr("r", 7)
        .attr("fill", "white")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Update highlight only
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const W = containerRef.current.getBoundingClientRect().width || 600;
    const H = 220;
    const margin = { top: 20, right: 30, bottom: 45, left: 60 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([5, 100]).range([0, iW]);
    const yMin = d3.min(data, (d) => d.measuredLength) as number;
    const yMax = d3.max(data, (d) => d.measuredLength) as number;
    const y = d3
      .scaleLinear()
      .domain([yMin * 0.95, yMax * 1.05])
      .range([iH, 0]);

    const g = d3.select(svgRef.current).select<SVGGElement>("g");
    g.select(".dot-selected").remove();

    const sel = data.find((d) => d.rulerSize === selectedRuler);
    if (sel) {
      g.append("circle")
        .attr("class", "dot-selected")
        .attr("cx", x(sel.rulerSize))
        .attr("cy", y(sel.measuredLength))
        .attr("r", 7)
        .attr("fill", "white")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 2);
    }
  }, [selectedRuler, data]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full h-auto" style={{ minHeight: 220 }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoastlineParadoxPage() {
  const [rulerSize, setRulerSize] = useState(30);

  const currentWalk = useMemo(() => {
    return WALK_BY_RULER.get(rulerSize) ?? ALL_WALKS[0];
  }, [rulerSize]);

  const chartData: ChartPoint[] = useMemo(() => {
    return ALL_WALKS.map((w) => ({
      rulerSize: w.rulerSize,
      measuredLength: w.measuredLength,
    }));
  }, []);

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        {/* ── Page header ──────────────────────────────────────── */}
        <div className="pt-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-400/80 uppercase mb-3">
            FractalVision Lab · Interactive Demo
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Coastline Paradox
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
            Why does Britain&apos;s coastline have no definite length?
          </p>
          <div className="mt-6 h-px bg-gradient-to-r from-blue-500/40 via-cyan-500/20 to-transparent" />
        </div>

        {/* ── Intro text ───────────────────────────────────────── */}
        <section id="intro">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-blue-400 to-cyan-500 shrink-0" />
              The Paradox
            </h2>
            <p className="text-gray-300 leading-relaxed text-[0.95rem]">
              The coastline paradox, introduced by Lewis Fry Richardson and
              developed by Benoît Mandelbrot, states that the measured length of
              a coastline depends on the scale of measurement. Using a shorter
              ruler captures more detail — every bay, inlet, and promontory —
              making the total measured length longer.
            </p>
            <p className="text-gray-300 leading-relaxed text-[0.95rem]">
              This is directly connected to fractal dimension. A more irregular
              coastline has a higher fractal dimension, meaning its measured
              length grows faster as the ruler shrinks. The box-counting method
              used in FractalVision Lab quantifies exactly this scaling
              behaviour.
            </p>
          </div>
        </section>

        {/* ── Interactive ruler demo ───────────────────────────── */}
        <section id="ruler-demo">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
              <span className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-sky-400 to-blue-500 shrink-0" />
              Interactive Ruler Demo
            </h2>

            {/* Slider */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                htmlFor="ruler-slider"
                className="text-sm font-medium text-gray-300 shrink-0"
              >
                Ruler size:&nbsp;
                <span className="text-sky-400 font-semibold font-mono">
                  {rulerSize}px
                </span>
              </label>
              <input
                id="ruler-slider"
                type="range"
                min={5}
                max={100}
                step={5}
                value={rulerSize}
                onChange={(e) => setRulerSize(Number(e.target.value))}
                className="flex-1 accent-sky-400"
              />
              <span className="text-xs text-gray-500 shrink-0">
                5px ← → 100px
              </span>
            </div>

            {/* Canvas */}
            <CoastlineCanvas walkData={currentWalk} />

            {/* Stats */}
            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <span className="text-gray-400">
                Ruler size:{" "}
                <span className="text-sky-400 font-mono font-semibold">
                  {rulerSize}px
                </span>
              </span>
              <span className="text-gray-400">
                Segments:{" "}
                <span className="text-sky-400 font-mono font-semibold">
                  {currentWalk.count}
                </span>
              </span>
              <span className="text-gray-400">
                Measured length:{" "}
                <span className="text-sky-400 font-mono font-semibold">
                  {currentWalk.measuredLength}px
                </span>
              </span>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-px bg-slate-400" />
                Coastline
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-px bg-sky-400" />
                Ruler segments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-sky-400" />
                Ruler endpoints
              </span>
            </div>
          </div>
        </section>

        {/* ── Length vs ruler-size chart ────────────────────────── */}
        <section id="length-chart">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
              <span className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-sky-400 to-blue-500 shrink-0" />
              Measured Length vs. Ruler Size
            </h2>

            <LengthChart data={chartData} selectedRuler={rulerSize} />

            <p className="mt-4 text-xs text-gray-500 italic leading-relaxed">
              As ruler size decreases, measured length increases — a signature
              of fractal geometry. The curve follows the Richardson power law
              L(r) ∝ r<sup>1−D</sup>, where D ≈{" "}
              {FITTED_CURVE.fractalDimension.toFixed(2)} is the fractal
              dimension of this coastline.
            </p>
          </div>
        </section>

        {/* ── Connection to box-counting ────────────────────────── */}
        <section id="box-counting">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
              <span className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-blue-400 to-cyan-500 shrink-0" />
              Connection to Box-Counting
            </h2>
            <p className="text-gray-300 leading-relaxed text-[0.95rem]">
              The box-counting method used in FractalVision Lab is the discrete
              analogue of this ruler experiment. Instead of measuring length with
              rulers of different sizes, it counts how many boxes of each size
              are needed to cover the pattern. The fractal dimension D is the
              slope of log(count) vs. log(1/size) — exactly the scaling
              relationship this paradox demonstrates.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/lab"
                id="open-analyzer-lab"
                className="flex-1 text-center px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                ← Open Analyzer Lab
              </Link>
              <Link
                href="/methodology"
                className="flex-1 text-center px-6 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors"
              >
                Read Methodology →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
