import {
  fetchEstatDataAllAreas,
  type LegacyStatParams,
} from "../services/fetchEstatData";

import type { DashboardConfigMap, DashboardComponentType } from "../types";
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
    switch (componentType) {
      case "line-chart":
        return computeForLineChart(config as DashboardConfigMap["line-chart"], areaCodes);
      case "stacked-area":
        return computeForStackedArea(config as DashboardConfigMap["stacked-area"], areaCodes);
      case "diverging-bar-chart":
        return computeForDiverging(config as DashboardConfigMap["diverging-bar-chart"], areaCodes);
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
): Promise<[number, number] | undefined> {
  const paramsList = Array.isArray(config.estatParams) ? config.estatParams : [config.estatParams];
  const allValues = await fetchAllValues(paramsList, areaCodes);
  if (allValues.length === 0) return undefined;
  return [Math.min(0, Math.min(...allValues)), Math.max(...allValues)];
}

/** 積み上げ面: 各地域×年度で系列を合算した最大値 */
async function computeForStackedArea(
  config: DashboardConfigMap["stacked-area"],
  areaCodes: string[],
): Promise<[number, number] | undefined> {
  const { estatParams } = config;
  if (!estatParams || estatParams.length === 0) return undefined;

  const allData: StatsSchema[] = [];
  for (const params of estatParams) {
    const result = await fetchEstatDataAllAreas(params);
    if ("data" in result) {
      allData.push(...result.data.filter((row) => areaCodes.includes(row.areaCode)));
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
): Promise<[number, number] | undefined> {
  const { estatParams } = config;
  if (!estatParams || estatParams.length < 2) return undefined;

  const allValues = await fetchAllValues(estatParams, areaCodes);
  if (allValues.length === 0) return undefined;
  const maxVal = Math.max(...allValues.map(Math.abs));
  return [-maxVal, maxVal];
}

/** ユーティリティ: 複数 estatParams × 複数地域の全数値を取得 */
async function fetchAllValues(
  paramsList: LegacyStatParams[],
  areaCodes: string[],
): Promise<number[]> {
  const results: number[] = [];
  for (const params of paramsList) {
    const result = await fetchEstatDataAllAreas(params);
    if ("data" in result) {
      for (const row of result.data) {
        if (areaCodes.includes(row.areaCode) && row.value != null) results.push(row.value);
      }
    }
  }
  return results;
}
