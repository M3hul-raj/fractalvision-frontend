/**
 * generateReport — client-side PDF export using jsPDF.
 * Page 1: Analysis data with card layout.
 * Page 2: D3 log-log chart (SVG serializer) + sensitivity analysis.
 */

import jsPDF from "jspdf";
import type { AnalyzeApiResponse } from "@/types/api";

// ── Private helpers ──────────────────────────────────────────────────────────

async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

function fitImage(imgW: number, imgH: number, maxW: number, maxH: number): { w: number; h: number } {
  const ratio = Math.min(maxW / imgW, maxH / imgH);
  return { w: imgW * ratio, h: imgH * ratio };
}

function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = dataUrl;
  });
}

async function drawImageCell(
  doc: jsPDF,
  urlOrDataUrl: string | null,
  isAlreadyDataUrl: boolean,
  x: number, y: number, maxW: number, maxH: number
): Promise<void> {
  const fallback = (): void => {
    doc.setFillColor(226, 232, 240);
    doc.rect(x, y, maxW, maxH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Not available", x + maxW / 2, y + maxH / 2, { align: "center" });
  };
  if (!urlOrDataUrl) { fallback(); return; }
  try {
    const dataUrl = isAlreadyDataUrl ? urlOrDataUrl : await urlToDataUrl(urlOrDataUrl);
    const { w: nw, h: nh } = await getImageSize(dataUrl);
    const { w, h } = fitImage(nw, nh, maxW, maxH);
    doc.addImage(dataUrl, "PNG", x + (maxW - w) / 2, y + (maxH - h) / 2, w, h);
  } catch { fallback(); }
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

// ── Design helpers ───────────────────────────────────────────────────────────

type RGB = [number, number, number];

/** Returns semantically coloured badge fill + text based on complexity class. */
function badgeColors(cls: string): { fill: RGB; text: RGB } {
  if (cls.includes("Very High")) return { fill: [254, 226, 226], text: [185, 28,  28]  }; // rose
  if (cls.includes("High"))      return { fill: [255, 237, 213], text: [194, 65,  12]  }; // orange
  if (cls.includes("Moderate"))  return { fill: [254, 249, 195], text: [161, 98,   7]  }; // amber
  if (cls.includes("Low"))       return { fill: [219, 234, 254], text: [29,  78, 216]  }; // blue
  return                                { fill: [241, 245, 249], text: [71,  85, 105]  }; // slate
}

/**
 * Draw a section heading with a 2 mm sky-blue left accent bar.
 * Breaks the "wall of helvetica" — single most impactful visual change.
 */
function drawSectionHeading(doc: jsPDF, label: string, x: number, y: number): void {
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(x, y - 4.5, 1.8, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(label, x + 4, y);
}

/** Light rounded card — slate-50 fill, slate-200 border. */
function drawCard(doc: jsPDF, y: number, h: number, padding = 15): void {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(padding, y, 210 - padding * 2, h, 3, 3, "FD");
}

/** Dark rounded card for charts — fill-only, no stroke to avoid edge artifact. */
function drawDarkCard(doc: jsPDF, y: number, h: number, padding = 15): void {
  doc.setFillColor(17, 24, 39);
  doc.roundedRect(padding, y, 210 - padding * 2, h, 3, 3, "F");
}

/** Draw footer divider + branding. */
function drawFooter(doc: jsPDF, pageNum: number, total: number): void {
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 282, 195, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("FractalVision Lab",                           105, 288, { align: "center" });
  doc.text(`Page ${pageNum} of ${total}`,                 195, 288, { align: "right"  });
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 15, 288);
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateReport(params: {
  result: AnalyzeApiResponse["result"];
  lastResponse: AnalyzeApiResponse;
  originalImageUrl: string | null;
  binaryImageUrl:   string | null;
}): Promise<void> {
  const { result, lastResponse, originalImageUrl, binaryImageUrl } = params;

  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ═══════════════════════════════════════════════════════════════════ PAGE 1

    // ── Banner (h=32) ────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("FractalVision Lab", 15, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Analysis Report", 195, 12, { align: "right" });

    // Key stats line (centred under title)
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `D = ${result.fractal_dimension.toFixed(4)}   \u00b7   R\u00b2 = ${result.r_squared.toFixed(4)}   \u00b7   ${result.complexity_class}   \u00b7   ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
      105, 22, { align: "center" }
    );

    // Sky accent stripe
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 32, 210, 0.7, "F");

    // ── Images card (y=36, h=76) ─────────────────────────────────────────────
    drawCard(doc, 36, 76);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ORIGINAL IMAGE", 57,  44, { align: "center" });
    doc.text("BINARY IMAGE",   153, 44, { align: "center" });

    await drawImageCell(doc, originalImageUrl, false, 21,  47, 72, 60);
    await drawImageCell(doc, binaryImageUrl,   true,  117, 47, 72, 60);

    // ── Metrics card (y=116, h=48) ───────────────────────────────────────────
    drawCard(doc, 116, 48);
    drawSectionHeading(doc, "Analysis Results", 21, 126);

    doc.setDrawColor(226, 232, 240);
    doc.line(21, 129, 189, 129);

    type MB = { label: string; value: string; color: RGB };
    const metrics: MB[] = [
      { label: "FRACTAL DIMENSION", value: result.fractal_dimension.toFixed(4), color: [2, 132, 199]  },
      { label: "R\u00b2 SCORE",         value: result.r_squared.toFixed(4),        color: [21, 128, 61]  },
      {
        label: "QUALITY SCORE",
        value: result.quality_score != null ? result.quality_score.toFixed(1) : "N/A",
        color: result.quality_score == null ? [71, 85, 105]
             : result.quality_score >= 85 ? [21, 128, 61]  // Green (matches Reliability High)
             : result.quality_score >= 70 ? [217, 119, 6]  // Amber (matches Reliability Medium)
             :                              [220, 38, 38]  // Red (matches Reliability Low)
      },
      {
        label: "RELIABILITY",
        value: result.reliability ?? "N/A",
        color: result.reliability === "High"   ? [21, 128, 61]
             : result.reliability === "Medium" ? [217, 119, 6]
             : result.reliability === "Low"    ? [220, 38, 38]
             :                                   [71, 85, 105],
      },
    ];

    metrics.forEach(({ label, value, color }, i) => {
      const bx = 21 + i * 43;
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(100, 116, 139);
      doc.text(label, bx, 135);
      doc.setFont("helvetica", "bold");  doc.setFontSize(15);  doc.setTextColor(color[0], color[1], color[2]);
      doc.text(value, bx, 147);
    });

    // ── Parameters card (y=168, h=32) ────────────────────────────────────────
    drawCard(doc, 168, 32);
    drawSectionHeading(doc, "Parameters", 21, 178);

    const p = lastResponse.parameters;
    const thresholdLabel =
      p.threshold_method +
      (p.threshold_method === "manual" && p.computed_threshold != null
        ? ` (${p.computed_threshold})` : "");

    const paramRows: [string, string][] = [
      ["Mode",      p.analysis_mode.replace(/_/g, " ")],
      ["Threshold", thresholdLabel],
      ["Scales",    result.box_sizes.join("  \u00b7  ")],  // e.g. "8 · 16 · 32 · 64 · 128 · 256"
    ];

    paramRows.forEach(([key, val], i) => {
      const ry = 185 + i * 7;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
      doc.text(`${key}:`, 21, ry);
      doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
      doc.text(val, 58, ry);
    });

    // ── Interpretation + Statistical Summary card (y=204, fills to y=278) ────
    // Layout (all Y positions absolute):
    //   204  card top
    //   211  "Interpretation" heading
    //   215  badge pill top  → bottom 221
    //   225.5 first line of interp text  (badge bottom 221 + gap 0 + LINE_H 4.5)
    //   234.5 end of interp text (2 lines × 4.5)
    //   242  stats divider  (234.5 + 7.5 gap)
    //   249  "Statistical Summary" heading
    //   256  row 0
    //   263.5 row 1
    //   271  row 2
    //   278  card bottom = FOOTER_Y

    const CARD_TOP  = 204;
    const FOOTER_Y  = 278;  // 4 mm above footer line
    const LINE_H    = 4.5;
    const WARN_LH   = 4.0;

    doc.setFontSize(8.5);
    const wrappedInterp = doc.splitTextToSize(result.interpretation, 160) as string[];

    let warningLines = 0;
    const wrappedWarnings: string[][] = [];
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((w) => {
        const wl = doc.splitTextToSize(`[!] ${w}`, 160) as string[];
        wrappedWarnings.push(wl);
        warningLines += wl.length;
      });
    }

    const interpBlockH = wrappedInterp.length * LINE_H;
    const warnBlockH   = warningLines > 0 ? warningLines * WARN_LH + 3 : 0;

    // Fixed anchor points
    const BADGE_TOP_Y  = CARD_TOP + 11;        // 204 + 11 = 215
    const interpY      = BADGE_TOP_Y + 6 + 4.5; // badge h=6, gap=0 → 225.5
    const warnEndY     = interpY + interpBlockH + warnBlockH;
    const statsDivY    = warnEndY + 7.5;        // gap before divider
    const statsHeadY   = statsDivY + 7;
    const statsRow0Y   = statsDivY + 14;

    // Card height: maximum of computed content height and space to footer
    const computedCardH = (statsRow0Y + 2 * 7.5 + 8) - CARD_TOP; // 3 rows
    const cardH = Math.max(computedCardH, FOOTER_Y - CARD_TOP);

    drawCard(doc, CARD_TOP, cardH);
    drawSectionHeading(doc, "Interpretation", 21, CARD_TOP + 7);

    // Complexity badge — semantic colour
    const badge = badgeColors(result.complexity_class);
    doc.setFillColor(badge.fill[0], badge.fill[1], badge.fill[2]);
    doc.roundedRect(25, BADGE_TOP_Y, 54, 6, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.setTextColor(badge.text[0], badge.text[1], badge.text[2]);
    doc.text(result.complexity_class, 52, BADGE_TOP_Y + 4.2, { align: "center" });

    // Interpretation text with sky left-border accent
    doc.setFillColor(14, 165, 233);
    doc.rect(21, interpY - LINE_H + 1, 1.5, interpBlockH, "F");

    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);
    doc.text(wrappedInterp, 25, interpY);

    // Warnings (amber)
    if (wrappedWarnings.length > 0) {
      let wy = interpY + interpBlockH + 3;
      doc.setFontSize(7.5); doc.setTextColor(217, 119, 6);
      wrappedWarnings.forEach((lines) => { doc.text(lines, 25, wy); wy += lines.length * WARN_LH + 2; });
    }

    // Statistical Summary sub-section
    doc.setDrawColor(226, 232, 240);
    doc.line(21, statsDivY, 189, statsDivY);

    drawSectionHeading(doc, "Statistical Summary", 21, statsHeadY);

    const ciText = result.confidence_interval != null
      ? `[${result.confidence_interval[0].toFixed(4)},  ${result.confidence_interval[1].toFixed(4)}]`
      : "N/A";

    const statsRows: [string, string][] = [
      ["Standard Error",     result.standard_error != null ? result.standard_error.toFixed(4) : "N/A"],
      ["95% Conf. Interval", ciText],
      ["Foreground Coverage",`${(result.foreground_ratio * 100).toFixed(1)}%`],
    ];

    statsRows.forEach(([key, val], i) => {
      const ry = statsRow0Y + i * 7.5;
      if (i % 2 === 0) { doc.setFillColor(241, 245, 249); doc.rect(21, ry - 4, 168, 6, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text(`${key}:`, 24, ry);
      doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
      doc.text(val, 78, ry);
    });

    // ═══════════════════════════════════════════════════════════════════ PAGE 2
    doc.addPage();

    // ── Banner (h=32) ────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(255, 255, 255);
    doc.text("FractalVision Lab", 15, 12);

    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text("Log-Log Regression Chart", 195, 12, { align: "right" });

    doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
    doc.text(
      `Box-counting method  \u00b7  ${result.box_sizes.length} scales  \u00b7  slope = D = ${result.fractal_dimension.toFixed(4)}`,
      105, 22, { align: "center" }
    );

    doc.setFillColor(14, 165, 233);
    doc.rect(0, 32, 210, 0.7, "F");

    // ── Chart card ───────────────────────────────────────────────────────────
    let chartH = 0;
    const chartContainer = document.getElementById("report-loglog-chart");
    const svgEl = chartContainer?.querySelector("svg") as SVGSVGElement | null;

    if (svgEl === null) {
      drawCard(doc, 36, 40);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
      doc.text("Chart not available \u2014 open the Analyzer Lab to generate.", 105, 59, { align: "center" });
    } else {
      try {
        const chartDataUrl = await captureSvgAsPng(svgEl);
        const { w: svgNW, h: svgNH } = await new Promise<{ w: number; h: number }>((res) => {
          const tmp = new Image();
          tmp.onload = () => res({ w: tmp.naturalWidth, h: tmp.naturalHeight });
          tmp.src = chartDataUrl;
        });

        const cardPad = 7;
        const chartW  = 180 - cardPad * 2; // 166 mm — contained within card boundaries
        chartH = (svgNH / svgNW) * chartW;

        drawDarkCard(doc, 36, chartH + cardPad * 2);
        doc.addImage(chartDataUrl, "PNG", 15 + cardPad, 36 + cardPad, chartW, chartH);

        // D & R² annotation inside dark card (top-right, muted)
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
        doc.text(
          `D = ${result.fractal_dimension.toFixed(4)}   R\u00b2 = ${result.r_squared.toFixed(4)}`,
          189 - cardPad, 36 + cardPad + 5.5, { align: "right" }
        );
      } catch (err) {
        console.warn("SVG capture failed:", err);
        drawCard(doc, 36, 30);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
        doc.text("Chart capture failed.", 105, 54, { align: "center" });
      }
    }

    // ── Sensitivity card (dynamically sized to fit content) ──────────────────
    const chartCardBottom = 36 + chartH + 7 * 2;
    const sensCardY  = chartH > 0 ? chartCardBottom + 8 : 84;
    
    if (result.sensitivity != null) {
      const sens = result.sensitivity;
      const stdDevStr = sens.std_deviation != null ? sens.std_deviation.toFixed(4) : "N/A";
      const conclusionText = sens.is_stable
        ? `The fractal dimension is stable across all tested thresholds (std dev = ${stdDevStr}), confirming that structural self-similarity is robust and not an artifact of the chosen threshold.`
        : `The fractal dimension varies across tested thresholds (std dev = ${stdDevStr}). The structure may not be perfectly self-similar and results should be interpreted with caution.`;

      const wrappedConclusion = doc.splitTextToSize(conclusionText, 162) as string[];
      const conclusionTextHeight = wrappedConclusion.length * 4.0;
      const sensCardH = 60 + conclusionTextHeight;

      drawCard(doc, sensCardY, sensCardH);
      drawSectionHeading(doc, "Sensitivity Analysis", 21, sensCardY + 9);

      doc.setDrawColor(226, 232, 240);
      doc.line(21, sensCardY + 12, 189, sensCardY + 12);

      const sensRows: [string, string][] = [
        ["Std Deviation",     sens.std_deviation?.toFixed(4) ?? "N/A"],
        ["Stable",            sens.is_stable ? "Yes" : "No"],
        ["Thresholds tested", sens.thresholds_tested.join(", ")],
      ];

      sensRows.forEach(([key, val], i) => {
        const ry = sensCardY + 20 + i * 8;
        if (i % 2 === 0) { doc.setFillColor(241, 245, 249); doc.rect(21, ry - 4, 168, 6, "F"); }
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
        doc.text(`${key}:`, 24, ry);
        doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
        doc.text(val, 72, ry);
      });

      // Conclusion paragraph — uses plain ASCII to avoid helvetica unicode issues
      const conclusionY = sensCardY + 20 + sensRows.length * 8 + 7;
      doc.setDrawColor(226, 232, 240);
      doc.line(21, conclusionY - 3, 189, conclusionY - 3);

      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(71, 85, 105);
      doc.text(wrappedConclusion, 21, conclusionY + 3);
    } else {
      const hintText =
        "Sensitivity data unavailable. Enable the Sensitivity Test toggle in the Analyzer Lab and re-run to see threshold stability metrics here.";
      const wrappedHint = doc.splitTextToSize(hintText, 162) as string[];
      const sensCardH = 28 + wrappedHint.length * 4.5;

      drawCard(doc, sensCardY, sensCardH);
      drawSectionHeading(doc, "Sensitivity Analysis", 21, sensCardY + 9);

      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(148, 163, 184);
      doc.text(wrappedHint, 21, sensCardY + 22);
    }

    // ── Footers ──────────────────────────────────────────────────────────────
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total); }

    doc.save(`FractalVision_Report_${Date.now()}.pdf`);
  } catch (err) {
    console.error("generateReport failed:", err);
    throw err;
  }
}
