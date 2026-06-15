import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Scientific Limitations",
  description:
    "A rigorous account of the boundaries and known limitations of the box-counting fractal dimension method as implemented in FractalVision Lab.",
};

// ── Reusable layout primitives (mirrors methodology page) ────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 flex items-center gap-3">
      <span className="inline-block w-1 h-7 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 shrink-0" />
      {children}
    </h2>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-gray-300 leading-relaxed space-y-4 text-[0.95rem]">
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

function CautionBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-amber-900/10 border border-amber-700/30 rounded-xl p-4 my-4">
      <svg
        className="shrink-0 mt-0.5 text-amber-400"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="text-amber-200/80 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-emerald-900/10 border border-emerald-700/30 rounded-xl p-4 my-4">
      <svg
        className="shrink-0 mt-0.5 text-emerald-400"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <p className="text-emerald-200/80 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-800 rounded text-cyan-300 text-[0.85em] font-mono">
      {children}
    </code>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LimitationsPage() {
  return (
    <PageShell>
      <div className="max-w-5xl mx-auto space-y-16 pb-20">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="pt-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-400/80 uppercase mb-3">
            FractalVision Lab · Scientific Documentation
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Scientific Limitations
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
            Understanding the boundaries of box-counting analysis — where the method
            is reliable, where it breaks down, and how to interpret results accordingly.
          </p>
          <div className="mt-6 h-px bg-gradient-to-r from-amber-500/40 via-orange-500/20 to-transparent" />
          <div className="mt-6 bg-gray-900/40 border border-gray-800 rounded-xl px-5 py-4 text-sm text-gray-400 leading-relaxed">
            Scientific honesty requires acknowledging method limitations alongside results.
            The limitations below do not invalidate fractal dimension as a measure of structural
            complexity — they define the conditions under which results should be interpreted
            with appropriate caution.
          </div>
        </div>

        {/* ── Section 1 — Rasterization and Resolution ────────────────────── */}
        <section id="rasterization" className="scroll-mt-20">
          <Card>
            <SectionHeading>Rasterization and Resolution</SectionHeading>
            <Prose>
              <p>
                Box-counting in FractalVision Lab operates on a <strong>pixel grid</strong>
                (raster image), not on a continuous mathematical object. This introduces
                quantization artefacts that have measurable effects on the computed D value.
              </p>
            </Prose>

            <CautionBox>
              Diagonal edges in a raster image produce a "staircase" (aliasing) effect.
              The staircase pixels inflate the box count at small scales, slightly biasing D
              upwards for patterns dominated by diagonal boundaries.
            </CautionBox>

            <Prose>
              <p>
                This effect is most visible at <strong>high iteration fractal images</strong>. For
                example, at iteration 7 or 8 of the Sierpiński Triangle, the smallest triangular
                holes are approximately 8–16 px wide. The box-counting algorithm samples these fine
                features with only 1–2 box sizes before the smallest box size (4 px) is reached,
                providing insufficient data points to fit the self-similar scaling law accurately.
              </p>
              <p>
                As iteration depth increases from 1 → 6, the computed D <em>converges toward</em>
                the theoretical value (e.g. 1.585 for Sierpiński Triangle) as the fractal structure
                occupies a wider range of scales relative to individual pixels. Beyond iteration 6–7,
                diminishing returns set in and aliasing noise dominates. This is why FractalVision
                Lab imposes per-fractal iteration caps (e.g. 6 for Sierpiński Carpet, 7 for Koch
                variants, 8 for Sierpiński Triangle).
              </p>
            </Prose>

            <TipBox>
              For the most accurate results, use images at 1024 × 1024 px or higher. The backend
              automatically resizes to a maximum of 1024 px — for the Fractal Explorer, this provides
              the optimal balance between rendering detail and box-counting accuracy.
            </TipBox>
          </Card>
        </section>

        {/* ── Section 2 — Scale Range Constraints ─────────────────────────── */}
        <section id="scale-range" className="scroll-mt-20">
          <Card>
            <SectionHeading>Scale Range Constraints</SectionHeading>
            <Prose>
              <p>
                The box-counting method estimates D from the <em>slope</em> of the log-log plot of
                N(ε) vs. 1/ε. The accuracy of this slope estimate improves with the number and spread
                of box scales used. If the scale range is too narrow — either too few scales or a
                small ratio between the largest and smallest box — the slope is poorly constrained
                and the confidence interval for D becomes wide.
              </p>
            </Prose>

            <div className="mt-5 bg-gray-950/50 border border-gray-700/40 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-widest">
                Scale selection in FractalVision Lab
              </div>
              <div className="divide-y divide-gray-800/50">
                {[
                  ["Smallest box size", "4 px", "Fixed lower limit — smaller boxes approach individual pixel noise"],
                  ["Largest box size", "image_size / 4", "Ensures at least a 4× scale range regardless of image size"],
                  ["Scale sequence", "Powers of 2: 4, 8, 16, 32, 64, 128 px", "Geometric spacing maximises scale range for a given number of data points"],
                  ["Typical scale count", "6–8 scales", "For a 1024 px image: 4, 8, 16, 32, 64, 128, 256 px"],
                ].map(([label, value, note]) => (
                  <div key={label as string} className="px-5 py-3 grid grid-cols-1 sm:grid-cols-[180px_auto] gap-1 sm:gap-4">
                    <span className="text-gray-400 text-sm font-medium">{label}</span>
                    <div>
                      <span className="text-white text-sm font-mono">{value}</span>
                      <span className="text-gray-500 text-xs block mt-0.5">{note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Prose>
              <p className="mt-5">
                Very small images (e.g. &lt; 128 px) may yield only 4–5 meaningful scales, reducing
                regression quality. The R² score directly captures this: a low R² value at a narrow
                scale range indicates that the power-law relationship is not well-established over the
                measured range, and D should be treated as an approximation rather than a precise estimate.
              </p>
            </Prose>

            <CautionBox>
              Avoid analysing thumbnails or heavily downsampled images. A minimum image size of 256 × 256 px
              is strongly recommended; 512 × 512 px or larger is preferred for publication-quality results.
            </CautionBox>
          </Card>
        </section>

        {/* ── Section 3 — Threshold Sensitivity ───────────────────────────── */}
        <section id="threshold-sensitivity" className="scroll-mt-20">
          <Card>
            <SectionHeading>Threshold Sensitivity</SectionHeading>
            <Prose>
              <p>
                The single most impactful preprocessing step is thresholding: converting the grayscale
                image to a binary mask. The choice of threshold value determines which pixels are
                classified as foreground and which as background — directly controlling the set of
                pixels that the box-counting algorithm sees.
              </p>
              <p>
                Two different threshold values applied to the same image can produce foreground masks
                with meaningfully different spatial structures, yielding different D values. This is
                not a flaw of the algorithm; it reflects the genuine ambiguity in defining what
                constitutes the "structure" in a noisy natural image.
              </p>
            </Prose>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-2">When Otsu is reliable</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Otsu's method works best when the image histogram has a clear bimodal distribution —
                  a distinct peak for the background and a distinct peak for the subject.
                  Well-lit specimens on clean backgrounds are optimal.
                </p>
              </div>
              <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-2">When adaptive threshold is better</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  For images with uneven illumination (shadows, vignetting), adaptive thresholding 
                  computes a per-pixel threshold from the weighted average of a local 
                  neighbourhood (Gaussian weights). The default block size is 11 px with C = 2, 
                  but both parameters are user-adjustable via sliders in the Preprocessing 
                  Controls panel. This suppresses lighting gradients that would confuse a 
                  global threshold.
                </p>
              </div>
            </div>

            <TipBox>
              Always run the <strong>Sensitivity Test</strong> (Full Mask + Otsu or Manual threshold)
              when reporting D for a novel image. A standard deviation σ &lt; 0.05 across threshold ± 15
              confirms that the result is stable and not threshold-dependent.
            </TipBox>

            <Prose>
              <p className="mt-2">
                The sensitivity test is explicitly disabled for Adaptive threshold mode, because
                adaptive thresholding does not have a single global threshold value to perturb.
                In that case, visual inspection of the binary image — accessible in the Algorithm
                Microscope panel — is the primary diagnostic tool.
              </p>
            </Prose>
          </Card>
        </section>

        {/* ── Section 4 — Image Quality Dependencies ──────────────────────── */}
        <section id="image-quality" className="scroll-mt-20">
          <Card>
            <SectionHeading>Image Quality Dependencies</SectionHeading>
            <Prose>
              <p>
                FractalVision Lab measures the fractal dimension of the <em>binary mask</em> derived
                from the input image, not of the physical object directly. The quality of this
                measurement therefore depends on how faithfully the image represents the object's
                structure.
              </p>
            </Prose>

            <div className="mt-5 space-y-4">
              {[
                {
                  title: "Background noise",
                  icon: "⚠",
                  iconColor: "text-amber-400",
                  text: "Speckle noise, dust, or texture in the background that crosses the threshold gets included in the foreground mask, inflating the pixel count and artificially increasing D. Use a clean, uniform background — a plain white or black surface — when photographing specimens.",
                },
                {
                  title: "JPEG compression artefacts",
                  icon: "⚠",
                  iconColor: "text-amber-400",
                  text: "JPEG compression introduces 8×8 block artefacts that create spurious high-frequency structure. These artefacts are picked up by the box-counting algorithm at small scales (ε = 4–8 px), biasing D upwards. Always prefer PNG for scientific imaging.",
                },
                {
                  title: "Low contrast and shadows",
                  icon: "⚠",
                  iconColor: "text-amber-400",
                  text: "Low contrast between subject and background forces the threshold into a region where small intensity changes dramatically alter the binary mask. Shadows cast by the subject onto the background are particularly problematic, as they may be darker than the subject itself and get classified as foreground.",
                },
                {
                  title: "Optimal capture conditions",
                  icon: "✓",
                  iconColor: "text-emerald-400",
                  text: "Diffuse, even lighting. Clean white or black background. PNG file format. Image resolution ≥ 512 × 512 px. Subject fills at least 50% of the frame. These conditions consistently produce R² ≥ 0.99 and quality scores ≥ 85 in the dissertation specimen set.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 bg-gray-950/40 border border-gray-800/60 rounded-xl p-4">
                  <span className={`text-xl shrink-0 ${item.iconColor}`}>{item.icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Section 5 — Method Limitations ──────────────────────────────── */}
        <section id="method-limitations" className="scroll-mt-20">
          <Card>
            <SectionHeading>Method Limitations</SectionHeading>
            <Prose>
              <p>
                Box-counting is one member of a family of fractal dimension estimators. The choice
                of estimator matters, and each has different theoretical properties:
              </p>
            </Prose>

            <div className="mt-5 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60 text-xs font-bold text-gray-500 uppercase tracking-widest">
                Fractal dimension estimators — comparison
              </div>
              <div className="divide-y divide-gray-800/50">
                {[
                  {
                    name: "Box-counting (Minkowski–Bouligand)",
                    used: true,
                    pros: "Simple, intuitive, works on any binary raster image",
                    cons: "Sensitive to grid alignment; quantization noise at small scales",
                  },
                  {
                    name: "Hausdorff dimension",
                    used: false,
                    pros: "Theoretically rigorous; the true mathematical definition",
                    cons: "Computationally intractable for raster images; requires analytic set definitions",
                  },
                  {
                    name: "Correlation dimension",
                    used: false,
                    pros: "Suitable for point-cloud or time-series data",
                    cons: "Requires a large number of data points; not applicable to 2D binary images",
                  },
                  {
                    name: "Mass dimension",
                    used: false,
                    pros: "Measures density scaling; good for self-similar mass distributions",
                    cons: "Requires a well-defined centre point; not appropriate for boundary patterns",
                  },
                ].map((row) => (
                  <div key={row.name} className={`px-5 py-3.5 ${row.used ? "bg-blue-900/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${
                        row.used
                          ? "border-blue-700/50 text-blue-300 bg-blue-900/20"
                          : "border-gray-700 text-gray-500 bg-transparent"
                      }`}>
                        {row.used ? "Used" : "Not used"}
                      </span>
                      <div>
                        <p className="text-white text-sm font-semibold">{row.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          <span className="text-emerald-400">+</span> {row.pros}
                          {"  "}
                          <span className="text-red-400">−</span> {row.cons}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Prose>
              <p className="mt-6">
                Beyond the choice of estimator, several fundamental limitations apply to the
                use of D as a descriptor of natural patterns:
              </p>
            </Prose>

            <ul className="mt-4 space-y-3">
              {[
                {
                  text: (
                    <>
                      <strong className="text-white">D measures the binary image, not the object.</strong>{" "}
                      The fractal dimension reported by FractalVision Lab is a property of the preprocessed
                      binary mask. Different preprocessing settings applied to the same photograph can yield
                      measurably different D values. The Sensitivity Test and Reliability Dashboard are
                      specifically designed to surface and quantify this uncertainty.
                    </>
                  ),
                },
                {
                  text: (
                    <>
                      <strong className="text-white">Natural patterns are not perfectly self-similar.</strong>{" "}
                      Mathematical fractals (Koch, Sierpiński) maintain strict self-similarity across
                      arbitrarily many scales by construction. Real biological and geological patterns are
                      only approximately self-similar, and only over a finite scale range. D should be
                      interpreted as an estimate of complexity over the <em>measured</em> scale range
                      [4 px, image_size/4], not as an absolute property of the object.
                    </>
                  ),
                },
                {
                  text: (
                    <>
                      <strong className="text-white">Theoretical vs. computed dimensions of rendered fractals.</strong>{" "}
                      The theoretical fractal dimensions of Koch Curve (1.2619), Sierpiński Triangle
                      (1.5850), and Sierpiński Carpet (1.8928) assume <em>infinite</em> iteration on a
                      continuous plane. FractalVision Lab renders these at finite pixel resolution with a
                      finite number of iterations. The computed D converges toward the theoretical value
                      as iteration depth increases, but never reaches it exactly. Error percentages of
                      1–5% at iteration 4–6 are expected and scientifically normal.
                    </>
                  ),
                },
                {
                  text: (
                    <>
                      <strong className="text-white">Single D value vs. multifractal analysis.</strong>{" "}
                      Box-counting produces a single global D value summarising the entire image.
                      Some structures exhibit different scaling behaviour at different locations
                      (multifractals). A single D value does not capture this spatial heterogeneity.
                      Multifractal analysis is beyond the scope of FractalVision Lab.
                    </>
                  ),
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-gray-400 text-sm leading-relaxed">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            <CautionBox>
              When citing fractal dimension values in academic work, always report D alongside
              R², the confidence interval, the threshold method used, the analysis mode, and
              the sensitivity test result. A single D value without this context is insufficient
              for reproducible scientific reporting.
            </CautionBox>
          </Card>
        </section>

        {/* ── Footer CTA ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/methodology"
            className="flex-1 text-center px-6 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors"
          >
            ← Read the Methodology
          </Link>
          <Link
            href="/lab"
            className="flex-1 text-center px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            Open Analyzer Lab →
          </Link>
        </div>

      </div>
    </PageShell>
  );
}
