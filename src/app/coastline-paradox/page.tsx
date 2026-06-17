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

interface PrecomputedWalk {
  rulerSize: number;
  endpoints: [number, number][];
  count: number;
  measuredLength: number;
}

// ── Fractal coastline (high resolution) ───────────────────────────────────────
//
// Multi-frequency sinusoidal base (201 points) with 7 levels of midpoint
// displacement.  Total: ~25,601 points.  Average segment ≈ 0.08px, which
// supports clean zoom to ~20× before individual segments become visible.
//
// The extra resolution exists purely for zoom — the walker uses all points,
// and the visual detail revealed at high zoom is the entire point of the
// interactive exploration.

const COAST_POINTS: [number, number][] = (() => {
  function hash(x: number, level: number): number {
    const h = Math.sin(x * 127.1 + level * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }

  let pts: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * 600;
    const t = i / 200;
    const y =
      100 +
      35 * Math.sin(t * Math.PI * 3 + 0.2) +
      20 * Math.sin(t * Math.PI * 7 + 0.9) +
      12 * Math.sin(t * Math.PI * 16 + 1.4) +
      7 * Math.sin(t * Math.PI * 35 + 2.0) +
      4 * Math.sin(t * Math.PI * 70 + 0.5);
    pts.push([x, Math.max(20, Math.min(180, y))]);
  }

  let amplitude = 5;
  const ROUGHNESS = 0.50;

  for (let level = 0; level < 7; level++) {
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

function walkCoastline(
  points: [number, number][],
  rulerSize: number
): WalkResult {
  const endpoints: [number, number][] = [[points[0][0], points[0][1]]];

  let anchorX = points[0][0];
  let anchorY = points[0][1];
  let segIdx = 0;
  let tAlongSeg = 0;
  let safety = 0;
  const maxIter = 50_000;

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

interface FittedCurve {
  A: number;
  alpha: number;
  fractalDimension: number;
  evaluate: (r: number) => number;
}

const FITTED_CURVE: FittedCurve = (() => {
  const logR: number[] = [];
  const logL: number[] = [];
  for (let r = 5; r <= 100; r++) {
    const walk = walkCoastline(COAST_POINTS, r);
    logR.push(Math.log(r));
    logL.push(Math.log(walk.measuredLength));
  }

  const n = logR.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
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

// ── Canvas constants ──────────────────────────────────────────────────────────

const CANVAS_H = 340;
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const WORLD_W = 600;
const WORLD_H = 200;

// ── Canvas component (interactive zoom/pan) ───────────────────────────────────
//
// Zoom: scroll wheel (centered on cursor), double-click, pinch gesture
// Pan:  click-drag, touch-drag
// The key educational value: when zoomed in, the user sees the fine coastline
// detail that the straight ruler segments cut across.  This is the visual
// proof of WHY smaller rulers measure longer.

function CoastlineCanvas({
  walkData,
  rulerSize,
  isFullscreen,
}: {
  walkData: PrecomputedWalk;
  rulerSize: number;
  isFullscreen: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // View state
  const [zoom, setZoom] = useState(1);
  const [cx, setCx] = useState(WORLD_W / 2);
  const [cy, setCy] = useState(WORLD_H / 2);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Interaction refs (avoid re-renders during drag)
  const dragRef = useRef({
    active: false,
    startMouseX: 0,
    startMouseY: 0,
    startCx: 0,
    startCy: 0,
  });
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setCx(WORLD_W / 2);
    setCy(WORLD_H / 2);
  }, []);

  // Clamp center so some coastline is always visible
  const clampCenter = useCallback(
    (x: number, y: number): [number, number] => {
      const margin = 100 / zoom;
      return [
        Math.max(-margin, Math.min(WORLD_W + margin, x)),
        Math.max(-margin, Math.min(WORLD_H + margin, y)),
      ];
    },
    [zoom]
  );

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.getBoundingClientRect().width || 600;
    const H = isFullscreen
      ? container.getBoundingClientRect().height || CANVAS_H
      : CANVAS_H;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Pixels per world unit
    const ppu = zoom * (W / WORLD_W);

    // World-to-canvas transform
    const w2cX = (wx: number) => (wx - cx) * ppu + W / 2;
    const w2cY = (wy: number) => (wy - cy) * ppu + H / 2;

    // Visible world bounds
    const vLeft = cx - W / 2 / ppu;
    const vRight = cx + W / 2 / ppu;

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);

    // ── Draw coastline (only visible segment) ─────────────────────────
    // Binary search for first visible point
    let lo = 0, hi = COAST_POINTS.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (COAST_POINTS[mid][0] < vLeft - 5) lo = mid + 1;
      else hi = mid;
    }
    const startIdx = Math.max(0, lo - 1);

    lo = 0;
    hi = COAST_POINTS.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (COAST_POINTS[mid][0] > vRight + 5) hi = mid - 1;
      else lo = mid;
    }
    const endIdx = Math.min(COAST_POINTS.length - 1, hi + 1);

    ctx.beginPath();
    ctx.moveTo(w2cX(COAST_POINTS[startIdx][0]), w2cY(COAST_POINTS[startIdx][1]));
    for (let i = startIdx + 1; i <= endIdx; i++) {
      ctx.lineTo(w2cX(COAST_POINTS[i][0]), w2cY(COAST_POINTS[i][1]));
    }
    ctx.strokeStyle = zoom > 3
      ? "rgba(148, 163, 184, 0.7)"  // fade coastline when zoomed so rulers pop
      : "rgb(148, 163, 184)";
    ctx.lineWidth = zoom > 4 ? 0.8 : 1.5;
    ctx.stroke();

    // ── Draw ruler segments ───────────────────────────────────────────
    const { endpoints } = walkData;
    const rulerLineW = Math.max(1.5, Math.min(3, 1.2 + zoom * 0.12));

    // Glow pass (subtle shadow underneath ruler lines for contrast)
    if (zoom > 2) {
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = rulerLineW + 4;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineCap = "round";
      for (let i = 0; i < endpoints.length - 1; i++) {
        const [x0] = endpoints[i];
        const [x1] = endpoints[i + 1];
        if (Math.max(x0, x1) < vLeft - 20 && Math.min(x0, x1) > vRight + 20)
          continue;
        ctx.beginPath();
        ctx.moveTo(w2cX(endpoints[i][0]), w2cY(endpoints[i][1]));
        ctx.lineTo(w2cX(endpoints[i + 1][0]), w2cY(endpoints[i + 1][1]));
        ctx.stroke();
      }
    }

    // Main ruler lines
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = rulerLineW;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineCap = "round";
    for (let i = 0; i < endpoints.length - 1; i++) {
      const [x0] = endpoints[i];
      const [x1] = endpoints[i + 1];
      if (Math.max(x0, x1) < vLeft - 20 && Math.min(x0, x1) > vRight + 20)
        continue;
      ctx.beginPath();
      ctx.moveTo(w2cX(endpoints[i][0]), w2cY(endpoints[i][1]));
      ctx.lineTo(w2cX(endpoints[i + 1][0]), w2cY(endpoints[i + 1][1]));
      ctx.stroke();
    }
    ctx.lineCap = "butt";

    // ── Draw endpoint dots ────────────────────────────────────────────
    ctx.globalAlpha = 1;
    const dotR = Math.min(6, Math.max(3, 2.5 + zoom * 0.2));
    for (const [ex, ey] of endpoints) {
      if (ex < vLeft - 10 || ex > vRight + 10) continue;
      const px = w2cX(ex);
      const py = w2cY(ey);
      if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue;

      // Glow ring when zoomed
      if (zoom > 2) {
        ctx.beginPath();
        ctx.arc(px, py, dotR + 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        ctx.fill();
      }

      // White border
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = zoom > 3 ? 1 : 0;
      if (zoom > 3) ctx.stroke();
    }

    // ── Scale bar (bottom-left) ───────────────────────────────────────
    // Shows what the current ruler size looks like at this zoom level
    const scaleBarWorldLen = rulerSize;
    const scaleBarCanvasPx = scaleBarWorldLen * ppu;
    const sbX = 16;
    const sbY = H - 22;

    if (scaleBarCanvasPx > 20 && scaleBarCanvasPx < W - 40) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D).roundRect(
        sbX - 6,
        sbY - 14,
        scaleBarCanvasPx + 12,
        22,
        4
      );
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sbX, sbY);
      ctx.lineTo(sbX + scaleBarCanvasPx, sbY);
      // End ticks
      ctx.moveTo(sbX, sbY - 4);
      ctx.lineTo(sbX, sbY + 4);
      ctx.moveTo(sbX + scaleBarCanvasPx, sbY - 4);
      ctx.lineTo(sbX + scaleBarCanvasPx, sbY + 4);
      ctx.stroke();

      ctx.font = "bold 10px Arial, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText(
        `${rulerSize}px ruler`,
        sbX + scaleBarCanvasPx / 2,
        sbY - 5
      );
      ctx.textAlign = "start";
    }

    // ── Zoom badge (top-right) ────────────────────────────────────────
    if (zoom > 1.05) {
      const badgeText = `${zoom.toFixed(1)}×`;
      ctx.font = "bold 13px Arial, sans-serif";
      const bw = ctx.measureText(badgeText).width + 16;
      const bx = W - bw - 12;
      const by = 10;

      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D).roundRect(bx, by, bw, 26, 5);
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.fillText(badgeText, bx + 8, by + 18);
    }

    // ── Minimap (bottom-right, only when zoomed) ──────────────────────
    if (zoom > 1.3) {
      const mmW = 120;
      const mmH = 40;
      const mmX = W - mmW - 12;
      const mmY = H - mmH - 12;

      // Background
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D).roundRect(mmX - 1, mmY - 1, mmW + 2, mmH + 2, 4);
      ctx.fill();

      // Simplified coastline (every ~200th point)
      const step = Math.max(1, Math.floor(COAST_POINTS.length / 150));
      ctx.beginPath();
      for (let i = 0; i < COAST_POINTS.length; i += step) {
        const px = mmX + (COAST_POINTS[i][0] / WORLD_W) * mmW;
        const py = mmY + (COAST_POINTS[i][1] / WORLD_H) * mmH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Viewport rectangle
      const vpL = mmX + (vLeft / WORLD_W) * mmW;
      const vpT = mmY + ((cy - H / 2 / ppu) / WORLD_H) * mmH;
      const vpW = (W / ppu / WORLD_W) * mmW;
      const vpH = (H / ppu / WORLD_H) * mmH;

      ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        Math.max(mmX, vpL),
        Math.max(mmY, vpT),
        Math.min(vpW, mmW),
        Math.min(vpH, mmH)
      );
    }

    // ── Hint text (center, only before first interaction) ─────────────
    if (!hasInteracted && zoom <= 1.05) {
      ctx.font = "12px Arial, sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.textAlign = "center";
      ctx.fillText("Scroll to zoom · Drag to pan", W / 2, H - 12);
      ctx.textAlign = "start";
    }
  }, [zoom, cx, cy, walkData, rulerSize, hasInteracted, isFullscreen]);

  // ── Render on state change + resize ─────────────────────────────────────

  useEffect(() => {
    draw();
    const obs = new ResizeObserver(() => draw());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  // ── Wheel zoom (centered on cursor) ─────────────────────────────────────

  const viewRef = useRef({ zoom: 1, cx: WORLD_W / 2, cy: WORLD_H / 2 });
  viewRef.current = { zoom, cx, cy };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      setHasInteracted(true);

      const rect = canvas!.getBoundingClientRect();
      const W = rect.width;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const v = viewRef.current;
      const ppu = v.zoom * (W / WORLD_W);
      const worldX = v.cx + (mouseX - W / 2) / ppu;
      const worldY = v.cy + (mouseY - rect.height / 2) / ppu;

      const factor = e.deltaY > 0 ? 0.92 : 1.09;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom * factor));
      const newPpu = newZoom * (W / WORLD_W);

      const ncx = worldX - (mouseX - W / 2) / newPpu;
      const ncy = worldY - (mouseY - rect.height / 2) / newPpu;

      const margin = 100 / newZoom;
      setZoom(newZoom);
      setCx(Math.max(-margin, Math.min(WORLD_W + margin, ncx)));
      setCy(Math.max(-margin, Math.min(WORLD_H + margin, ncy)));
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mouse drag ──────────────────────────────────────────────────────────

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragRef.current = {
        active: true,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startCx: cx,
        startCy: cy,
      };
    },
    [cx, cy]
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current.active) return;
      setHasInteracted(true);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.getBoundingClientRect().width;
      const ppu = viewRef.current.zoom * (W / WORLD_W);

      const dx = e.clientX - dragRef.current.startMouseX;
      const dy = e.clientY - dragRef.current.startMouseY;

      const ncx = dragRef.current.startCx - dx / ppu;
      const ncy = dragRef.current.startCy - dy / ppu;

      const margin = 100 / viewRef.current.zoom;
      setCx(Math.max(-margin, Math.min(WORLD_W + margin, ncx)));
      setCy(Math.max(-margin, Math.min(WORLD_H + margin, ncy)));
    }

    function onMouseUp() {
      dragRef.current.active = false;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Double-click zoom ───────────────────────────────────────────────────

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      setHasInteracted(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const ppu = zoom * (W / WORLD_W);
      const worldX = cx + (mouseX - W / 2) / ppu;
      const worldY = cy + (mouseY - rect.height / 2) / ppu;

      const newZoom = e.shiftKey
        ? Math.max(MIN_ZOOM, zoom / 2)
        : Math.min(MAX_ZOOM, zoom * 2);
      const newPpu = newZoom * (W / WORLD_W);

      const ncx = worldX - (mouseX - W / 2) / newPpu;
      const ncy = worldY - (mouseY - rect.height / 2) / newPpu;

      const margin = 100 / newZoom;
      setZoom(newZoom);
      setCx(Math.max(-margin, Math.min(WORLD_W + margin, ncx)));
      setCy(Math.max(-margin, Math.min(WORLD_H + margin, ncy)));
    },
    [zoom, cx, cy]
  );

  // ── Touch support (pinch zoom + drag pan) ───────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function getTouchDist(e: TouchEvent) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchRef.current = {
          active: true,
          startDist: getTouchDist(e),
          startZoom: viewRef.current.zoom,
        };
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        dragRef.current = {
          active: true,
          startMouseX: t.clientX,
          startMouseY: t.clientY,
          startCx: viewRef.current.cx,
          startCy: viewRef.current.cy,
        };
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (pinchRef.current.active && e.touches.length === 2) {
        e.preventDefault();
        setHasInteracted(true);
        const dist = getTouchDist(e);
        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, pinchRef.current.startZoom * (dist / pinchRef.current.startDist))
        );
        setZoom(newZoom);
      } else if (dragRef.current.active && e.touches.length === 1) {
        e.preventDefault();
        setHasInteracted(true);
        const t = e.touches[0];
        const W = canvas!.getBoundingClientRect().width;
        const ppu = viewRef.current.zoom * (W / WORLD_W);

        const dx = t.clientX - dragRef.current.startMouseX;
        const dy = t.clientY - dragRef.current.startMouseY;

        const ncx = dragRef.current.startCx - dx / ppu;
        const ncy = dragRef.current.startCy - dy / ppu;

        const margin = 100 / viewRef.current.zoom;
        setCx(Math.max(-margin, Math.min(WORLD_W + margin, ncx)));
        setCy(Math.max(-margin, Math.min(WORLD_H + margin, ncy)));
      }
    }

    function onTouchEnd() {
      pinchRef.current.active = false;
      dragRef.current.active = false;
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cursor style ────────────────────────────────────────────────────────

  const cursorStyle = dragRef.current.active ? "grabbing" : "grab";

  return (
    <div className="relative" style={isFullscreen ? { flex: 1, display: "flex", flexDirection: "column" } : undefined}>
      <div ref={containerRef} className="w-full" style={isFullscreen ? { flex: 1 } : undefined}>
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg select-none"
          style={{
            height: isFullscreen ? "100%" : CANVAS_H,
            cursor: cursorStyle,
            border:
              zoom > 1.05
                ? "1px solid rgba(56, 189, 248, 0.25)"
                : "1px solid transparent",
          }}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
        />
      </div>

      {/* Reset button (visible when zoomed) */}
      {zoom > 1.05 && (
        <button
          onClick={resetView}
          className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold
                     bg-slate-900/80 text-sky-400 border border-sky-500/30
                     rounded-md hover:bg-slate-800/90 hover:border-sky-400/50
                     transition-colors backdrop-blur-sm"
        >
          Reset View
        </button>
      )}
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
    const H = 340;
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
          .ticks(8)
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
    const H = 340;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const demoSectionRef = useRef<HTMLDivElement>(null);

  const currentWalk = useMemo(() => {
    return WALK_BY_RULER.get(rulerSize) ?? ALL_WALKS[0];
  }, [rulerSize]);

  const chartData: ChartPoint[] = useMemo(() => {
    return ALL_WALKS.map((w) => ({
      rulerSize: w.rulerSize,
      measuredLength: w.measuredLength,
    }));
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!demoSectionRef.current) return;
    if (!document.fullscreenElement) {
      demoSectionRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
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
          <div
            ref={demoSectionRef}
            className={`border rounded-2xl p-6 md:p-8 ${
              isFullscreen
                ? "bg-gray-950 border-gray-700 flex flex-col"
                : "bg-gray-900/60 border-gray-800"
            }`}
            style={isFullscreen ? { height: "100vh" } : undefined}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-sky-400 to-blue-500 shrink-0" />
                Interactive Ruler Demo
              </h2>
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="p-2 rounded-lg border border-gray-700 hover:border-sky-500/50
                           hover:bg-sky-500/10 text-gray-400 hover:text-sky-400
                           transition-all duration-200"
              >
                {isFullscreen ? (
                  /* Minimize icon (compress) */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                ) : (
                  /* Maximize icon (expand) */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                )}
              </button>
            </div>

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
            <CoastlineCanvas walkData={currentWalk} rulerSize={rulerSize} isFullscreen={isFullscreen} />

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
