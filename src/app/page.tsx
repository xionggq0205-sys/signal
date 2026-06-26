"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: query.trim(),
          description: query.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create topic");
      }

      const topic = await res.json();
      router.push(`/dashboard?id=${topic.id}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-12 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full border-2 border-accent flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
          <span className="text-fg font-semibold tracking-tight text-[15px]">
            Signal
          </span>
        </div>
        <button className="px-4 py-1.5 text-[13px] font-medium bg-accent text-white rounded cursor-pointer hover:bg-accent-light transition-colors">
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative">
          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative text-center max-w-[600px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-mono text-accent uppercase tracking-wider">
                Now in private beta
              </span>
            </div>

            <h1 className="text-[52px] font-bold leading-[1.1] tracking-[-0.03em] mb-4">
              Validate before
              <br />
              <span className="text-accent">you build.</span>
            </h1>

            <p className="text-fg-muted text-lg leading-relaxed max-w-[480px] mx-auto mb-8">
              Enter a product idea. Signal scans Reddit, Hacker News, Product
              Hunt, Google Trends, and marketplaces to tell you if there is real
              demand — with a score, not a guess.
            </p>

            {/* Input */}
            <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='e.g. "epub to pdf converter" or "AI meal planner"'
                  className="flex-1 px-4 py-3 bg-bg-card border border-border rounded text-[15px] text-fg placeholder:text-fg-dim focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-5 py-3 bg-accent text-white font-medium text-[15px] rounded cursor-pointer hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      Scan
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red text-sm mt-3 text-left">{error}</p>
              )}
              <p className="text-fg-dim text-[12px] mt-3 font-mono">
                No credit card required · Free forever plan
              </p>
            </form>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex gap-6 mt-16">
          {[
            {
              icon: Activity,
              label: "5 sources",
              desc: "Reddit, HN, PH, Trends, Fiverr",
            },
            {
              icon: TrendingUp,
              label: "4D Scoring",
              desc: "Freq × Intensity × Detail × WTP",
            },
            {
              icon: Target,
              label: "GO / NO-GO",
              desc: "Clear build-or-pivot decision",
            },
            {
              icon: Zap,
              label: "Results in 30s",
              desc: "Instant first scan, then monitoring",
            },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 px-4 py-3 bg-bg-card border border-border rounded"
            >
              <f.icon className="w-4 h-4 text-accent" />
              <div>
                <div className="text-[13px] font-semibold text-fg">
                  {f.label}
                </div>
                <div className="text-[11px] text-fg-dim font-mono">
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-border">
        <span className="text-fg-dim text-[12px] font-mono">
          &copy; 2026 Signal. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
