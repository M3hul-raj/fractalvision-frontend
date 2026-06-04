import PageShell from "@/components/layout/PageShell";

export default function GalleryPage() {
  return (
    <PageShell>
      <h1 className="text-4xl font-bold tracking-tight">Dissertation Gallery</h1>
      <p className="mt-4 text-gray-400">
        Explore the original dissertation dataset — leaves, coastlines, and
        standard fractal validation results.
      </p>
      {/* TODO: Phase 4 — GalleryGrid, SpecimenCard, filtering, sorting */}
    </PageShell>
  );
}
