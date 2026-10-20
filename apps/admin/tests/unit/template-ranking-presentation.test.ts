import { computeChoroplethPaths } from '../../../remotion/src/shared/utils/choropleth';
import type { Topology } from 'topojson-specification';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolveChoroplethScale } from '../../../../packages/visualization/src/server';
import { generateChoroplethSvg } from '../../../../packages/svg-builder/src/charts/choropleth';
import {
  RANKING_SAMPLE_METRIC,
  rankingInputFromStats,
  rankingBarAxis,
} from '@/lib/template-ranking-data';
import { rankingRows, renderRankingBars } from '@/lib/template-ranking-bars';
import { resolveStatisticalSamples } from '@/lib/server/template-statistical-samples';
import { buildRankingItemFromMetric } from '../../../../packages/ranking/src/builders/build-ranking-item-from-metric';
import { parseRankingItemSnapshot } from '../../../../packages/ranking/src/repositories/schemas/ranking-item.schemas';

const rows = Array.from({ length: 47 }, (_, i) => ({
  areaCode: String(i + 1).padStart(2, '0') + '000',
  areaName: '県' + i,
  yearCode: '2024',
  yearName: '2024年',
  unit: '℃',
  value: 36 - Math.floor(i / 2) / 10,
  rank: Math.floor(i / 2) * 2 + 1,
}));
const fixture = () => ({
  metricKey: 'maximum-temperature',
  entityKind: 'prefecture',
  rows,
  meta: {
    rowCount: 47,
    areaCount: 47,
    yearRange: ['2024', '2024'],
    generatedAt: '2026-10-19',
  },
});

describe('shared ranking/image presentation contract', () => {
  // Loading the site's D3 implementation is setup, not part of each assertion's 5s budget.
  beforeAll(async () => {
    await import('d3');
  }, 30000);
  it('selects the fixed year from canonical observations and preserves competition ranks', () => {
    const input = rankingInputFromStats({
      ...fixture(),
      rows: [...rows, { ...rows[0], yearCode: '2023', value: 99 }],
    });
    expect(input.data).toHaveLength(47);
    expect(
      rankingRows(input)
        .slice(0, 4)
        .map((row) => row.rank)
    ).toEqual([1, 1, 3, 3]);
    expect(() =>
      rankingInputFromStats({ ...fixture(), metricKey: 'other' })
    ).toThrow();
    expect(() =>
      rankingInputFromStats({ ...fixture(), entityKind: 'city' })
    ).toThrow();
    expect(() =>
      rankingInputFromStats({
        ...fixture(),
        rows: rows.map((row) => ({ ...row, unit: '円' })),
      })
    ).toThrow();
    expect(() =>
      rankingRows(
        rankingInputFromStats({ ...fixture(), rows: rows.slice(0, 46) })
      )
    ).toThrow();
  });
  it('binds all three ranking forms to the same authored presentation and canonical data, without replacing household samples', () => {
    const samples = resolveStatisticalSamples([]);
    const bindings = samples
      .filter((sample) => sample.renderer && sample.purpose === 'ranking')
      .map((sample) => sample.binding);
    expect(bindings).toHaveLength(3);
    for (const binding of bindings) {
      expect(binding?.visualization).toEqual(
        RANKING_SAMPLE_METRIC.visualization
      );
      expect(binding?.dataKey).toBe(
        'app/stats/maximum-temperature/values.json'
      );
      expect(binding?.dataSha256).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(
      samples.filter((sample) => sample.topic?.startsWith('a-kakei-'))
    ).toHaveLength(3);
  });
  it('defaults to the full-data minimum and maximum while retaining explicit zero and fixed policies', () => {
    expect(rankingBarAxis([28.4, 36.2])).toMatchObject({
      min: 28.4,
      max: 36.2,
      baseline: 28.4,
      truncated: true,
    });
    expect(rankingBarAxis([28.4, 56.2]).max).toBe(56.2);
    expect(rankingBarAxis([-7, 3])).toMatchObject({
      min: -7,
      max: 3,
      baseline: 0,
      truncated: false,
    });
    expect(rankingBarAxis([-10, -2])).toMatchObject({
      min: -10,
      max: -2,
      baseline: -2,
      truncated: true,
    });
    expect(
      rankingBarAxis([28.4, 36.2], {
        ...RANKING_SAMPLE_METRIC.visualization,
        barDomain: { mode: 'zero' },
      })
    ).toMatchObject({ min: 0, max: 36.2, truncated: false });
    const { barDomain: _barDomain, ...withoutOverride } =
      RANKING_SAMPLE_METRIC.visualization;
    expect(_barDomain).toEqual({ mode: 'extent' });
    expect(rankingBarAxis([28.4, 36.2], withoutOverride)).toMatchObject({
      min: 28.4,
      max: 36.2,
    });
  });
  it('takes fixed limits from the metric ledger and applies them to bar widths without rounding', () => {
    const policy = {
      ...RANKING_SAMPLE_METRIC.visualization,
      barDomain: { mode: 'fixed' as const, min: 0, max: 37 },
    };
    expect(rankingBarAxis([28.4, 36.2], policy)).toMatchObject({
      min: 0,
      max: 37,
    });
    expect(rankingBarAxis([28.4, 36.2], policy).ticks).toContain(37);
    const input = rankingInputFromStats(fixture());
    const svg = renderRankingBars(input, policy);
    const firstWidth = (image: string) =>
      Number(
        /data-rank="1"[^]*?<rect data-bar-value="true"[^]*?width="([\d.]+)"/.exec(
          image
        )?.[1]
      );
    expect(firstWidth(svg)).toBeCloseTo((536 * 36) / 37);
    expect(svg).toContain('data-domain-max="37"');
    const expanded = renderRankingBars(input, {
      ...policy,
      barDomain: { mode: 'fixed', min: -10, max: 50 },
    });
    expect(firstWidth(expanded)).toBeCloseTo((536 * 36) / 60);
    expect(expanded).toContain('data-domain-max="50"');
    expect(expanded).toContain('data-domain-min="-10"');
    expect(() =>
      renderRankingBars(input, {
        ...policy,
        barDomain: { mode: 'fixed', min: 0, max: 35 },
      })
    ).toThrow();
    const cropped = renderRankingBars(input, {
      ...policy,
      barDomain: { mode: 'fixed', min: 30, max: 37 },
    });
    expect(firstWidth(cropped)).toBeCloseTo((536 * 6) / 7);
    expect(cropped).toContain('範囲：30.0–37.0');
    expect(RANKING_SAMPLE_METRIC.visualization.barDomain).toEqual({
      mode: 'extent',
    });
    const item = buildRankingItemFromMetric(
      { ...RANKING_SAMPLE_METRIC, visualization: policy },
      { values: { yearCodes: ['2024'] }, now: '2026-10-19' }
    );
    const snapshot = parseRankingItemSnapshot(
      JSON.parse(JSON.stringify({ generatedAt: '2026-10-19', item }))
    );
    expect(snapshot.item.visualization.barDomain).toEqual(policy.barDomain);
  });
  it.each(['equal-interval', 'quantile', 'threshold', 'continuous'] as const)(
    'uses the site resolver for %s tile fills and legend',
    async (method) => {
      const classification =
        method === 'continuous'
          ? { method }
          : method === 'threshold'
            ? { method, thresholds: [1, 3] }
            : { method, classes: 5 };
      const config = { ...RANKING_SAMPLE_METRIC.visualization, classification };
      const data = [0, 1, 2, 3, 10].map((value, i) => ({
        areaCode: String(i + 1).padStart(2, '0'),
        value,
      }));
      const resolved = await resolveChoroplethScale(config, data);
      const svg = generateChoroplethSvg(
        data.map((row) => ({
          code: row.areaCode,
          name: row.areaCode,
          value: row.value,
        })),
        { title: '', unit: '℃', showRankList: false, resolvedScale: resolved }
      );
      for (const row of data)
        expect(svg).toContain(
          'fill="' + resolved.colorAtValue(row.value) + '"'
        );
      if (method !== 'continuous')
        for (const color of resolved.colors)
          expect(svg).toContain('fill="' + color + '"');
      expect(svg).not.toContain('url(#choropleth-lg)');
    }
  );
  it('uses the same class colors in Remotion as the site and static SVG', async () => {
    const config = {
      ...RANKING_SAMPLE_METRIC.visualization,
      colorScheme: 'interpolateRdBu',
      colorSchemeType: 'diverging' as const,
      divergingMidpoint: 'custom' as const,
      divergingMidpointValue: 1,
      domain: { mode: 'fixed' as const, min: -1, max: 3 },
      isSymmetrized: true,
      isReversed: true,
    };
    const values = [-1, 1, 3];
    const topology: Topology = {
      type: 'Topology',
      arcs: [
        [
          [130, 30],
          [131, 30],
          [131, 31],
          [130, 31],
          [130, 30],
        ],
      ],
      objects: {
        prefectures: {
          type: 'GeometryCollection',
          geometries: values.map((_, i) => ({
            type: 'Polygon' as const,
            arcs: [[0]],
            properties: { N03_007: String(i + 1).padStart(2, '0') + '000' },
          })),
        },
      },
    };
    const data = values.map((value, i) => ({
      areaCode: String(i + 1).padStart(2, '0') + '000',
      value,
    }));
    const site = await resolveChoroplethScale(config, data);
    const video = computeChoroplethPaths(topology, data, {
      width: 400,
      height: 400,
      colorScheme: config.colorScheme,
      encoding: config,
    });
    expect(video.map((row) => row.fill)).toEqual(values.map(site.colorAtValue));
  });
  it('retains a declared diverging center, symmetric fixed limits and reversal in static maps', async () => {
    const config = {
      ...RANKING_SAMPLE_METRIC.visualization,
      colorScheme: 'interpolateRdBu',
      colorSchemeType: 'diverging' as const,
      divergingMidpoint: 'custom' as const,
      divergingMidpointValue: 1,
      isSymmetrized: true,
      isReversed: true,
      domain: { mode: 'fixed' as const, min: -1, max: 3 },
    };
    const resolved = await resolveChoroplethScale(config, [
      { areaCode: '01', value: 1 },
    ]);
    expect('midpoint' in resolved && resolved.midpoint).toBe(1);
    expect(resolved.domain).toEqual([-1, 3]);
    const svg = generateChoroplethSvg(
      [{ code: '01', name: '北海道', value: 1 }],
      { title: '', unit: '倍', resolvedScale: resolved }
    );
    expect(svg).toContain('基準：1');
    expect(svg).toContain('fill="' + resolved.colorAtValue(1) + '"');
    const forward = await resolveChoroplethScale(
      { ...config, isReversed: false },
      [{ areaCode: '01', value: 1 }]
    );
    expect(resolved.colorAtValue(-1)).toBe(forward.colorAtValue(3));
  });
});
