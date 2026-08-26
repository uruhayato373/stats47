"use server";


import { resolveChartColorHex } from "@stats47/data-configs/theme-catalog";
import { readStatsValues } from "@stats47/stats-r2/readers";

import { toCompositionChartData, type CompositionChartData } from "@/components/stat-charts/adapters/toCompositionChartData";
import { toLineChartData } from "@/components/stat-charts/adapters/toLineChartData";
import { toMixedChartData } from "@/components/stat-charts/adapters/toMixedChartData";
import { fetchEstatData } from "@/components/stat-charts/server";
import type { LineChartData, MixedChartData } from "@/components/stat-charts/types/visualization";

import { aggregateMetricTimeseries } from "../lib/aggregate-metric-timeseries";
import {
  NATIONAL_AREA_CODE,
  selectNationalSeries,
} from "../lib/select-national-series";

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
  const isNational = prefCode === NATIONAL_AREA_CODE;
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
  if (props.seriesRefs) {
    return fetchR2LineData(props, prefCode);
  }
  if (!props.estatParams) return null;
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

/**
 * MetricConfig の取得・派生・換算を一度だけ適用して生成された R2 系列を読む。
 * ThemeCatalog 側には metricKey / label / color role 以外の recipe を置かない。
 */
async function fetchR2LineData(
  props: LineChartComponentProps,
  prefCode: string,
): Promise<{ type: "line"; data: LineChartData; showLatestValues?: boolean } | null> {
  const refs = props.seriesRefs;
  if (!refs) return null;

  try {
    const rawDataList = await Promise.all(
      refs.map(async (ref) => {
        const payload = await readStatsValues(ref.metricKey, "prefecture");
        if (!payload) return null;
        const areaCode = ref.area === "national" ? NATIONAL_AREA_CODE : prefCode;
        const rows = ref.year
          ? payload.rows.filter((row) => row.yearCode === ref.year)
          : payload.rows;
        const series = aggregateMetricTimeseries(rows, areaCode);
        if (series.points.length === 0) return null;
        const unit = rows.find((row) => row.unit)?.unit;
        if (!unit) return null;
        return series.points.map(
          (point): StatsSchema => ({
            areaCode,
            areaName: areaCode === NATIONAL_AREA_CODE ? "全国" : areaCode,
            yearCode: point.year,
            yearName: point.yearName,
            metricKey: ref.metricKey,
            value: point.value,
            unit,
          }),
        );
      }),
    );
    if (rawDataList.some((series) => series === null)) return null;

    const labels = refs.map((ref) => ref.label ?? ref.metricKey);
    const colors = refs.every((ref) => ref.colorRole !== undefined)
      ? refs.map((ref) => resolveChartColorHex(ref.colorRole!))
      : undefined;
    return {
      type: "line",
      data: toLineChartData(rawDataList as StatsSchema[][], labels, colors),
      showLatestValues: props.showLatestValues,
    };
  } catch {
    return null;
  }
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
 * 複数系列のデータを並列取得。全国の場合は全国系列を取得する。
 */
async function fetchAllSeries(
  paramsList: Array<Record<string, string>>,
  prefCode: string,
  isNational: boolean
): Promise<StatsSchema[][] | null> {
  const results = await Promise.all(
    paramsList.map(async (params) => {
      if (isNational) {
        return fetchNationalSeries(params as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      }
      const result = await fetchEstatData(prefCode, params as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      if ("error" in result) return null;
      return result.data;
    })
  );

  if (results.some((r) => r === null)) return null;
  return results as StatsSchema[][];
}

/**
 * 全国 (areaCode "00000") の系列を取得する。
 *
 * 「全国行を使うか 47 県平均へ落とすか」の判定は純粋関数 `selectNationalSeries` が持ち、
 * ここは取得だけを担う (判定の不変量はユニットテストで固定する)。
 */
async function fetchNationalSeries(
  params: import("@stats47/estat-api/server").GetStatsDataParams,
): Promise<StatsSchema[] | null> {
  const { fetchFormattedStats } = await import("@stats47/estat-api/server");
  const { getEstatCacheStorage } = await import("@/components/stat-charts/services/get-estat-cache-storage");

  try {
    const storage = await getEstatCacheStorage();
    const allData = await fetchFormattedStats(params, storage);
    return selectNationalSeries(allData);
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
        return await fetchNationalSeries({ statsDataId: props.statsDataId, cdCat01: seg.code } as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      }
      const result = await fetchEstatData(prefCode, { statsDataId: props.statsDataId, cdCat01: seg.code } as unknown as import("@stats47/estat-api/server").GetStatsDataParams);
      return "error" in result ? null : result.data;
    })
  );

  if (segmentData.some((d) => d === null)) return null;

  let totalData: StatsSchema[] | undefined;
  if (props.totalCode) {
    if (isNational) {
      totalData = (await fetchNationalSeries({ statsDataId: props.statsDataId, cdCat01: props.totalCode } as unknown as import("@stats47/estat-api/server").GetStatsDataParams)) ?? undefined;
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
        ? await fetchNationalSeries({ statsDataId: props.statsDataId, cdCat01: cat.code } as unknown as import("@stats47/estat-api/server").GetStatsDataParams)
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
