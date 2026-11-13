import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { compositionSampleRows, renderCompositionStacked, renderStackedAreaChart, type StackedChart } from '@/lib/template-composition-stacked';
import { stackedAreaChartFromArticleData, stackedFormOf } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

const labels = ['ビール', '発泡酒', 'リキュール・その他の醸造酒等', '焼酎', '清酒', '果実酒', 'ウイスキー・ブランデー', 'その他'];
const fixture = () => ({
  title: '酒類別の販売（消費）数量の構成比', unit: '%', valueUnit: '千kL', normalized: true,
  series: labels.map((label, i) => ({
    label,
    data: ['2008年度', '2013年度', '2018年度'].map((year, j) => ({ year, value: 100 + i * 20 + j })),
  })),
});

describe('酒類の実統計入力を用いる積み上げ棒見本', () => {
  it('uses all categories and years, preserving values and rendering a single portrait image', async () => {
    const input = fixture();
    const rows = compositionSampleRows(input);
    expect(rows).toHaveLength(24);
    expect(rows.map(row => row.value)).toEqual(input.series.flatMap(s => s.data.map(d => d.value)));
    const svg = renderCompositionStacked(input);
    for (const label of labels) expect(svg).toContain(`>${label}</text>`);
    for (const year of ['2008年度', '2013年度', '2018年度']) expect(svg).toContain(`>${year}</text>`);
    expect(svg).toContain('出典：国税庁「酒のしおり」');
    // One 100% bar per fiscal year, eight segments each; a single legend (no per-bar category lists).
    expect(svg.match(/data-group="/g)).toHaveLength(3);
    for (const label of labels) expect(svg.split(`>${label}</text>`).length - 1).toBe(1);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350 });
  });
  it.each(['missing', 'duplicate-year', 'duplicate-category', 'negative', 'zero', 'unit'] as const)('rejects %s input', issue => {
    const input = fixture();
    if (issue === 'missing') input.series.pop();
    if (issue === 'duplicate-year') input.series[0].data[1].year = '2008年度';
    if (issue === 'duplicate-category') input.series[0].label = input.series[1].label;
    if (issue === 'negative') input.series[0].data[0].value = -1;
    if (issue === 'zero') input.series.forEach(s => s.data.forEach(d => { d.value = 0; }));
    if (issue === 'unit') input.valueUnit = 'kL';
    expect(() => renderCompositionStacked(input)).toThrow();
  });
});

// 積み上げ面は積み上げ棒の型の 1 つの形 (data-form="area")。時間に沿った内訳を、区分の面を下から重ねて描く。
// 2026-10-08 の cc-estat-14 の書き直しで、積み上げ面の記事に積み上げ面の図が 1 枚も無かった (BLOG-CC14-STACKED-AREA-FIGURE-01)。
describe('積み上げ面 (積み上げ棒の型の area の形)', () => {
  const months = Array.from({ length: 36 }, (_, i) => `${2013 + Math.floor((i + 3) / 12)}年${((i + 3) % 12) + 1}月`);
  const areaChart = (over: Partial<StackedChart> = {}): StackedChart => ({
    title: '用途別の電力需要', meta: '2013年4月–2016年3月 · 単位：MWh', source: '電力調査統計',
    groups: months,
    categories: [
      { label: '電灯需要', values: months.map((_, i) => 25000 + (i % 12) * 900) },
      { label: '電力需要', values: months.map((_, i) => 9000 + (i % 6) * 300) },
      { label: '特定規模需要', values: months.map((_, i) => 40000 + (i % 4) * 700) },
    ],
    normalized: false, unit: 'MWh', decimals: 0, ...over,
  });
  const polygons = (svg: string) => [...svg.matchAll(/<polygon data-category="([^"]+)" points="([^"]+)"/g)].map((m) => ({
    label: m[1], points: m[2].split(' ').map((p) => p.split(',').map(Number) as [number, number]),
  }));

  it('区分の面を下から隙間なく重ね、最上段の上端が合計になる', () => {
    const svg = renderStackedAreaChart(areaChart());
    expect(svg).toContain('data-image-template="stacked-bar"');
    expect(svg).toContain('data-form="area"');
    const layers = polygons(svg);
    expect(layers.map((l) => l.label)).toEqual(['電灯需要', '電力需要', '特定規模需要']);
    const n = months.length;
    for (const layer of layers) expect(layer.points).toHaveLength(2 * n);
    const top = (l: (typeof layers)[number]) => l.points.slice(0, n);
    const bottom = (l: (typeof layers)[number]) => l.points.slice(n).reverse();
    // 1 段目の下端は値の 0 の線、2 段目以降の下端は 1 つ下の段の上端と同じ座標 (重なりも隙間も無い)
    const base = bottom(layers[0]).map(([, y]) => y);
    expect(new Set(base).size).toBe(1);
    for (let i = 1; i < layers.length; i++) expect(bottom(layers[i])).toEqual(top(layers[i - 1]));
    // 合計の大きい月ほど最上段の上端が高い (y が小さい)
    const totals = months.map((_, g) => areaChart().categories.reduce((s, c) => s + c.values[g]!, 0));
    const ys = top(layers[2]).map(([, y]) => y);
    const hi = totals.indexOf(Math.max(...totals)), lo = totals.indexOf(Math.min(...totals));
    expect(ys[hi]).toBeLessThan(ys[lo]);
  });

  it('凡例は 1 か所で面の積み順 (上の段から) にそろえ、各区分の最後の値を右端に置く', async () => {
    const chart = areaChart();
    const svg = renderStackedAreaChart(chart);
    for (const c of chart.categories) expect(svg.split(`>${c.label}</text>`).length - 1).toBe(1);
    const at = (label: string) => svg.indexOf(`>${label}</text>`);
    expect(at('特定規模需要')).toBeLessThan(at('電力需要'));
    expect(at('電力需要')).toBeLessThan(at('電灯需要'));
    for (const c of chart.categories) expect(svg).toContain(`>${c.values[35]!.toLocaleString('en-US')}</text>`);
    // 年月の目盛りは間引くが、最初と最後の月は必ず出す
    expect(svg).toContain('>2013年4月</text>');
    expect(svg).toContain('>2016年3月</text>');
    expect(svg.match(/data-x-label="/g)!.length).toBeLessThanOrEqual(7);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350 });
  });

  it('100% の形は各月の合計を 100 にそろえる', () => {
    const layers = polygons(renderStackedAreaChart(areaChart({ normalized: true })));
    const n = months.length;
    const topYs = layers[2].points.slice(0, n).map(([, y]) => y);
    expect(new Set(topYs).size).toBe(1);
  });

  it.each(['gap', 'negative', 'one-category', 'one-period', 'zero'] as const)('%s の入力は描かない (面を補間で埋めない)', (issue) => {
    const chart = areaChart();
    if (issue === 'gap') chart.categories[1].values[10] = null;
    if (issue === 'negative') chart.categories[0].values[3] = -1;
    if (issue === 'one-category') chart.categories.splice(1);
    if (issue === 'one-period') { chart.groups = months.slice(0, 1); chart.categories.forEach((c) => { c.values = c.values.slice(0, 1); }); }
    if (issue === 'zero') chart.categories.forEach((c) => { c.values = c.values.map(() => 0); });
    expect(() => renderStackedAreaChart(chart)).toThrow();
  });
});

describe('記事の積み上げ json の形 (form)', () => {
  const article = (over: Record<string, unknown> = {}) => ({
    title: '用途別の電力需要', unit: 'MWh', source: '電力調査統計', form: 'area',
    series: ['電灯需要', '電力需要'].map((label, i) => ({
      label, data: ['2013年4月', '2013年5月', '2013年6月'].map((x, j) => ({ x, value: 100 * (i + 1) + j })),
    })), ...over,
  });
  it('form が area の json は期間を条件の行に書いた積み上げ面になる', () => {
    expect(stackedFormOf(article())).toBe('area');
    expect(stackedFormOf(article({ form: undefined }))).toBe('bar');
    const chart = stackedAreaChartFromArticleData(article());
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart.meta).toBe('2013年4月–2013年6月 · 単位：MWh');
    expect(chart.groups).toEqual(['2013年4月', '2013年5月', '2013年6月']);
    expect(renderStackedAreaChart(chart)).toContain('data-form="area"');
    const share = stackedAreaChartFromArticleData(article({ normalized: true }));
    expect('skip' in share ? share.skip : share.meta).toBe('2013年4月–2013年6月 · 単位：%');
  });
  it('欠けた月がある json は理由を返して止める', () => {
    const input = article();
    (input.series as { data: { value: number | null }[] }[])[1].data[1].value = null;
    expect(stackedAreaChartFromArticleData(input)).toEqual({ skip: expect.stringContaining('欠け') });
  });
});
