import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How FractalVision Lab measures structural complexity — fractal dimension theory, the box-counting algorithm, log-log regression, image preprocessing pipeline, and reliability metrics.",
};

// ── Reusable layout primitives ───────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 flex items-center gap-3">
      <span className="inline-block w-1 h-7 rounded-full bg-gradient-to-b from-blue-400 to-cyan-500 shrink-0" />
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

function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 px-5 py-3.5 bg-gray-950/80 border border-gray-700/60 rounded-xl font-mono text-cyan-300 text-sm overflow-x-auto">
      {children}
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

function Tag({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "amber" | "cyan" | "purple" | "emerald" }) {
  const colors = {
    blue:    "bg-blue-900/30 border-blue-700/40 text-blue-300",
    amber:   "bg-amber-900/30 border-amber-700/40 text-amber-300",
    cyan:    "bg-cyan-900/30 border-cyan-700/40 text-cyan-300",
    purple:  "bg-purple-900/30 border-purple-700/40 text-purple-300",
    emerald: "bg-emerald-900/30 border-emerald-700/40 text-emerald-300",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  return (
    <PageShell>
      <div className="max-w-5xl mx-auto space-y-16 pb-20">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="pt-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-400/80 uppercase mb-3">
            FractalVision Lab · Scientific Documentation
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Methodology
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
            How FractalVision Lab measures structural complexity — from raw image to
            fractal dimension, with full statistical validation.
          </p>
          <div className="mt-6 h-px bg-gradient-to-r from-blue-500/40 via-cyan-500/20 to-transparent" />
        </div>

        {/* ── Section 1 — What is Fractal Dimension? ───────────────────────── */}
        <section id="fractal-dimension" className="scroll-mt-20">
          <Card>
            <SectionHeading>What is Fractal Dimension?</SectionHeading>
            <Prose>
              <p>
                Classical Euclidean geometry assigns integer dimensions to objects: a line is
                one-dimensional, a filled square is two-dimensional, a solid cube is three-dimensional.
                These dimensions describe how a shape <em>scales</em> — double the side length of a
                square and its area grows by 2² = 4; double a cube's side and its volume grows by 2³ = 8.
              </p>
              <p>
                Many natural objects — coastlines, leaf venation networks, snowflakes, river tributaries —
                defy this neat classification. They exhibit <strong>self-similarity across scales</strong>:
                a section of a coastline viewed at 1 km resolution looks statistically indistinguishable
                from the same coastline viewed at 100 m resolution. The geometric complexity is preserved
                as you zoom in, not smoothed away.
              </p>
              <p>
                The <strong>fractal dimension</strong> D is a non-integer exponent that quantifies this
                scale-invariant complexity. For a two-dimensional binary image, D lies in the range
                [1, 2]:
              </p>
            </Prose>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  range: "D ≈ 1.0–1.2",
                  label: "Near-linear",
                  desc: "Smooth curves, simple edges. Barely more complex than a line.",
                  color: "border-blue-700/50 bg-blue-900/10",
                  badge: "blue" as const,
                },
                {
                  range: "D ≈ 1.4–1.6",
                  label: "Moderate",
                  desc: "Complex networks, jagged borders, river systems. Mid-range self-similarity.",
                  color: "border-cyan-700/50 bg-cyan-900/10",
                  badge: "cyan" as const,
                },
                {
                  range: "D ≈ 1.8–2.0",
                  label: "Space-filling",
                  desc: "Dense, highly irregular textures approaching full 2D coverage.",
                  color: "border-purple-700/50 bg-purple-900/10",
                  badge: "purple" as const,
                },
              ].map((item) => (
                <div key={item.range} className={`rounded-xl border p-4 ${item.color}`}>
                  <Tag color={item.badge}>{item.label}</Tag>
                  <p className="mt-2 font-mono text-white font-bold text-lg">{item.range}</p>
                  <p className="mt-1 text-gray-400 text-sm leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>

            <Prose>
              <p className="mt-6">
                The lower bound D = 1 corresponds to a single continuous curve (a coastline with zero
                roughness); the upper bound D = 2 would be a completely filled square with no structure.
                Real biological and geographical patterns cluster between 1.5 and 1.95, reflecting their
                intermediate complexity. A D value outside [0.5, 2.1] is almost certainly an artefact
                of preprocessing and is rejected by the analysis pipeline.
              </p>
            </Prose>
          </Card>
        </section>

        {/* ── Section 2 — Box-Counting Algorithm ──────────────────────────── */}
        <section id="box-counting" className="scroll-mt-20">
          <Card>
            <SectionHeading>The Box-Counting Algorithm</SectionHeading>
            <Prose>
              <p>
                Box-counting (also called the Minkowski–Bouligand dimension estimator) is the most
                widely used method for computing the fractal dimension of raster images. The algorithm
                is geometrically intuitive:
              </p>
            </Prose>

            <ol className="mt-6 space-y-5">
              {[
                {
                  n: "01",
                  title: "Overlay a grid",
                  text: "Cover the binary image with a regular grid of square boxes, each of side length ε (epsilon). The grid is aligned to the top-left corner of the image.",
                },
                {
                  n: "02",
                  title: "Count occupied boxes",
                  text: "Count N(ε) — the number of boxes that contain at least one white (foreground) pixel. Empty boxes are discarded.",
                },
                {
                  n: "03",
                  title: "Shrink the grid and repeat",
                  text: "Halve the box size (ε → ε/2) and repeat. FractalVision Lab iterates through powers of 2: ε ∈ {4, 8, 16, 32, 64, 128, …} up to image_size / 4. This gives 6–8 data points per analysis.",
                },
                {
                  n: "04",
                  title: "Fit the power law",
                  text: "As ε → 0, the count N(ε) grows as a power law: N(ε) ~ ε^(−D). Taking logarithms, log N(ε) = −D · log ε + const, so D is the slope of the log-log plot.",
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-900/40 border border-blue-700/40 text-blue-300 text-xs font-bold font-mono">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-gray-400 text-sm mt-0.5 leading-relaxed">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <MathBlock>
              {"D = lim(ε→0)  log N(ε) / log(1/ε)"}
            </MathBlock>

            <Prose>
              <p>
                <strong>Grid offsets.</strong> A known artefact of box-counting is that the result
                depends slightly on where the grid is anchored relative to the image. To reduce this
                grid-alignment bias, the algorithm runs box-counting at four grid offsets per box size:
                0, 25%, 50%, and 75% of the box size. For each scale, the minimum box count across
                all offsets is used rather than the average. This implements the tightest box cover —
                a conservative bound that prevents overcounting caused by favorable grid placement
                over the fractal pattern.
              </p>
            </Prose>
          </Card>
        </section>

        {/* ── Section 3 — Log-Log Regression ──────────────────────────────── */}
        <section id="regression" className="scroll-mt-20">
          <Card>
            <SectionHeading>Log-Log Regression</SectionHeading>
            <Prose>
              <p>
                The relationship N(ε) ~ ε^(−D) is linearised by taking natural logarithms of both
                sides. Letting x = log(1/ε) and y = log N(ε):
              </p>
            </Prose>

            <MathBlock>
              {"y = D · x + b"}
              <br />
              {"where  D = fractal dimension (slope),  b = intercept (constant)"}
            </MathBlock>

            <Prose>
              <p>
                FractalVision Lab fits this line using <InlineCode>scipy.stats.linregress</InlineCode>,
                which applies ordinary least-squares (OLS) regression. The key outputs are:
              </p>
            </Prose>

            <div className="mt-5 divide-y divide-gray-800/60 border border-gray-800 rounded-xl overflow-hidden">
              {[
                {
                  term: "Slope (D)",
                  def: "The estimated fractal dimension. This is the primary scientific output.",
                  tag: "blue",
                },
                {
                  term: "R² Score",
                  def: "Coefficient of determination. Measures how well the data points lie on a straight line in log-log space. R² ≥ 0.99 confirms near-perfect self-similarity across scales. Lower values suggest the pattern is not self-similar over the measured range.",
                  tag: "emerald",
                },
                {
                  term: "Standard Error",
                  def: "The standard error of the slope estimate. Smaller is better. Reported to 4 d.p. in the Reliability Dashboard.",
                  tag: "cyan",
                },
                {
                  term: "95% Confidence Interval",
                  def: "The range [D − 1.96·SE, D + 1.96·SE] within which the true fractal dimension lies with 95% probability, under the OLS assumptions. A narrow CI indicates a precise, stable estimate.",
                  tag: "purple",
                },
              ].map((row) => (
                <div key={row.term} className="flex flex-col sm:flex-row gap-2 sm:gap-6 px-5 py-3.5 hover:bg-gray-800/30 transition-colors">
                  <span className="shrink-0 w-44 font-semibold text-white text-sm">{row.term}</span>
                  <span className="text-gray-400 text-sm leading-relaxed">{row.def}</span>
                </div>
              ))}
            </div>

            <Prose>
              <p className="mt-5">
                A high R² value is the strongest single indicator of a well-behaved fractal structure.
                It confirms that the power-law relationship holds across <em>all measured scales</em>,
                not just locally — a requirement for meaningful fractal dimension estimation. Dissertation
                specimens in FractalVision Lab's gallery achieve R² ≥ 0.9953.
              </p>
            </Prose>
          </Card>
        </section>

        {/* ── Section 4 — Preprocessing Pipeline ──────────────────────────── */}
        <section id="preprocessing" className="scroll-mt-20">
          <Card>
            <SectionHeading>Image Preprocessing Pipeline</SectionHeading>
            <Prose>
              <p>
                Box-counting requires a <strong>binary image</strong> — every pixel is either foreground
                (white, 255) or background (black, 0). The preprocessing pipeline transforms a colour
                photograph into this binary mask in three stages:
              </p>
            </Prose>

            {/* Stage 1 — Grayscale */}
            <div className="mt-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-2">
                  Stage 1 — Grayscale Conversion
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The colour image (BGR format from OpenCV) is converted to an 8-bit grayscale image
                  using <InlineCode>cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)</InlineCode>. Luminance
                  weights (0.114 B + 0.587 G + 0.299 R) are applied, preserving perceptual intensity.
                  The image is also resized to a maximum dimension of 1 024 px if larger, preserving
                  aspect ratio.
                </p>
              </div>

              {/* Stage 2 — Thresholding */}
              <div>
                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3">
                  Stage 2 — Thresholding Method
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Otsu (automatic)",
                      tag: "blue",
                      text: "Otsu's method finds the global threshold that minimises intra-class variance between the foreground and background pixel intensity distributions. It is fully automatic and works well when the image has a clear bimodal histogram (e.g. a dark leaf on a bright background).",
                    },
                    {
                      label: "Adaptive (local)",
                      tag: "amber",
                      text: "For images with uneven illumination (shadows, vignetting), adaptive thresholding computes a per-pixel threshold from the weighted average of a 11×11 neighbourhood (Gaussian weights, C = 2). This suppresses lighting gradients that would confuse a global threshold.",
                    },
                    {
                      label: "Manual (user-set)",
                      tag: "purple",
                      text: "The user provides an explicit threshold value (0–255). Pixels darker than the threshold become foreground. Useful for fine-tuning or reproducing a specific preprocessing condition.",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <Tag color={item.tag as "blue" | "amber" | "purple"}>{item.label}</Tag>
                      <p className="text-gray-400 text-sm leading-relaxed flex-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 3 — Analysis Mode */}
              <div>
                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3">
                  Stage 3 — Analysis Mode
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Full Mask",
                      tag: "cyan",
                      text: "The entire thresholded binary mask is counted. D measures the total spatial complexity of the foreground structure — appropriate for solid or filled patterns.",
                    },
                    {
                      label: "Boundary (Canny edge)",
                      tag: "emerald",
                      text: "After Otsu thresholding, Canny edge detection (thresholds 50/150) extracts just the boundary pixels. D measures the complexity of the outline rather than the filled region. Particularly meaningful for smooth-edged biological specimens.",
                    },
                    {
                      label: "Texture (morphological gradient)",
                      tag: "amber",
                      text: "A morphological gradient (dilation − erosion, 3×3 kernel) highlights local texture transitions. This mode captures internal surface complexity and is appropriate for porous or textured materials.",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <Tag color={item.tag as "cyan" | "emerald" | "amber"}>{item.label}</Tag>
                      <p className="text-gray-400 text-sm leading-relaxed flex-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Section 5 — Quality & Reliability Metrics ──────────────────── */}
        <section id="quality" className="scroll-mt-20">
          <Card>
            <SectionHeading>Quality and Reliability Metrics</SectionHeading>
            <Prose>
              <p>
                Because fractal dimension estimates can be sensitive to preprocessing choices and
                image quality, FractalVision Lab accompanies every result with a multi-layer
                reliability assessment.
              </p>
            </Prose>

            <div className="mt-6 space-y-8">
              {/* Quality Score */}
              <div>
                <p className="font-semibold text-white mb-2">Quality Score (0–100)</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  A composite integer score that begins with the regression fit quality and
                  applies stepwise penalties for conditions that undermine measurement reliability.
                </p>

                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2 mt-5">
                  Base Score
                </p>
                <MathBlock>
                  {"base = R² × 100"}
                  <br />
                  {"if R² ≥ 0.999:   base += 5   (bonus for near-perfect fit)"}
                  <br />
                  {"if R² < 0.95:    base -= 20  (poor linearity)"}
                  <br />
                  {"if R² < 0.90:    base -= 20  (cumulative — very poor linearity)"}
                  <br />
                  {"if scales < 5:   base -= 10  (too few data points)"}
                </MathBlock>

                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2 mt-5">
                  Penalty Adjustments
                </p>
                <div className="divide-y divide-gray-800/60 border border-gray-800 rounded-xl overflow-hidden text-sm">
                  {[
                    { condition: "Foreground ratio < 5%",          penalty: "−15", note: "Mask too sparse — box counts dominated by noise" },
                    { condition: "Foreground ratio < 10%",         penalty: "−5",  note: "Somewhat sparse" },
                    { condition: "Foreground ratio > 95%",         penalty: "−15", note: "Near-saturated — most boxes trivially occupied" },
                    { condition: "Foreground ratio > 85%",         penalty: "−5",  note: "Somewhat dense" },
                    { condition: "Threshold sensitivity σ > 0.10", penalty: "−20", note: "Very unstable across threshold variation" },
                    { condition: "Threshold sensitivity σ > 0.05", penalty: "−10", note: "Unstable across threshold variation" },
                    { condition: "Rotation sensitivity σ > 0.10",  penalty: "−15", note: "Highly orientation-dependent" },
                    { condition: "Rotation sensitivity σ > 0.05",  penalty: "−8",  note: "Moderately orientation-dependent" },
                  ].map((row) => (
                    <div key={row.condition} className="flex items-baseline gap-4 px-5 py-2.5 hover:bg-gray-800/30 transition-colors">
                      <span className="shrink-0 w-64 font-mono text-cyan-300 text-xs">{row.condition}</span>
                      <span className="shrink-0 w-10 font-mono font-bold text-red-400 text-xs text-right">{row.penalty}</span>
                      <span className="text-gray-500 text-xs">{row.note}</span>
                    </div>
                  ))}
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mt-4">
                  Foreground ratio penalties are mutually exclusive (only the first matching
                  condition applies). Sensitivity penalties are applied only when the
                  corresponding test was run. The final score is clamped:
                </p>
                <MathBlock>
                  {"score = max(0, min(penalised_base, 100))"}
                </MathBlock>

                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2 mt-5">
                  Reliability Bands
                </p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { range: "≥ 85", label: "High", color: "border-emerald-700/40 bg-emerald-900/10 text-emerald-300" },
                    { range: "70–84", label: "Medium", color: "border-amber-700/40 bg-amber-900/10 text-amber-300" },
                    { range: "< 70", label: "Low", color: "border-red-700/40 bg-red-900/10 text-red-300" },
                  ].map((item) => (
                    <div key={item.label} className={`border rounded-xl p-3 text-center ${item.color}`}>
                      <p className="font-mono font-bold text-base">{item.range}</p>
                      <p className="text-xs mt-1 opacity-80">{item.label} reliability</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensitivity Test */}
              <div>
                <p className="font-semibold text-white mb-2">Threshold Sensitivity Test</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The sensitivity test re-runs the full analysis at three threshold values: the
                  computed threshold, threshold − 15, and threshold + 15. The standard deviation σ
                  of the three resulting D values is computed. If σ &lt; 0.05, the result is marked
                  <strong className="text-emerald-400"> Stable</strong>; otherwise it is marked{" "}
                  <strong className="text-red-400">Unstable</strong>. A stable result means the
                  fractal dimension is a robust property of the structure, not an artefact of the
                  exact threshold chosen. The test is only available for Full Mask mode with Otsu or
                  Manual threshold.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Footer CTA ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/lab"
            className="flex-1 text-center px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            Open Analyzer Lab →
          </Link>
          <Link
            href="/limitations"
            className="flex-1 text-center px-6 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors"
          >
            Read Scientific Limitations →
          </Link>
        </div>

      </div>
    </PageShell>
  );
}
