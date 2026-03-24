import type { StatsSchema } from '@stats47/types';

export type BlogChartType =
  | "bar"
  | "column"
  | "line"
  | "choropleth"
  | "scatterplot"
  | "donut"
  | "treemap"
  | "sunburst";

/** BarChart / ColumnChart 用: { name, value, code } */
export interface BarDataNode {
  name: string;
  value: number;
  code: string;
}

/** LineChart 用（単一系列）: { category, label, value } */
export interface LineDataNode {
  category: string;
  label: string;
  value: number;
}

/** LineChart 用（複数系列）: { category, label, [areaName]: value } */
export type MultiAreaLineDataNode = {
  category: string;
  label: string;
  [areaName: string]: string | number;
};

/** ChoroplethMap 用: { areaCode, value } */
export interface ChoroplethDataNode {
  areaCode: string;
  value: number;
}

/**
 * StatsSchema[] から最新年を特定するユーティリティ
 */
function getLatestYear(stats: StatsSchema[]): string | undefined {
  const years = [...new Set(stats.map(s => s.yearCode))].sort();
  return years[years.length - 1];
}

/**
 * BarChart / ColumnChart 用変換
 * 最新年の都道府県別データを返す（全国値 areaCode=00000 は除外）
 */
export function convertToBarData(stats: StatsSchema[]): BarDataNode[] {
  const latestYear = getLatestYear(stats);
  if (!latestYear) return [];
  return stats
    .filter(s => s.yearCode === latestYear && s.areaCode !== '00000')
    .map(s => ({ name: s.areaName, value: s.value, code: s.areaCode }));
}

/**
 * LineChart 用変換（単一系列）
 * 全国データ（areaCode=00000）があればそれを使い、なければ全データの合計を使う。
 * 年度昇順で返す。
 */
export function convertToLineData(stats: StatsSchema[]): LineDataNode[] {
  const national = stats.filter(s => s.areaCode === '00000');
  const source = national.length > 0 ? national : stats;
  const years = [...new Set(source.map(s => s.yearCode))].sort();
  return years.map(yc => {
    const record = source.find(s => s.yearCode === yc);
    return {
      category: yc,
      label: record?.yearName ?? yc,
      value: record?.value ?? 0,
    };
  });
}

/**
 * LineChart 用変換（複数都道府県比較）
 * stats に複数の areaCode が含まれる場合に使う。
 * 各都道府県を系列として year × prefecture のマトリクス形式で返す。
 */
export function convertToMultiAreaLineData(
  stats: StatsSchema[]
): MultiAreaLineDataNode[] {
  const years = [...new Set(stats.map(s => s.yearCode))].sort();
  return years.map(yc => {
    const row: MultiAreaLineDataNode = {
      category: yc,
      label: stats.find(s => s.yearCode === yc)?.yearName ?? yc,
    };
    stats.filter(s => s.yearCode === yc).forEach(s => {
      row[s.areaName] = s.value;
    });
    return row;
  });
}

/**
 * ChoroplethMap 用変換
 * 最新年の都道府県別データを返す（全国値除外）
 */
export function convertToChoroplethData(stats: StatsSchema[]): ChoroplethDataNode[] {
  const latestYear = getLatestYear(stats);
  if (!latestYear) return [];
  return stats
    .filter(s => s.yearCode === latestYear && s.areaCode !== '00000')
    .map(s => ({ areaCode: s.areaCode, value: s.value }));
}

/**
 * LineChart 用変換の自動判定
 * stats 内のユニークな areaCode（全国値除く）が2以上なら複数系列、1以下なら単一系列
 */
export function convertToLineDataAuto(
  stats: StatsSchema[]
): LineDataNode[] | MultiAreaLineDataNode[] {
  const areaCodes = [...new Set(
    stats.filter(s => s.areaCode !== '00000').map(s => s.areaCode)
  )];
  if (areaCodes.length >= 2) {
    return convertToMultiAreaLineData(stats.filter(s => s.areaCode !== '00000'));
  }
  return convertToLineData(stats);
}
