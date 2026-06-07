"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

export default function HomePage() {
  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden relative">
      {/* SECTION 1 — Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Overlapping radial gradient glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start md:items-center md:text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full"
          >
            <motion.p variants={fadeInUp} className="text-xs md:text-sm font-semibold tracking-[0.2em] text-blue-400/80 uppercase mb-4">
              Mathematics & Computing · Fractal Geometry
            </motion.p>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-blue-400 via-cyan-300 to-blue-600 max-w-5xl md:mx-auto pb-2">
              Quantify the Complexity Hidden in Nature
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl md:mx-auto leading-relaxed">
              An interactive scientific tool for computing fractal dimensions of natural
              patterns using the box-counting method — underpinned by original academic
              research in fractal geometry.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-start md:justify-center gap-4 mb-16 w-full">
              <Link href="/lab" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-center shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                Open Analyzer Lab
              </Link>
              <Link href="/gallery" className="w-full sm:w-auto px-8 py-3.5 border border-blue-500/50 hover:border-blue-400 text-blue-300 hover:text-blue-200 hover:bg-blue-900/20 font-semibold rounded-lg transition-colors text-center">
                Explore Specimens
              </Link>
            </motion.div>

            {/* Stats strip + decorative SVG */}
            <motion.div variants={fadeInUp} className="w-full pt-8 mt-4 border-t border-gray-800/50">
              <div className="flex items-center justify-center gap-8">
                {/* Stats */}
                <div className="flex-1 max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
                  <div className="flex flex-col items-center md:border-r border-gray-800/50">
                    <span className="text-4xl font-bold text-white mb-1">11</span>
                    <span className="text-sm text-gray-500 font-medium">Specimens Analyzed</span>
                  </div>
                  <div className="flex flex-col items-center md:border-r border-gray-800/50">
                    <span className="text-4xl font-bold text-white mb-1">1.35–1.99</span>
                    <span className="text-sm text-gray-500 font-medium">Fractal Dimension Range</span>
                  </div>
                  <div className="flex flex-col items-center md:border-r border-gray-800/50">
                    <span className="text-4xl font-bold text-white mb-1">&gt;0.99</span>
                    <span className="text-sm text-gray-500 font-medium">Average R² Score</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-white mb-1">3</span>
                    <span className="text-sm text-gray-500 font-medium">Analysis Modes</span>
                  </div>
                </div>

                {/* Decorative log-log chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className="hidden lg:block shrink-0 w-[280px] h-[200px] opacity-30 pointer-events-none"
                >
                  <svg width="280" height="200" viewBox="0 0 280 200" className="drop-shadow-lg">
                    <line x1="20" y1="180" x2="260" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="20" y1="20" x2="20" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="160" x2="240" y2="40" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                    <line x1="40" y1="140" x2="240" y2="60" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
                    <circle cx="80" cy="136" r="4" fill="#60a5fa" />
                    <circle cx="140" cy="100" r="4" fill="#60a5fa" />
                    <circle cx="200" cy="64" r="4" fill="#60a5fa" />
                    <circle cx="90" cy="120" r="3" fill="#fbbf24" />
                    <circle cx="150" cy="96" r="3" fill="#fbbf24" />
                    <circle cx="210" cy="72" r="3" fill="#fbbf24" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — How It Works */}
      <section className="relative px-4 py-24 md:py-32 bg-gray-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16 md:text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">From Image to Fractal Dimension in 4 Steps</h2>
            <p className="text-gray-400 text-lg max-w-2xl md:mx-auto">
              A rigorous OpenCV pipeline runs server-side for reproducibility and scientific accuracy.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="relative flex flex-col lg:flex-row gap-8 lg:gap-4 justify-between"
          >
            {/* Desktop Connectors */}
            <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gray-800 -translate-y-1/2 z-0" />
            <div className="hidden lg:flex absolute top-1/2 left-[30%] right-[10%] justify-between -translate-y-1/2 z-0 px-8 text-gray-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>

            {[
              {
                step: "01",
                title: "Preprocess",
                desc: "Upload any image. Choose Full Mask, Boundary (Canny edge), or Texture (morphological gradient) extraction mode.",
              },
              {
                step: "02",
                title: "Threshold",
                desc: "Otsu auto-thresholding, adaptive localized, or manual — converts to a precise binary mask.",
              },
              {
                step: "03",
                title: "Box Count",
                desc: "Non-empty boxes counted across scales (powers of 2) with 4 grid offsets for maximum accuracy.",
              },
              {
                step: "04",
                title: "Regress",
                desc: "Log-log linear regression yields D and R². Confidence intervals and sensitivity analysis validate every result.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="relative z-10 flex-1 bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl border border-gray-800 shadow-xl overflow-hidden"
              >
                <div className="absolute -top-4 -right-2 text-8xl font-black text-white/[0.03] select-none pointer-events-none">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-blue-400 mb-3 relative z-10">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — Feature Highlights */}
      <section className="px-4 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16 md:text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Scientific Rigour</h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              {
                title: "Reliability Dashboard",
                desc: "Every analysis returns a quality score (0–100), 95% confidence interval, standard error, and threshold sensitivity test.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )
              },
              {
                title: "Specimen Comparison Engine",
                desc: "Overlay your log-log regression line against 11 dissertation specimens on a shared auto-scaled D3 chart. ΔD computed instantly.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                )
              },
              {
                title: "Algorithm Microscope",
                desc: "Watch the box-counting grid render live on the binary image at every scale. Step through each counting level interactively.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
                  </svg>
                )
              },
              {
                title: "Multi-Mode Preprocessing",
                desc: "3 analysis modes × 3 threshold methods = 9 preprocessing combinations. Auto-reanalysis fires on every change with 600ms debounce.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                )
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-[#0f111a] border border-gray-800 p-8 rounded-2xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] flex flex-col"
              >
                <div className="mb-6 p-3 bg-gray-900 rounded-xl w-fit border border-gray-800">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 4 — Tech Stack */}
      <section className="px-4 py-24 md:py-32 bg-gray-900/30 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built With</h2>
            <p className="text-gray-400 text-lg">Production-grade tools chosen for reproducibility and performance.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left"
          >
            <motion.div variants={fadeInUp}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-800 pb-2">Frontend</h3>
              <div className="flex flex-wrap gap-2">
                {["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "D3.js", "Zustand", "Framer Motion", "Supabase JS"].map((tech) => (
                  <span key={tech} className="px-3 py-1.5 bg-blue-900/20 border border-blue-800/30 text-blue-200 text-sm rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-800 pb-2">Backend</h3>
              <div className="flex flex-wrap gap-2">
                {["FastAPI", "Python 3.14", "OpenCV", "NumPy", "SciPy", "Supabase PostgreSQL", "Uvicorn", "slowapi"].map((tech) => (
                  <span key={tech} className="px-3 py-1.5 bg-amber-900/20 border border-amber-800/30 text-amber-200 text-sm rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mt-20 flex flex-col items-center"
          >
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">Data Flow Architecture</h3>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-xs md:text-sm font-mono text-gray-400">
              <div className="px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg">Browser</div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden md:block text-gray-600"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block md:hidden text-gray-600 rotate-90"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              <div className="px-4 py-2 border border-blue-900 bg-blue-900/10 rounded-lg text-blue-300">Next.js + Zustand</div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden md:block text-gray-600"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block md:hidden text-gray-600 rotate-90"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              <div className="px-4 py-2 border border-amber-900 bg-amber-900/10 rounded-lg text-amber-300">FastAPI + OpenCV</div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden md:block text-gray-600"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block md:hidden text-gray-600 rotate-90"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              <div className="px-4 py-2 border border-emerald-900 bg-emerald-900/10 rounded-lg text-emerald-300">Supabase</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — Final CTA */}
      <section className="relative px-4 py-32 overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">
            Ready to Analyze Your First Image?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-gray-400 mb-10">
            Upload a leaf, coastline, or any natural pattern. Results in seconds.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="/lab" className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] hover:-translate-y-1">
              Launch Analyzer Lab
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
