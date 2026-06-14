"use client";

import { useAnalyzerStore } from "@/store/analyzerStore";
import type { SensitivityResult, RotationSensitivityResult } from "@/types/analysis";

// ─── Helper: arc colour by score ──────────────────────────────────────────────
function arcColor(score: number): string {
  if (score >= 85) return "#22c55e"; // green-500
  if (score >= 70) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

// ─── Helper: reliability badge colours ───────────────────────────────────────
function reliabilityColors(reliability: string): { bg: string; text: string } {
  if (reliability === "High") return { bg: "bg-green-900/50", text: "text-green-300 border-green-700" };
  if (reliability === "Medium") return { bg: "bg-yellow-900/50", text: "text-yellow-300 border-yellow-700" };
  return { bg: "bg-red-900/50", text: "text-red-300 border-red-700" };
}

// ─── Section A: SVG semicircular gauge ────────────────────────────────────────
function QualityArc({ score }: { score: number }) {
  // Semicircle: r=54, cx=70, cy=70. Arc length ≈ π*r = 169.6
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * r;           // half-circle arc length
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;
  const color = arcColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80" aria-label={`Quality score ${score} out of 100`}>
        {/* Background track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#374151"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        {/* Score label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="22"
          fontWeight="bold"
          fill={color}
          fontFamily="monospace"
        >
          {score}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#9ca3af">
          / 100
        </text>
      </svg>
      <span className="text-xs text-gray-400 uppercase tracking-wider mt-1">Analysis Quality</span>
    </div>
  );
}

// ─── Section D: Sensitivity sparkline ────────────────────────────────────────
function SensitivitySparkline({ sensitivity, fallbackD }: { sensitivity: SensitivityResult; fallbackD: number }) {
  const { dimensions, is_stable, std_deviation } = sensitivity;

  const allNull = dimensions.every((d) => d === null);
  if (allNull) return null;

  const center_D = dimensions[1] ?? fallbackD;
  const window = 0.10;
  const yMin = center_D - window;
  const yMax = center_D + window;
  const svgW = 96;
  const svgH = 36;

  const toY = (d: number) => {
    const raw = ((yMax - d) / (yMax - yMin)) * svgH;
    return Math.max(0, Math.min(svgH, raw));
  };

  const xPositions = [12, 48, 84];
  const refY = toY(center_D);

  // Build polyline points (skip nulls)
  const validPoints: { x: number; y: number; d: number }[] = [];
  dimensions.forEach((d, i) => {
    if (d !== null) validPoints.push({ x: xPositions[i], y: toY(d), d });
  });

  // Build line segments between consecutive non-null points
  const segments: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
  for (let i = 0; i < dimensions.length - 1; i++) {
    const a = dimensions[i];
    const b = dimensions[i + 1];
    if (a !== null && b !== null) {
      segments.push([
        { x: xPositions[i], y: toY(a) },
        { x: xPositions[i + 1], y: toY(b) },
      ]);
    }
  }

  const stableBadge = is_stable
    ? { label: "Stable ✓", cls: "bg-green-900/60 text-green-300 border border-green-700" }
    : { label: "Unstable ⚠", cls: "bg-amber-900/60 text-amber-300 border border-amber-700" };

  return (
    <div className="flex items-center gap-3 mt-3 flex-wrap">
      {/* Badge */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stableBadge.cls}`}>
        {stableBadge.label}
      </span>

      {/* Sparkline SVG */}
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="overflow-visible"
        aria-label="Threshold sensitivity sparkline"
      >
        {/* Reference line at center_D */}
        <line x1={0} y1={refY} x2={svgW} y2={refY} stroke="#4b5563" strokeWidth={0.75} strokeDasharray="2 2" />

        {/* Line segments */}
        {segments.map((seg, i) => (
          <line
            key={i}
            x1={seg[0].x}
            y1={seg[0].y}
            x2={seg[1].x}
            y2={seg[1].y}
            stroke="#6b7280"
            strokeWidth={1.5}
          />
        ))}

        {/* Points */}
        {validPoints.map((pt, i) => {
          const deviation = Math.abs(pt.d - center_D);
          const color = deviation <= 0.03 ? "#22c55e" : "#f59e0b";
          return (
            <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={color} />
          );
        })}
      </svg>

      {/* Sigma text */}
      {std_deviation !== null && (
        <span className="text-xs text-gray-400 font-mono">
          σ = {std_deviation.toFixed(4)}
        </span>
      )}
    </div>
  );
}

// ─── Section D2: Rotation sensitivity sparkline ─────────────────────────────
function RotationSparkline({
  sensitivity,
  fallbackD,
}: {
  sensitivity: RotationSensitivityResult;
  fallbackD: number;
}) {
  const { angles_tested, dimensions, is_stable, std_deviation } = sensitivity;
  const allNull = dimensions.every((d) => d === null);
  if (allNull) return null;

  const center_D = dimensions[0] ?? fallbackD;
  const window = 0.10;
  const yMin = center_D - window;
  const yMax = center_D + window;
  const svgW = 120;
  const svgH = 36;

  const toY = (d: number) => {
    const raw = ((yMax - d) / (yMax - yMin)) * svgH;
    return Math.max(0, Math.min(svgH, raw));
  };

  const xPositions = angles_tested.map((a) => 10 + (a / 90) * 100);
  const refY = toY(center_D);

  const validPoints: { x: number; y: number; d: number }[] = [];
  dimensions.forEach((d, i) => {
    if (d !== null) validPoints.push({ x: xPositions[i], y: toY(d), d });
  });

  const segments: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
  for (let i = 0; i < dimensions.length - 1; i++) {
    const a = dimensions[i];
    const b = dimensions[i + 1];
    if (a !== null && b !== null) {
      segments.push([
        { x: xPositions[i], y: toY(a) },
        { x: xPositions[i + 1], y: toY(b) },
      ]);
    }
  }

  const stableBadge = is_stable
    ? { label: "Stable ✓", cls: "bg-green-900/60 text-green-300 border border-green-700" }
    : { label: "Unstable ⚠", cls: "bg-amber-900/60 text-amber-300 border border-amber-700" };

  return (
    <div className="flex items-center gap-3 mt-3 flex-wrap">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stableBadge.cls}`}>
        {stableBadge.label}
      </span>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="overflow-visible"
        aria-label="Rotation sensitivity sparkline"
      >
        <line
          x1={0} y1={refY} x2={svgW} y2={refY}
          stroke="#4b5563" strokeWidth={0.75} strokeDasharray="2 2"
        />
        {segments.map((seg, i) => (
          <line
            key={i}
            x1={seg[0].x} y1={seg[0].y}
            x2={seg[1].x} y2={seg[1].y}
            stroke="#6b7280" strokeWidth={1.5}
          />
        ))}
        {validPoints.map((pt, i) => {
          const deviation = Math.abs(pt.d - center_D);
          const color = deviation <= 0.03 ? "#22c55e" : "#f59e0b";
          return <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={color} />;
        })}
      </svg>
      {std_deviation !== null && (
        <span className="text-xs text-gray-400 font-mono">
          σ = {std_deviation.toFixed(4)}
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function QualityScore() {
  const { result } = useAnalyzerStore();

  if (!result) return null;

  const { fractal_dimension, quality_score, reliability, standard_error, confidence_interval, sensitivity, rotation_sensitivity } = result;

  const hasQuality = quality_score != null && reliability != null;
  const hasPrecision = confidence_interval != null && confidence_interval.length === 2;
  const hasSensitivity = sensitivity != null;
  const hasRotationSensitivity = rotation_sensitivity != null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md space-y-6">
      <h3 className="text-xl font-bold text-gray-100">Reliability Dashboard</h3>

      {hasQuality && (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Section A — Arc gauge */}
          <QualityArc score={quality_score!} />

          {/* Section B — Reliability badge */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Reliability</span>
            {(() => {
              const { bg, text } = reliabilityColors(reliability!);
              return (
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${bg} ${text}`}>
                  {reliability}
                </span>
              );
            })()}
          </div>
        </div>
      )}

      {/* Section C — Precision panel */}
      {hasPrecision && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Precision</h4>
          <div className="font-mono text-sm space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-gray-400 w-20 shrink-0">D</span>
              <span className="text-blue-300 font-bold">{fractal_dimension.toFixed(4)}</span>
              <span className="text-gray-500">±</span>
              <span className="text-blue-300">{((confidence_interval![1] - confidence_interval![0]) / 2).toFixed(4)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-400 w-20 shrink-0">95% CI</span>
              <span className="text-gray-200">{confidence_interval![0].toFixed(4)} – {confidence_interval![1].toFixed(4)}</span>
            </div>
            {standard_error != null && (
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 w-20 shrink-0">Std Error</span>
                <span className="text-gray-200">{standard_error.toFixed(4)}</span>
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-gray-400 w-20 shrink-0">Coverage</span>
              <span className="text-gray-200">
                {(result.foreground_ratio * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Section D — Sensitivity sparkline */}
      {hasSensitivity && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-1">Threshold Sensitivity</h4>
          <SensitivitySparkline sensitivity={sensitivity!} fallbackD={fractal_dimension} />
        </div>
      )}

      {/* Section E — Rotation Sensitivity */}
      {hasRotationSensitivity && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-1">
            Rotation Sensitivity
          </h4>
          <RotationSparkline
            sensitivity={rotation_sensitivity!}
            fallbackD={fractal_dimension}
          />
        </div>
      )}
    </div>
  );
}
