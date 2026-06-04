import PageShell from "@/components/layout/PageShell";

export default function ExplorerPage() {
  return (
    <PageShell>
      <h1 className="text-4xl font-bold tracking-tight">Standard Fractal Explorer</h1>
      <p className="mt-4 text-gray-400">
        Validate the box-counting algorithm against known mathematical fractals
        — Cantor Set, Koch Curve, Sierpiński Triangle, and more.
      </p>
      {/* TODO: Phase 7 — fractal generators, iteration slider, theoretical vs computed D */}
    </PageShell>
  );
}
