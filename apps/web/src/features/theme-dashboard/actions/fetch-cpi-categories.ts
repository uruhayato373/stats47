"use server";

import { fetchFormattedStats, type GetStatsDataParams } from "@stats47/estat-api/server";
import type { StatsSchema } from "@stats47/types";

export interface CpiCategoryData {
  label: string;
  value: number;
  code: string;
}

/** 除外する品目コード（総合と参考値） */
const EXCLUDED_CODES = new Set(["00010", "00120"]);

/** 最新年のコード */
const LATEST_YEAR = "2024000000";

/**
 * 10大費目別 消費者物価地域差指数（全国平均=100）を取得
 *
 * e-Stat statsDataId: 0003441258（小売物価統計調査・構造編）
 */
export async function fetchCpiCategoriesAction(
  prefCode: string,
  year?: string,
): Promise<CpiCategoryData[] | null> {
  try {
    const params: GetStatsDataParams = {
      statsDataId: "0003441258",
      cdArea: prefCode,
      cdTime: year ?? LATEST_YEAR,
    };

    const rawData: StatsSchema[] = await fetchFormattedStats(params);

    if (rawData.length === 0) return null;

    const result: CpiCategoryData[] = rawData
      .filter((d) => !EXCLUDED_CODES.has(d.categoryCode))
      .map((d) => ({
        label: d.categoryName,
        value: d.value,
        code: d.categoryCode,
      }));

    return result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

export interface CpiHeatmapCell {
  x: string;   // 年名（"2024年"）
  y: string;   // 品目名（"食料"）
  value: number;
}

/**
 * 全年分の10大費目別 CPI 地域差指数を取得（ヒートマップ用）
 */
export async function fetchCpiAllYearsAction(
  prefCode: string,
): Promise<CpiHeatmapCell[] | null> {
  try {
    const params: GetStatsDataParams = {
      statsDataId: "0003441258",
      cdArea: prefCode,
    };

    const rawData: StatsSchema[] = await fetchFormattedStats(params);
    if (rawData.length === 0) return null;

    const result: CpiHeatmapCell[] = rawData
      .filter((d) => !EXCLUDED_CODES.has(d.categoryCode))
      .map((d) => ({
        x: d.yearName,
        y: d.categoryName,
        value: d.value,
      }))
      .sort((a, b) => a.x.localeCompare(b.x));

    return result.length > 0 ? result : null;
  } catch {
    return null;
  }
}
