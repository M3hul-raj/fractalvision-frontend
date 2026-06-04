"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/lab", label: "Analyzer Lab" },
  { href: "/gallery", label: "Gallery" },
  { href: "/compare", label: "Compare" },
  { href: "/explorer", label: "Fractal Explorer" },
  { href: "/methodology", label: "Methodology" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/limitations", label: "Limitations" },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          FractalVision Lab
        </Link>

        {/* Nav links */}
        <ul className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
