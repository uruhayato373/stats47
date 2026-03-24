import type { RadarAxis, RadarDataSeries } from "@stats47/visualization/d3";
import { CHART_COLORS } from "../constants";

export interface RadarChartData {
  axes: RadarAxis[];
  data: RadarDataSeries[];
}

/**
 * ランキングデータをレーダーチャート用に変換
 *
 * 各軸の値は偏差値ベース（0-100スケール）。
 * 偏差値が渡される場合そのまま使用し、生値が渡される場合は
 * max に対する比率でスケーリングする。
 *
 * @param axesDef - 軸定義（key, label, max）
 * @param seriesData - 系列データ（label, values）
 */
export function toRadarChartData(
  axesDef: { key: string; label: string; max?: number }[],
  seriesData: { label: string; values: Record<string, number>; color?: string }[]
): RadarChartData {
  const axes: RadarAxis[] = axesDef.map((a) => ({
    key: a.key,
    label: a.label,
    max: a.max ?? 100,
  }));

  const data: RadarDataSeries[] = seriesData.map((s, i) => ({
    label: s.label,
    values: s.values,
    color: s.color ?? CHART_COLORS[i % CHART_COLORS.length],
  }));

  return { axes, data };
}
