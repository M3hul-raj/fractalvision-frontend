"use client";

import { useState } from "react";
import { generateReport } from "@/lib/report/generateReport";
import { useAnalyzerStore } from "@/store/analyzerStore";

export default function ReportButton() {
  const { result, lastResponse, originalImageUrl, binaryImageUrl } =
    useAnalyzerStore();

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Nothing to export until an analysis has been completed
  if (result === null || lastResponse === null) return null;

  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    setExportError(null);
    try {
      await generateReport({ result, lastResponse, originalImageUrl, binaryImageUrl });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-blue-700/50 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {/* Download arrow icon */}
        <span className={isExporting ? "animate-pulse" : ""}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </span>
        {isExporting ? "Exporting..." : "Export PDF"}
      </button>
      {exportError && (
        <p className="mt-2 text-xs text-red-400 text-right">{exportError}</p>
      )}
    </div>
  );
}
