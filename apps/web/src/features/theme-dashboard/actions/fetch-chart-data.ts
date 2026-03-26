"use server";

import type { StatsSchema } from "@stats47/types";
import type { DualLineChartDef, MixedChartDef, ChartDefinition } from "@stats47/types";
import { resolveEstatParams } from "@stats47/ranking/server";

import { fetchEstatData } from "@/features/stat-charts/services/fetchEstatData";
import { toLineChartData } from "@/features/stat-charts/adapters/toLineChartData";
import { toMixedChartData } from "@/features/stat-charts/adapters/toMixedChartData";
import type { LineChartData, MixedChartData } from "@/features/stat-charts/types/visualization";

/**
 * テーマダッシュボード用: ChartDefinition + 都道府県コード からチャートデータを取得
 *
 * rankingKey → e-Stat API パラメータ解決 → fetchEstatData → アダプター変換
 * の流れで、stat-charts と同じデータパイプラインを使用する。
 *
 * prefCode が "00000" の場合は全47都道府県の平均値を計算。
 */
export async function fetchThemeChartDataAction(
  chartDef: ChartDefinition,
  prefCode: string
): Promise<{ type: "line"; data: LineChartData } | { type: "mixed"; data: MixedChartData } | null> {
  if (chartDef.type === "dual-line") {
    return fetchDualLineData(chartDef, prefCode);
  }
  if (chartDef.type === "mixed") {
    return fetchMixedData(chartDef, prefCode);
  }
  return null;
}

async function fetchDualLineData(
  chartDef: DualLineChartDef,
  prefCode: string
): Promise<{ type: "line"; data: LineChartData } | null> {
  const [s0, s1] = chartDef.series;

  const [params0, params1] = await Promise.all([
    resolveEstatParams(s0.rankingKey),
    resolveEstatParams(s1.rankingKey),
  ]);
  if (!params0 || !params1) return null;

  const isNational = prefCode === "00000";

  const [raw0, raw1] = await Promise.all([
    fetchSeriesData(params0, prefCode, isNational),
    fetchSeriesData(params1, prefCode, isNational),
  ]);
  if (!raw0 || !raw1) return null;

  const chartData = toLineChartData([raw0, raw1], [s0.name, s1.name], [s0.color, s1.color]);

  return { type: "line", data: chartData };
}

async function fetchMixedData(
  chartDef: MixedChartDef,
  prefCode: string
): Promise<{ type: "mixed"; data: MixedChartData } | null> {
  const col = chartDef.columns[0];
  const line = chartDef.lines[0];

  const [colParams, lineParams] = await Promise.all([
    resolveEstatParams(col.rankingKey),
    resolveEstatParams(line.rankingKey),
  ]);
  if (!colParams || !lineParams) return null;

  const isNational = prefCode === "00000";

  const [colRaw, lineRaw] = await Promise.all([
    fetchSeriesData(colParams, prefCode, isNational),
    fetchSeriesData(lineParams, prefCode, isNational),
  ]);
  if (!colRaw || !lineRaw) return null;

  const chartData = toMixedChartData(
    [colRaw], [lineRaw],
    [col.name], [line.name],
    chartDef.leftUnit, chartDef.rightUnit,
    [col.color], [line.color]
  );

  return { type: "mixed", data: chartData };
}

/**
 * 1系列分のデータを取得。全国選択時は47都道府県の平均値を算出。
 */
async function fetchSeriesData(
  params: import("@stats47/estat-api/server").GetStatsDataParams,
  prefCode: string,
  isNational: boolean
): Promise<StatsSchema[] | null> {
  if (isNational) {
    // 全都道府県データを取得して年度ごとに平均値を算出
    const result = await fetchEstatData("00000", { ...params, cdArea: undefined as unknown as string });
    if ("error" in result) {
      // cdArea なしで全データ取得を試みる
      const allResult = await fetchAllAndAverage(params);
      return allResult;
    }
    return result.data;
  }

  const result = await fetchEstatData(prefCode, params);
  if ("error" in result) return null;
  return result.data;
}

/**
 * 全47都道府県データを取得し、年度ごとの平均値を算出
 */
async function fetchAllAndAverage(
  params: import("@stats47/estat-api/server").GetStatsDataParams,
): Promise<StatsSchema[] | null> {
  // fetchEstatData は cdArea なしで全データを取得し、areaCode でフィルタする。
  // "00000" は全国コードだが e-Stat にはないので、全データを取得して集計する。
  // fetchFormattedStats を直接使って全データを取得
  const { fetchFormattedStats } = await import("@stats47/estat-api/server");
  const { getEstatCacheStorage } = await import("@/features/stat-charts/services/get-estat-cache-storage");

  try {
    const storage = await getEstatCacheStorage();
    const allData = await fetchFormattedStats(params, storage);

    // 都道府県コード（01000-47000）のみフィルタ
    const prefData = allData.filter((d) =>
      /^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(d.areaCode)
    );

    // 年度ごとに平均値を算出
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
