"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import type { DemandScore, GoNoGoDecision, ClassifiedSignal } from "@/lib/types";

// ─── Score Gauge Component ──────────────────────────────────

function ScoreGauge({ score }: { score: DemandScore | null }) {
  if (!score) {
    return (
      <div className="flex flex-col items-center gap-3 p-4">
        <div className="w-36 h-36 rounded-full border-2 border-border flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-fg-dim animate-spin" />
        </div>
        <p className="text-fg-dim text-sm font-mono">Scanning...</p>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score.composite / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 70) return "#22C55E";
    if (val >= 40) return "#F59E0B";
    return "#EF4444";
  };

  const color = getColor(score.composite);

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <svg width="140" height="140" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#1E293B"
          strokeWidth="8"
        />
        {/* Score ring with animation */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="gauge-ring"
          style={
            { "--gauge-offset": offset } as React.CSSProperties
          }
        />
        {/* Center text */}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          fill="#F8FAFC"
          fontSize="22"
          fontWeight="700"
          fontFamily="Geist Mono, monospace"
        >
          {Math.round(score.composite)}
        </text>
        <text
          x="50"
          y="64"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="9"
          fontFamily="Geist Mono, monospace"
        >
          /100
        </text>
      </svg>
      <p className="text-fg font-semibold text-sm">Demand Score</p>
    </div>
  );
}

// ─── Dimension Bar Component ────────────────────────────────

function DimensionBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-fg-muted">{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Decision Card Component ────────────────────────────────

function DecisionCard({ decision }: { decision: GoNoGoDecision | null }) {
  if (!decision) {
    return (
      <div className="bg-bg-card border border-border rounded p-5">
        <div className="flex items-center gap-2 text-fg-dim">
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm font-mono">Awaiting data...</span>
        </div>
      </div>
    );
  }

  const config = {
    go: {
      icon: CheckCircle2,
      color: "#22C55E",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      label: "GO — Build It",
    },
    no_go: {
      icon: XCircle,
      color: "#EF4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      label: "NO-GO — Pivot",
    },
    uncertain: {
      icon: AlertTriangle,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      label: "UNCERTAIN — More data needed",
    },
  };

  const cfg = config[decision.decision];
  const Icon = cfg.icon;

  return (
    <div
      className="p-5 rounded border"
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        <span
          className="text-sm font-bold font-mono"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {decision.goReasons.length > 0 && (
        <div className="mb-2">
          <p className="text-[11px] text-fg-dim font-mono mb-1">
            GO conditions met:
          </p>
          <ul className="space-y-0.5">
            {decision.goReasons.map((r, i) => (
              <li
                key={i}
                className="text-[12px] text-fg-muted flex items-start gap-2"
              >
                <CheckCircle2 className="w-3 h-3 text-green shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {decision.noGoReasons.length > 0 && (
        <div className="mb-2">
          <p className="text-[11px] text-fg-dim font-mono mb-1">
            NO-GO conditions triggered:
          </p>
          <ul className="space-y-0.5">
            {decision.noGoReasons.map((r, i) => (
              <li
                key={i}
                className="text-[12px] text-fg-muted flex items-start gap-2"
              >
                <XCircle className="w-3 h-3 text-red shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[13px] text-fg mt-3 leading-relaxed">
        {decision.recommendation}
      </p>
    </div>
  );
}

// ─── Signal Feed Component ──────────────────────────────────

function SignalFeed({ signals }: { signals: ClassifiedSignal[] }) {
  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-fg-dim">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-mono">No signals collected yet.</p>
        <p className="text-[12px] font-mono mt-1">
          Run a scan to find demand signals.
        </p>
      </div>
    );
  }

  const sourceColors: Record<string, string> = {
    reddit: "#FF4500",
    hackernews: "#FF6600",
    producthunt: "#DA552F",
    googletrends: "#4285F4",
    fiverr: "#1DBF73",
    upwork: "#14A800",
    gumroad: "#FF90E8",
  };

  const typeLabels: Record<string, string> = {
    pain_point: "Pain Point",
    feature_request: "Feature Req.",
    complaint: "Complaint",
    comparison: "Comparison",
    payment_signal: "WTP Signal",
    question: "Question",
  };

  return (
    <div className="space-y-2">
      {signals.slice(0, 50).map((signal, i) => (
        <a
          key={i}
          href={signal.url || signal.permalink || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="signal-card block p-3 bg-bg-card border border-border rounded cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: sourceColors[signal.source] || "#94A3B8",
                    backgroundColor:
                      (sourceColors[signal.source] || "#94A3B8") + "15",
                  }}
                >
                  {signal.source}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    signal.type === "payment_signal"
                      ? "bg-green/15 text-green"
                      : signal.type === "pain_point"
                      ? "bg-red/15 text-red"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {typeLabels[signal.type] || signal.type}
                </span>
                {signal.intensity > 0.6 && (
                  <span className="text-[10px] font-mono text-amber">
                    <Zap className="w-3 h-3 inline -mt-px" /> High
                  </span>
                )}
              </div>
              <p className="text-[13px] text-fg font-medium truncate">
                {signal.title}
              </p>
              <p className="text-[12px] text-fg-muted mt-0.5 line-clamp-2">
                {signal.content}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-fg-dim font-mono whitespace-nowrap">
              {signal.engagement > 0 && (
                <>
                  <TrendingUp className="w-3 h-3" />
                  {signal.engagement}
                </>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Main Dashboard Page ────────────────────────────────────

interface DashboardData {
  title: string;
  keywords: string[];
  signals: any[];
  latestScore: any;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("id");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!topicId) return;
    try {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const d = await res.json();
      setData(d);
    } catch (err) {
      setError("Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchData();
    // Poll every 10s while scanning
    const interval = setInterval(() => {
      if (data && !data.latestScore) fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData, data]);

  const runScan = async () => {
    if (!topicId || !data) return;
    setScanning(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: data.title }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <p className="text-red text-sm font-mono">{error || "Topic not found"}</p>
        <button
          onClick={() => router.push("/")}
          className="text-accent text-sm font-mono hover:underline"
        >
          Back to home
        </button>
      </div>
    );
  }

  const score = data.latestScore
    ? {
        composite: data.latestScore.compositeScore,
        frequency: data.latestScore.frequencyScore,
        intensity: data.latestScore.intensityScore,
        specificity: data.latestScore.specificityScore,
        monetizability: data.latestScore.monetizabilityScore,
        totalSignals: data.latestScore.totalSignals,
        activeSignals: data.latestScore.activeSignals,
        growthRate: data.latestScore.growthRate,
      }
    : null;

  const decision = data.latestScore
    ? {
        decision: data.latestScore.goDecision || "uncertain",
        goReasons: data.latestScore.goReasons || [],
        noGoReasons: data.latestScore.noGoReasons || [],
        recommendation: "",
      }
    : null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
            <span className="text-fg font-semibold text-[14px]">
              Signal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white text-[13px] font-medium rounded cursor-pointer hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Re-scan
              </>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Topic Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-fg">{data.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            {data.keywords?.slice(0, 5).map((kw: string) => (
              <span
                key={kw}
                className="text-[11px] font-mono px-2 py-0.5 bg-bg-card border border-border rounded text-fg-muted"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Top Row: Score + Dimensions + Decision */}
        <div className="grid grid-cols-12 gap-4 mb-8">
          {/* Score Gauge */}
          <div className="col-span-3 bg-bg-card border border-border rounded p-4 flex flex-col items-center">
            <ScoreGauge score={score} />
            {score && (
              <p className="text-[11px] text-fg-dim font-mono mt-1">
                {score.totalSignals} signals · {score.activeSignals} active
              </p>
            )}
          </div>

          {/* Dimensions */}
          <div className="col-span-5 bg-bg-card border border-border rounded p-5 space-y-3">
            <h3 className="text-[13px] font-semibold text-fg mb-3">
              Score Breakdown
            </h3>
            {score ? (
              <>
                <DimensionBar
                  label="Intensity"
                  value={score.intensity}
                  max={30}
                  color="#5E6AD2"
                />
                <DimensionBar
                  label="Monetizability"
                  value={score.monetizability}
                  max={25}
                  color="#22C55E"
                />
                <DimensionBar
                  label="Frequency"
                  value={score.frequency}
                  max={25}
                  color="#F59E0B"
                />
                <DimensionBar
                  label="Specificity"
                  value={score.specificity}
                  max={20}
                  color="#94A3B8"
                />
                <div className="flex items-center gap-2 mt-3 text-[11px] font-mono">
                  <span className="text-fg-dim">Growth:</span>
                  {score.growthRate > 0 ? (
                    <span className="text-green flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />+
                      {Math.round(score.growthRate * 100)}%
                    </span>
                  ) : (
                    <span className="text-red flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {Math.round(score.growthRate * 100)}%
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-fg-dim text-sm font-mono">
                Run a scan to calculate scores
              </p>
            )}
          </div>

          {/* Decision */}
          <div className="col-span-4">
            <DecisionCard decision={decision} />
          </div>
        </div>

        {/* Signal Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-fg">
              Demand Signals
            </h2>
            <span className="text-[12px] text-fg-dim font-mono">
              {data.signals?.length ?? 0} signals collected
            </span>
          </div>
          <SignalFeed signals={data.signals ?? []} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
