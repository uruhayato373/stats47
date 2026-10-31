import type { RankingItem, RankingValue } from "@stats47/ranking";

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

/**
 * 県を選んでいないときの地域名。テーマのページは 1 つの地域を見せ、県を選ばなければ全国の値 (e-Stat の全国行) を出す
 * (2026-10-31 オーナー決定。旧: 「47都道府県」と呼び、1 位の県の値を出していた)。47 都道府県の比較はランキングのページ。
 */
export const NATIONAL_REGION_LABEL = "全国";

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
interface MarkdownSectionBaseProps {
  /** サブタイトル（タイトル下の小さな説明文） */
  subtitle?: string;
  /** 出典リスト（末尾に「出典」見出し付きで表示） */
  sources?: MarkdownSectionSource[];
}

/** 通常の長文セクション、または生成時に構造化済みの FAQ。 */
export type MarkdownSectionComponentProps = MarkdownSectionBaseProps &
  (
    | {
        displayMode?: "prose";
        /** 本文（Markdown 文字列） */
        markdown: string;
        items?: never;
      }
    | {
        displayMode: "faq";
        items: Array<{ question: string; answer: string }>;
        markdown?: never;
      }
  );

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
}

/** 指標ごとのプリロード済みデータ */
export interface ThemeIndicatorData {
  rankingItem: RankingItem;
  rankingValues: RankingValue[];
  /** 利用可能年度リスト（年度セレクタ用） */
  availableYears?: { yearCode: string; yearName: string }[];
  /**
   * 全国の値 (公式の全国の系列 app/japan/<key>/series.json の最新の値)。無い指標は undefined で、
   * 全国のページは値を出さない (47 県の平均で埋めない。2026-10-31)
   */
  nationalValue?: number;
  /**
   * 各年の 47 都道府県の単純平均。全国の値ではない (表示するときは「都道府県平均」と呼ぶ)。
   * 県の系列が取れない指標の推移の代わりに使う。
   */
  nationalSeries?: { year: number; value: number }[];
  /** 公式の全国の系列 (app/japan/<key>/series.json)。全国のページの推移に使う。無い指標は undefined (2026-10-31) */
  officialNationalSeries?: { year: number; value: number }[];
}

/** Server → Client に渡す props */
export interface ThemeDashboardClientProps {
  themeConfig: ThemeConfig;
  /**
   * 指標カードの編成 (ThemeCatalog.metricGroups)。server component が
   * THEME_CATALOGS から直読みして渡す。未定義テーマは 1 グループにフォールバック。
   */
  metricGroups?: import("@stats47/data-configs/theme-catalog").CatalogMetricGroup[];
  sections?: import("@stats47/data-configs/theme-catalog").CatalogSection[];
  /** Server-rendered visualizations, inserted into their editorial chapter. */
  embeddedSections?: Record<string, import("react").ReactNode>;
  /** 全指標のプリロード済みデータ（rankingKey → data） */
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** DB 管理チャート（page_components + page_component_assignments） */
  pageCharts?: import("@/components/stat-charts/services/load-page-components").PageComponent[];
  /** componentKey ごとに survey taxonomy から解決した出典調査ハブ。 */
  chartSourceLinks?: Record<string, Array<{ label: string; url: string }>>;
}
