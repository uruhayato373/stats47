import type { ChartDataNode } from "@stats47/visualization/d3";
import type { StatsSchema } from "@stats47/types";

/** ChoroplethMap 用: { areaCode, value } */
export interface ChoroplethDataNode {
  areaCode: string;
  value: number;
}

function getLatestYear(stats: StatsSchema[]): string | undefined {
  const years = [...new Set(stats.map((s) => s.yearCode))].sort();
  return years[years.length - 1];
}

/** BarChart 用: 最新年の都道府県別データ（全国値除外） */
export function convertToBarData(stats: StatsSchema[]): ChartDataNode[] {
  const latestYear = getLatestYear(stats);
  if (!latestYear) return [];
  return stats
    .filter((s) => s.yearCode === latestYear && s.areaCode !== "00000")
    .map((s) => ({ name: s.areaName, value: s.value, code: s.areaCode }));
}

/** LineChart 用（単一系列）: 全国データ優先、年度昇順 */
export function convertToLineData(
  stats: StatsSchema[]
): { category: string; label: string; value: number }[] {
  const national = stats.filter((s) => s.areaCode === "00000");
  const source = national.length > 0 ? national : stats;
  const years = [...new Set(source.map((s) => s.yearCode))].sort();
  return years.map((yc) => {
    const record = source.find((s) => s.yearCode === yc);
    return { category: yc, label: record?.yearName ?? yc, value: record?.value ?? 0 };
  });
}

/** LineChart 用（複数都道府県比較）: year × prefecture マトリクス */
export function convertToMultiAreaLineData(
  stats: StatsSchema[]
): { category: string; label: string; [key: string]: string | number }[] {
  const years = [...new Set(stats.map((s) => s.yearCode))].sort();
  return years.map((yc) => {
    const row: { category: string; label: string; [key: string]: string | number } = {
      category: yc,
      label: stats.find((s) => s.yearCode === yc)?.yearName ?? yc,
    };
    stats.filter((s) => s.yearCode === yc).forEach((s) => {
      row[s.areaName] = s.value;
    });
    return row;
  });
}

/** ChoroplethMap 用: 最新年の都道府県別データ（全国値除外） */
export function convertToChoroplethData(stats: StatsSchema[]): ChoroplethDataNode[] {
  const latestYear = getLatestYear(stats);
  if (!latestYear) return [];
  return stats
    .filter((s) => s.yearCode === latestYear && s.areaCode !== "00000")
    .map((s) => ({ areaCode: s.areaCode, value: s.value }));
}

/**
 * LineChart 用変換の自動判定
 * stats 内のユニーク areaCode（全国値除く）が 2 以上なら複数系列
 */
export function convertToLineDataAuto(
  stats: StatsSchema[]
): ReturnType<typeof convertToLineData> | ReturnType<typeof convertToMultiAreaLineData> {
  const areaCodes = [
    ...new Set(stats.filter((s) => s.areaCode !== "00000").map((s) => s.areaCode)),
  ];
  if (areaCodes.length >= 2) {
    return convertToMultiAreaLineData(stats.filter((s) => s.areaCode !== "00000"));
  }
  return convertToLineData(stats);
}
