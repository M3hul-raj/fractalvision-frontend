import PageShell from "@/components/layout/PageShell";
import ImageUploader from "@/components/analyzer/ImageUploader";
import ResultCard from "@/components/analyzer/ResultCard";
import LogLogChart from "@/components/charts/LogLogChart";

export default function LabPage() {
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
        
        <ImageUploader />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ResultCard />
          <LogLogChart />
        </div>
      </div>
    </PageShell>
  );
}
