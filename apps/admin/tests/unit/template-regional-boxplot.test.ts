import { describe, expect, it } from 'vitest';
import { REGIONS } from '../../../../packages/area/src/constants/regions';
import { getMetricConfig } from '../../../../packages/data-configs/src/registry';
import { rankingChartFromArticleData } from '../../lib/type-chart-input';
import { renderRegionalBoxplotChart } from '../../lib/template-regional-boxplot';

// note の入力 (chart-data.json) と同じ形で型の入力を作る。note 側の変換は .claude/scripts/note/__tests__ で検査する
const rankingChartFromNoteData = (chartData: ReturnType<typeof noteData>) => {
  const metric = getMetricConfig(chartData._meta.rankingKey);
  const chart = rankingChartFromArticleData({
    title: metric?.title ?? chartData.copy.canonicalTitle, year: String(chartData._meta.year), unit: chartData.unit, source: '',
    rankingKey: chartData._meta.rankingKey, data: chartData.data.map((row) => ({ areaCode: row.area_code, value: row.value })),
  }, { metric, prefCodeOf: () => '', prefNameOf: (code) => chartData.data.find((row) => row.area_code.startsWith(code))?.area_name ?? code });
  if ('skip' in chart) throw new Error(chart.skip);
  return chart;
};

const codes = Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, '0')}000`);
const noteData = (valueOf: (code: string, i: number) => number = (_, i) => 20 + i / 10) => ({
  _meta: { rankingKey: 'maximum-temperature', year: 2024 },
  copy: { canonicalTitle: '最高気温' },
  unit: '℃',
  data: codes.map((code, i) => ({ rank: i + 1, area_code: code, area_name: `県${code}`, value: valueOf(code, i) })),
});

describe('地方別の箱ひげの型', () => {
  it('7 地方の箱に 47 都道府県の点を 1 つずつ描き、発行元を入れない', () => {
    const svg = renderRegionalBoxplotChart(rankingChartFromNoteData(noteData()));
    expect(svg.match(/data-region=/g)).toHaveLength(REGIONS.length);
    expect(svg.match(/<circle data-area=/g)).toHaveLength(47);
    expect(svg).toContain('data-image-template="boxplot"');
    expect(svg).not.toMatch(/stats47/);
  });

  it('中央値は地方の県の値から計算する', () => {
    const region = REGIONS[0];
    const svg = renderRegionalBoxplotChart(rankingChartFromNoteData(noteData((code) =>
      (region.prefectures as readonly string[]).includes(code) ? 10 + region.prefectures.indexOf(code as never) : 30)));
    const sorted = region.prefectures.map((_, i) => 10 + i);
    const mid = (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2;
    expect(svg).toContain(`data-median="${mid}"`);
  });
});
