"use client";

import { useEffect, useState, useMemo } from "react";
import PageShell from "@/components/layout/PageShell";
import SpecimenCard from "@/components/gallery/SpecimenCard";
import { getSpecimens } from "@/lib/supabase/queries";
import type { Specimen } from "@/types/specimen";

type FilterType = "all" | "leaf" | "coastline";
type SortKey = "d_desc" | "d_asc" | "name_asc";

export default function GalleryPage() {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortKey>("d_desc");

  // Fetch all specimens once on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSpecimens()
      .then((data) => {
        if (!cancelled) setSpecimens(data);
      })
      .catch((err) => {
        console.error("Supabase fetch error:", err);
        if (!cancelled)
          setError(
            "Failed to load specimens. Check your Supabase configuration."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Client-side filter + sort
  const displayed = useMemo(() => {
    let list =
      filter === "all"
        ? [...specimens]
        : specimens.filter((s) => s.category === filter);

    switch (sort) {
      case "d_desc":
        list.sort((a, b) => b.fractal_dimension - a.fractal_dimension);
        break;
      case "d_asc":
        list.sort((a, b) => a.fractal_dimension - b.fractal_dimension);
        break;
      case "name_asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [specimens, filter, sort]);

  // Filter button helper
  const FilterBtn = ({
    value,
    label,
  }: {
    value: FilterType;
    label: string;
  }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
        filter === value
          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Dissertation Gallery
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl">
            Explore the original dissertation dataset — leaves, coastlines, and
            their fractal dimension analysis results.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <div className="flex gap-2">
            <FilterBtn value="all" label="All" />
            <FilterBtn value="leaf" label="Leaves" />
            <FilterBtn value="coastline" label="Coastlines" />
          </div>

          <div className="flex items-center gap-4">
            {/* Sort dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="d_desc">D: High → Low</option>
              <option value="d_asc">D: Low → High</option>
              <option value="name_asc">Name: A → Z</option>
            </select>

            {/* Count */}
            {!loading && !error && (
              <span className="text-sm text-gray-500 font-mono whitespace-nowrap">
                Showing {displayed.length} of {specimens.length} specimens
              </span>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800/50 border border-gray-700/40 rounded-xl p-6 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="h-6 bg-gray-700 rounded w-32" />
                  <div className="h-5 bg-gray-700 rounded-full w-16" />
                </div>
                <div className="h-4 bg-gray-700 rounded w-20" />
                <div className="flex gap-6">
                  <div>
                    <div className="h-3 bg-gray-700 rounded w-24 mb-2" />
                    <div className="h-9 bg-gray-700 rounded w-28" />
                  </div>
                  <div>
                    <div className="h-3 bg-gray-700 rounded w-10 mb-2" />
                    <div className="h-6 bg-gray-700 rounded w-20" />
                  </div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-px bg-gray-700 mt-2" />
                <div className="h-3 bg-gray-700 rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-red-900/30 border border-red-500/40 rounded-xl">
              <p className="text-red-300 text-lg font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayed.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No specimens found.</p>
          </div>
        )}

        {/* Cards grid */}
        {!loading && !error && displayed.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map((specimen) => (
              <SpecimenCard key={specimen.id} specimen={specimen} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
