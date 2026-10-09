/**
 * 地域コードから色を取得する関数を生成
 *
 * 統計データとカラースケール設定から、地域コード（都道府県コードなど）
 * を色に変換するマッパー関数を生成します。
 */

import { resolveChoroplethScale } from './resolve-choropleth-scale';

import type { VisualizationDataPoint } from "../../types";
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
  const resolved = await resolveChoroplethScale(config, data.map((point) => ({ areaCode: String(point.areaCode), value: point.value })));
  const dataMap = new Map(data.map((d) => [d.areaCode, d.value]));

  return (areaCode: string): string => {
    const value = dataMap.get(areaCode);
    if (value === undefined) {
      return resolved.noDataColor;
    }
    return resolved.colorAtValue(value);
  };
}
