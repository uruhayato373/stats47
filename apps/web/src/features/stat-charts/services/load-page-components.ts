import "server-only";

import { getDrizzle, pageComponents, pageComponentAssignments } from "@stats47/database/server";
import { eq, and, asc } from "drizzle-orm";
import { logger } from "@stats47/logger/server";

/**
 * ページコンポーネント（DB から取得した統一型）
 *
 * KPI カード・チャート・属性マトリクス等、全コンポーネントを同じ型で扱う。
 */
export interface PageComponent {
  componentKey: string;
  componentType: string;
  title: string;
  componentProps: Record<string, unknown>;
  sourceName: string | null;
  sourceLink: string | null;
  rankingLink: string | null;
  gridColumnSpan: number;
  gridColumnSpanTablet: number | null;
  gridColumnSpanSm: number | null;
  dataSource: string | null;
  section: string | null;
  sortOrder: number;
}

/** @deprecated loadPageComponents を使用してください */
export type PageChart = PageComponent;
/** @deprecated loadPageComponents を使用してください */
export const loadPageCharts = loadPageComponents;

/**
 * ページに割り当てられた全コンポーネントを DB から取得
 *
 * page_component_assignments + page_components を JOIN し、
 * section → sortOrder 順で返す。
 *
 * @param pageType - "theme" | "area" | "area-category"
 * @param pageKey - テーマキー / エリアコード / カテゴリキー
 */
export async function loadPageComponents(
  pageType: string,
  pageKey: string
): Promise<PageComponent[]> {
  try {
    const db = getDrizzle();

    const rows = await db
      .select({
        componentKey: pageComponents.componentKey,
        componentType: pageComponents.componentType,
        title: pageComponents.title,
        componentProps: pageComponents.componentProps,
        sourceName: pageComponents.sourceName,
        sourceLink: pageComponents.sourceLink,
        rankingLink: pageComponents.rankingLink,
        gridColumnSpan: pageComponents.gridColumnSpan,
        gridColumnSpanTablet: pageComponents.gridColumnSpanTablet,
        gridColumnSpanSm: pageComponents.gridColumnSpanSm,
        dataSource: pageComponents.dataSource,
        section: pageComponentAssignments.section,
        sortOrder: pageComponentAssignments.sortOrder,
      })
      .from(pageComponentAssignments)
      .innerJoin(
        pageComponents,
        eq(pageComponentAssignments.componentKey, pageComponents.componentKey)
      )
      .where(
        and(
          eq(pageComponentAssignments.pageType, pageType),
          eq(pageComponentAssignments.pageKey, pageKey),
          eq(pageComponents.isActive, true)
        )
      )
      .orderBy(
        asc(pageComponentAssignments.sortOrder)
      );

    return rows.map((row) => ({
      ...row,
      componentProps: parseJson(row.componentProps),
      gridColumnSpan: row.gridColumnSpan ?? 12,
      sortOrder: row.sortOrder ?? 0,
    }));
  } catch (error) {
    logger.error({ pageType, pageKey, error }, "loadPageComponents: failed");
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
