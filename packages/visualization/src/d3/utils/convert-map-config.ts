/**
 * MapVisualizationConfigをColorScaleOptionsに変換
 */

import type { ColorScaleOptions, VisualizationDataPoint } from "../types";
import type { MapVisualizationConfig } from "../types/map-chart";
import { normalizeColorScheme } from "./color-scale/normalize-color-scheme";

function normalizeSequentialScheme(colorScheme: string | undefined): string {
  return normalizeColorScheme(colorScheme || "interpolateBlues");
}

function normalizeDivergingScheme(colorScheme: string | undefined): string {
  return normalizeColorScheme(colorScheme || "interpolateRdBu");
}

/**
 * 地図可視化設定をカラースケールオプションに変換
 *
 * @param colorConfig - 地図可視化設定
 * @param data - 統計データ
 * @returns カラースケールオプション
 */
export function mapConfigToColorOptions(
  colorConfig: MapVisualizationConfig | undefined,
  data: VisualizationDataPoint[]
): ColorScaleOptions {
  switch (colorConfig?.colorSchemeType) {
    case "sequential":
      return {
        type: "sequential",
        data,
        colorScheme: normalizeSequentialScheme(colorConfig.colorScheme),
        minValueType: colorConfig.minValueType,
        isReversed: colorConfig.isReversed,
        noDataColor: colorConfig.noDataColor || "#e0e0e0",
      };

    case "diverging":
      return {
        type: "diverging",
        data,
        colorScheme: normalizeDivergingScheme(colorConfig.colorScheme),
        divergingMidpoint: colorConfig.divergingMidpoint || "zero",
        divergingMidpointValue: colorConfig.divergingMidpointValue,
        isSymmetrized: colorConfig.isSymmetrized,
        isReversed: colorConfig.isReversed,
        noDataColor: colorConfig.noDataColor || "#e0e0e0",
      };

    case "categorical":
      return {
        type: "categorical",
        data,
        colorScheme: colorConfig.colorScheme || "interpolateBlues",
        isReversed: colorConfig.isReversed,
        noDataColor: colorConfig.noDataColor || "#e0e0e0",
      };

    default:
      return {
        type: "sequential",
        data,
        colorScheme: "interpolateBlues",
        noDataColor: "#e0e0e0",
      };
  }
}
