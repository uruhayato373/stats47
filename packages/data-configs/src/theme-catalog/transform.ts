/**
 * ThemeCatalog → 生成物への変換 (generator / validator 共有)。
 *
 * 生成物:
 *   1. IndicatorSet TS ソース文字列 (codegen)
 *   2. page-components JSON 文字列 (R2 verbatim export と byte 一致する minified 形式)
 */
import type { IndicatorSet } from '@stats47/types';

import { resolveComponentPropsColors } from './chart-color-role';
import { parseFaqMarkdown } from './faq-markdown';
import type { CatalogChart, ThemeCatalog } from './types';

/** 現在廃止した componentType 別の自動説明を検出する決定的パターン。 */
const GENERIC_CHART_DESCRIPTION_FRAGMENTS = [
  '線の傾きと系列間の差から、増減の方向と変化の大きさを確認できます。',
  '左右の軸と凡例を確認し、規模と割合など異なる指標の動きを比較できます。',
  '各項目の幅とその変化から、構成の偏りや移り変わりを確認できます。',
  '各区分の割合を比べ、全体の中で大きい項目を確認できます。',
  '基準値との差から、どの費目の物価水準が相対的に高いか低いかを確認できます。',
  '時期と費目を横断して、上昇や低下が集中している箇所を確認できます。',
  '年代ごとの厚みを比べ、人口構成の特徴を確認できます。',
] as const;

/** 旧 generator の定型文が再び可視説明へ混入していないか。 */
export function isGenericChartDescription(description: string): boolean {
  const normalized = description.trim();
  return GENERIC_CHART_DESCRIPTION_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment)
  );
}

function resolveChartAnnotation(chart: CatalogChart): string | undefined {
  const authored = chart.annotation?.trim();
  return authored || undefined;
}

/**
 * relatedRankingKeys を既存の ChartFooter 契約へ変換する。
 *
 * 配列先頭を主導線、2 件目以降を追加導線へ決定的に変換する。
 * ラベルは同じ ThemeCatalog.metrics の shortLabel だけから導出するため、
 * 自由記述 URL や別の対応表を SSOT に持たない。
 */
function resolveIndicatorHubLinks(
  chart: CatalogChart,
  metricLabels: ReadonlyMap<string, string>
): { rankingLink: string | null; componentProps: Record<string, unknown> } {
  const componentProps = resolveComponentPropsColors(
    chart.componentProps
  ) as Record<string, unknown>;
  const annotation = resolveChartAnnotation(chart);
  if (annotation) componentProps.annotation = annotation;

  if (
    chart.componentType === 'markdown-section' &&
    componentProps.displayMode === 'faq'
  ) {
    const parsed = parseFaqMarkdown(componentProps.markdown);
    if (!parsed.ok) {
      throw new Error(`${chart.componentKey}: ${parsed.error}`);
    }
    componentProps.items = parsed.items;
    delete componentProps.markdown;
  }

  const relatedKeys = [...new Set(chart.relatedRankingKeys ?? [])];
  const rankingLink = relatedKeys[0] ? `/ranking/${relatedKeys[0]}` : null;
  const generatedLinks = relatedKeys.slice(1).map((key) => ({
    label: `${metricLabels.get(key) ?? key}の定義・ランキング`,
    url: `/ranking/${key}`,
  }));
  delete componentProps.rankingLinks;
  if (generatedLinks.length > 0) componentProps.rankingLinks = generatedLinks;

  return { rankingLink, componentProps };
}

/** theme key → IndicatorSet の export const 名 (例: "aging-society" → "AGING_SOCIETY_SET")。 */
export function indicatorSetConstName(key: string): string {
  return `${key.replace(/-/g, '_').toUpperCase()}_SET`;
}

/**
 * カタログ → IndicatorSet オブジェクト。
 * selection / charts / rejectedCandidates は IndicatorSet に含めない (指標選定の view のみ)。
 * undefined フィールドは省略し、既存の手書き IndicatorSet と deep-equal になるようにする。
 */
export function catalogToIndicatorSet(catalog: ThemeCatalog): IndicatorSet {
  const set: IndicatorSet = {
    key: catalog.key,
    title: catalog.title,
    description: catalog.description,
    category: catalog.category,
    usage: catalog.usage,
    metrics: catalog.metrics.map((m) => ({
      rankingKey: m.rankingKey,
      shortLabel: m.shortLabel,
      role: m.role,
    })),
  };
  if (catalog.keywords !== undefined) set.keywords = catalog.keywords;
  if (catalog.relatedArticleTagKeys !== undefined) {
    set.relatedArticleTagKeys = catalog.relatedArticleTagKeys;
  }
  return set;
}

/** カタログ → IndicatorSet TS ソース文字列 (codegen, DO NOT EDIT ヘッダー付き)。 */
export function catalogToIndicatorSetSource(catalog: ThemeCatalog): string {
  const constName = indicatorSetConstName(catalog.key);
  const set = catalogToIndicatorSet(catalog);
  const body = JSON.stringify(set, null, 2);
  return (
    `// AUTO-GENERATED — DO NOT EDIT.\n` +
    `// Source of truth: packages/data-configs/src/theme-catalog/${catalog.key}.ts\n` +
    `// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs\n` +
    `import type { IndicatorSet } from "../indicator-set";\n\n` +
    `export const ${constName}: IndicatorSet = ${body};\n`
  );
}

/**
 * カタログの 1 チャート → page-components の PageComponent 行 (キー順固定)。
 * relatedRankingKeys 自体は出力せず、rankingLink / componentProps.rankingLinks
 * の配信契約へ決定的に変換する。
 */
function chartToPageComponent(
  chart: CatalogChart,
  metricLabels: ReadonlyMap<string, string>
): Record<string, unknown> {
  const indicatorHub = resolveIndicatorHubLinks(chart, metricLabels);
  return {
    componentKey: chart.componentKey,
    componentType: chart.componentType,
    title: chart.title,
    // ChartPanel の後方互換スキーマは維持するが、近接説明は表示しない。
    description: null,
    // catalog (SSOT) は色 role を持ち、生成物は解決済み hex を持つ (WP5)。色キー文脈のみ解決。
    componentProps: indicatorHub.componentProps,
    sourceName: chart.sourceName ?? null,
    sourceLink: chart.sourceLink ?? null,
    rankingLink: indicatorHub.rankingLink,
    gridColumnSpan: chart.gridColumnSpan ?? 12,
    gridColumnSpanTablet: chart.gridColumnSpanTablet ?? null,
    gridColumnSpanSm: chart.gridColumnSpanSm ?? null,
    dataSource: chart.dataSource ?? null,
    section: chart.section ?? null,
    sortOrder: chart.sortOrder,
  };
}

/**
 * カタログ → page-components JSON 文字列 (minified, 改行なし・末尾改行なし)。
 * export-page-components-snapshot.ts が R2 へ verbatim 転送するため、既存配信 byte と一致させる。
 *
 * ⚠️ charts 配列の順序をそのまま出力する (sortOrder で再ソートしない)。既存 JSON には
 * array 順 ≠ sortOrder 順のテーマ (local-economy 等・sortOrder 重複あり) があり、再ソートすると
 * byte 不一致になる。表示順は描画側が sortOrder で決めるため、配列順は SSOT の見た目管理用。
 */
export function catalogToPageComponentsJson(catalog: ThemeCatalog): string {
  const metricLabels = new Map(
    catalog.metrics.map((metric) => [metric.rankingKey, metric.shortLabel])
  );
  return JSON.stringify(
    catalog.charts.map((chart) => chartToPageComponent(chart, metricLabels))
  );
}
