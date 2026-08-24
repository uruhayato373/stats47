/**
 * ThemeCatalog → 生成物への変換 (generator / validator 共有)。
 *
 * 生成物:
 *   1. IndicatorSet TS ソース文字列 (codegen)
 *   2. page-components JSON 文字列 (R2 verbatim export と byte 一致する minified 形式)
 */
import type { IndicatorSet } from '@stats47/types';

import { resolveComponentPropsColors } from './chart-color-role';
import type { CatalogChart, ThemeCatalog } from './types';

/**
 * 読者向けチャート説明を解決する。
 *
 * カタログで個別説明を上書きできる一方、未移行テーマでも無説明のチャートを配信しない。
 * 文は描画タイプだけから決まるため、generator / validator / test で同じ結果になる。
 */
export function resolveChartDescription(chart: CatalogChart): string | null {
  const authored = chart.description?.trim();
  if (authored) return authored;

  switch (chart.componentType) {
    case 'line-chart':
      return (
        chart.title +
        'を年ごとに示します。線の傾きと系列間の差から、増減の方向と変化の大きさを確認できます。'
      );
    case 'mixed-chart':
      return (
        chart.title +
        'を棒と線で重ねて示します。左右の軸と凡例を確認し、規模と割合など異なる指標の動きを比較できます。'
      );
    case 'composition-chart':
      return (
        chart.title +
        'を項目別・時系列で示します。各項目の幅とその変化から、構成の偏りや移り変わりを確認できます。'
      );
    case 'donut-chart':
      return (
        chart.title +
        'の内訳と構成比を示します。各区分の割合を比べ、全体の中で大きい項目を確認できます。'
      );
    case 'cpi-profile':
      return (
        chart.title +
        'を費目別に比較します。基準値との差から、どの費目の物価水準が相対的に高いか低いかを確認できます。'
      );
    case 'cpi-heatmap':
      return (
        chart.title +
        'を色の濃淡で示します。時期と費目を横断して、上昇や低下が集中している箇所を確認できます。'
      );
    case 'pyramid-chart':
      return (
        chart.title +
        'を年齢階級と性別で示します。年代ごとの厚みを比べ、人口構成の特徴を確認できます。'
      );
    case 'kpi-card':
    case 'markdown-section':
      return null;
  }
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
 * relatedRankingKeys はカタログ内の validator 用フィールドなので出力しない。
 */
function chartToPageComponent(chart: CatalogChart): Record<string, unknown> {
  return {
    componentKey: chart.componentKey,
    componentType: chart.componentType,
    title: chart.title,
    description: resolveChartDescription(chart),
    // catalog (SSOT) は色 role を持ち、生成物は解決済み hex を持つ (WP5)。色キー文脈のみ解決。
    componentProps: resolveComponentPropsColors(chart.componentProps),
    sourceName: chart.sourceName ?? null,
    sourceLink: chart.sourceLink ?? null,
    rankingLink: chart.rankingLink ?? null,
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
  return JSON.stringify(catalog.charts.map(chartToPageComponent));
}
