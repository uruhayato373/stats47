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

// ------------------------------------------------------------
// 都道府県別解説（SEO 長尾コンテンツ）
// 各県の順位・値・短い解説を保持する。
// ------------------------------------------------------------

export interface PrefectureCommentaryItem {
  /** 5桁の都道府県コード (例: "13000") */
  areaCode: string;
  /** 都道府県名 (例: "東京都") */
  areaName: string;
  /** 順位 (1-47) */
  rank: number;
  /** 値 (単位は ranking の unit と一致) */
  value: number;
  /** 60〜120 字の解説 (相対位置・地域内の位置づけ等) */
  commentary: string;
}

export interface PrefectureCommentaryContent {
  items: PrefectureCommentaryItem[];
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
