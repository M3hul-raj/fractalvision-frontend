"use client";

import PageShell from "@/components/layout/PageShell";
import ImageUploader from "@/components/analyzer/ImageUploader";
import ResultCard from "@/components/analyzer/ResultCard";
import LogLogChart from "@/components/charts/LogLogChart";
import PipelineViewer from "@/components/analyzer/PipelineViewer";
import BoxSizeSlider from "@/components/analyzer/BoxSizeSlider";
import PreprocessingControls from "@/components/analyzer/PreprocessingControls";
import QualityScore from "@/components/analyzer/QualityScore";
import { useAnalyzerStore } from "@/store/analyzerStore";
import { useAutoAnalyze } from "@/hooks/useAutoAnalyze";

export default function LabPage() {
  useAutoAnalyze();
  const { result, binaryImageUrl, selectedBoxSize } = useAnalyzerStore();

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
              <LogLogChart />
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
