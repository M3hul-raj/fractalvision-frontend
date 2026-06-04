import PageShell from "@/components/layout/PageShell";

export default function LimitationsPage() {
  return (
    <PageShell>
      <h1 className="text-4xl font-bold tracking-tight">Limitations</h1>
      <p className="mt-4 text-gray-400">
        Scientific limitations of digital fractal analysis — finite resolution,
        preprocessing sensitivity, and interpretation caveats.
      </p>
      {/* TODO: Phase 11 — detailed limitation explanations */}
    </PageShell>
  );
}
