import { describe, expect, it } from 'vitest';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { renderRadarChart, type RadarChart } from '@/lib/template-radar';
import { flowsFromTable, renderSankeyChart, type SankeyChart } from '@/lib/template-sankey';
import { regionNetSteps, renderWaterfallChart, type WaterfallChart } from '@/lib/template-waterfall';

const head = { title: '見本', meta: '2024年 · 単位：人', source: '統計' };
const radar: RadarChart = {
  ...head,
  axes: [{ key: 'a', label: '人口' }, { key: 'b', label: '刑法犯認知の少なさ' }, { key: 'c', label: '所得' }],
  series: [{ name: '東京都', values: { a: 1, b: 0.4, c: 0.8 } }, { name: '中央値', reference: true, values: { a: 0.2, b: 0.5, c: 0.3 } }],
};
const sankey: SankeyChart = {
  ...head, sources: ['東北', '九州'], targets: ['米', '畜産'],
  flows: [{ from: '東北', to: '米', value: 30 }, { from: '東北', to: '畜産', value: 10 }, { from: '九州', to: '畜産', value: 60 }],
};
const waterfall: WaterfallChart = {
  ...head, steps: [{ label: '近畿', value: 500 }, { label: '関東', value: -800 }], totalLabel: '転入超過',
};

describe('レーダーチャートの型', () => {
  it('欠けた値を 0 として描かずに止める', () => {
    const series = [{ name: '東京都', values: { a: 1, b: 0.4 } }];
    expect(() => renderRadarChart({ ...radar, series })).toThrow(/0〜1/);
  });
  it('0〜1 の外の値と系列の数の超過を止める', () => {
    expect(() => renderRadarChart({ ...radar, series: [{ name: '東京都', values: { a: 2, b: 0.4, c: 0.8 } }] })).toThrow(/0〜1/);
    const four = Array.from({ length: 4 }, (_, i) => ({ name: `県${i}`, values: { a: 1, b: 1, c: 1 } }));
    expect(() => renderRadarChart({ ...radar, series: four })).toThrow(/1〜3/);
  });
  it('基準の系列は破線で塗らず、データの系列より先に描く', () => {
    const svg = renderRadarChart(radar);
    const reference = svg.indexOf('data-series="中央値"');
    expect(reference).toBeGreaterThan(-1);
    expect(reference).toBeLessThan(svg.indexOf('data-series="東京都"'));
    expect(svg.slice(reference, svg.indexOf('/>', reference))).toContain('fill="none"');
  });
});

describe('サンキーの型', () => {
  it('左右の列の合計が帯の合計に一致する', () => {
    const svg = renderSankeyChart(sankey);
    expect(svg).toContain('data-image-template="sankey" data-total="100"');
    expect(svg).toContain('data-source="東北" data-total="40"');
    expect(svg).toContain('data-target="畜産" data-total="70"');
  });
  it('列に無い項目と負の量を止める', () => {
    expect(() => renderSankeyChart({ ...sankey, flows: [{ from: '関東', to: '米', value: 1 }] })).toThrow(/列にありません/);
    expect(() => renderSankeyChart({ ...sankey, flows: [{ from: '東北', to: '米', value: -1 }] })).toThrow(/正の数/);
  });
  it('元の表が宣言する合計と流れが合わなければ止める', () => {
    const table = { flowTotals: { 東北: 40 }, series: [{ label: '米', data: [{ year: '東北', value: 30 }] }, { label: '畜産', data: [{ year: '東北', value: 10 }] }] };
    expect(flowsFromTable(table).flows).toHaveLength(2);
    expect(() => flowsFromTable({ ...table, flowTotals: { 東北: 41 } })).toThrow(/合いません/);
  });
});

describe('ウォーターフォールの型', () => {
  it('各棒は前の行の終わりから始まり、最後の行が足し上げになる', () => {
    const svg = renderWaterfallChart({ ...waterfall, start: { label: '前年', value: 1000 } });
    expect(svg).toContain('data-total="700"');
    expect(svg).toContain('−800');
    const bar = (kind: string, n = 0) => [...svg.matchAll(new RegExp(`data-step="${kind}"[^>]*>.*?<rect x="([\\d.]+)" y="[\\d.]+" width="([\\d.]+)"`, 'g'))][n];
    const [first, second] = [bar('step', 0), bar('step', 1)];
    const firstEnd = Number(first[1]) + Number(first[2]);
    const secondEnd = Number(second[1]) + Number(second[2]);
    expect(secondEnd).toBeCloseTo(firstEnd, 0);
  });
  it('公表の合計と足し上げが合わなければ止める', () => {
    expect(() => renderWaterfallChart({ ...waterfall, total: 1 })).toThrow(/合計が合いません/);
  });
  it('地方別の増減の足し上げは、その県の転入超過に一致する', () => {
    const pairs = [
      { fromPrefCode: '01000', toPrefCode: '13000', inflow: 100 },
      { fromPrefCode: '13000', toPrefCode: '01000', inflow: 30 },
      { fromPrefCode: '27000', toPrefCode: '13000', inflow: 50 },
      { fromPrefCode: '13000', toPrefCode: '27000', inflow: 90 },
      { fromPrefCode: '01000', toPrefCode: '27000', inflow: 999 },
    ];
    const steps = regionNetSteps(pairs, '13000');
    expect(steps.reduce((sum, step) => sum + step.value, 0)).toBe(30);
    expect(steps[0].value).toBe(70);
    expect(steps[steps.length - 1].value).toBe(-40);
  });
});

describe.each([['レーダー', () => renderRadarChart(radar), renderRadarChart.bind(null, radar)], ['サンキー', () => renderSankeyChart(sankey), renderSankeyChart.bind(null, sankey)], ['ウォーターフォール', () => renderWaterfallChart(waterfall), renderWaterfallChart.bind(null, waterfall)]] as const)('%s の画像の決まり', (_, light, render) => {
  it('明暗の両方で描き、余計な文言を入れない', () => {
    expect(() => assertMinimalChartCopy(light())).not.toThrow();
    expect(render(CHART_THEMES.dark)).toContain('data-theme="dark"');
    expect(render(CHART_THEMES.light)).toContain('data-theme="light"');
  });
});
