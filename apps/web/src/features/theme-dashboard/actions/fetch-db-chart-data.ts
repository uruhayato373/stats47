"use server";


import { toCompositionChartData, type CompositionChartData } from "@/components/stat-charts/adapters/toCompositionChartData";
import { toLineChartData } from "@/components/stat-charts/adapters/toLineChartData";
import { toMixedChartData } from "@/components/stat-charts/adapters/toMixedChartData";
import { fetchEstatData } from "@/components/stat-charts/server";
import type { LineChartData, MixedChartData } from "@/components/stat-charts/types/visualization";

import {
  parseThemeDbChartComponentProps,
  type CompositionChartComponentProps,
  type CpiChartComponentProps,
  type DonutChartComponentProps,
  type LineChartComponentProps,
  type MixedChartComponentProps,
} from "./theme-chart-props";

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
  | { type: "line"; data: LineChartData; showLatestValues?: boolean }
  | { type: "mixed"; data: MixedChartData }
  | { type: "composition"; data: CompositionChartData; defaultTab?: "composition" | "trend" }
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
  const parsed = parseThemeDbChartComponentProps(componentType, componentProps);
  if (!parsed) return null;

  if (parsed.componentType === "line-chart") {
    return fetchLineData(parsed.props, prefCode, isNational);
  }
  if (parsed.componentType === "mixed-chart") {
    return fetchMixedData(parsed.props, prefCode, isNational);
  }
  if (parsed.componentType === "donut-chart") {
    return fetchDonutData(parsed.props, prefCode, isNational);
  }
  if (parsed.componentType === "composition-chart") {
    return fetchCompositionData(parsed.props, prefCode, isNational);
  }
  if (parsed.componentType === "cpi-profile") {
    return fetchCpiProfileData(parsed.props, prefCode);
  }
  if (parsed.componentType === "cpi-heatmap") {
    return fetchCpiHeatmapData(parsed.props, prefCode);
  }
  return null;
}

async function fetchLineData(
  props: LineChartComponentProps,
  prefCode: string,
  isNational: boolean
): Promise<{ type: "line"; data: LineChartData; showLatestValues?: boolean } | null> {
  const paramsList = Array.isArray(props.estatParams)
    ? props.estatParams
    : [props.estatParams];

  const rawDataList = await fetchAllSeries(paramsList, prefCode, isNational);
  if (!rawDataList) return null;

  const chartData = toLineChartData(rawDataList, props.labels, props.seriesColors);
  return {
    type: "line",
    data: chartData,
    showLatestValues: props.showLatestValues,
  };
}

async function fetchMixedData(
  props: MixedChartComponentProps,
  prefCode: string,
  isNational: boolean
): Promise<{ type: "mixed"; data: MixedChartData } | null> {
  const [colData, lineData] = await Promise.all([
    fetchAllSeries(props.columnParams, prefCode, isNational),
    fetchAllSeries(props.lineParams, prefCode, isNational),
  ]);
  if (!colData || !lineData) return null;

  const chartData = toMixedChartData(
    colData,
    lineData,
    props.columnLabels,
    props.lineLabels,
    props.leftUnit,
    props.rightUnit,
    props.columnColors,
    props.lineColors,
  );
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
  const { getEstatCacheStorage } = await import("@/components/stat-charts/services/get-estat-cache-storage");

  try {
    const storage = await getEstatCacheStorage();
    const allData = await fetchFormattedStats(params, storage);

    const prefData = allData.filter((d) =>
      /^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(d.areaCode)
    );

    const byYear = new Map<string, { values: number[]; yearName: string; metricKey: string; unit: string }>();
    for (const d of prefData) {
      const entry = byYear.get(d.yearCode);
      if (entry) {
        entry.values.push(d.value ?? 0);
      } else {
        byYear.set(d.yearCode, {
          values: [d.value ?? 0],
          yearName: d.yearName,
          metricKey: d.metricKey,
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
        metricKey: entry.metricKey,
        value: Math.round(avg * 100) / 100,
        unit: entry.unit,
      });
    }

    return averaged.length > 0 ? averaged : null;
  } catch {
    return null;
  }
}

async function fetchCompositionData(
  props: CompositionChartComponentProps,
  prefCode: string,
  isNational: boolean
): Promise<{ type: "composition"; data: CompositionChartData; defaultTab?: "composition" | "trend" } | null> {
  const segmentData = await Promise.all(
    props.segments.map(async (seg) => {
      if (isNational) {
        return await fetchAllAndAverage({ statsDataId: props.statsDataId, cdCat01: seg.code } as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      }
      const result = await fetchEstatData(prefCode, { statsDataId: props.statsDataId, cdCat01: seg.code } as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      return "error" in result ? null : result.data;
    })
  );

  if (segmentData.some((d) => d === null)) return null;

  let totalData: StatsSchema[] | undefined;
  if (props.totalCode) {
    if (isNational) {
      totalData = (await fetchAllAndAverage({ statsDataId: props.statsDataId, cdCat01: props.totalCode } as unknown as import("@stats47/estat-api/server").GetStatsDataParams)) ?? undefined;
    } else {
      const result = await fetchEstatData(prefCode, { statsDataId: props.statsDataId, cdCat01: props.totalCode } as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      totalData = "error" in result ? undefined : result.data;
    }
  }

  const labels = props.segments.map((s) => s.label);
  const colors = props.segments.map((s) => s.color).filter((c): c is string => !!c);
  const chartData = toCompositionChartData(segmentData as StatsSchema[][], labels, colors, totalData);

  return chartData.trendData.length > 0
    ? { type: "composition", data: chartData, defaultTab: props.defaultTab }
    : null;
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
  props: DonutChartComponentProps,
  prefCode: string,
  isNational: boolean
): Promise<{ type: "donut"; data: DonutChartItem[] } | null> {
  const topN = props.topN ?? 9;

  // 各カテゴリの値を並列取得
  const results = await Promise.all(
    props.categories.map(async (cat) => {
      const data = isNational
        ? await fetchAllAndAverage({ statsDataId: props.statsDataId, cdCat01: cat.code } as unknown as import("@stats47/estat-api/server").GetStatsDataParams)
        : await fetchSeriesDataForDonut({ statsDataId: props.statsDataId, cdCat01: cat.code }, prefCode);
      if (!data || data.length === 0) return null;

      // 最新年度の値を取得
      const sorted = [...data].sort((a, b) => b.yearCode.localeCompare(a.yearCode));
      return {
        name: cat.label,
        value: sorted[0].value ?? 0,
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
  top.push({ name: "その他", value: otherValue, color: "hsl(var(--muted-foreground))" });
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
  props: CpiChartComponentProps,
  prefCode: string
): Promise<{ type: "cpi-profile"; data: CpiProfileItem[] } | null> {
  const excludeCodes = new Set(props.excludeCodes ?? ["00010", "00120"]);

  try {
    const { fetchFormattedStats } = await import("@stats47/estat-api/server");
    const params = {
      statsDataId: props.statsDataId,
      cdArea: prefCode,
      ...(props.year && { cdTime: props.year }),
    };

    const rawData = await fetchFormattedStats(params as import("@stats47/estat-api/server").GetStatsDataParams);
    if (rawData.length === 0) return null;

    // 年指定なしの場合は最新年のみフィルタ
    let filtered = rawData.filter((d) => !excludeCodes.has(d.metricKey));
    if (!props.year) {
      const latestYear = filtered.reduce((max, d) => d.yearCode > max ? d.yearCode : max, "");
      filtered = filtered.filter((d) => d.yearCode === latestYear);
    }

    const result: CpiProfileItem[] = filtered.map((d) => ({
      label: d.metricKey,
      value: d.value ?? 0,
      code: d.metricKey,
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
  props: CpiChartComponentProps,
  prefCode: string
): Promise<{ type: "cpi-heatmap"; data: CpiHeatmapItem[] } | null> {
  const excludeCodes = new Set(props.excludeCodes ?? ["00010", "00120"]);

  try {
    const { fetchFormattedStats } = await import("@stats47/estat-api/server");
    const params = {
      statsDataId: props.statsDataId,
      cdArea: prefCode,
    };

    const rawData = await fetchFormattedStats(params as import("@stats47/estat-api/server").GetStatsDataParams);
    if (rawData.length === 0) return null;

    const result: CpiHeatmapItem[] = rawData
      .filter((d) => !excludeCodes.has(d.metricKey))
      .map((d) => ({ x: d.yearName, y: d.metricKey, value: d.value ?? 0 }))
      .sort((a, b) => a.x.localeCompare(b.x));

    return result.length > 0 ? { type: "cpi-heatmap", data: result } : null;
  } catch {
    return null;
  }
}
