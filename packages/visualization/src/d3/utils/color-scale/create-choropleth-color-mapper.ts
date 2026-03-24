/**
 * 地域コードから色を取得する関数を生成
 *
 * 統計データとカラースケール設定から、地域コード（都道府県コードなど）
 * を色に変換するマッパー関数を生成します。
 */

import { createColorScale } from './create-color-scale';
import { mapConfigToColorOptions } from '../convert-map-config';

import type { ColorScaleOptions, VisualizationDataPoint } from "../../types";
import type { MapVisualizationConfig } from '../../types/map-chart';

/**
 * 地域コードから色を取得する関数を生成
 *
 * @param config - 地図可視化設定
 * @param data - データ配列
 * @returns 地域コードから色への変換関数
 */
export async function createChoroplethColorMapper(
  config: MapVisualizationConfig,
  data: VisualizationDataPoint[]
) {
  const colorOptions = mapConfigToColorOptions(config, data);
  const { noDataColor = "#e0e0e0" } = colorOptions;

  const dataMap = new Map((data as VisualizationDataPoint[]).map((d) => [d.areaCode, d.value]));
  const colorScale = await createColorScale(colorOptions);

  return (areaCode: string): string => {
    const value = dataMap.get(areaCode);
    if (value === undefined) {
      return noDataColor;
    }
    return colorScale(value as number);
  };
}
