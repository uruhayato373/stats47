import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderRelationshipScatter, renderRelationshipScatterChart, relationshipPoints, unitLabel } from '@/lib/template-relationship-scatter';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { matchScatterYear, prefecturesNamedNear, scatterChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
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
    expect(svg).toContain('灯油消費量（L・県庁所在市・二人以上世帯）');
    expect(svg.match(/font-weight="700">県\d+<\/text>/g)?.length ?? 0).toBeLessThanOrEqual(4);
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
  it('builds the chart with display units, the basis on its axis and both years', () => {
    const chart = scatterChartFromArticleData(articleData(), {
      x: { metric: { source: { displayName: '給与調査' } }, year: '2024年' },
      y: { metric: { subtitle: '人口100万人当たり', source: { displayName: '社会・人口統計体系' } }, year: '2021年度' },
      prefCodeOf, unitLabel,
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart).toMatchObject({ title: '平均給与月額と施設数', meta: '横軸 2024年・縦軸 2021年度', source: '給与調査・社会・人口統計体系', xLabel: '平均給与月額（万円）', yLabel: '施設数（施設・人口100万人当たり）' });
    expect(chart.note).toBeUndefined();
    expect(chart.formatX?.(450000)).toBe('45');
    const svg = renderRelationshipScatterChart(chart, CHART_THEMES.dark);
    expect(svg).toContain('data-image-template="scatter"');
    expect(svg).toContain('data-theme="dark"');
    expect(svg.match(/<circle data-pref=/g)).toHaveLength(47);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
  });
  it('names axes from the metric and leaves out subtitles that do not change the reading', () => {
    const chart = scatterChartFromArticleData({ ...articleData(), xLabel: '年間降水量 (mm) →', xUnit: 'mm', yLabel: '単独世帯割合（65歳以上人口に占める・％）' }, {
      x: { metric: { title: '年間降水量', subtitle: '総数', unit: 'mm' }, year: '2024年' },
      y: { metric: { subtitle: '都道府県庁所在市の二人以上世帯の年間消費量' }, year: '2024年' },
      prefCodeOf, unitLabel,
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart).toMatchObject({ title: '年間降水量と単独世帯割合', xLabel: '年間降水量（mm）', yLabel: '単独世帯割合（施設・県庁所在市）' });
  });
  it('keeps the article labels when both axes are one metric in two years', () => {
    const chart = scatterChartFromArticleData({ ...articleData(), title: '健康寿命 2019年 × 2022年', xLabel: '2019年の健康寿命', yLabel: '2022年の健康寿命' }, {
      x: { metric: { title: '健康寿命' }, year: '2019年' }, y: { metric: { title: '健康寿命' }, year: '2022年' }, prefCodeOf, unitLabel,
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart.title).toBe('健康寿命 2019年と2022年');
    expect(chart.xLabel).toContain('2019年の健康寿命');
    expect(chart.yLabel).toContain('2022年の健康寿命');
  });
  it('reads the prefectures named in the chart section, in order, without taking 京都 from 東京都', () => {
    const md = '## はじめに\n大阪府の話です。\n\n## 関係を見る\n![図](data/a-scatter.svg)\n\n東京都と沖縄が外れ、北海道も続きます。<source-link href="/ranking/kyoto">京都</source-link>\n\n## まとめ\n広島県の話です。\n';
    const names = ['北海道', '東京都', '京都府', '大阪府', '広島県', '沖縄県'];
    expect(prefecturesNamedNear(md, 'a-scatter', names)).toEqual(['東京都', '沖縄県', '北海道']);
    expect(prefecturesNamedNear(md, 'missing-scatter', names)).toEqual([]);
  });
  it('labels the data\'s own points, then the prefectures in the text, then the extremes', () => {
    const chart = scatterChartFromArticleData({ ...articleData(), labelPoints: ['県1'] }, {
      x: { year: '2024年' }, y: { year: '2024年' }, prefCodeOf, unitLabel, bodyNames: ['県9'],
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart.labelNames).toEqual(['県1', '県9']);
  });
  it('colours the dots by the vertical metric and marks the named prefectures in its strong colour', () => {
    const blue = { colorScheme: 'interpolateBlues', colorSchemeType: 'sequential' } as const;
    const red = { colorScheme: 'interpolateReds', colorSchemeType: 'sequential' } as const;
    const base = { title: 't', meta: '2024年', source: 's', xLabel: 'x', yLabel: 'y', labelNames: ['県3'],
      // 県3 stands clear of the line of other points, so its label fits.
      points: articleData().points.map((p, i) => ({ code: String(i + 1).padStart(2, '0') + '000', name: p.label, x: p.x, y: i === 2 ? p.y - 500 : p.y })) };
    const fills = (svg: string) => new Set([...svg.matchAll(/<circle data-pref="[^"]+"[^>]*fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]));
    const blueFills = fills(renderRelationshipScatterChart({ ...base, presentation: blue }));
    expect(blueFills.size).toBe(2);
    expect([...fills(renderRelationshipScatterChart({ ...base, presentation: red }))]).not.toEqual([...blueFills]);
    expect(fills(renderRelationshipScatterChart({ ...base, presentation: blue }, CHART_THEMES.dark)).size).toBe(2);
  });
  it('skips data without 47 prefectures or without a matched year', () => {
    const opts = { x: { year: '2024年' }, y: { year: '2024年' }, prefCodeOf, unitLabel };
    const partial = { ...articleData(), points: articleData().points.slice(1) };
    expect(scatterChartFromArticleData(partial, opts)).toHaveProperty('skip');
    expect(scatterChartFromArticleData(articleData(), { ...opts, y: { year: null } })).toHaveProperty('skip');
  });
});
