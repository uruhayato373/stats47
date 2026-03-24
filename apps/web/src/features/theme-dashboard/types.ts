import type { RankingItem, RankingValue } from "@stats47/ranking";
import type {
  ChartDefinition,
  DualLineChartDef,
  DonutChartDef,
  IndicatorPanelTab,
  TopoJSONTopology,
} from "@stats47/types";

// ============================================================================
// チャート型は @stats47/types の ChartDefinition を re-export
// ============================================================================

/** 2指標の時系列比較チャート設定 */
export type ThemeChartDualLine = DualLineChartDef;

/** Server Action でデータ取得するドーナツチャート設定 */
export type ThemeChartDonutAction = DonutChartDef;

/** チャート設定のユニオン型 */
export type ThemeChartConfig = ChartDefinition;

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

/** 統計パネルのタブグルーピング設定 */
export interface PanelTabGroup {
  /** タブラベル */
  label: string;
  /** このタブに表示する rankingKey 一覧 */
  rankingKeys: string[];
  /** このタブ内に表示するチャート */
  charts?: ThemeChartConfig[];
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
  /** 統計パネルに表示するチャート設定 */
  charts?: ThemeChartConfig[];
  /** 統計パネルの KPI をタブでグルーピング（未指定時はフラット表示） */
  panelTabs?: PanelTabGroup[];
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
type _PanelTabCompat = _AssertAssignable<PanelTabGroup, IndicatorPanelTab>;
