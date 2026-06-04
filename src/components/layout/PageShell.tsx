/**
 * PageShell — common page wrapper with consistent padding and max-width.
 */
// TODO: Phase 11 — add page transitions with Framer Motion

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {children}
    </main>
  );
}
