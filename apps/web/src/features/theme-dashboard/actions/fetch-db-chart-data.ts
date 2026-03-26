"use server";

import type { StatsSchema } from "@stats47/types";

import { fetchEstatData } from "@/features/stat-charts/services/fetchEstatData";
import { toLineChartData } from "@/features/stat-charts/adapters/toLineChartData";
import { toMixedChartData } from "@/features/stat-charts/adapters/toMixedChartData";
import type { LineChartData, MixedChartData } from "@/features/stat-charts/types/visualization";

/**
 * DB 管理チャート用 Server Action
 *
 * chart_definitions.component_props をそのまま受け取り、
 * stat-charts パイプラインでデータを取得・変換する。
 *
 * Single Source of Truth: chart_definitions テーブルの component_props
 */
export async function fetchDbChartDataAction(
  componentType: string,
  componentProps: Record<string, unknown>,
  prefCode: string
): Promise<{ type: "line"; data: LineChartData } | { type: "mixed"; data: MixedChartData } | null> {
  const isNational = prefCode === "00000";

  if (componentType === "line-chart") {
    return fetchLineData(componentProps, prefCode, isNational);
  }
  if (componentType === "mixed-chart") {
    return fetchMixedData(componentProps, prefCode, isNational);
  }
  return null;
}

async function fetchLineData(
  props: Record<string, unknown>,
  prefCode: string,
  isNational: boolean
): Promise<{ type: "line"; data: LineChartData } | null> {
  const estatParams = props.estatParams as Array<Record<string, string>> | Record<string, string>;
  const paramsList = Array.isArray(estatParams) ? estatParams : [estatParams];
  const labels = props.labels as string[] | undefined;
  const seriesColors = props.seriesColors as string[] | undefined;

  const rawDataList = await fetchAllSeries(paramsList, prefCode, isNational);
  if (!rawDataList) return null;

  const chartData = toLineChartData(rawDataList, labels, seriesColors);
  return { type: "line", data: chartData };
}

async function fetchMixedData(
  props: Record<string, unknown>,
  prefCode: string,
  isNational: boolean
): Promise<{ type: "mixed"; data: MixedChartData } | null> {
  const columnParams = props.columnParams as Array<Record<string, string>>;
  const lineParams = props.lineParams as Array<Record<string, string>>;
  const columnLabels = props.columnLabels as string[] | undefined;
  const lineLabels = props.lineLabels as string[] | undefined;
  const leftUnit = props.leftUnit as string | undefined;
  const rightUnit = props.rightUnit as string | undefined;
  const columnColors = props.columnColors as string[] | undefined;
  const lineColors = props.lineColors as string[] | undefined;

  const [colData, lineData] = await Promise.all([
    fetchAllSeries(columnParams, prefCode, isNational),
    fetchAllSeries(lineParams, prefCode, isNational),
  ]);
  if (!colData || !lineData) return null;

  const chartData = toMixedChartData(colData, lineData, columnLabels, lineLabels, leftUnit, rightUnit, columnColors, lineColors);
  return { type: "mixed", data: chartData };
}

/**
 * 複数系列のデータを並列取得。全国の場合は全47都道府県の平均を算出。
 */
async function fetchAllSeries(
  paramsList: Array<Record<string, string>>,
  prefCode: string,
  isNational: boolean
): Promise<StatsSchema[][] | null> {
  const results = await Promise.all(
    paramsList.map(async (params) => {
      if (isNational) {
        return fetchAllAndAverage(params as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      }
      const result = await fetchEstatData(prefCode, params as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      if ("error" in result) return null;
      return result.data;
    })
  );

  if (results.some((r) => r === null)) return null;
  return results as StatsSchema[][];
}

async function fetchAllAndAverage(
  params: import("@stats47/estat-api/server").GetStatsDataParams,
): Promise<StatsSchema[] | null> {
  const { fetchFormattedStats } = await import("@stats47/estat-api/server");
  const { getEstatCacheStorage } = await import("@/features/stat-charts/services/get-estat-cache-storage");

  try {
    const storage = await getEstatCacheStorage();
    const allData = await fetchFormattedStats(params, storage);

    const prefData = allData.filter((d) =>
      /^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(d.areaCode)
    );

    const byYear = new Map<string, { values: number[]; yearName: string; categoryCode: string; categoryName: string; unit: string }>();
    for (const d of prefData) {
      const entry = byYear.get(d.yearCode);
      if (entry) {
        entry.values.push(d.value);
      } else {
        byYear.set(d.yearCode, {
          values: [d.value],
          yearName: d.yearName,
          categoryCode: d.categoryCode,
          categoryName: d.categoryName,
          unit: d.unit,
        });
      }
    }

    const averaged: StatsSchema[] = [];
    for (const [yearCode, entry] of byYear) {
      const avg = entry.values.reduce((a, b) => a + b, 0) / entry.values.length;
      averaged.push({
        areaCode: "00000",
        areaName: "全国平均",
        yearCode,
        yearName: entry.yearName,
        categoryCode: entry.categoryCode,
        categoryName: entry.categoryName,
        value: Math.round(avg * 100) / 100,
        unit: entry.unit,
      });
    }

    return averaged.length > 0 ? averaged : null;
  } catch {
    return null;
  }
}
