/**
 * ThemeCatalog — テーマページの「指標 × チャート」統合 SSOT 型
 *
 * 規約の正典: `.claude/rules/theme-catalog-standards.md`
 *
 * 従来はテーマの (a) 指標選定 = `packages/types/src/indicator-sets/<theme>.ts` と
 * (b) チャート定義 = `apps/web/scripts/data/page-components/theme/<theme>.json` が
 * 独立編集され突合の仕組みが無かった。ThemeCatalog はこの 2 つを 1 ファイルに統合し、
 * 選定根拠 (どの白書・調査に基づくか) も selection として保持する。
 *
 * カタログは生成の SSOT で、以下 2 つは生成物 (手編集禁止):
 *   - IndicatorSet TS  (`packages/types/src/indicator-sets/<theme>.ts`) … codegen
 *   - page-components JSON (`apps/web/scripts/data/page-components/theme/<theme>.json`) … R2 verbatim export 用
 *
 * generator: `packages/data-configs/scripts/generate-theme-catalog.ts`
 * validator: `packages/data-configs/scripts/validate-theme-catalog.ts`
 */
import type {
  IndicatorSetCategory,
  IndicatorSetUsage,
  IndicatorPanelTab,
} from "@stats47/types";

/**
 * 有効な componentType の文字列 union。
 *
 * ⚠️ 正典は app 層の `DashboardConfigMap`
 * (`apps/web/src/components/stat-charts/types/index.ts`)。あちらは
 * `@stats47/estat-api/server` の型に依存するため packages へ移設できず、ここに
 * キーだけを複製する。両者の drift は app 側の型等価アサーション
 * (`Expect<Equal<DashboardComponentType, CatalogComponentType>>`) が type-check で検知する。
 */
export const CATALOG_COMPONENT_TYPES = [
  "kpi-card",
  "line-chart",
  "bar-chart",
  "diverging-bar-chart",
  "mixed-chart",
  "sunburst",
  "treemap",
  "bar-chart-race",
  "multi-stats-card",
  "definitions-card",
  "slide-presentation",
  "stats-table",
  "stacked-area",
  "radar-chart",
  "attribute-matrix",
  "ranking-chart",
  "pyramid-chart",
  "composition-chart",
] as const;

export type CatalogComponentType = (typeof CATALOG_COMPONENT_TYPES)[number];

/** 指標選定の根拠 (白書・調査由来)。新規追加指標では必須 (validator warn)。 */
export interface MetricSelection {
  /** 提案元 (白書名 / 調査名 / 競合ダッシュボード名) */
  proposedBy: string;
  /** 出典 URL (公式ドキュメント / 白書 PDF 等) */
  sourceUrl?: string;
  /** 調査日 (ISO date, 例 "2026-07-04") */
  surveyedAt: string;
  /** 採用理由 (なぜこのテーマにこの指標が要るか) */
  rationale: string;
}

/** カタログ内の 1 指標。IndicatorSet.metrics の 1 エントリに対応。 */
export interface CatalogMetric {
  /** METRICS_REGISTRY のキー (validator が実在照合) */
  rankingKey: string;
  /** 短縮ラベル (タブ・凡例・比較表示用) */
  shortLabel: string;
  /** テーマ内での役割 */
  role: "primary" | "secondary" | "context";
  /** 選定根拠 (移行時は省略可) */
  selection?: MetricSelection;
}

/** カタログ内の 1 チャート。page-components の PageComponent 1 行に対応。 */
export interface CatalogChart {
  /** 一意キー (テーマ内 + 全テーマ横断で重複禁止) */
  componentKey: string;
  componentType: CatalogComponentType;
  title: string;
  /** チャート固有 props (estatParams 等)。型は app 層 DashboardConfigMap で担保。 */
  componentProps: Record<string, unknown>;
  /** このチャートが扱う指標の rankingKey (metrics との整合 validator 用) */
  relatedRankingKeys?: string[];
  sourceName?: string | null;
  sourceLink?: string | null;
  rankingLink?: string | null;
  gridColumnSpan?: number;
  gridColumnSpanTablet?: number | null;
  gridColumnSpanSm?: number | null;
  dataSource?: string | null;
  /** panelTabs.label と対応 (null 許容 = タブ非依存) */
  section?: string | null;
  sortOrder: number;
}

/** テーマ 1 件の統合カタログ (指標選定 + チャート割当 + 選定根拠)。 */
export interface ThemeCatalog {
  key: string;
  title: string;
  description: string;
  category: IndicatorSetCategory;
  usage: IndicatorSetUsage;
  /** 含まれる指標 (表示順) */
  metrics: CatalogMetric[];
  /** パネルタブ (指標のサブグループ) */
  panelTabs?: IndicatorPanelTab[];
  /** チャート定義 (page-components に生成) */
  charts: CatalogChart[];
  /** SEO キーワード */
  keywords?: string[];
  /** 関連記事のタグキー */
  relatedArticleTagKeys?: string[];
  /** 不採用にした候補指標の記録 (再調査防止) */
  rejectedCandidates?: Array<{ rankingKey: string; reason: string }>;
}
