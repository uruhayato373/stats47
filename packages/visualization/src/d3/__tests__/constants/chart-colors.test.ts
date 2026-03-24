import { describe, it, expect } from 'vitest';
import { CHART_COLORS, getChartColor } from '../../constants/chart-colors';

describe('chart-colors', () => {
  // getChartColor(index) が配列内の色を返す
  it('should return a color from CHART_COLORS array for a valid index', () => {
    expect(getChartColor(0)).toBe(CHART_COLORS[0]);
    expect(getChartColor(CHART_COLORS.length - 1)).toBe(CHART_COLORS[CHART_COLORS.length - 1]);
  });

  // インデックスがモジュロ計算で循環する
  it('should return colors in a cyclic manner using modulo arithmetic', () => {
    // 配列の長さと同じインデックスの場合、最初の色を返す
    expect(getChartColor(CHART_COLORS.length)).toBe(CHART_COLORS[0]);
    // 配列の長さの2倍のインデックスの場合、最初の色を返す
    expect(getChartColor(CHART_COLORS.length * 2)).toBe(CHART_COLORS[0]);
    // 配列の長さ + 1 のインデックスの場合、2番目の色を返す
    expect(getChartColor(CHART_COLORS.length + 1)).toBe(CHART_COLORS[1]);
  });

  // 負のインデックスでも正しく循環すること
  it('should handle negative indices correctly', () => {
    // -1 は末尾の色を返す（CHART_COLORS[7] for length=8）
    expect(getChartColor(-1)).toBe(CHART_COLORS[CHART_COLORS.length - 1]);
    // -CHART_COLORS.length は最初の色を返す
    expect(getChartColor(-CHART_COLORS.length)).toBe(CHART_COLORS[0]);
    // -CHART_COLORS.length - 1 は末尾の色を返す
    expect(getChartColor(-CHART_COLORS.length - 1)).toBe(CHART_COLORS[CHART_COLORS.length - 1]);
  });
});
