"use server";

import {
  resolveChartColorHex,
  type StatSeriesRef,
} from "@stats47/data-configs/theme-catalog";
import { readStatsValues } from "@stats47/stats-r2/readers";

import {
  toCompositionChartData,
  type CompositionChartData,
} from "@/components/stat-charts/adapters/toCompositionChartData";
import { toLineChartData } from "@/components/stat-charts/adapters/toLineChartData";
import { toMixedChartData } from "@/components/stat-charts/adapters/toMixedChartData";
import type { LineChartData, MixedChartData } from "@/components/stat-charts/types/visualization";

import { aggregateMetricTimeseries } from "../lib/aggregate-metric-timeseries";
import { NATIONAL_AREA_CODE } from "../lib/select-national-series";

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
  | {
      type: "line";
      data: LineChartData;
      contract: ThemeChartDataContract;
      showLatestValues?: boolean;
    }
  | { type: "mixed"; data: MixedChartData; contract: ThemeChartDataContract }
  | {
      type: "composition";
      data: CompositionChartData;
      contract: ThemeChartDataContract;
      defaultTab?: "composition" | "trend";
    }
  | { type: "donut"; data: DonutChartItem[]; contract: ThemeChartDataContract }
  | {
      type: "cpi-profile";
      data: CpiProfileItem[];
      contract: ThemeChartDataContract;
    }
  | {
      type: "cpi-heatmap";
      data: CpiHeatmapItem[];
      contract: ThemeChartDataContract;
    }
  | null;

export interface ThemeChartDataContract {
  unit: string;
  year: string;
  seriesCount: number;
  /** 全国行が無い場合に、全国値と誤認させないための表示ラベル。 */
  scopeLabel?: "47都道府県平均";
}

export type ThemeDbChartResult = ChartResult;

function resolveScopeLabel(
  rows: ReadonlyArray<readonly StatsSchema[] | null | undefined>,
): ThemeChartDataContract["scopeLabel"] {
  return rows.some((series) =>
    series?.some((row) => row.areaName === "全国平均"),
  )
    ? "47都道府県平均"
    : undefined;
}

function lineContract(
  data: LineChartData,
  rows: ReadonlyArray<readonly StatsSchema[]>,
): ThemeChartDataContract {
  const last = data.data.at(-1);
  return {
    unit: data.unit ?? "",
    year: String(last?.yearCode ?? last?.year ?? ""),
    seriesCount: data.lines.length,
    scopeLabel: resolveScopeLabel(rows),
  };
}

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
  const parsed = parseThemeDbChartComponentProps(componentType, componentProps);
  if (!parsed) return null;

  if (parsed.componentType === "line-chart") {
    return fetchLineData(parsed.props, prefCode);
  }
  if (parsed.componentType === "mixed-chart") {
    return fetchMixedData(parsed.props, prefCode);
  }
  if (parsed.componentType === "donut-chart") {
    return fetchDonutData(parsed.props, prefCode);
  }
  if (parsed.componentType === "composition-chart") {
    return fetchCompositionData(parsed.props, prefCode);
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
): Promise<Extract<NonNullable<ChartResult>, { type: "line" }> | null> {
  return props.seriesRefs ? fetchR2LineData(props, prefCode) : null;
}

/**
 * MetricConfig の取得・派生・換算を一度だけ適用して生成された R2 系列を読む。
 * ThemeCatalog 側には metricKey / label / color role 以外の recipe を置かない。
 */
async function fetchR2LineData(
  props: LineChartComponentProps,
  prefCode: string
): Promise<Extract<NonNullable<ChartResult>, { type: "line" }> | null> {
  const refs = props.seriesRefs;
  if (!refs) return null;

  try {
    const rawDataList = await Promise.all(
      refs.map((ref) => readR2Series(ref, prefCode)),
    );
    if (rawDataList.some((series) => series === null)) return null;

    const labels = refs.map((ref, index) => ref.label ?? props.labels?.[index] ?? ref.metricKey);
    const colors = refs.every((ref) => ref.colorRole !== undefined)
      ? refs.map((ref) => resolveChartColorHex(ref.colorRole!))
      : props.seriesColors;
    const chartData = toLineChartData(rawDataList as StatsSchema[][], labels, colors);
    return {
      type: "line",
      data: chartData,
      contract: lineContract(chartData, rawDataList as StatsSchema[][]),
      showLatestValues: props.showLatestValues,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function readR2Series(
  ref: StatSeriesRef,
  prefCode: string,
): Promise<StatsSchema[] | null> {
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
  return series.points.map((point): StatsSchema => ({
    areaCode,
    areaName:
      series.source === "average"
        ? "全国平均"
        : areaCode === NATIONAL_AREA_CODE
          ? "全国"
          : areaCode,
    yearCode: point.year,
    yearName: point.yearName,
    metricKey: ref.metricKey,
    value: point.value,
    unit,
  }));
}

async function fetchMixedData(
  props: MixedChartComponentProps,
  prefCode: string,
): Promise<Extract<NonNullable<ChartResult>, { type: "mixed" }> | null> {
  return props.columnSeriesRefs && props.lineSeriesRefs
    ? fetchR2MixedData(props, prefCode)
    : null;
}

async function fetchR2MixedData(
  props: MixedChartComponentProps,
  prefCode: string,
): Promise<Extract<NonNullable<ChartResult>, { type: "mixed" }> | null> {
  const columnRefs = props.columnSeriesRefs;
  const lineRefs = props.lineSeriesRefs;
  if (!columnRefs || !lineRefs) return null;
  const [colData, lineData] = await Promise.all([
    Promise.all(columnRefs.map((ref) => readR2Series(ref, prefCode))),
    Promise.all(lineRefs.map((ref) => readR2Series(ref, prefCode))),
  ]);
  if ([...colData, ...lineData].some((series) => series === null)) return null;

  const columns = colData as StatsSchema[][];
  const lines = lineData as StatsSchema[][];
  const chartData = toMixedChartData(
    columns,
    lines,
    columnRefs.map((ref, index) => ref.label ?? props.columnLabels?.[index] ?? ref.metricKey),
    lineRefs.map((ref, index) => ref.label ?? props.lineLabels?.[index] ?? ref.metricKey),
    props.leftUnit,
    props.rightUnit,
    columnRefs.every((ref) => ref.colorRole !== undefined)
      ? columnRefs.map((ref) => resolveChartColorHex(ref.colorRole!))
      : props.columnColors,
    lineRefs.every((ref) => ref.colorRole !== undefined)
      ? lineRefs.map((ref) => resolveChartColorHex(ref.colorRole!))
      : props.lineColors,
  );
  const last = chartData.data.at(-1);
  return {
    type: "mixed",
    data: chartData,
    contract: {
      unit: [chartData.leftUnit, chartData.rightUnit].filter(Boolean).join(" / "),
      year: String(last?.yearCode ?? last?.year ?? ""),
      seriesCount: chartData.columns.length + chartData.lines.length,
      scopeLabel: resolveScopeLabel([...columns, ...lines]),
    },
  };
}

async function fetchCompositionData(
  props: CompositionChartComponentProps,
  prefCode: string,
): Promise<Extract<NonNullable<ChartResult>, { type: "composition" }> | null> {
  if (props.seriesRefs) {
    const segmentData = await Promise.all(
      props.seriesRefs.map((ref) => readR2Series(ref, prefCode)),
    );
    if (segmentData.some((series) => series === null)) return null;
    const rows = segmentData as StatsSchema[][];
    const labels = props.seriesRefs.map(
      (ref, index) => ref.label ?? props.segments?.[index]?.label ?? ref.metricKey,
    );
    const colors = props.seriesRefs.map((ref, index) =>
      ref.colorRole
        ? resolveChartColorHex(ref.colorRole)
        : (props.segments?.[index]?.color ?? resolveChartColorHex("series-1")),
    );
    const chartData = toCompositionChartData(rows, labels, colors);
    return chartData.trendData.length > 0
      ? {
          type: "composition",
          data: chartData,
          contract: {
            unit: chartData.unit,
            year: chartData.latestYearLabel,
            seriesCount: chartData.series.length,
            scopeLabel: resolveScopeLabel(rows),
          },
          defaultTab: props.defaultTab,
        }
      : null;
  }
  return null;
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
): Promise<Extract<NonNullable<ChartResult>, { type: "donut" }> | null> {
  const topN = props.topN ?? 9;

  if (props.seriesRefs) {
    const series = await Promise.all(
      props.seriesRefs.map((ref) => readR2Series(ref, prefCode)),
    );
    const validResults = series.flatMap((rows, index) => {
      if (!rows || rows.length === 0) return [];
      const latest = [...rows].sort((a, b) => b.yearCode.localeCompare(a.yearCode))[0];
      if (typeof latest.value !== "number" || latest.value <= 0) return [];
      const ref = props.seriesRefs![index];
      return [{
        item: {
          name: ref.label ?? props.categories?.[index]?.label ?? ref.metricKey,
          value: latest.value,
          color: ref.colorRole
            ? resolveChartColorHex(ref.colorRole)
            : (props.categories?.[index]?.color ?? resolveChartColorHex("series-1")),
        },
        year: latest.yearName || latest.yearCode,
        unit: latest.unit ?? "",
        scopeLabel: latest.areaName === "全国平均" ? ("47都道府県平均" as const) : undefined,
      }];
    });
    return buildDonutResult(validResults, topN);
  }
  return null;
}

function buildDonutResult(
  validResults: Array<{
    item: DonutChartItem;
    year: string;
    unit: string;
    scopeLabel?: "47都道府県平均";
  }>,
  topN: number,
): Extract<NonNullable<ChartResult>, { type: "donut" }> | null {
  const valid = validResults.map((result) => result.item);
  if (valid.length === 0) return null;

  const contract: ThemeChartDataContract = {
    unit: validResults[0].unit,
    year: validResults[0].year,
    seriesCount: valid.length,
    scopeLabel: validResults.some((result) => result.scopeLabel)
      ? "47都道府県平均"
      : undefined,
  };

  // 降順ソート → 上位N + その他
  valid.sort((a, b) => b.value - a.value);
  if (valid.length <= topN + 1) {
    return { type: "donut", data: valid, contract };
  }

  const top = valid.slice(0, topN);
  const otherValue = valid.slice(topN).reduce((sum, i) => sum + i.value, 0);
  top.push({
    name: "その他",
    value: otherValue,
    color: "hsl(var(--muted-foreground))",
  });
  return {
    type: "donut",
    data: top,
    contract: { ...contract, seriesCount: top.length },
  };
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
): Promise<Extract<NonNullable<ChartResult>, { type: "cpi-profile" }> | null> {
  return props.seriesRefs ? fetchR2CpiProfileData(props, prefCode) : null;
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
): Promise<Extract<NonNullable<ChartResult>, { type: "cpi-heatmap" }> | null> {
  return props.seriesRefs ? fetchR2CpiHeatmapData(props, prefCode) : null;
}

function commonCpiYears(series: readonly StatsSchema[][]): string[] {
  if (series.length === 0) return [];
  const common = new Set(series[0].map((row) => row.yearCode));
  for (const rows of series.slice(1)) {
    const years = new Set(rows.map((row) => row.yearCode));
    for (const year of common) if (!years.has(year)) common.delete(year);
  }
  return [...common].sort();
}

async function readR2CpiSeries(
  props: CpiChartComponentProps,
  prefCode: string,
): Promise<{ refs: StatSeriesRef[]; series: StatsSchema[][] } | null> {
  const refs = props.seriesRefs;
  if (!refs) return null;
  const rows = await Promise.all(refs.map((ref) => readR2Series(ref, prefCode)));
  if (rows.some((value) => value === null)) return null;
  return { refs, series: rows as StatsSchema[][] };
}

async function fetchR2CpiProfileData(
  props: CpiChartComponentProps,
  prefCode: string,
): Promise<Extract<NonNullable<ChartResult>, { type: "cpi-profile" }> | null> {
  const loaded = await readR2CpiSeries(props, prefCode);
  if (!loaded) return null;
  const commonYears = commonCpiYears(loaded.series);
  const year = props.year ?? commonYears.at(-1);
  if (!year || !commonYears.includes(year)) return null;
  const selected = loaded.series.map((rows) => rows.find((row) => row.yearCode === year));
  if (selected.some((row) => !row || row.value === null)) return null;
  const rows = selected as StatsSchema[];
  return {
    type: "cpi-profile",
    data: rows.map((row, index) => ({
      label: loaded.refs[index].label ?? loaded.refs[index].metricKey,
      value: row.value as number,
      code: loaded.refs[index].metricKey,
    })),
    contract: {
      unit: rows[0].unit?.trim() || "指数",
      year: rows[0].yearName || rows[0].yearCode,
      seriesCount: rows.length,
      scopeLabel: resolveScopeLabel(loaded.series),
    },
  };
}

async function fetchR2CpiHeatmapData(
  props: CpiChartComponentProps,
  prefCode: string,
): Promise<Extract<NonNullable<ChartResult>, { type: "cpi-heatmap" }> | null> {
  const loaded = await readR2CpiSeries(props, prefCode);
  if (!loaded) return null;
  const years = props.year
    ? commonCpiYears(loaded.series).filter((year) => year === props.year)
    : commonCpiYears(loaded.series);
  if (years.length === 0) return null;
  const yearSet = new Set(years);
  const data = loaded.series.flatMap((rows, index) =>
    rows
      .filter((row) => yearSet.has(row.yearCode) && row.value !== null)
      .map((row) => ({
        x: row.yearName || row.yearCode,
        y: loaded.refs[index].label ?? loaded.refs[index].metricKey,
        value: row.value as number,
      })),
  ).sort((a, b) => a.x.localeCompare(b.x) || a.y.localeCompare(b.y));
  if (data.length !== years.length * loaded.refs.length) return null;
  return {
    type: "cpi-heatmap",
    data,
    contract: {
      unit: loaded.series[0][0]?.unit?.trim() || "指数",
      year: years.at(-1) ?? "",
      seriesCount: loaded.refs.length,
      scopeLabel: resolveScopeLabel(loaded.series),
    },
  };
}
