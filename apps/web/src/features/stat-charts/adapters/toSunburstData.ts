import { extractYearsFromStats } from "@stats47/estat-api/server";
import type { StatsSchema } from "@stats47/types";
import type { HierarchyData } from "../types/visualization";
import type { SunburstEstatParams } from "../types";

/**
 * e-Stat 生データから Sunburst/Treemap 用階層データを構築
 *
 * @param rawData - e-Stat 生データ（rootCode + childCodes のデータを含む）
 * @param config - 階層構造の定義（rootCode, childCodes, groups）
 * @returns 階層データ（D3形式）
 */
export function toSunburstData(
  rawData: StatsSchema[],
  config: Pick<SunburstEstatParams, "rootCode" | "childCodes" | "groups">
): HierarchyData | null {
  if (rawData.length === 0) return null;

  const years = extractYearsFromStats(rawData);
  if (years.length === 0) return null;

  const latestYear = years[0];
  const yearData = rawData.filter((d) => d.yearCode === latestYear.yearCode);

  const rootItem = yearData.find((d) => d.categoryCode === config.rootCode);
  if (!rootItem) return null;

  const children = buildHierarchyChildren(yearData, config);

  return {
    name: rootItem.categoryName || "総額",
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Treemap用も同じロジック（エイリアス）
 */
export const toTreemapData = toSunburstData;

function buildHierarchyChildren(
  yearData: StatsSchema[],
  config: Pick<SunburstEstatParams, "childCodes" | "groups">
): HierarchyData[] {
  const { childCodes, groups } = config;

  if (groups && groups.length > 0) {
    const groupedCodes = new Set(groups.flatMap((g) => g.childCodes));

    const groupNodes: HierarchyData[] = groups
      .map((group) => ({
        name: group.name,
        children: group.childCodes
          .map((code) => {
            const item = yearData.find((d) => d.categoryCode === code);
            if (!item || item.value <= 0) return null;
            return {
              name: item.categoryName || code,
              value: item.value,
            } as HierarchyData;
          })
          .filter((child): child is HierarchyData => child !== null),
      }))
      .filter((g) => g.children && g.children.length > 0);

    const standaloneNodes: HierarchyData[] = childCodes
      .filter((code) => !groupedCodes.has(code))
      .map((code) => {
        const item = yearData.find((d) => d.categoryCode === code);
        if (!item || item.value <= 0) return null;
        return {
          name: item.categoryName || code,
          value: item.value,
        } as HierarchyData;
      })
      .filter((child): child is HierarchyData => child !== null);

    return [...groupNodes, ...standaloneNodes];
  }

  return childCodes
    .map((code) => {
      const item = yearData.find((d) => d.categoryCode === code);
      if (!item || item.value <= 0) return null;
      return {
        name: item.categoryName || code,
        value: item.value,
      } as HierarchyData;
    })
    .filter((child): child is HierarchyData => child !== null);
}
