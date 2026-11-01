import { resolveColorEncoding } from '@stats47/types';
import { describe, expect, it } from 'vitest';

// 市区町村の地図はランキングと同じ部品で描き、県内の分位 5 段の規則もその部品が持つ (2026-10-30)
import { toCityMapConfig as toMunicipalityMapConfig } from '@/features/ranking/components/RankingMapChart/RankingMapChartClient';

import type { MapVisualizationConfig } from '@stats47/visualization/d3';

// 愛知県の製造品出荷額 (百万円) の形: 1 自治体だけ飛び抜け、残りは 1 桁以上小さい
const SKEWED = [20_527_151, 3_549_111, 3_192_685, 2_900_877, 1_614_394, 930_182, 432_388, 152_713, 84_438, 28_471, 1_938, 31];

function classesUsed(config: MapVisualizationConfig, values: readonly number[]): number {
  if (config.colorSchemeType === 'categorical') throw new Error('数値の色分けだけを数える');
  const encoding = resolveColorEncoding(config, values, (t) => t.toFixed(3), 'none');
  return new Set(values.map((value) => encoding.colorAtValue(value))).size;
}

describe('toMunicipalityMapConfig', () => {
  const equalInterval: MapVisualizationConfig = {
    colorSchemeType: 'sequential',
    colorScheme: 'interpolateBlues',
    classification: { method: 'equal-interval', classes: 5 },
  };

  it('連続色の指標は分位 5 段階にする', () => {
    expect(toMunicipalityMapConfig(equalInterval).classification).toEqual({
      method: 'quantile',
      classes: 5,
    });
  });

  it('飛び抜けた自治体がいても、県内の色が 1 段に潰れない (等間隔のままだと 2 段しか使わない)', () => {
    expect(classesUsed(equalInterval, SKEWED)).toBeLessThanOrEqual(2);
    expect(classesUsed(toMunicipalityMapConfig(equalInterval), SKEWED)).toBe(5);
  });

  it('発散色 (正負) の指標は設定のまま使う', () => {
    const diverging: MapVisualizationConfig = {
      colorSchemeType: 'diverging',
      colorScheme: 'interpolateRdBu',
      classification: { method: 'equal-interval', classes: 5 },
    };
    expect(toMunicipalityMapConfig(diverging)).toBe(diverging);
  });
});
