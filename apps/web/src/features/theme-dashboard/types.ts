import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { TopoJSONTopology } from "@stats47/types";

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
  // チャートは page_components (git TS) で管理（Single Source of Truth）
  /**
   * テーマに紐付く関連記事を取得するタグキー一覧。
   * 未指定 or 空配列の場合、ThemePageLayout は関連記事セクションを描画しない。
   */
  relatedArticleTagKeys?: string[];
  /**
   * ダッシュボード本体の下に埋め込む GIS マップ section のキー一覧。
   * THEME_SECTION_REGISTRY (config/theme-section-registry.tsx) に登録された
   * component を順に描画する。1 つの section を複数テーマから再利用できる
   * (例: "depopulation-medical" は healthcare と aging-society の両方で使用)。
   */
  embeddedSections?: string[];
  /**
   * 地図を非表示にしカード主役レイアウトにする。
   * true のとき ThemeDashboardTabbed は地図 (ThemeLeafletMap) を描画せず、
   * 「全国の主要指標」KPI スタットカード (ThemeMetricsDashboard) を主役として先頭に配置する。
   */
  hideMap?: boolean;
}

/** 指標ごとのプリロード済みデータ */
export interface ThemeIndicatorData {
  rankingItem: RankingItem;
  rankingValues: RankingValue[];
  /** 利用可能年度リスト（年度セレクタ用） */
  availableYears?: { yearCode: string; yearName: string }[];
  /**
   * 全国値（e-Stat の areaCode "00000" 行の値、最新年度）。
   * 計算型 / city / port 指標など全国行が無い場合は undefined。
   * 表示側は undefined なら都道府県値の単純平均にフォールバックする。
   */
  nationalValue?: number;
  /**
   * 全国行 (areaCode "00000") の値の年次推移。カード内 MiniLineChart 用。
   * 計算型 / city / port 指標など全国行が無い場合は undefined。
   */
  nationalSeries?: { year: number; value: number }[];
}

/** Server → Client に渡す props */
export interface ThemeDashboardClientProps {
  themeConfig: ThemeConfig;
  /** 全指標のプリロード済みデータ（rankingKey → data） */
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** TopoJSON */
  topology: TopoJSONTopology | null;
  /** DB 管理チャート（page_components + page_component_assignments） */
  pageCharts?: import("@/components/stat-charts/services/load-page-components").PageComponent[];
  /** KPI カードの全都道府県データ（chartKey → areaCode → KpiCardClientProps） */
  kpiDataByArea?: Record<string, Record<string, import("@/components/stat-charts/components/cards/KpiCard/KpiCardClient").KpiCardClientProps>>;
  /** ハイライト対象の都道府県コード（5桁、/areas/[code]/[themeSlug] 経由時に設定） */
  highlightAreaCode?: string;
}
