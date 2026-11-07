import { colorViewsFor, resolveColorEncoding, withColorView } from '@stats47/types';
import { describe, expect, it } from 'vitest';

import type { MapVisualizationConfig } from '@stats47/visualization/d3';

// 愛知県の製造品出荷額 (百万円) の形: 1 自治体だけ飛び抜け、残りは 1 桁以上小さい
const SKEWED = [20_527_151, 3_549_111, 3_192_685, 2_900_877, 1_614_394, 930_182, 432_388, 152_713, 84_438, 28_471, 1_938, 31];

function classesUsed(config: MapVisualizationConfig, values: readonly number[]): number {
  if (config.colorSchemeType === 'categorical') throw new Error('数値の色分けだけを数える');
  const encoding = resolveColorEncoding(config, values, (t) => t.toFixed(6), 'none');
  return new Set(values.map((value) => encoding.colorAtValue(value))).size;
}

describe('地図の見方の切り替え', () => {
  const continuous: MapVisualizationConfig = {
    colorSchemeType: 'sequential',
    colorScheme: 'interpolateBlues',
    classification: { method: 'continuous' },
  };

  it('分布の見方は、飛び抜けた自治体がいても色が 5 区分に分かれる', () => {
    expect(classesUsed(withColorView(continuous, 'distribution'), SKEWED)).toBe(5);
  });

  it('連続の見方は、値が違えば色も違う (段に丸めない)', () => {
    const stepped = withColorView(continuous, 'distribution');
    expect(classesUsed(withColorView(stepped, 'continuous'), SKEWED)).toBe(SKEWED.length);
  });

  it('選ばれていなければ配色の台帳の判定のまま', () => {
    expect(withColorView(continuous, null)).toBe(continuous);
  });

  it('発散の配色と手で決めた区切りは切り替えない', () => {
    const diverging: MapVisualizationConfig = {
      colorSchemeType: 'diverging',
      colorScheme: 'interpolateRdBu',
      classification: { method: 'continuous' },
    };
    const authored: MapVisualizationConfig = {
      colorSchemeType: 'sequential',
      colorScheme: 'interpolateBlues',
      classification: { method: 'threshold', thresholds: [1, 2] },
    };
    expect(colorViewsFor(diverging)).toEqual([]);
    expect(withColorView(diverging, 'distribution')).toBe(diverging);
    expect(colorViewsFor(authored)).toEqual([]);
  });
});
