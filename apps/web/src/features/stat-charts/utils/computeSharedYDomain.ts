import { fetchFormattedStats, type GetStatsDataParams } from "@stats47/estat-api/server";

import { getEstatCacheStorage } from "../services";

import type { DashboardConfigMap, DashboardComponentType } from "../types";
import type { R2Bucket } from "@stats47/r2-storage";
import type { StatsSchema } from "@stats47/types";


/**
 * 比較ページで選択中の複数地域に対し、同一コンポーネントの Y 軸ドメインを算出する。
 *
 * 各地域のデータを取得し、全体の min/max からドメインを決定。
 * これにより東京と大阪を並べた際にスケールが揃う。
 */
export async function computeSharedYDomain(
  componentType: DashboardComponentType,
  config: Record<string, unknown>,
  areaCodes: string[],
): Promise<[number, number] | undefined> {
  try {
    const storage = await getEstatCacheStorage();
    switch (componentType) {
      case "line-chart":
        return computeForLineChart(config as DashboardConfigMap["line-chart"], areaCodes, storage);
      case "stacked-area":
        return computeForStackedArea(config as DashboardConfigMap["stacked-area"], areaCodes, storage);
      case "diverging-bar-chart":
        return computeForDiverging(config as DashboardConfigMap["diverging-bar-chart"], areaCodes, storage);
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/** 折れ線: 全地域×全系列の [min(0,min), max] */
async function computeForLineChart(
  config: DashboardConfigMap["line-chart"],
  areaCodes: string[],
  storage?: R2Bucket,
): Promise<[number, number] | undefined> {
  const paramsList = Array.isArray(config.estatParams) ? config.estatParams : [config.estatParams];
  const allValues = await fetchAllValues(paramsList, areaCodes, storage);
  if (allValues.length === 0) return undefined;
  return [Math.min(0, Math.min(...allValues)), Math.max(...allValues)];
}

/** 積み上げ面: 各地域×年度で系列を合算した最大値 */
async function computeForStackedArea(
  config: DashboardConfigMap["stacked-area"],
  areaCodes: string[],
  storage?: R2Bucket,
): Promise<[number, number] | undefined> {
  const { estatParams } = config;
  if (!estatParams || estatParams.length === 0) return undefined;

  const allData: StatsSchema[] = [];
  for (const areaCode of areaCodes) {
    for (const p of estatParams) {
      try {
        const data = await fetchFormattedStats({ ...p, cdArea: areaCode }, storage);
        allData.push(...data);
      } catch { /* skip */ }
    }
  }
  if (allData.length === 0) return undefined;

  // 各 (areaCode, yearCode) ごとに系列を合算
  const byKey = new Map<string, number>();
  for (const d of allData) {
    if (d.value == null) continue;
    const key = `${d.areaCode}-${d.yearCode}`;
    byKey.set(key, (byKey.get(key) ?? 0) + d.value);
  }
  const totals = [...byKey.values()];
  if (totals.length === 0) return undefined;
  return [0, Math.max(...totals)];
}

/** 上下対称: 全地域の最大絶対値で [-max, max] */
async function computeForDiverging(
  config: DashboardConfigMap["diverging-bar-chart"],
  areaCodes: string[],
  storage?: R2Bucket,
): Promise<[number, number] | undefined> {
  const { estatParams } = config;
  if (!estatParams || estatParams.length < 2) return undefined;

  const allValues = await fetchAllValues(estatParams, areaCodes, storage);
  if (allValues.length === 0) return undefined;
  const maxVal = Math.max(...allValues.map(Math.abs));
  return [-maxVal, maxVal];
}

/** ユーティリティ: 複数 estatParams × 複数地域の全数値を取得 */
async function fetchAllValues(
  paramsList: GetStatsDataParams[],
  areaCodes: string[],
  storage?: R2Bucket,
): Promise<number[]> {
  const results: number[] = [];
  for (const areaCode of areaCodes) {
    for (const p of paramsList) {
      try {
        const data = await fetchFormattedStats({ ...p, cdArea: areaCode }, storage);
        for (const d of data) {
          if (d.value != null) results.push(d.value);
        }
      } catch { /* skip */ }
    }
  }
  return results;
}
