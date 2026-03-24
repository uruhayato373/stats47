// ============================================================
// ランキングページ向け型定義
// ============================================================

export interface FaqItem {
  question: string;
  answer: string;
  type: "top_ranking" | "bottom_ranking" | "average" | "trend" | "regional" | "custom";
}

export interface FaqContent {
  items: FaqItem[];
}

// ============================================================
// ダッシュボードページ向け型定義
// ============================================================

export interface TrendFaqItem {
  question: string;
  answer: string;
  type: "trend" | "peak" | "comparison" | "forecast" | "custom";
}

export interface TrendMetrics {
  periodStart: string;
  periodEnd: string;
  totalChangeRate: number;
  totalChangeValue: number;
  latestChangeRate: number;
  direction: "increasing" | "decreasing" | "stable" | "fluctuating";
  turningPoint?: { year: string; description: string };
  vsNationalAvg: "above" | "below" | "similar";
}
