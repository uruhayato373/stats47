import "server-only";

import { getDrizzle, chartDefinitions, pageChartAssignments } from "@stats47/database/server";
import { eq, and, asc } from "drizzle-orm";
import { logger } from "@stats47/logger/server";

export interface PageChart {
  chartKey: string;
  componentType: string;
  title: string;
  componentProps: Record<string, unknown>;
  sourceName: string | null;
  sourceLink: string | null;
  rankingLink: string | null;
  gridColumnSpan: number;
  section: string | null;
  sortOrder: number;
}

/**
 * ページに割り当てられたチャート定義を DB から取得
 *
 * page_chart_assignments + chart_definitions を JOIN し、
 * section → sortOrder 順で返す。
 *
 * @param pageType - "theme" | "area" | "compare"
 * @param pageKey - テーマキー / エリアコード / カテゴリキー
 */
export async function loadPageCharts(
  pageType: string,
  pageKey: string
): Promise<PageChart[]> {
  try {
    const db = getDrizzle();

    const rows = await db
      .select({
        chartKey: chartDefinitions.chartKey,
        componentType: chartDefinitions.componentType,
        title: chartDefinitions.title,
        componentProps: chartDefinitions.componentProps,
        sourceName: chartDefinitions.sourceName,
        sourceLink: chartDefinitions.sourceLink,
        rankingLink: chartDefinitions.rankingLink,
        gridColumnSpan: chartDefinitions.gridColumnSpan,
        section: pageChartAssignments.section,
        sortOrder: pageChartAssignments.sortOrder,
      })
      .from(pageChartAssignments)
      .innerJoin(
        chartDefinitions,
        eq(pageChartAssignments.chartKey, chartDefinitions.chartKey)
      )
      .where(
        and(
          eq(pageChartAssignments.pageType, pageType),
          eq(pageChartAssignments.pageKey, pageKey),
          eq(chartDefinitions.isActive, true)
        )
      )
      .orderBy(
        asc(pageChartAssignments.section),
        asc(pageChartAssignments.sortOrder)
      );

    return rows.map((row) => ({
      ...row,
      componentProps: parseJson(row.componentProps),
      gridColumnSpan: row.gridColumnSpan ?? 12,
      sortOrder: row.sortOrder ?? 0,
    }));
  } catch (error) {
    logger.error({ pageType, pageKey, error }, "loadPageCharts: failed");
    return [];
  }
}

function parseJson(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}
