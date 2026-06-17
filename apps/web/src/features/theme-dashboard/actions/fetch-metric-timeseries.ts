"use server";

import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";
import { readRankingItemFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { getEstatCacheStorage } from "@/components/stat-charts/server";

/**
 * 指標の時系列データを取得する Server Action
 *
 * 選択中の都道府県 (areaCode) について metric の全年度値を返す。
 * areaCode='00000' は全国 (e-Stat に全国行があれば採用、無ければ 47 県平均)。
 *
 * 戻り値: 年度昇順の { year, yearName, value } 配列
 */
export interface MetricTimeseriesPoint {
  year: string;
  yearName: string;
  value: number;
}

export async function fetchMetricTimeseriesAction(
  rankingKey: string,
  areaCode: string,
): Promise<MetricTimeseriesPoint[]> {
  const result = await readRankingItemFromR2(rankingKey, "prefecture");
  if (!result || !isOk(result) || !result.data) return [];

  const rankingItem = result.data;
  const { sourceConfig, calculation } = rankingItem;

  // 計算型は全年度 timeseries 取得未対応 (Phase 3.5 で個別対応)
  if (calculation?.isCalculated) {
    return [];
  }

  if (!sourceConfig?.statsDataId) return [];

  try {
    const params: GetStatsDataParams = {
      ...(sourceConfig as GetStatsDataParams),
    };
    const storage = await getEstatCacheStorage();
    const rawData = await fetchFormattedStats(params, storage);
    if (!rawData || rawData.length === 0) return [];

    // 年度ごとに集約
    const byYear = new Map<string, { yearName: string; values: number[]; nationalValue: number | null }>();
    for (const d of rawData) {
      if (typeof d.value !== "number" || !Number.isFinite(d.value)) continue;
      const entry = byYear.get(d.yearCode) ?? {
        yearName: d.yearName ?? d.yearCode,
        values: [],
        nationalValue: null,
      };
      if (d.areaCode === "00000") {
        entry.nationalValue = d.value;
      } else if (d.areaCode === areaCode) {
        // 特定県の値
        entry.values.push(d.value);
      } else if (areaCode === "00000") {
        // 全国モード: 47 県の値を集約 (平均算出用)
        entry.values.push(d.value);
      }
      byYear.set(d.yearCode, entry);
    }

    const points: MetricTimeseriesPoint[] = [];
    for (const [yearCode, entry] of byYear.entries()) {
      let value: number | null = null;
      if (areaCode === "00000") {
        // 全国: e-Stat に 00000 行があればそれ、無ければ 47 県平均
        if (entry.nationalValue !== null) value = entry.nationalValue;
        else if (entry.values.length > 0) {
          value = entry.values.reduce((a, b) => a + b, 0) / entry.values.length;
        }
      } else if (entry.values.length === 1) {
        value = entry.values[0];
      }
      if (value === null) continue;
      points.push({ year: yearCode, yearName: entry.yearName, value });
    }

    points.sort((a, b) => a.year.localeCompare(b.year));
    return points;
  } catch {
    return [];
  }
}
