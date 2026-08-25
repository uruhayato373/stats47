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
import type { IndicatorSetCategory, IndicatorSetUsage } from '@stats47/types';

import type { EvidenceLensKey, EvidenceSourceKey } from './evidence-lenses';

/**
 * テーマページ (`/themes/*`) で有効な componentType の文字列 union。
 *
 * ⚠️ テーマページは `ThemeDbChartRenderer`
 * (`apps/web/src/features/theme-dashboard/`) で描画され、これは stat-charts の
 * `DashboardComponentRenderer` (area 系) とは**別の renderer / 別の型集合**。
 * チャート型の正典は `ThemeDbChartComponentProps`
 * (`apps/web/src/features/theme-dashboard/actions/theme-chart-props.ts`、6 種) +
 * 非チャート (`kpi-card` / `markdown-section` / `pyramid-chart`)。
 * app 層へ import できないためここに複製し、drift は app 側の型アサーション
 * (`theme-chart-props.ts` 末尾の `_ThemeChartTypeDriftGuard`: ThemeDbChartComponentProps の型 ⊆ CatalogComponentType) が検知する。
 */
export const CATALOG_COMPONENT_TYPES = [
  // ThemeDbChartComponentProps (チャート 6 種)
  'line-chart',
  'mixed-chart',
  'composition-chart',
  'donut-chart',
  'cpi-profile',
  'cpi-heatmap',
  // 非チャート (ThemeMetricsDashboard で個別描画)
  'kpi-card',
  'markdown-section',
  'pyramid-chart',
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
  role: 'primary' | 'secondary' | 'context';
  /** 選定根拠 (移行時は省略可) */
  selection?: MetricSelection;
}

/** カタログ内の 1 チャート。page-components の PageComponent 1 行に対応。 */
export interface CatalogChart {
  /** 一意キー (テーマ内 + 全テーマ横断で重複禁止) */
  componentKey: string;
  componentType: CatalogComponentType;
  title: string;
  /**
   * この可視化に固有の誤読防止注釈（対象期間の差、系列断絶、比較不能条件など）。
   * generator が既存 page-component 契約の componentProps.annotation へ出力する。
   * 指標一般の定義・単位・算出式は ranking の指標ハブへ置き、ここには複製しない。
   */
  annotation?: string;
  /** チャート固有 props (estatParams 等)。型は app 層 DashboardConfigMap で担保。 */
  componentProps: Record<string, unknown>;
  /**
   * このコンポーネントが扱う指標の rankingKey。
   * markdown-section 以外は validator が 1 件以上を必須化し、先頭を主導線に使う。
   */
  relatedRankingKeys?: string[];
  sourceName?: string | null;
  sourceLink?: string | null;
  gridColumnSpan?: number;
  gridColumnSpanTablet?: number | null;
  gridColumnSpanSm?: number | null;
  dataSource?: string | null;
  /**
   * 視覚グループ見出し (null 許容)。
   * 注: テーマ renderer (ThemeDbChartRenderer) は section を参照しない (flat grid 描画)。
   * area ページの AreaChartSection はグループ見出しに使う。theme では現状メタデータ。
   */
  section?: string | null;
  sortOrder: number;
}

/**
 * 指標カード 1 枚の編成 (2026-08-06 新設)。
 *
 * テーマページの「主要指標」パネルは 1 カード = 1 グループで描画され、カード内の
 * タイルをチェックすると系列がチャートに重なる (GSC のクリック数/表示回数と同じ形)。
 * 1 ページに複数カードが並ぶ。
 *
 * ★このフィールドは **codegen を通らない**。generator (transform.ts) は metrics/charts
 *   しか読まないので、ここを足しても生成物 (indicator-sets / page-components) は byte 不変。
 *   app 側は server component が THEME_CATALOGS を直読みする
 *   (前例: apps/web/src/features/theme-dashboard/components/ThemeIndicatorCatalogSection.tsx)。
 *   IndicatorSet は compare / Remotion と共有する型なので、theme 固有の UI 都合を持ち込まない。
 *
 * ★未定義のテーマ (カタログ未登録を含む) は UI 側が「非 context 指標を 1 グループ」へ
 *   フォールバックするので、全テーマに書く必要はない。
 */
export interface CatalogMetricGroup {
  /** kebab-case。テーマ内で一意 (React key・計測ラベルに使う) */
  key: string;
  /** カード見出し (例 "賃金水準と格差") */
  title: string;
  /** カード内のタイル順。metrics の rankingKey の部分集合 */
  rankingKeys: string[];
  /**
   * 初期チェック (= 初期描画される系列)。rankingKeys の部分集合で 1 件以上。
   * ここに入れた分だけ mount 時に時系列を取りに行くので 3 件以内が目安 (validator warn)。
   */
  defaultCheckedKeys: string[];
}

export interface CatalogEvidenceTopic {
  /** kebab-case。テーマ内で一意。計測 label と section anchor に使う。 */
  key: string;
  /** 横断的な読み方。evidence-lenses.ts の登録値だけを使う。 */
  lensKey: EvidenceLensKey;
  /** テーマ固有の論点名。 */
  title: string;
  /** 読者がデータへ尋ねる問い。 */
  question: string;
  /** 指標をどう読み分けるかの短い説明。資料本文の転載はしない。 */
  summary: string;
  /** 根拠にした白書・報告書・統計要覧。 */
  sourceKeys: EvidenceSourceKey[];
  /** 論点から直接たどれるランキング。ThemeCatalog.metrics 外も許容する。 */
  relatedRankingKeys?: string[];
  /** 同じテーマ内で論点を可視化する componentKey。 */
  relatedChartKeys?: string[];
  /** 論点を別の主語から深掘りできるテーマ。 */
  relatedThemeKeys?: string[];
  /** 関連記事一覧へ接続する tag key。 */
  relatedArticleTagKeys?: string[];
}

/**
 * 単位を「同じ Y 軸に載せてよいか」の判定キーへ正規化する。
 *
 * 揃えるのは**全角・半角などの互換文字だけ** (NFKC)。metric config には `%` と `％` が
 * 混在していて (gender-wage-gap が `%`、unemployment-rate が `％`)、素の文字列比較だと
 * 同じパーセントが 2 軸に分かれ、無関係なスケールで並ぶ嘘のグラフになる。
 *
 * ★意味的な正規化はしない。`円` と `千円` は桁が 1000 倍違うので別軸が正しく、
 *   まとめると誤読を生む (誤結合の方が危険)。
 *
 * validator (定義時の単位数チェック) と UI (実際の軸割当) が同じ判定を使うために
 * ここ 1 か所に置く。
 */
export function normalizeUnitForAxis(unit: string): string {
  return unit.normalize('NFKC').trim();
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
  /** チャート定義 (page-components に生成) */
  charts: CatalogChart[];
  /**
   * 指標カードの編成 (省略時は UI が「非 context 指標を 1 グループ」にフォールバック)。
   * 1 グループ内の相異なる単位は 2 種まで (チャートの Y 軸が左右 2 本のため。validator error)。
   */
  metricGroups?: CatalogMetricGroup[];
  /** 白書等の論点を指標・チャート・周遊導線へ接続する Theme 従属メタデータ。 */
  evidenceTopics?: CatalogEvidenceTopic[];
  /** SEO キーワード */
  keywords?: string[];
  /** 関連記事のタグキー */
  relatedArticleTagKeys?: string[];
  /** 不採用にした候補指標の記録 (再調査防止) */
  rejectedCandidates?: Array<{ rankingKey: string; reason: string }>;
}
