/**
 * AreaDatabookTemplate → 生成物への変換 (generator / validator 共有)。
 *
 * 生成物: page-components JSON 文字列 (R2 verbatim export と byte 一致する minified 形式)。
 * chart ブロックのみを PageComponent 行に変換し、`section` は親セクションの title を付与する。
 * 他ブロック (ranked-kpi-grid 等) は page-components を経由しない (app が template 直 import)。
 */
import type { AreaDatabookTemplate, DatabookChart } from "./types";

/** template 内の chart ブロックを (親セクション title 付きで) 平坦化する。 */
export function listTemplateCharts(
  template: AreaDatabookTemplate,
): Array<{ chart: DatabookChart; sectionTitle: string }> {
  const rows: Array<{ chart: DatabookChart; sectionTitle: string }> = [];
  for (const section of template.sections) {
    for (const block of section.blocks) {
      if (block.blockType === "chart") {
        rows.push({ chart: block.chart, sectionTitle: section.title });
      }
    }
  }
  return rows;
}

/**
 * 1 チャート → page-components の PageComponent 行 (キー順固定・theme transform と同順)。
 * relatedRankingKeys は validator 用フィールドなので出力しない。
 */
function chartToPageComponent(
  chart: DatabookChart,
  sectionTitle: string,
): Record<string, unknown> {
  return {
    componentKey: chart.componentKey,
    componentType: chart.componentType,
    title: chart.title,
    componentProps: chart.componentProps,
    sourceName: chart.sourceName ?? null,
    sourceLink: chart.sourceLink ?? null,
    rankingLink: chart.rankingLink ?? null,
    gridColumnSpan: chart.gridColumnSpan ?? 12,
    gridColumnSpanTablet: chart.gridColumnSpanTablet ?? null,
    gridColumnSpanSm: chart.gridColumnSpanSm ?? null,
    dataSource: chart.dataSource ?? null,
    section: sectionTitle,
    sortOrder: chart.sortOrder,
  };
}

/**
 * template → page-components JSON 文字列 (minified, 末尾改行なし)。
 * 47 県共通テンプレのため全県同一内容になる。
 * export-page-components-snapshot.ts が R2 へ verbatim 転送するため、既存配信 byte と一致させる。
 */
export function templateToPageComponentsJson(
  template: AreaDatabookTemplate,
): string {
  return JSON.stringify(
    listTemplateCharts(template).map(({ chart, sectionTitle }) =>
      chartToPageComponent(chart, sectionTitle),
    ),
  );
}
