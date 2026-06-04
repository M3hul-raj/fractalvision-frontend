import PageShell from "@/components/layout/PageShell";

export default function HomePage() {
  return (
    <PageShell>
      <h1 className="text-4xl font-bold tracking-tight">FractalVision Lab</h1>
      <p className="mt-4 text-lg text-gray-400">
        Measure the hidden geometry of nature. Upload a leaf, coastline, or
        natural pattern and watch its fractal dimension emerge through
        box-counting, image processing, and live mathematical visualization.
      </p>
    </PageShell>
  );
}
