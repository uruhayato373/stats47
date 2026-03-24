/**
 * 発散カラースケール用の分岐点を計算
 *
 * データの統計値（平均、中央値）または指定値に基づいて
 * 発散カラースケールの分岐点を計算します。
 */

import type { VisualizationDataPoint } from "../../types";

import type { D3Module } from "../../types";

/**
 * 分岐点の値を計算
 *
 * @param data - 統計データ配列
 * @param divergingMidpoint - 分岐点の計算方法（"zero" | "mean" | "median" | "custom" | number）
 * @param divergingMidpointValue - カスタム分岐点の値（divergingMidpointが"custom"の場合に使用）
 * @param d3 - D3モジュール
 * @returns 計算された分岐点の値
 */
export function calculateMidpoint(
  data: VisualizationDataPoint[],
  divergingMidpoint: "zero" | "mean" | "median" | "custom" | number,
  divergingMidpointValue: number | undefined,
  d3: D3Module
): number {
  if (typeof divergingMidpoint === "number") {
    return divergingMidpoint;
  }

  if (divergingMidpoint === "custom") {
    return divergingMidpointValue ?? 0;
  }

  const values = data.map((d) => d.value);

  switch (divergingMidpoint) {
    case "zero":
      return 0;
    case "mean":
      return d3.mean(values) ?? 0;
    case "median":
      return d3.median(values) ?? 0;
    default:
      return 0;
  }
}
