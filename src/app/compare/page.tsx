"use client";

import { useState, useEffect } from "react";
import PageShell from "@/components/layout/PageShell";
import ComparePanel from "@/components/compare/ComparePanel";
import CompareResults from "@/components/compare/CompareResults";
import { useCompareStore } from "@/store/compareStore";

export default function ComparePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { A, B } = useCompareStore();

  if (!isMounted) {
    return null;
  }

  const bothReady = A.result !== null && B.result !== null;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Compare Mode
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl">
            Upload two images or select gallery specimens to compare their fractal complexity
            side by side.
          </p>
        </div>

        {/* Dual panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComparePanel slot="A" />
          <ComparePanel slot="B" />
        </div>

        {/* Results — shown only when both slots have results */}
        {bothReady ? (
          <CompareResults resultA={A.result!} resultB={B.result!} />
        ) : (
          <div className="border-2 border-dashed border-gray-700 rounded-2xl p-10 text-center text-gray-500">
            {A.result === null && B.result === null ? (
              <p>Load an image or specimen into <strong className="text-gray-400">both Slot A and Slot B</strong> to see the comparison results.</p>
            ) : A.result === null ? (
              <p>Load an image or specimen into <strong className="text-sky-400">Slot A</strong> to see the comparison.</p>
            ) : (
              <p>Load an image or specimen into <strong className="text-orange-400">Slot B</strong> to see the comparison.</p>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
