import { describe, expect, it } from 'vitest';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { rankingChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { PREF_NAMES } from '../../../../.claude/scripts/lib/prefectures.cjs';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { prefectureChordNodes, regionChordNodes, renderChordChart, type MigrationPair } from '@/lib/template-chord';
import { renderTileMapChart } from '@/lib/template-ranking-tile-map';

const code = (i: number) => `${String(i + 1).padStart(2, '0')}000`;
const pairs: MigrationPair[] = Array.from({ length: 47 }, (_, a) => Array.from({ length: 47 }, (_, b) => ({ fromPrefCode: code(a), toPrefCode: code(b), inflow: a === b ? 0 : (a + 1) * 10 + b })))
  .flat().filter((p) => p.fromPrefCode !== p.toPrefCode);
const head = { title: '人の移動', meta: '2025年 · 単位：人', source: '住民基本台帳人口移動報告' };
const names = PREF_NAMES as string[];

describe('コード図の型', () => {
  it('地方別は地方をまたぐ移動だけを足し、合計が県別の該当分と一致する', () => {
    const { nodes, matrix } = regionChordNodes(pairs);
    expect(nodes).toHaveLength(7);
    const hokkaidoToOkinawa = pairs.find((p) => p.fromPrefCode === '01000' && p.toPrefCode === '47000')!;
    expect(matrix[0][6]).toBeGreaterThanOrEqual(hokkaidoToOkinawa.inflow);
    matrix.forEach((row, i) => expect(row[i]).toBe(0));
  });
  it('県別は移動の向きを保ち、from の行が to の列に入る', () => {
    const { nodes, matrix } = prefectureChordNodes(pairs, names);
    expect(nodes).toHaveLength(47);
    expect(matrix[0][12]).toBe(22);
    expect(matrix[12][0]).toBe(130);
  });
  it.each([['地方別', regionChordNodes(pairs)], ['都道府県別', prefectureChordNodes(pairs, names)]] as const)('%s を明暗の両方で描き、画像の決まりを守る', (_, data) => {
    for (const theme of [CHART_THEMES.light, CHART_THEMES.dark]) {
      const svg = renderChordChart({ ...head, ...data }, theme);
      expect(svg).toContain('data-image-template="chord"');
      expect(svg).toContain(`data-theme="${theme.name}"`);
      for (const node of data.nodes) expect(svg).toContain(`>${node.label}</text>`);
      expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    }
  });
  it('行列と項目の数が違えば描かない', () => {
    expect(() => renderChordChart({ ...head, nodes: [{ label: 'a', color: '#000000' }], matrix: [[0, 1], [1, 0]] })).toThrow();
  });
  it('負の移動量を受け取らない', () => {
    expect(() => regionChordNodes([{ fromPrefCode: '01000', toPrefCode: '02000', inflow: -1 }])).toThrow();
  });
});

describe('基準の県のあるタイル地図', () => {
  const article = (rankingKey: string) => ({
    title: '大阪府と各県の人口移動', subtitle: '2025年', year: '2025', unit: '人', source: '住民基本台帳人口移動報告', rankingKey, scheme: 'RdBu',
    data: names.filter((n) => n !== '大阪府').map((name, i) => ({ areaName: name, value: i - 20 })),
  });
  const opts = { allowBaseArea: true, prefCodeOf: (n: string) => String(names.indexOf(n) + 1).padStart(2, '0'), prefNameOf: (c: string) => names[Number(c) - 1] };
  it('移動の 46 県は欠けた県を基準にし、そのタイルへ値でなく「基準」と書く', () => {
    const chart = rankingChartFromArticleData(article('population-migration-inter-prefecture'), opts);
    if ('skip' in chart) throw Error(chart.skip);
    expect(chart.baseAreaCode).toBe('27000');
    expect(renderTileMapChart(chart)).toContain('基準');
  });
  it('移動でない指標の 46 県は欠測のままで、基準の県にしない', () => {
    expect(rankingChartFromArticleData(article('other-metric'), opts)).toHaveProperty('skip');
  });
  it('allowBaseArea が無ければ棒の経路は 46 県を 47 県にしない', () => {
    expect(rankingChartFromArticleData(article('population-migration-inter-prefecture'), { ...opts, allowBaseArea: false })).toHaveProperty('skip');
  });
});
