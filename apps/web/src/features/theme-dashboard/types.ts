import type { RankingItem, RankingValue } from "@stats47/ranking";
import type {
  IndicatorPanelTab,
  TopoJSONTopology,
} from "@stats47/types";

// ============================================================================
// テーマダッシュボード固有の型
// ============================================================================

/** タブ型指標の設定 */
export interface TabIndicatorConfig {
  /** ランキングキー */
  rankingKey: string;
  /** タブに表示する短いラベル（例: "出生率"） */
  tabLabel: string;
}

/** Markdown セクションの出典情報 */
export interface MarkdownSectionSource {
  /** 表示するラベル（例: "総務省統計局 人口推計"） */
  label: string;
  /** リンク先 URL（省略時は label のみ表示） */
  url?: string;
}

/**
 * Markdown セクションコンポーネントの props
 *
 * page_components.componentProps に保存される構造。
 * componentType="markdown-section" の場合に利用。
 */
export interface MarkdownSectionComponentProps {
  /** 本文（Markdown 文字列） */
  markdown: string;
  /** サブタイトル（タイトル下の小さな説明文） */
  subtitle?: string;
  /** 出典リスト（末尾に「出典」見出し付きで表示） */
  sources?: MarkdownSectionSource[];
}

/** 統計パネルのタブグルーピング設定 */
export interface PanelTabGroup {
  /** タブラベル */
  label: string;
  /** このタブに表示する rankingKey 一覧 */
  rankingKeys: string[];
  // チャートは chart_definitions テーブルで管理（Single Source of Truth）
}

/** テーマ設定 */
export interface ThemeConfig {
  themeKey: string;
  title: string;
  description: string;
  /** 表示する指標のランキングキー一覧（表示順） */
  rankingKeys: string[];
  /** デフォルト表示する指標 */
  defaultRankingKey: string;
  /** SEO キーワード */
  keywords: string[];
  /** タブ型指標セレクタの設定 */
  tabIndicators: TabIndicatorConfig[];
  // チャートは chart_definitions テーブルで管理（Single Source of Truth）
  /** 統計パネルの KPI をタブでグルーピング（未指定時はフラット表示） */
  panelTabs?: PanelTabGroup[];
  /**
   * テーマに紐付く関連記事を取得するタグキー一覧。
   * 未指定 or 空配列の場合、ThemePageLayout は関連記事セクションを描画しない。
   */
  relatedArticleTagKeys?: string[];
}

/** 指標ごとのプリロード済みデータ */
export interface ThemeIndicatorData {
  rankingItem: RankingItem;
  rankingValues: RankingValue[];
  /** 利用可能年度リスト（年度セレクタ用） */
  availableYears?: { yearCode: string; yearName: string }[];
}

/** Server → Client に渡す props */
export interface ThemeDashboardClientProps {
  themeConfig: ThemeConfig;
  /** 全指標のプリロード済みデータ（rankingKey → data） */
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** TopoJSON */
  topology: TopoJSONTopology | null;
  /** DB 管理チャート（page_components + page_component_assignments） */
  pageCharts?: import("@/features/stat-charts/services/load-page-components").PageComponent[];
  /** KPI カードの全都道府県データ（chartKey → areaCode → KpiCardClientProps） */
  kpiDataByArea?: Record<string, Record<string, import("@/features/stat-charts/components/cards/KpiCard/KpiCardClient").KpiCardClientProps>>;
}

// ============================================================================
// IndicatorSet → ThemeConfig 変換
// ============================================================================

/**
 * IndicatorSet → ThemeConfig 変換ユーティリティ
 *
 * @stats47/types の IndicatorPanelTab → ThemeConfig の PanelTabGroup は
 * 構造が同一なのでそのまま渡せる。
 */
export { toThemeConfig } from "./lib/to-theme-config";

// PanelTabGroup と IndicatorPanelTab の互換性を型レベルで保証
type _AssertAssignable<A, B> = A extends B ? B extends A ? true : never : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _PanelTabCompat = _AssertAssignable<PanelTabGroup, IndicatorPanelTab>;
