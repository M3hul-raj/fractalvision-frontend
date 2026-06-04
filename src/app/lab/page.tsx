import PageShell from "@/components/layout/PageShell";

export default function LabPage() {
  return (
    <PageShell>
      <h1 className="text-4xl font-bold tracking-tight">Analyzer Lab</h1>
      <p className="mt-4 text-gray-400">
        Upload an image, preprocess it, and compute its fractal dimension using
        the box-counting method.
      </p>
      {/* TODO: Phase 1 — ImageUploader, PipelineViewer, ResultCard, LogLogChart */}
    </PageShell>
  );
}
