"use client";

import { useState } from "react";
import PageShell from "@/components/layout/PageShell";
import ImageUploader from "@/components/analyzer/ImageUploader";
import ResultCard from "@/components/analyzer/ResultCard";
import LogLogChart from "@/components/charts/LogLogChart";
import PipelineViewer from "@/components/analyzer/PipelineViewer";
import BoxSizeSlider from "@/components/analyzer/BoxSizeSlider";
import PreprocessingControls from "@/components/analyzer/PreprocessingControls";
import QualityScore from "@/components/analyzer/QualityScore";
import ComparisonPanel from "@/components/compare/ComparisonPanel";
import SpecimenPickerModal from "@/components/compare/SpecimenPickerModal";
import { useAnalyzerStore } from "@/store/analyzerStore";
import { useAutoAnalyze } from "@/hooks/useAutoAnalyze";

export default function LabPage() {
  useAutoAnalyze();
  const { result, binaryImageUrl, selectedBoxSize, comparisonSpecimen } = useAnalyzerStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">Analyzer Lab</h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl">
            Upload an image, preprocess it, and compute its fractal dimension using
            the box-counting method.
          </p>
        </div>

        <PreprocessingControls />
        <ImageUploader />

        {result && binaryImageUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <PipelineViewer binaryImageB64={binaryImageUrl} selectedBoxSize={selectedBoxSize} />
              <BoxSizeSlider />
            </div>

            <div className="space-y-8">
              <ResultCard />
              {result && <QualityScore />}

              {/* Compare button / active banner */}
              {result && !comparisonSpecimen && (
                <button
                  id="open-specimen-picker"
                  onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-amber-700/50 text-amber-400 hover:bg-amber-900/20 hover:border-amber-500 text-sm font-medium transition-all duration-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Compare with Specimen
                </button>
              )}

              {result && comparisonSpecimen && (
                <div
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-amber-700/40 bg-amber-900/15 cursor-pointer hover:bg-amber-900/25 transition-colors"
                  onClick={() => setPickerOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setPickerOpen(true)}
                  aria-label="Change comparison specimen"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" aria-hidden="true" />
                    <span className="text-sm text-amber-300 truncate">
                      Comparing with <strong>{comparisonSpecimen.name}</strong>
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">Change</span>
                </div>
              )}

              {result && <ComparisonPanel />}
              <LogLogChart comparisonSpecimen={comparisonSpecimen} />
            </div>
          </div>
        )}
      </div>

      {/* Modal — rendered outside the grid so it can use a full-viewport overlay */}
      <SpecimenPickerModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </PageShell>
  );
}
