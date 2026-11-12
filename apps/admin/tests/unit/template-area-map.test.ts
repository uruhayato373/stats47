import { describe, expect, it } from 'vitest';
import type { Topology } from 'topojson-specification';
import { areasOf, resolveAreaChart, type AreaScope } from '@/lib/template-area-scope';
import { renderAreaMapChart } from '@/lib/template-area-map';

const scope: AreaScope = { level: 'municipality', wardMode: 'merged', within: { kind: 'nation' } };
const codes = [...areasOf(scope).keys()];
// Synthetic rectangles test code coverage, not a fabricated statistical or geographical example.
function fixture() {
  const arcs = codes.map(code => {
    const [lon, lat] = code === '13421' ? [142, 27] : code === '47358' ? [131, 25]
      : code.startsWith('47') ? [127, 26] : [140, 35];
    return [[lon, lat], [lon, lat + .01], [lon + .01, lat + .01], [lon + .01, lat], [lon, lat]];
  });
  const topology: Topology = { type: 'Topology', arcs, objects: { cities: { type: 'GeometryCollection',
    geometries: codes.map((code, i) => ({ type: 'Polygon', arcs: [[i]], properties: { N03_007: code } })),
  } } };
  const chart = resolveAreaChart({ scope, title: '地域比較', yearLabel: '2020年', unit: '%', source: '検証用',
    presentation: { colorScheme: 'interpolateRdBu', colorSchemeType: 'diverging', domain: { mode: 'extent' },
      classification: { method: 'continuous' }, divergingMidpoint: 'zero' } as never,
    values: codes.map((areaCode, i) => ({ areaCode, value: areaCode === '13421' ? null : i - codes.length / 2 })),
  });
  return { chart, topology };
}

describe('全国と県内で共通の市区町村地図', () => {
  it('本土・沖縄・小笠原・大東諸島の全自治体を一度ずつ描き、欠測の形も残す', () => {
    const { chart, topology } = fixture();
    const svg = renderAreaMapChart(chart, topology);
    const rendered = [...svg.matchAll(/data-area="(\d{5})"/g)].map(match => match[1]);
    expect(rendered.sort()).toEqual([...codes].sort());
    expect(svg).toContain('data-within="nation"');
    expect(svg).toContain('data-area="13421" data-value=""');
    expect(svg).toContain('離島（別位置・別縮尺）');
    expect(svg).not.toMatch(/NaN|Infinity/);
  });

  it('欠測の自治体でも境界が欠けていたら止める', () => {
    const { chart, topology } = fixture();
    const collection = topology.objects.cities;
    if (collection.type !== 'GeometryCollection') throw Error('Invalid fixture');
    collection.geometries = collection.geometries.filter(g => (g.properties as Record<string, unknown>)?.N03_007 !== '13421');
    expect(() => renderAreaMapChart(chart, topology)).toThrow('境界データに無い地域');
  });

  it('対象外の境界が離島の投影範囲を広げず、全国の同名自治体は県名付きで識別できる', () => {
    const { chart, topology } = fixture();
    expect(areasOf(scope).get('13102')).toBe('東京都 中央区');
    const expected = renderAreaMapChart(chart, topology);
    const collection = topology.objects.cities;
    if (collection.type !== 'GeometryCollection') throw Error('Invalid fixture');
    collection.geometries.push({ type: 'Polygon', arcs: [[topology.arcs.length]], properties: { N03_007: '13000' } });
    topology.arcs.push([[-100, 0], [-100, 1], [-99, 1], [-99, 0], [-100, 0]]);
    expect(renderAreaMapChart(chart, topology)).toBe(expected);
  });

  it('県内表示でも同じコード照合・欠測表示を使う', () => {
    const { chart, topology } = fixture();
    const local: AreaScope = { level: 'municipality', wardMode: 'merged', within: { kind: 'prefecture', prefCode: '39' } };
    const svg = renderAreaMapChart({ ...chart, scope: local, rows: chart.rows.filter(row => row.area_code.startsWith('39')) }, topology);
    expect([...svg.matchAll(/data-area="(\d{5})"/g)].map(match => match[1]).sort()).toEqual([...areasOf(local).keys()].sort());
    expect(svg).not.toContain('離島（別位置）');
  });
});
