import { describe, expect, it } from 'vitest';
import { REGIONS } from '../../../../packages/area/src/constants/regions';
import { rankingChartFromNoteData, rasterSafeSvg } from '../../../../.claude/scripts/note/build-ranking-type-images';
import { renderRegionalBoxplotChart } from '../../lib/template-regional-boxplot';

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

describe('note の入力', () => {
  it('固定コピーの通し番号ではなく、同値を同順位にする', () => {
    const chart = rankingChartFromNoteData(noteData((_, i) => (i < 2 ? 40 : 30 - i / 10)));
    expect(chart.rows.slice(0, 3).map((row) => row.rank)).toEqual([1, 1, 3]);
  });

  it('47 県がそろわない指標は止める', () => {
    const data = noteData();
    expect(() => rankingChartFromNoteData({ ...data, data: data.data.slice(0, 46) })).toThrow(/47都道府県/);
  });

  it('PNG に焼くときだけ °C を 1 文字にする', () => {
    expect(rasterSafeSvg('<text>36.2°C</text>')).toBe('<text>36.2℃</text>');
  });
});
