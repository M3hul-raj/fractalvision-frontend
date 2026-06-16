/**
 * generateComparisonReport — client-side comparison PDF using jsPDF.
 * 2-page A4: side-by-side slot metrics with binary images, comparison
 * summary, D-value bars, conclusion (page 1), dual log-log chart +
 * sensitivity analysis (page 2).
 *
 * Does NOT import any Zustand store — all data arrives via parameters.
 */

import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/analysis";

// ── Types ────────────────────────────────────────────────────────────────────

interface SlotData {
  result: AnalysisResult;
  binaryImageUrl: string | null;
  analysisMode: string;
  thresholdMethod: string;
}

// ── Private helpers (mirrors generateReport.ts style) ────────────────────────

function fitImage(
  imgW: number,
  imgH: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  const ratio = Math.min(maxW / imgW, maxH / imgH);
  return { w: imgW * ratio, h: imgH * ratio };
}

function getImageSize(
  dataUrl: string
): Promise<{ w: number; h: number }> {
  return new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = dataUrl;
  });
}

async function drawSlotImage(
  doc: jsPDF,
  dataUrl: string | null,
  x: number,
  y: number,
  maxW: number,
  maxH: number
): Promise<void> {
  const fallback = (): void => {
    doc.setFillColor(226, 232, 240);
    doc.rect(x, y, maxW, maxH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Image unavailable", x + maxW / 2, y + maxH / 2, {
      align: "center",
    });
  };

  if (!dataUrl || dataUrl.trim() === "") {
    fallback();
    return;
  }

  try {
    const { w: nw, h: nh } = await getImageSize(dataUrl);
    const { w, h } = fitImage(nw, nh, maxW, maxH);
    doc.addImage(
      dataUrl,
      "PNG",
      x + (maxW - w) / 2,
      y + (maxH - h) / 2,
      w,
      h
    );
  } catch {
    fallback();
  }
}

type RGB = [number, number, number];

function drawCard(
  doc: jsPDF,
  y: number,
  h: number,
  padding = 15
): void {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(padding, y, 210 - padding * 2, h, 3, 3, "FD");
}

function drawSectionHeading(
  doc: jsPDF,
  label: string,
  x: number,
  y: number
): void {
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(x, y - 4.5, 1.8, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(label, x + 4, y);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 282, 195, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("FractalVision Lab", 105, 288, { align: "center" });
  doc.text(`Page ${pageNum} of ${totalPages}`, 195, 288, { align: "right" });
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 15, 288);
}

/** Serialize a live D3 SVG to a high-DPI PNG data URL via XMLSerializer. */
function captureSvgAsPng(svgElement: SVGSVGElement): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const rect   = svgElement.getBoundingClientRect();
      const width  = svgElement.clientWidth  || rect.width  || 800;
      const height = svgElement.clientHeight || rect.height || 400;

      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width",  String(width));
      clone.setAttribute("height", String(height));
      clone.setAttribute("xmlns",  "http://www.w3.org/2000/svg");

      // Inject font style for reliable canvas rasterization
      const fontStyle = document.createElementNS("http://www.w3.org/2000/svg", "style");
      fontStyle.textContent = `text, tspan { font-family: Arial, sans-serif !important; }`;
      clone.insertBefore(fontStyle, clone.firstChild);

      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("width",  String(width));
      bg.setAttribute("height", String(height));
      bg.setAttribute("fill",   "#111827");
      clone.insertBefore(bg, clone.firstChild);

      const blob      = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);

      const canvas = document.createElement("canvas");
      canvas.width  = width  * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.onload = () => {
        if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error("Canvas 2D unavailable")); return; }
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("SVG image load failed")); };
      img.src = objectUrl;
    } catch (e) {
      reject(e instanceof Error ? e : new Error("captureSvgAsPng failed"));
    }
  });
}

function qualityColor(score: number | undefined): RGB {
  if (score == null) return [71, 85, 105];
  if (score >= 85) return [21, 128, 61];
  if (score >= 70) return [217, 119, 6];
  return [220, 38, 38];
}

function reliabilityColor(rel: string | undefined): RGB {
  if (rel === "High") return [21, 128, 61];
  if (rel === "Medium") return [217, 119, 6];
  if (rel === "Low") return [220, 38, 38];
  return [71, 85, 105];
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateComparisonReport(
  slotA: SlotData,
  slotB: SlotData
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Computed values ────────────────────────────────────────────────────────
  const dA = slotA.result.fractal_dimension;
  const dB = slotB.result.fractal_dimension;
  const deltaD = dB - dA;
  const absDeltaD = Math.abs(deltaD);
  const deltaR2 = Math.abs(slotA.result.r_squared - slotB.result.r_squared);
  const maxD = Math.max(dA, dB);
  const minD = Math.min(dA, dB);
  const relDelta = minD > 0 ? ((maxD - minD) / minD) * 100 : 0;
  const winner: "A" | "B" | "equal" =
    absDeltaD < 0.005 ? "equal" : dA > dB ? "A" : "B";
  const conclusionText =
    winner === "equal"
      ? `Image A and Image B have essentially identical fractal complexity (delta D = ${absDeltaD.toFixed(4)}). Both patterns exhibit similar structural irregularity across scales.`
      : `Image ${winner} is ${relDelta.toFixed(2)}% more complex than Image ${winner === "A" ? "B" : "A"} (D = ${maxD.toFixed(4)} vs D = ${minD.toFixed(4)}). Image ${winner} exhibits greater space-filling behaviour and structural irregularity across scales.`;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ═══════════════════════════════════════════════════════════════════ PAGE 1

  // ── Banner (h=32) ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("FractalVision Lab", 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Comparison Report", 195, 12, { align: "right" });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Image A: D = ${dA.toFixed(4)}   /   Image B: D = ${dB.toFixed(4)}   /   ${dateStr}`,
    105,
    22,
    { align: "center" }
  );

  // Sky accent stripe
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 32, 210, 0.7, "F");

  // ── SECTION A — Two-column card (y=36, h=140) ─────────────────────────────
  const CARD_Y = 36;
  const CARD_H = 140;
  drawCard(doc, CARD_Y, CARD_H);

  const COL_A_X = 21;
  const COL_B_X = 111;
  const IMG_MAX_W = 72;
  const IMG_MAX_H = 55;

  // Column labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("IMAGE A", COL_A_X + IMG_MAX_W / 2, CARD_Y + 8, { align: "center" });
  doc.text("IMAGE B", COL_B_X + IMG_MAX_W / 2, CARD_Y + 8, { align: "center" });

  // Vertical divider
  doc.setDrawColor(226, 232, 240);
  doc.line(105, CARD_Y + 4, 105, CARD_Y + CARD_H - 4);

  // Draw binary images
  const imgY = CARD_Y + 12;
  await drawSlotImage(doc, slotA.binaryImageUrl, COL_A_X, imgY, IMG_MAX_W, IMG_MAX_H);
  await drawSlotImage(doc, slotB.binaryImageUrl, COL_B_X, imgY, IMG_MAX_W, IMG_MAX_H);

  // Metrics for each slot
  const metricsY = imgY + IMG_MAX_H + 7; // 48 + 55 + 7 = 110

  const drawSlotMetrics = (
    result: AnalysisResult,
    mode: string,
    threshold: string,
    x: number
  ): void => {
    // Row 1 — Fractal dimension
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("FRACTAL DIMENSION", x, metricsY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(2, 132, 199);
    doc.text(result.fractal_dimension.toFixed(4), x, metricsY + 7);

    // Row 2 — R2
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("R2 SCORE", x, metricsY + 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text(result.r_squared.toFixed(4), x, metricsY + 21);

    // Row 3 — Quality + Reliability
    const qY = metricsY + 29;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("QUALITY", x, qY);
    const qColor = qualityColor(result.quality_score);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(qColor[0], qColor[1], qColor[2]);
    doc.text(
      result.quality_score != null
        ? `${Math.round(result.quality_score)}/100`
        : "N/A",
      x,
      qY + 5
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("RELIABILITY", x + 32, qY);
    const rColor = reliabilityColor(result.reliability);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(rColor[0], rColor[1], rColor[2]);
    doc.text(result.reliability ?? "N/A", x + 32, qY + 5);

    // Row 4 — Complexity class
    const cY = metricsY + 42;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("COMPLEXITY", x, cY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(result.complexity_class, x, cY + 5);

    // Row 5 — Coverage
    const cvY = metricsY + 52;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("COVERAGE", x, cvY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      result.foreground_ratio != null
        ? `${(result.foreground_ratio * 100).toFixed(1)}%`
        : "N/A",
      x,
      cvY + 5
    );

    // Row 6 — Mode / Threshold
    const pY = metricsY + 62;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Mode: ${mode.replace(/_/g, " ")} / Threshold: ${threshold}`,
      x,
      pY
    );
  };

  drawSlotMetrics(slotA.result, slotA.analysisMode, slotA.thresholdMethod, COL_A_X);
  drawSlotMetrics(slotB.result, slotB.analysisMode, slotB.thresholdMethod, COL_B_X);

  // ── SECTION B — Comparison metrics card (y=178, h=28) ─────────────────────
  const COMP_Y = 178;
  const COMP_H = 28;
  drawCard(doc, COMP_Y, COMP_H);

  const blockPositions = [21, 65, 110, 154];

  type MetricBlock = {
    label: string;
    value: string;
    color: RGB;
    sub: string;
  };

  const deltaDColor: RGB =
    absDeltaD < 0.02
      ? [21, 128, 61]
      : absDeltaD < 0.1
        ? [217, 119, 6]
        : [220, 38, 38];

  const winnerColor: RGB =
    winner === "A"
      ? [2, 132, 199]
      : winner === "B"
        ? [251, 146, 60]
        : [100, 116, 139];

  const blocks: MetricBlock[] = [
    {
      label: "DIMENSION GAP",
      value: `delta D = ${absDeltaD.toFixed(4)}`,
      color: deltaDColor,
      sub:
        absDeltaD < 0.02
          ? "nearly identical"
          : absDeltaD < 0.1
            ? "moderate"
            : "large difference",
    },
    {
      label: "MORE COMPLEX",
      value: winner === "equal" ? "Equal" : `Image ${winner}`,
      color: winnerColor,
      sub:
        winner === "equal"
          ? "delta D < 0.005"
          : `by ${relDelta.toFixed(2)}%`,
    },
    {
      label: "FIT QUALITY GAP",
      value: `delta R2 = ${deltaR2.toFixed(4)}`,
      color: [71, 85, 105],
      sub: "lower is better",
    },
    {
      label: "RELATIVE DELTA",
      value: `${relDelta.toFixed(2)}%`,
      color: [71, 85, 105],
      sub: "% complexity diff",
    },
  ];

  blocks.forEach((block, i) => {
    const bx = blockPositions[i];
    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(block.label, bx, COMP_Y + 7);
    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(block.color[0], block.color[1], block.color[2]);
    doc.text(block.value, bx, COMP_Y + 15);
    // Sub
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(block.sub, bx, COMP_Y + 21);
  });

  // ── SECTION C — D-value bars card (y=208, h=44) ───────────────────────────
  const BARS_Y = 208;
  const BARS_H = 44;
  drawCard(doc, BARS_Y, BARS_H);
  drawSectionHeading(doc, "Complexity Range", 21, BARS_Y + 9);

  doc.setDrawColor(226, 232, 240);
  doc.line(21, BARS_Y + 12, 189, BARS_Y + 12);

  const dToBar = (d: number): number =>
    Math.min(1, Math.max(0, (d - 1.0) / 1.0));

  const barSeries: Array<{
    label: string;
    d: number;
    color: RGB;
  }> = [
    { label: "Image A", d: dA, color: [2, 132, 199] },
    { label: "Image B", d: dB, color: [251, 146, 60] },
  ];

  barSeries.forEach(({ label, d, color }, i) => {
    const rowY = BARS_Y + 17 + i * 11;
    // Label left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(label, 24, rowY);
    // D value right
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`D = ${d.toFixed(4)}`, 189, rowY, { align: "right" });
    // Background bar
    const barY = rowY + 2;
    doc.setFillColor(226, 232, 240);
    doc.rect(24, barY, 162, 3, "F");
    // Filled bar
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(24, barY, 162 * dToBar(d), 3, "F");
  });

  // Scale labels (8mm below Image B bar for clear separation)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("D = 1.0 (line)", 24, BARS_Y + 41);
  doc.text("D = 2.0 (plane)", 186, BARS_Y + 41, { align: "right" });

  // ── SECTION D — Conclusion card (dynamic height) ──────────────────────────
  const CONCL_Y = 254;
  // Pre-wrap at 8pt to measure lines before drawing the card
  doc.setFontSize(8);
  const wrappedConclusion = doc.splitTextToSize(conclusionText, 162) as string[];
  const CONCL_H = Math.min(26, Math.max(20, 12 + wrappedConclusion.length * 4 + 6));
  drawCard(doc, CONCL_Y, CONCL_H);
  drawSectionHeading(doc, "Conclusion", 21, CONCL_Y + 8);

  // Sky accent bar for conclusion text (matching analyzer style)
  doc.setFillColor(14, 165, 233);
  doc.rect(21, CONCL_Y + 11, 1.5, wrappedConclusion.length * 4, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(wrappedConclusion, 25, CONCL_Y + 14);

  // ═══════════════════════════════════════════════════════════════════ PAGE 2
  doc.addPage();

  // ── Banner (h=32) ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("FractalVision Lab", 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Log-Log Regression Chart", 195, 12, { align: "right" });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Box-counting method - slope A = D = ${dA.toFixed(4)}  /  slope B = D = ${dB.toFixed(4)}`,
    105,
    22,
    { align: "center" }
  );

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 32, 210, 0.7, "F");

  // ── Dual log-log chart (SVG serialization) ────────────────────────────────
  let chartH = 0;
  const chartContainer = document.getElementById("report-comparison-chart");
  const svgEl = chartContainer?.querySelector("svg") as SVGSVGElement | null;

  if (svgEl === null) {
    drawCard(doc, 36, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Chart not available - open Compare Mode to view.",
      105,
      59,
      { align: "center" }
    );
  } else {
    try {
      const chartDataUrl = await captureSvgAsPng(svgEl);
      const { w: svgNW, h: svgNH } = await new Promise<{ w: number; h: number }>((res) => {
        const tmp = new Image();
        tmp.onload = () => res({ w: tmp.naturalWidth, h: tmp.naturalHeight });
        tmp.src = chartDataUrl;
      });

      const cardPad = 7;
      const chartW = 180 - cardPad * 2;
      chartH = Math.max((svgNH / svgNW) * chartW, 90);

      // Dark card background for chart
      doc.setFillColor(17, 24, 39);
      doc.roundedRect(15, 36, 180, chartH + cardPad * 2, 3, 3, "F");
      doc.addImage(chartDataUrl, "PNG", 15 + cardPad, 36 + cardPad, chartW, chartH);

      // D annotations inside dark card (top-right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `A: D = ${dA.toFixed(4)}   B: D = ${dB.toFixed(4)}`,
        189 - cardPad, 36 + cardPad + 5.5, { align: "right" }
      );

      // Color legend inside dark card (bottom-left)
      const legendY = 36 + cardPad + chartH - 5;
      // Image A swatch (sky)
      doc.setFillColor(56, 189, 248);
      doc.rect(15 + cardPad, legendY, 8, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Image A", 15 + cardPad + 10, legendY + 1.8);
      // Image B swatch (orange)
      doc.setFillColor(251, 146, 60);
      doc.rect(15 + cardPad + 38, legendY, 8, 2, "F");
      doc.text("Image B", 15 + cardPad + 48, legendY + 1.8);
    } catch {
      drawCard(doc, 36, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Chart capture failed.", 105, 54, { align: "center" });
    }
  }

  // ── Statistical Comparison card ────────────────────────────────────────────
  const chartCardBottom = chartH > 0 ? 36 + chartH + 7 * 2 : 84;
  const STATS_Y = chartCardBottom + 8;
  const STATS_H = 60;
  drawCard(doc, STATS_Y, STATS_H);
  drawSectionHeading(doc, "Statistical Comparison", 21, STATS_Y + 9);

  doc.setDrawColor(226, 232, 240);
  doc.line(21, STATS_Y + 12, 189, STATS_Y + 12);

  // Column headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("METRIC", 24, STATS_Y + 18);
  doc.text("IMAGE A", 100, STATS_Y + 18);
  doc.text("IMAGE B", 156, STATS_Y + 18);

  // Header divider
  doc.setDrawColor(226, 232, 240);
  doc.line(21, STATS_Y + 20, 189, STATS_Y + 20);

  const ciA = slotA.result.confidence_interval != null
    ? `[${slotA.result.confidence_interval[0].toFixed(4)}, ${slotA.result.confidence_interval[1].toFixed(4)}]`
    : "N/A";
  const ciB = slotB.result.confidence_interval != null
    ? `[${slotB.result.confidence_interval[0].toFixed(4)}, ${slotB.result.confidence_interval[1].toFixed(4)}]`
    : "N/A";

  const statsTableRows: [string, string, string][] = [
    ["Fractal Dimension", dA.toFixed(4), dB.toFixed(4)],
    ["R2 Score", slotA.result.r_squared.toFixed(4), slotB.result.r_squared.toFixed(4)],
    ["Standard Error", slotA.result.standard_error?.toFixed(4) ?? "N/A", slotB.result.standard_error?.toFixed(4) ?? "N/A"],
    ["95% Confidence Interval", ciA, ciB],
    [
      "Foreground Coverage",
      slotA.result.foreground_ratio != null ? `${(slotA.result.foreground_ratio * 100).toFixed(1)}%` : "N/A",
      slotB.result.foreground_ratio != null ? `${(slotB.result.foreground_ratio * 100).toFixed(1)}%` : "N/A",
    ],
    ["Complexity Class", slotA.result.complexity_class, slotB.result.complexity_class],
  ];

  statsTableRows.forEach(([metric, valA, valB], i) => {
    const ry = STATS_Y + 26 + i * 6;
    if (i % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(21, ry - 3.5, 168, 6, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(metric, 24, ry);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(valA, 100, ry);
    doc.text(valB, 156, ry);
  });
  // ── Interpretation card (page 2, below stats table) ────────────────────────
  const interpCardY = STATS_Y + STATS_H + 8;
  const wrappedInterp2 = doc.splitTextToSize(conclusionText, 162) as string[];
  // heading(9) + divider(12) + text gap(7) + text(lines*5) + badge gap(4) + badge(9) + bottom(8)
  const hasBadge = winner !== "equal";
  const interpCardH = Math.max(32, 14 + wrappedInterp2.length * 5 + (hasBadge ? 4 + 9 : 0) + 8);

  drawCard(doc, interpCardY, interpCardH);
  drawSectionHeading(doc, "Interpretation", 21, interpCardY + 9);

  doc.setDrawColor(226, 232, 240);
  doc.line(21, interpCardY + 12, 189, interpCardY + 12);

  // Sky accent bar
  doc.setFillColor(14, 165, 233);
  doc.rect(21, interpCardY + 16, 1.5, wrappedInterp2.length * 4.5, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(wrappedInterp2, 25, interpCardY + 19);

  // Winner highlight badge
  if (winner !== "equal") {
    const badgeTxt = winner === "B"
      ? `Image B is more complex: D = ${dB.toFixed(4)}`
      : `Image A is more complex: D = ${dA.toFixed(4)}`;
    const badgeColor: RGB = winner === "B" ? [251, 146, 60] : [2, 132, 199];
    const badgeFill: RGB = winner === "B" ? [255, 237, 213] : [224, 242, 254];
    const badgeY = interpCardY + 19 + wrappedInterp2.length * 4.5 + 4;
    doc.setFillColor(badgeFill[0], badgeFill[1], badgeFill[2]);
    doc.roundedRect(25, badgeY - 3.5, 100, 6.5, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.text(badgeTxt, 75, badgeY + 0.5, { align: "center" });
  }

  const sensA = slotA.result.sensitivity ?? null;
  const sensB = slotB.result.sensitivity ?? null;
  const statsCardBottom = STATS_Y + STATS_H;

  if (sensA != null || sensB != null) {
    const sensY = interpCardY + interpCardH + 8;
    const hasBoth = sensA != null && sensB != null;
    const sensCardH = hasBoth ? 50 : 40;

    drawCard(doc, sensY, sensCardH);
    drawSectionHeading(doc, "Sensitivity Analysis", 21, sensY + 9);

    doc.setDrawColor(226, 232, 240);
    doc.line(21, sensY + 12, 189, sensY + 12);

    const drawSensColumn = (
      sens: NonNullable<AnalysisResult["sensitivity"]>,
      label: string,
      x: number,
      baseY: number
    ): void => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(label, x, baseY);

      const rows: [string, string][] = [
        ["Std Deviation", sens.std_deviation?.toFixed(4) ?? "N/A"],
        ["Stable", sens.is_stable ? "Yes" : "No"],
        ["Thresholds tested", sens.thresholds_tested.join(", ")],
      ];

      rows.forEach(([key, val], i) => {
        const ry = baseY + 7 + i * 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${key}:`, x, ry);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(val, x + 40, ry);
      });
    };

    if (hasBoth) {
      drawSensColumn(sensA!, "Image A", 24, sensY + 18);
      drawSensColumn(sensB!, "Image B", 114, sensY + 18);
    } else if (sensA != null) {
      drawSensColumn(sensA, "Image A", 24, sensY + 18);
    } else if (sensB != null) {
      drawSensColumn(sensB, "Image B", 24, sensY + 18);
    }
  }

  // ── Footers ────────────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(`FractalVision_Comparison_${Date.now()}.pdf`);
}
