import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderRelationshipScatter, renderRelationshipScatterChart, relationshipPoints, unitLabel } from '@/lib/template-relationship-scatter';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { matchScatterAxis, matchScatterYear, metricKeysInSource, prefecturesNamedNear, scatterChartFromArticleData, sourceAxisYear, sourceNamesOf } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { reproducesValues } from '../../../../.claude/scripts/blog/audit-chart-axes';
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
      prefCodeOf, unitLabel, sourceNames: ['調査'],
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart).toMatchObject({ title: '年間降水量と単独世帯割合', xLabel: '年間降水量（mm）', yLabel: '単独世帯割合（施設・県庁所在市）' });
  });
  it('keeps the capital-city scope of a household-survey item whose subtitle no longer states it', () => {
    // 家計調査の品目は調査方法を note へ移し、subtitle は同名の区別子だけになった (無いことが多い)
    const chart = scatterChartFromArticleData({ ...articleData(), xLabel: '年間降水量 (mm) →', xUnit: 'mm', yLabel: '納豆消費支出額（円）', yUnit: '円' }, {
      x: { metric: { title: '年間降水量', unit: 'mm' }, year: '2024年' },
      y: { metric: { title: '納豆消費支出額', unit: '円', source: { kind: 'kakei-chousa' } }, year: '2024年' },
      prefCodeOf, unitLabel, sourceNames: ['調査'],
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart.yLabel).toBe('納豆消費支出額（円・県庁所在市）');
    expect(chart.xLabel).toBe('年間降水量（mm）');
  });
  it('takes the denominator from the subtitle without a bracket or a leading particle', () => {
    // 持家率の説明文は「家計調査（二人以上世帯）の調査世帯に占める…」で、括弧の途中から切り出すと軸名の括弧が壊れる
    const chart = scatterChartFromArticleData({ ...articleData(), xLabel: '持家率', xUnit: '％' }, {
      x: { metric: { title: '持家率', subtitle: '家計調査（二人以上世帯）の調査世帯に占める持家世帯の割合', unit: '％' }, year: '2025年' },
      y: { metric: { subtitle: '人口100万人当たり' }, year: '2025年' },
      prefCodeOf, unitLabel, sourceNames: ['調査'],
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart.xLabel).toMatch(/^持家率（[%％]・調査世帯に占める）$/);
    expect(chart.yLabel).toContain('人口100万人当たり');
  });
  it('keeps the article labels when both axes are one metric in two years', () => {
    const chart = scatterChartFromArticleData({ ...articleData(), title: '健康寿命 2019年 × 2022年', xLabel: '2019年の健康寿命', yLabel: '2022年の健康寿命' }, {
      x: { metric: { title: '健康寿命' }, year: '2019年' }, y: { metric: { title: '健康寿命' }, year: '2022年' }, prefCodeOf, unitLabel, sourceNames: ['調査'],
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
      x: { year: '2024年' }, y: { year: '2024年' }, prefCodeOf, unitLabel, sourceNames: ['調査'], bodyNames: ['県9'],
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart.labelNames).toEqual(['県1', '県9']);
  });
  it('finds the scale when the article wrote the values in a larger unit', () => {
    const ys = articleData().points.map((p) => p.y);
    expect(matchScatterAxis(ys, codes, observed((i) => (900 - i * 15.5) * 1e4, { 2021: 0 }))).toEqual({ year: '2021年', scale: 1e4 });
    expect(matchScatterAxis(ys, codes, observed((i) => 900 - i * 15.5, { 2021: 0 }))).toEqual({ year: '2021年', scale: 1 });
    expect(matchScatterAxis(ys, codes, observed((i) => i * 3 + 1, { 2021: 0 }))).toBeNull();
  });
  it('reads metric keys from any manifest shape, keeping only real metrics', () => {
    const keys = metricKeysInSource({ kind: 'derived', source: ['r2:app/ranking/a-key/values.json'], derivedFrom: [{ axis: 'x', rankingKey: 'b-key' }], note: 'plain words' }, (k) => ['a-key', 'b-key'].includes(k));
    expect(keys).toEqual(['a-key', 'b-key']);
  });
  it('reads an axis year from the label, then each manifest shape', () => {
    expect(sourceAxisYear({ year: '2020' }, 'x', '財政力指数（2022年度）')).toBe('2022年度');
    expect(sourceAxisYear({ xYear: '2023', yYear: '2024' }, 'y', '')).toBe('2024年');
    expect(sourceAxisYear({ year: 'x:2024/y:2023' }, 'x', '')).toBe('2024年');
    expect(sourceAxisYear({ year: '2020/2024' }, 'y', '')).toBe('2024年');
    expect(sourceAxisYear({ inputs: [{ year: '2020' }, { year: '2019' }] }, 'y', '')).toBe('2019年');
    expect(sourceAxisYear({ formula: '2021年の値', fetchedAt: '2026-07-16' }, 'x', '')).toBe('2021年');
    expect(sourceAxisYear({ inputs: [{ params: { cdTime: '2021000000' } }] }, 'x', '')).toBe('2021年');
    expect(sourceAxisYear({ formula: '2021年と2020年' }, 'x', '')).toBeNull();
  });
  it('takes survey names from the manifest, not its r2 paths', () => {
    expect(sourceNamesOf({ displaySources: [{ label: '電子国土基本図' }], source: 'r2:gis/points.json' })).toEqual(['電子国土基本図']);
    expect(sourceNamesOf({ source: 'e-Stat 工業統計調査 https://www.e-stat.go.jp/x' })).toEqual(['e-Stat 工業統計調査']);
  });
  it('keeps the written numbers and unit on an axis no metric proves, and draws full prefecture names', () => {
    const chart = scatterChartFromArticleData({ ...articleData(), xLabel: '財政力指数（2022年度）', xUnit: undefined, yLabel: '一人当たり地方交付税（万円／人・2022年度）', yUnit: undefined, labelPoints: ['県1'] }, {
      x: { year: '2022年度', asWritten: true }, y: { year: '2022年度', asWritten: true }, prefCodeOf, unitLabel, sourceNames: ['地方財政状況調査'],
      prefNameOf: (code) => '正式' + Number(code.slice(0, 2)),
    });
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart).toMatchObject({ title: '財政力指数と一人当たり地方交付税', yLabel: '一人当たり地方交付税（万円／人）', source: '地方財政状況調査', labelNames: ['正式1'] });
    expect(chart.points[0].name).toBe('正式1');
    expect(chart.formatX).toBeUndefined();
  });
  it('draws a declared partial set, states its count and refuses an undeclared gap', () => {
    const partial = { ...articleData(), points: articleData().points.slice(0, 41) };
    const opts = { x: { year: '2024年' }, y: { year: '2024年' }, prefCodeOf, unitLabel, sourceNames: ['調査'] };
    expect(scatterChartFromArticleData(partial, opts)).toHaveProperty('skip');
    const chart = scatterChartFromArticleData(partial, { ...opts, excludedCount: 6 });
    if ('skip' in chart) throw Error(chart.skip);
    const svg = renderRelationshipScatterChart(chart);
    expect(svg.match(/<circle data-pref=/g)).toHaveLength(41);
    expect(svg).toContain('41都道府県');
  });
  it('gives a default-blue metric its subject colour, but keeps a chosen one', () => {
    const base = { x: { year: '2024年' }, prefCodeOf, unitLabel, sourceNames: ['調査'] };
    const blue = { colorScheme: 'interpolateBlues', colorSchemeType: 'sequential' };
    const of = (metric: object) => { const c = scatterChartFromArticleData(articleData(), { ...base, y: { metric, year: '2024年' } }); if ('skip' in c) throw Error(c.skip); return c.presentation?.colorScheme; };
    expect(of({ category: 'economy' })).toBe('interpolatePurples');
    expect(of({ category: 'population' })).toBe('interpolateBlues');
  });
  it('tells a rounding difference from a changed value', () => {
    const observed = new Map([['01', 543.25], ['02', 1277.3]]);
    expect(reproducesValues([{ code: '01', value: 543.3 }, { code: '02', value: 1277.3 }], observed)).toBe(true);
    expect(reproducesValues([{ code: '01', value: 543.3 }, { code: '02', value: 66733 }], observed)).toBe(false);
    expect(reproducesValues([{ code: '01', value: 543.3 }, { code: '03', value: 1 }], observed)).toBe(false);
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

// The published university-advancement-capacity chart: 京都府 sits beside 東京都 at the right edge and 香川県 inside the
// left cluster, so the side facing the middle is taken for both.
const CAPACITY: [string, number, number][] = [
  ['北海道', 109.1, 52.7], ['青森県', 72.1, 54.2], ['岩手県', 58.9, 49.9], ['宮城県', 131.7, 55.6], ['秋田県', 68.5, 49.4], ['山形県', 73.4, 51], ['福島県', 47.8, 50.9], ['茨城県', 51.7, 57.4],
  ['栃木県', 58.6, 56.9], ['群馬県', 84.1, 57.4], ['埼玉県', 84.3, 65.8], ['千葉県', 100.3, 64.7], ['東京都', 226.5, 74.1], ['神奈川県', 116.1, 69.4], ['新潟県', 80.7, 53.7], ['富山県', 62.3, 58.4],
  ['石川県', 127.6, 62.7], ['福井県', 61.2, 61.2], ['山梨県', 105.9, 62.4], ['長野県', 50.2, 55.3], ['岐阜県', 50.7, 61.1], ['静岡県', 51.9, 58.1], ['愛知県', 121.3, 64], ['三重県', 46.7, 55.4],
  ['滋賀県', 116.4, 61.7], ['京都府', 238.3, 74], ['大阪府', 139.6, 68.9], ['兵庫県', 105.1, 68.5], ['奈良県', 70.5, 65.2], ['和歌山県', 54.4, 57.1], ['鳥取県', 80.7, 51.4], ['島根県', 71.5, 50.1],
  ['岡山県', 107.4, 56.8], ['広島県', 93.9, 65.7], ['山口県', 112.6, 48.5], ['徳島県', 83.6, 59.7], ['香川県', 49.2, 58.4], ['愛媛県', 72.8, 57.7], ['高知県', 86.5, 57.7], ['福岡県', 131.7, 58.7],
  ['佐賀県', 59.4, 48.4], ['長崎県', 80.1, 49.7], ['熊本県', 92.5, 50.4], ['大分県', 85.2, 52.1], ['宮崎県', 56.4, 48], ['鹿児島県', 71.6, 48.1], ['沖縄県', 77, 46.7],
];
const scatterOf = (rows: [string, number, number][], labelNames: string[]) => renderRelationshipScatterChart({
  title: '大学収容力指数と進学率', meta: '2024年度', source: '学校基本調査', xLabel: '大学収容力指数', yLabel: '進学率（%）', labelNames,
  points: rows.map(([name, x, y], i) => ({ code: String(i + 1).padStart(2, '0') + '000', name, x, y })),
});
/** Each prefecture name drawn in the plot, as the box its 32px glyphs cover. */
const nameBoxes = (svg: string) => [...svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)" text-anchor="(start|end|middle)" font-size="32" font-weight="700">([^<]+)<\/text>/g)].map((m) => {
  const width = m[4].length * 32, x = Number(m[1]);
  const x0 = m[3] === 'start' ? x : m[3] === 'end' ? x - width : x - width / 2;
  return { name: m[4], x0, x1: x0 + width, top: Number(m[2]) - 11 - 16, bottom: Number(m[2]) - 11 + 16 };
});
const dotsOf = (svg: string) => [...svg.matchAll(/<circle data-pref="[^"]+" cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.]+)"/g)].map((m) => ({ cx: Number(m[1]), cy: Number(m[2]), r: Number(m[3]) }));
const plotOf = (svg: string) => {
  const [x, y, width, height] = svg.match(/<clipPath id="scatter-plot"><rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/)!.slice(1).map(Number);
  return { left: x, right: x + width, top: y, bottom: y + height };
};

describe('scatter names try every side of the dot', () => {
  const asked = ['京都府', '奈良県', '山口県', '香川県'];
  it('draws each prefecture the data asked for when the side facing the middle is taken', () => {
    const names = nameBoxes(scatterOf(CAPACITY, asked)).map((box) => box.name);
    expect(names).toEqual(asked);
  });
  it('keeps every name inside the plot, clear of the dots and of the other names', () => {
    const svg = scatterOf(CAPACITY, asked);
    const boxes = nameBoxes(svg), plot = plotOf(svg);
    expect(boxes).toHaveLength(4);
    for (const box of boxes) {
      expect(box.x0).toBeGreaterThanOrEqual(plot.left);
      expect(box.x1).toBeLessThanOrEqual(plot.right);
      expect(box.top).toBeGreaterThanOrEqual(plot.top);
      expect(box.bottom).toBeLessThanOrEqual(plot.bottom);
      // 10 is the radius of an unnamed dot: a name may not touch any dot, its own included.
      expect(dotsOf(svg).filter((dot) => dot.cx + 10 > box.x0 && dot.cx - 10 < box.x1 && dot.cy + 10 > box.top && dot.cy - 10 < box.bottom)).toEqual([]);
      expect(boxes.filter((other) => other !== box && other.x0 < box.x1 && other.x1 > box.x0 && other.top < box.bottom && other.bottom > box.top)).toEqual([]);
    }
  });
  it('leaves out a name that has a dot on every side', () => {
    // 県24 has neighbours 4 units away on all four sides; the other 42 run along the diagonal, far from it.
    const ring: [string, number, number][] = [['県24', 50, 50], ['県44', 46, 50], ['県45', 54, 50], ['県46', 50, 46], ['県47', 50, 54]];
    const rest = Array.from({ length: 42 }, (_, i): [string, number, number] => {
      const at = i < 21 ? i * 1.5 : 70 + (i - 21) * 1.5;
      return [`他${i + 1}`, at, 100 - at];
    });
    const names = nameBoxes(scatterOf([...ring, ...rest], ['県24'])).map((box) => box.name);
    expect(names).not.toContain('県24');
  });
});

// The prototype's H01 needed about a thousand municipalities; the prefecture rule must not loosen with it.
describe('relationship scatter across municipalities', () => {
  const town = (i: number) => ({ code: String(10000 + i), name: `町${i}`, x: i, y: i * 2 + (i % 7) });
  const chart = (points: ReturnType<typeof town>[]) => ({
    title: '人口と空き家率', meta: '2023年', source: '住宅・土地統計調査', xLabel: '人口増減率（%）', yLabel: '空き家率（%）', points,
    level: 'municipality' as const,
  });

  it('draws the set the caller built and counts it once in the meta line', () => {
    const svg = renderRelationshipScatterChart(chart(Array.from({ length: 1052 }, (_, i) => town(i))));
    expect(svg.match(/<circle data-pref=/g)).toHaveLength(1052);
    expect(svg).toContain('2023年・1,052市区町村');
    expect(svg).not.toContain('都道府県');
    expect(svg).toMatch(/r="4"/);
  });

  it('names only the areas the caller chose, never the extremes', () => {
    const points = [town(0), town(40), town(200), town(600), town(1000)];
    expect(renderRelationshipScatterChart(chart(points))).not.toContain('font-weight="700">町');
    const named = renderRelationshipScatterChart({ ...chart(points), labelNames: ['町200'] });
    expect(named.match(/font-weight="700">町/g)).toHaveLength(1);
    expect(named).toContain('>町200<');
  });

  it('stops a duplicate area, a broken value or an empty set', () => {
    const points = Array.from({ length: 5 }, (_, i) => town(i));
    expect(() => renderRelationshipScatterChart(chart([...points, points[0]]))).toThrow('市区町村');
    expect(() => renderRelationshipScatterChart(chart([...points, { ...town(9), y: Number.NaN }]))).toThrow('市区町村');
    expect(() => renderRelationshipScatterChart(chart([]))).toThrow('市区町村');
  });

  it('still requires every prefecture when no level is given', () => {
    const { level: _level, ...prefectures } = chart(Array.from({ length: 46 }, (_, i) => town(i)));
    expect(() => renderRelationshipScatterChart(prefectures)).toThrow('47都道府県');
  });

  it('logAxes は 1・2・5 の目盛りを実際の値で書き、桁の違う点を等間隔に置く', () => {
    const points = [1, 10, 100].flatMap((x, i) => [{ code: `a${i}`, name: `a${i}`, x, y: x / 100 }, { code: `b${i}`, name: `b${i}`, x: x * 2, y: (x * 2) / 100 }]);
    const svg = renderRelationshipScatterChart({
      title: 'きざみ', meta: 'メタ', source: '出典', xLabel: '横', yLabel: '縦', level: 'municipality', logAxes: true, points,
    });
    expect(svg).toContain('>100</text>');
    expect(svg).toContain('>0.5</text>');
    const cx = (code: string) => Number(svg.match(new RegExp(`data-pref="${code}" cx="([0-9.]+)"`))?.[1]);
    expect(cx('a1') - cx('a0')).toBeCloseTo(cx('a2') - cx('a1'), 5);
  });
});
