"use client";

import type { Specimen } from "@/types/specimen";

interface SpecimenCardProps {
  specimen: Specimen;
  onClick?: () => void;
}

export default function SpecimenCard({ specimen, onClick }: SpecimenCardProps) {
  const categoryColor =
    specimen.category === "leaf"
      ? "bg-emerald-600/80 text-emerald-100"
      : specimen.category === "coastline"
      ? "bg-sky-600/80 text-sky-100"
      : "bg-purple-600/80 text-purple-100";

  const categoryLabel =
    specimen.category === "leaf"
      ? "LEAF"
      : specimen.category === "coastline"
      ? "COASTLINE"
      : "FRACTAL";

  return (
    <div
      onClick={onClick}
      className={`group bg-gray-800/70 backdrop-blur-sm border border-gray-700/60 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)] hover:-translate-y-0.5${onClick ? " cursor-pointer" : ""}`}
    >
      {/* Specimen image */}
      {specimen.image_url ? (
        <img
          src={specimen.image_url}
          alt={specimen.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gray-700/50 flex items-center justify-center">
          <span className="text-gray-500 text-sm">No image</span>
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
      {/* Header row: name + badges */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-white leading-tight group-hover:text-blue-300 transition-colors">
            {specimen.name}
          </h3>
          <div className="flex gap-2 shrink-0">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${categoryColor}`}
            >
              {categoryLabel}
            </span>
          </div>
        </div>
        {specimen.complexity_class && (
          <span className="text-xs font-medium text-amber-400/90 bg-amber-900/30 border border-amber-700/40 px-2.5 py-0.5 rounded-full w-fit">
            {specimen.complexity_class}
          </span>
        )}
      </div>

      {/* Hero numbers */}
      <div className="flex items-baseline gap-6">
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
            Fractal Dimension
          </span>
          <span className="text-3xl font-mono font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
            {specimen.fractal_dimension.toFixed(4)}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">
            R²
          </span>
          <span className="text-lg font-mono font-semibold text-green-400/90">
            {specimen.r_squared.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Description */}
      {specimen.description && (
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
          {specimen.description}
        </p>
      )}

      {/* Footer metadata */}
      <div className="mt-auto pt-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
        {specimen.notes && (
          <span className="italic text-gray-500 truncate max-w-[60%]">
            {specimen.notes}
          </span>
        )}
        {!specimen.notes && <span />}
        <span className="font-mono shrink-0">
          {specimen.box_sizes.length > 0
            ? `${specimen.box_sizes.length} scales`
            : "—"}
        </span>
      </div>
      </div>
    </div>
  );
}
