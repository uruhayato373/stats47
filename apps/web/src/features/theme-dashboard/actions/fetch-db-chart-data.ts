"use server";


import { toLineChartData } from "@/features/stat-charts/adapters/toLineChartData";
import { toMixedChartData } from "@/features/stat-charts/adapters/toMixedChartData";
import { fetchEstatData } from "@/features/stat-charts/server";
import type { LineChartData, MixedChartData } from "@/features/stat-charts/types/visualization";

import type { StatsSchema } from "@stats47/types";

/** ドーナツチャート用データ */
export interface DonutChartItem {
  name: string;
  value: number;
  color: string;
}

/** CPI プロファイル用データ */
export interface CpiProfileItem {
  label: string;
  value: number;
  code: string;
}

/** CPI ヒートマップ用データ */
export interface CpiHeatmapItem {
  x: string;
  y: string;
  value: number;
}

type ChartResult =
  | { type: "line"; data: LineChartData }
  | { type: "mixed"; data: MixedChartData }
  | { type: "donut"; data: DonutChartItem[] }
  | { type: "cpi-profile"; data: CpiProfileItem[] }
  | { type: "cpi-heatmap"; data: CpiHeatmapItem[] }
  | null;

/**
 * DB 管理チャート用 Server Action
 *
 * page_components.component_props をそのまま受け取り、
 * stat-charts パイプラインでデータを取得・変換する。
 *
 * Single Source of Truth: page_components テーブルの component_props
 */
export async function fetchDbChartDataAction(
  componentType: string,
  componentProps: Record<string, unknown>,
  prefCode: string
): Promise<ChartResult> {
  const isNational = prefCode === "00000";

  if (componentType === "line-chart") {
    return fetchLineData(componentProps, prefCode, isNational);
  }
  if (componentType === "mixed-chart") {
    return fetchMixedData(componentProps, prefCode, isNational);
  }
  if (componentType === "donut-chart") {
    return fetchDonutData(componentProps, prefCode, isNational);
  }
  if (componentType === "cpi-profile") {
    return fetchCpiProfileData(componentProps, prefCode);
  }
  if (componentType === "cpi-heatmap") {
    return fetchCpiHeatmapData(componentProps, prefCode);
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

/**
 * 汎用ドーナツチャートデータ取得
 *
 * componentProps:
 * - categories: Array<{ code: string; label: string; color: string }>
 *   各カテゴリの e-Stat cdCat01 コード、表示名、色
 * - statsDataId: string
 * - topN?: number (デフォルト 9 — 上位N件 + その他)
 */
async function fetchDonutData(
  props: Record<string, unknown>,
  prefCode: string,
  isNational: boolean
): Promise<{ type: "donut"; data: DonutChartItem[] } | null> {
  const categories = props.categories as Array<{ code: string; label: string; color: string }> | undefined;
  const statsDataId = props.statsDataId as string | undefined;
  const topN = (props.topN as number) ?? 9;

  if (!categories || !statsDataId) return null;

  // 各カテゴリの値を並列取得
  const results = await Promise.all(
    categories.map(async (cat) => {
      const data = isNational
        ? await fetchAllAndAverage({ statsDataId, cdCat01: cat.code } as unknown as import("@stats47/estat-api/server").GetStatsDataParams)
        : await fetchSeriesDataForDonut({ statsDataId, cdCat01: cat.code }, prefCode);
      if (!data || data.length === 0) return null;

      // 最新年度の値を取得
      const sorted = [...data].sort((a, b) => b.yearCode.localeCompare(a.yearCode));
      return {
        name: cat.label,
        value: sorted[0].value,
        color: cat.color,
      };
    })
  );

  const valid = results.filter((r): r is DonutChartItem => r !== null && r.value > 0);
  if (valid.length === 0) return null;

  // 降順ソート → 上位N + その他
  valid.sort((a, b) => b.value - a.value);
  if (valid.length <= topN + 1) {
    return { type: "donut", data: valid };
  }

  const top = valid.slice(0, topN);
  const otherValue = valid.slice(topN).reduce((sum, i) => sum + i.value, 0);
  top.push({ name: "その他", value: otherValue, color: "#d4d4d4" });
  return { type: "donut", data: top };
}

async function fetchSeriesDataForDonut(
  params: { statsDataId: string; cdCat01: string },
  prefCode: string
): Promise<StatsSchema[] | null> {
  const result = await fetchEstatData(prefCode, params as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
  if ("error" in result) return null;
  return result.data;
}

/**
 * CPI プロファイル（10大費目別 消費者物価地域差指数）
 *
 * componentProps:
 * - statsDataId: string (例: "0003441258")
 * - excludeCodes?: string[] (除外コード)
 * - year?: string (年コード、省略時は最新)
 */
async function fetchCpiProfileData(
  props: Record<string, unknown>,
  prefCode: string
): Promise<{ type: "cpi-profile"; data: CpiProfileItem[] } | null> {
  const statsDataId = props.statsDataId as string;
  const excludeCodes = new Set((props.excludeCodes as string[]) ?? ["00010", "00120"]);
  const year = props.year as string | undefined;

  if (!statsDataId) return null;

  try {
    const { fetchFormattedStats } = await import("@stats47/estat-api/server");
    const params = {
      statsDataId,
      cdArea: prefCode,
      ...(year && { cdTime: year }),
    };

    const rawData = await fetchFormattedStats(params as import("@stats47/estat-api/server").GetStatsDataParams);
    if (rawData.length === 0) return null;

    // 年指定なしの場合は最新年のみフィルタ
    let filtered = rawData.filter((d) => !excludeCodes.has(d.categoryCode));
    if (!year) {
      const latestYear = filtered.reduce((max, d) => d.yearCode > max ? d.yearCode : max, "");
      filtered = filtered.filter((d) => d.yearCode === latestYear);
    }

    const result: CpiProfileItem[] = filtered.map((d) => ({
      label: d.categoryName,
      value: d.value,
      code: d.categoryCode,
    }));

    return result.length > 0 ? { type: "cpi-profile", data: result } : null;
  } catch {
    return null;
  }
}

/**
 * CPI ヒートマップ（年×品目の地域差指数推移）
 *
 * componentProps:
 * - statsDataId: string
 * - excludeCodes?: string[]
 */
async function fetchCpiHeatmapData(
  props: Record<string, unknown>,
  prefCode: string
): Promise<{ type: "cpi-heatmap"; data: CpiHeatmapItem[] } | null> {
  const statsDataId = props.statsDataId as string;
  const excludeCodes = new Set((props.excludeCodes as string[]) ?? ["00010", "00120"]);

  if (!statsDataId) return null;

  try {
    const { fetchFormattedStats } = await import("@stats47/estat-api/server");
    const params = {
      statsDataId,
      cdArea: prefCode,
    };

    const rawData = await fetchFormattedStats(params as import("@stats47/estat-api/server").GetStatsDataParams);
    if (rawData.length === 0) return null;

    const result: CpiHeatmapItem[] = rawData
      .filter((d) => !excludeCodes.has(d.categoryCode))
      .map((d) => ({ x: d.yearName, y: d.categoryName, value: d.value }))
      .sort((a, b) => a.x.localeCompare(b.x));

    return result.length > 0 ? { type: "cpi-heatmap", data: result } : null;
  } catch {
    return null;
  }
}
