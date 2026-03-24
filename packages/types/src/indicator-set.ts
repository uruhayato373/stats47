/**
 * IndicatorSet — KPI・チャート定義の一元管理型
 *
 * theme-dashboard / compare (SNS) / Remotion が共通で参照する
 * 「指標セット」の定義。ranking_items.ranking_key をグルーピングし、
 * チャート・表示ルールを付与する。
 */

// ============================================================================
// チャート定義
// ============================================================================

/** 系列定義（折れ線チャート等で使用） */
export interface ChartSeriesDef {
  rankingKey: string;
  name: string;
  color: string;
}

/** 2系列の時系列折れ線チャート */
export interface DualLineChartDef {
  type: "dual-line";
  label: string;
  series: [ChartSeriesDef, ChartSeriesDef];
  unit?: string;
  source?: string;
}

/** Server Action で取得するドーナツチャート */
export interface DonutChartDef {
  type: "donut-action";
  label: string;
  actionId: string;
  source?: string;
}

/** チャート定義のユニオン型 */
export type ChartDefinition = DualLineChartDef | DonutChartDef;

// ============================================================================
// 指標エントリ
// ============================================================================

/** 個々の指標エントリ */
export interface IndicatorEntry {
  /** ranking_items.ranking_key */
  rankingKey: string;
  /** 短縮ラベル（タブ・凡例・比較表示用、例: "高齢化率"） */
  shortLabel: string;
  /**
   * この指標セット内での役割
   * - primary: タブ表示・デフォルト選択候補
   * - secondary: タブ表示するが primary ではない
   * - context: 補足指標（パネル内のみ表示、compare には含めない）
   */
  role?: "primary" | "secondary" | "context";
}

// ============================================================================
// パネルタブ（指標のグルーピング）
// ============================================================================

/** パネルタブグループ（テーマ内で指標をサブグループ化） */
export interface IndicatorPanelTab {
  label: string;
  rankingKeys: string[];
  charts?: ChartDefinition[];
}

// ============================================================================
// IndicatorSet 本体
// ============================================================================

/** 指標セットのカテゴリ */
export type IndicatorSetCategory =
  | "demographics"
  | "economy"
  | "finance"
  | "welfare"
  | "education"
  | "lifestyle"
  | "safety"
  | "industry"
  | "tourism";

/** 指標セットの用途タグ */
export type IndicatorSetUsage = "theme" | "compare" | "both";

/**
 * IndicatorSet: KPI グループの一元定義
 *
 * 一つの IndicatorSet を theme-dashboard / compare / SNS / Remotion が
 * 消費者として参照する。
 */
export interface IndicatorSet {
  /** 一意キー（例: "aging-society", "fiscal"） */
  key: string;
  /** 表示名（例: "少子高齢化"） */
  title: string;
  /** 説明文（SEO description のベースにもなる） */
  description: string;
  /** 分類カテゴリ */
  category: IndicatorSetCategory;
  /** 用途（theme / compare / both） */
  usage: IndicatorSetUsage;
  /** 含まれる指標（表示順） */
  indicators: IndicatorEntry[];
  /** トップレベルのチャート定義 */
  charts?: ChartDefinition[];
  /** パネルタブ（指標をサブグループ化する場合） */
  panelTabs?: IndicatorPanelTab[];
  /** SEO キーワード */
  keywords?: string[];
}
