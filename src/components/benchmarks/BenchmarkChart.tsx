"use client";

/**
 * BenchmarkChart.tsx
 *
 * Horizontal bar chart comparing JS vs WASM execution time.
 * Implemented with inline SVG — no D3, no additional packages.
 */

interface BenchmarkChartProps {
  jsTimeMs: number;
  wasmTimeMs: number;
}

const BAR_HEIGHT = 32;
const BAR_GAP = 12;
const LABEL_W = 110; // left-side label column width
const VALUE_W = 70; // right-side value column width
const SVG_H = BAR_HEIGHT * 2 + BAR_GAP + 40; // bars + padding top/bottom
const PADDING_TOP = 16;

export default function BenchmarkChart({
  jsTimeMs,
  wasmTimeMs,
}: BenchmarkChartProps) {
  const maxTime = Math.max(jsTimeMs, wasmTimeMs, 0.001); // guard divide-by-zero

  // The chart bar area sits between the label column and the value column
  const bars: Array<{
    label: string;
    timeMs: number;
    color: string;
    id: string;
  }> = [
    { label: "JavaScript", timeMs: jsTimeMs, color: "#38bdf8", id: "bar-js" },
    {
      label: "WebAssembly",
      timeMs: wasmTimeMs,
      color: "#fb923c",
      id: "bar-wasm",
    },
  ];

  return (
    <div
      className="w-full rounded-xl bg-gray-800/60 border border-white/10 px-4 py-4"
      role="img"
      aria-label="Horizontal bar chart comparing JavaScript and WebAssembly execution times"
    >
      {/* We use a responsive SVG: viewBox drives intrinsic size,
          width="100%" lets it fill its container. */}
      <svg
        viewBox={`0 0 600 ${SVG_H}`}
        width="100%"
        height={SVG_H}
        aria-hidden="true"
        style={{ display: "block", overflow: "visible" }}
      >
        {bars.map((bar, idx) => {
          const y = PADDING_TOP + idx * (BAR_HEIGHT + BAR_GAP);
          // Available bar width = total - label column - value column - gaps
          const availableW = 600 - LABEL_W - VALUE_W - 16;
          const barW = (bar.timeMs / maxTime) * availableW;
          const barX = LABEL_W + 8;

          return (
            <g key={bar.id} id={bar.id}>
              {/* Left label */}
              <text
                x={LABEL_W - 8}
                y={y + BAR_HEIGHT / 2 + 5}
                textAnchor="end"
                fill="#d1d5db"
                fontSize="13"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="500"
              >
                {bar.label}
              </text>

              {/* Background track */}
              <rect
                x={barX}
                y={y}
                width={availableW}
                height={BAR_HEIGHT}
                rx={6}
                fill="#1f2937"
              />

              {/* Filled bar */}
              <rect
                x={barX}
                y={y}
                width={Math.max(barW, 4)}
                height={BAR_HEIGHT}
                rx={6}
                fill={bar.color}
                fillOpacity={0.85}
              />

              {/* Right value label */}
              <text
                x={barX + availableW + 10}
                y={y + BAR_HEIGHT / 2 + 5}
                textAnchor="start"
                fill={bar.color}
                fontSize="13"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="600"
              >
                {bar.timeMs.toFixed(1)}ms
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
