// ============================================================
// AutoApply AI — Landing Page
// ============================================================

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-primary-500 selection:text-white">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-neutral-800/80 glass px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent group-hover:from-primary-300 group-hover:to-primary-500 transition-all duration-300">
            ✦ AutoApply AI
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-primary-400 transition-colors">Features</a>
          <a href="#matrix" className="hover:text-primary-400 transition-colors">Supported Platforms</a>
          <a href="#pricing" className="hover:text-primary-400 transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary-400 transition-colors">
            Log In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-all shadow-[0_0_15px_rgba(79,107,246,0.3)] hover:shadow-[0_0_25px_rgba(79,107,246,0.5)]"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 lg:px-12 py-20 lg:py-32 overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-accent-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto z-10 flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/5 text-primary-400 text-xs font-semibold uppercase tracking-wider">
            ⚡ Autonomous Career Automation Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
            Let AI Apply to Jobs <br className="hidden sm:inline" />
            On Your Behalf, 24/7
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-neutral-400 leading-relaxed">
            Upload your resumes, secure-link your job board profiles, and let our continuous multimodal agent scan listings, score relevance, write custom cover letters, and fill out forms automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Link
              href="/register"
              className="px-8 py-4 text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-all shadow-[0_0_20px_rgba(79,107,246,0.4)] hover:shadow-[0_0_30px_rgba(79,107,246,0.6)]"
            >
              Start Auto-Applying Now
            </Link>
            <a
              href="#features"
              className="px-8 py-4 text-base font-semibold text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 rounded-md transition-all hover:bg-neutral-900"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="border-t border-neutral-850 px-6 lg:px-12 py-20 bg-neutral-900/20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Features Built for Modern Job Hunting</h2>
            <p className="text-neutral-400 text-base">We handle the repetitive forms, filtering, and customization so you can focus entirely on acing interviews.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:border-primary-500/30 transition-all duration-300">
              <span className="text-3xl">🤖</span>
              <h3 className="text-xl font-bold mt-4 mb-2">Multimodal AI filler</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">DOM analysis coupled with Vision fallbacks detects form contexts, matching skills, experience, and custom pre-screening queries flawlessly.</p>
            </div>
            <div className="p-8 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:border-primary-500/30 transition-all duration-300">
              <span className="text-3xl">🔗</span>
              <h3 className="text-xl font-bold mt-4 mb-2">Aggregator Matrix</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Twin-column layout cleanly segregates domestic Indian job sites from global platforms, managing credentials securely.</p>
            </div>
            <div className="p-8 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:border-primary-500/30 transition-all duration-300">
              <span className="text-3xl">📈</span>
              <h3 className="text-xl font-bold mt-4 mb-2">AI Insights Center</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Evaluates ATS parsing health, builds interactive skill gap radar charts, and recommends concrete coursework to close profile deficits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
        <div>© 2026 AutoApply AI. All rights reserved.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-neutral-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-neutral-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-neutral-400 transition-colors">Security Audit</a>
        </div>
      </footer>
    </div>
  );
}
