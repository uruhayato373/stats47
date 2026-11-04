import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderRelationshipScatter, renderRelationshipScatterChart, relationshipPoints, unitLabel } from '@/lib/template-relationship-scatter';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { matchScatterYear, scatterChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

// Synthetic values check the join and frame; live data stays in the SHA-verified R2 snapshots.
const payload = (metricKey: string, unit: string, valueAt: (i: number) => number, year = '2024') => ({
  metricKey, entityKind: 'prefecture',
  meta: { rowCount: 47, yearRange: [year, year], areaCount: 47, generatedAt: '2026-10-06T00:00:00.000Z' },
  rows: Array.from({ length: 47 }, (_, i) => ({
    areaCode: String(i + 1).padStart(2, '0') + '000', areaName: '県' + (i + 1),
    yearCode: year, yearName: year + '年', value: valueAt(i), unit,
  })),
});
const fixture = () => ({
  x: payload('average-temperature', '℃', (i) => 10 + i * 0.3),
  // Reverse order: the join must use prefecture codes, not row positions.
  y: { ...payload('kerosene-consumption-quantity', 'l', (i) => 600 - i * 12), rows: payload('kerosene-consumption-quantity', 'l', (i) => 600 - i * 12).rows.reverse() },
});

describe('relationship scatter basic form', () => {
  it('joins both snapshots by prefecture code into 47 points', () => {
    const points = relationshipPoints(fixture());
    expect(points).toHaveLength(47);
    expect(points.find((p) => p.code === '01000')).toMatchObject({ x: 10, y: 600 });
    expect(points.find((p) => p.code === '47000')).toMatchObject({ x: 10 + 46 * 0.3, y: 600 - 46 * 12 });
  });
  it('stops when a prefecture, year or unit is missing instead of plotting a partial set', () => {
    const input = fixture();
    expect(() => relationshipPoints({ ...input, y: { ...input.y, rows: input.y.rows.slice(1) } })).toThrow();
    expect(() => relationshipPoints({ ...input, x: payload('average-temperature', '℃', (i) => i, '2023') })).toThrow();
    expect(() => relationshipPoints({ ...input, y: payload('kerosene-consumption-quantity', 'kl', (i) => i) })).toThrow();
  });
  it('renders a 4:5 PNG with 47 points, the capital-city scope and minimal copy', async () => {
    const svg = renderRelationshipScatter(fixture());
    expect(svg.match(/<circle data-pref=/g)).toHaveLength(47);
    expect(svg).toContain('県庁所在市・二人以上世帯');
    expect(svg).toContain('灯油消費量（L）');
    expect(svg.match(/font-weight="700">県\d+<\/text>/g)?.length ?? 0).toBeLessThanOrEqual(2);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
  });
});

// Blog scatter data: 47 labelled points without a year; the year comes from the observed values.
const prefName = (i: number) => '県' + (i + 1);
const prefCodeOf = (name: string) => String(Number(name.slice(1))).padStart(2, '0');
const articleData = () => ({
  xLabel: '平均給与月額', xUnit: '円', yLabel: '施設数', yUnit: '施設',
  points: Array.from({ length: 47 }, (_, i) => ({ label: prefName(i), x: 400000 + i * 2500, y: 900 - i * 15.5 })),
});
const observed = (valueAt: (i: number) => number, years: Record<string, number>) => Object.entries(years).flatMap(([year, shift]) =>
  Array.from({ length: 47 }, (_, i) => ({ areaCode: String(i + 1).padStart(2, '0') + '000', yearCode: year, yearName: year + '年', value: valueAt(i) + shift })));

describe('blog scatter as the shared type', () => {
  const codes = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0') + '000');
  it('finds the one year whose values give the points, as each point is rounded', () => {
    const ys = articleData().points.map((p) => p.y);
    // The stored values carry more digits than the article wrote; 2021 matches, 2020 is off by 3.
    const rows = observed((i) => 900 - i * 15.5 + 0.0004, { 2020: 3, 2021: 0 });
    expect(matchScatterYear(ys, codes, rows)).toBe('2021年');
  });
  it('gives no year when no year or two years match, so the earlier chart stays', () => {
    const ys = articleData().points.map((p) => p.y);
    expect(matchScatterYear(ys, codes, observed((i) => 900 - i * 15.5, { 2020: 1 }))).toBeNull();
    expect(matchScatterYear(ys, codes, observed((i) => 900 - i * 15.5, { 2020: 0, 2021: 0 }))).toBeNull();
  });
  it('builds the chart with display units, the basis note and both years', () => {
    const chart = scatterChartFromArticleData(articleData(), {
      x: { metric: { source: { displayName: '給与調査' } }, year: '2024年' },
      y: { metric: { subtitle: '人口100万人当たり', source: { displayName: '社会・人口統計体系' } }, year: '2021年度' },
      prefCodeOf, unitLabel,
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart).toMatchObject({ title: '平均給与月額と施設数', meta: '横軸 2024年・縦軸 2021年度', note: '縦軸：人口100万人当たり', source: '給与調査・社会・人口統計体系', xLabel: '平均給与月額（万円）', yLabel: '施設数（施設）' });
    expect(chart.formatX?.(450000)).toBe('45');
    const svg = renderRelationshipScatterChart(chart, CHART_THEMES.dark);
    expect(svg).toContain('data-image-template="scatter"');
    expect(svg).toContain('data-theme="dark"');
    expect(svg.match(/<circle data-pref=/g)).toHaveLength(47);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
  });
  it('skips data without 47 prefectures or without a matched year', () => {
    const opts = { x: { year: '2024年' }, y: { year: '2024年' }, prefCodeOf, unitLabel };
    const partial = { ...articleData(), points: articleData().points.slice(1) };
    expect(scatterChartFromArticleData(partial, opts)).toHaveProperty('skip');
    expect(scatterChartFromArticleData(articleData(), { ...opts, y: { year: null } })).toHaveProperty('skip');
  });
});
