import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { TopoJSONTopology } from "@stats47/types";

// ============================================================================
// テーマダッシュボード固有の型
// ============================================================================

/**
 * Theme Dashboard の地理スコープ状態 (GEO-SCOPE-SEPARATION-01 WP1)。
 *
 * `docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md` §3.1 が定義する
 * `PrefectureView`。未選択は e-Stat の全国コード "00000" ではなく `prefecture-set`
 * (47都道府県) として明示する。日本全国の統計は別 context (`/japan/*`) が持ち、
 * このダッシュボードの型には混ぜない。
 *
 * ★段階移行: 既存 `ThemePrefectureContext` (`selectedPrefectureCode: string | null`) は
 *   引き続き内部表現として残る。この型は新規consumerが「未選択=47都道府県」であることを
 *   型で強制するための橋渡しで、`toPrefectureView` (同ファイル) が変換する。
 */
export type PrefectureView =
  | { scope: "prefecture-set" }
  | { scope: "prefecture"; prefectureCode: string; prefectureName: string };

/** 未選択時の表示名。「全国」ではなく「47都道府県」と呼ぶ (情報設計 §地理スコープ)。 */
export const PREFECTURE_SET_LABEL = "47都道府県";

/**
 * 既存の `selectedPrefectureCode: string | null` 表現から `PrefectureView` へ変換する。
 * `null` を e-Stat の "00000" とは解釈しない (単に「未選択」を表す)。
 */
export function toPrefectureView(
  selectedPrefectureCode: string | null,
  selectedAreaName: string | null,
): PrefectureView {
  if (!selectedPrefectureCode) return { scope: "prefecture-set" };
  return {
    scope: "prefecture",
    prefectureCode: selectedPrefectureCode,
    prefectureName: selectedAreaName ?? "選択地域",
  };
}

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
  /**
   * 指標カードの編成 (ThemeCatalog.metricGroups)。server component が
   * THEME_CATALOGS から直読みして渡す。未定義テーマは 1 グループにフォールバック。
   */
  metricGroups?: import("@stats47/data-configs/theme-catalog").CatalogMetricGroup[];
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
