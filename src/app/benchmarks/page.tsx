import PageShell from "@/components/layout/PageShell";

export default function BenchmarksPage() {
  return (
    <PageShell>
      <h1 className="text-4xl font-bold tracking-tight">Benchmarks</h1>
      <p className="mt-4 text-gray-400">
        Performance comparison — TypeScript vs Web Worker vs WebAssembly
        box-counting implementations.
      </p>
      {/* TODO: Phase 10 — BenchmarkChart, runtime comparison table */}
    </PageShell>
  );
}
