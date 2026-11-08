import { describe, expect, it } from 'vitest';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { renderGroupBoxplotChart, type GroupBoxplotChart } from '@/lib/template-group-boxplot';

const chart: GroupBoxplotChart = {
  title: '人口の増減と空き家率の分布', meta: '空き家率（%）・1,052市区町村', source: '住宅・土地統計調査', decimals: 1,
  groups: [
    { label: '人口増', min: 3.1, q1: 9.8, median: 11.6, q3: 13.4, max: 24.0 },
    { label: '人口減', min: 5.0, q1: 13.9, median: 16.8, q3: 20.2, max: 41.5 },
  ],
};

describe('区分ごとの箱ひげの型', () => {
  it('区分ごとに箱を 1 つ、中央値を分析の値のまま 4:5 で描き、発行元を入れない', () => {
    for (const theme of [CHART_THEMES.light, CHART_THEMES.dark]) {
      const svg = renderGroupBoxplotChart(chart, theme);
      expect(svg).toContain('width="1080" height="1350"');
      expect(svg).toContain('data-image-template="boxplot"');
      expect(svg).toContain(`data-theme="${theme.name}"`);
      expect(svg.match(/<g data-group=/g)).toHaveLength(2);
      expect(svg).toContain('data-median="16.8"');
      expect(svg).toContain('中央値 16.8');
      expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    }
  });

  it('四分位の順序が崩れた区分と多すぎる区分は描かない', () => {
    expect(() => renderGroupBoxplotChart({ ...chart, groups: [{ ...chart.groups[0], q3: 5 }] })).toThrow('min ≤ q1');
    expect(() => renderGroupBoxplotChart({ ...chart, groups: Array(9).fill(chart.groups[0]) })).toThrow('1〜8');
  });
});
