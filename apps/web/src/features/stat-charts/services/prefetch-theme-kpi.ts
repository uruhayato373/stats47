import { logger } from "@stats47/logger";

import { toKpiCardData } from "../adapters";

import { fetchEstatDataAllAreas } from "./fetchEstatData";

import type { KpiCardClientProps } from "../components";
import type { PageComponent } from "./load-page-components";
import type { GetStatsDataParams } from "@stats47/estat-api/server";

/**
 * テーマページ用: KPI カードの e-Stat データを全都道府県分プリフェッチ
 *
 * page_components の kpi-card エントリから estatParams を取得し、
 * 全都道府県のデータを取得して areaCode ごとの KpiCardClientProps に変換する。
 *
 * @returns Record<chartKey, Record<areaCode, KpiCardClientProps>>
 */
export async function prefetchThemeKpiData(
  pageCharts: PageComponent[],
): Promise<Record<string, Record<string, KpiCardClientProps>>> {
  const kpiCharts = pageCharts.filter((c) => c.componentType === "kpi-card");
  if (kpiCharts.length === 0) return {};

  const results: Record<string, Record<string, KpiCardClientProps>> = {};

  await Promise.all(
    kpiCharts.map(async (chart) => {
      const props = chart.componentProps as Record<string, unknown>;
      const estatParams = props.estatParams as GetStatsDataParams | undefined;
      if (!estatParams?.statsDataId) return;

      try {
        const response = await fetchEstatDataAllAreas(estatParams);
        if ("error" in response) return;

        // areaCode ごとにグループ化
        const byArea = new Map<string, typeof response.data>();
        for (const item of response.data) {
          const group = byArea.get(item.areaCode) ?? [];
          group.push(item);
          byArea.set(item.areaCode, group);
        }

        const areaKpis: Record<string, KpiCardClientProps> = {};
        for (const [areaCode, areaData] of byArea) {
          const kpi = toKpiCardData(areaData);
          areaKpis[areaCode] = {
            title: chart.title,
            value: kpi.value,
            unit: kpi.unit ?? (props.unit as string) ?? "",
            year: kpi.year,
            changeRate: kpi.changeRate,
            changeDirection: kpi.changeDirection,
          };
        }

        results[chart.componentKey] = areaKpis;
      } catch (err) {
        logger.warn(
          { error: err, chartKey: chart.componentKey },
          "テーマ KPI プリフェッチ失敗",
        );
      }
    }),
  );

  return results;
}
