// Core type definitions for Signal platform

export type SignalSource =
  | "reddit"
  | "hackernews"
  | "producthunt"
  | "googletrends"
  | "fiverr"
  | "upwork"
  | "gumroad";

export type SignalType =
  | "pain_point"
  | "feature_request"
  | "complaint"
  | "comparison"
  | "payment_signal"
  | "question";

export interface RawSignal {
  source: SignalSource;
  title: string;
  content: string;
  url?: string;
  permalink?: string;
  author?: string;
  engagement: number; // upvotes/likes/replies
  extractedAt: Date;
}

export interface ClassifiedSignal extends RawSignal {
  type: SignalType;
  intensity: number; // 0-1
  specificity: number; // 0-1
  wtpSignal: number; // 0-1, willingness-to-pay
  classificationReason: string;
}

export interface DemandScore {
  composite: number; // 0-100
  frequency: number; // 0-25
  intensity: number; // 0-30
  specificity: number; // 0-20
  monetizability: number; // 0-25
  totalSignals: number;
  activeSignals: number; // last 30 days
  growthRate: number; // % change MoM
}

export interface GoNoGoDecision {
  decision: "go" | "no_go" | "uncertain";
  goReasons: string[]; // GO conditions met
  noGoReasons: string[]; // NO-GO conditions triggered
  recommendation: string;
}

export interface ExpandedKeywords {
  direct: string[]; // 直接关键词 e.g. ["epub to pdf converter"]
  adjacent: string[]; // 相邻问题词 e.g. ["epub formatting breaks", "calibre too complicated"]
  coOccurring: string[]; // 共现词 e.g. ["batch convert epub files"]
  platformContext: string[]; // 平台语境词 e.g. ["looking for epub converter"]
  exclude: string[]; // 排除歧义词 e.g. ["epub reader app"]
}

export interface UserPersona {
  name: string;
  role: string;
  currentSolution: string;
  painPoint: string;
  spending: string; // e.g. "$0, using free tools"
  willingness: "high" | "medium" | "low";
  quote: string; // synthesized from real comments
}

export interface SourceConfig {
  name: SignalSource;
  enabled: boolean;
  weight: number; // 0-1, contribution to composite score
  maxResults: number;
}
