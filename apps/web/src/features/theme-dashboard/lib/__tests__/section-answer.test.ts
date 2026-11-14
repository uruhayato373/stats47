// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { buildSectionAnswer } from '../section-answer';

import type { MetricKpi } from '../../components/metric-kpi';

function kpi(overrides: Partial<MetricKpi>): MetricKpi {
  return {
    metricKey: 'food-expenditure',
    trendDomain: { mode: 'extent', padding: 0.08 },
    title: '食料費',
    unit: '円',
    yearName: '2025年',
    value: 1094070,
    rank: 26,
    total: 47,
    precision: 0,
    series: [],
    isLoading: false,
    nationalValue: 1138736,
    ...overrides,
  };
}

describe('buildSectionAnswer', () => {
  it('県のページは先頭の指標の値・年・順位と、全国との差を割合で書く', () => {
    const answer = buildSectionAnswer({
      metrics: [kpi({})],
      labels: {},
      areaName: '兵庫県',
      isPrefecture: true,
    });
    expect(answer).toBe('兵庫県の食料費は1,094,070円（2025年・全国26位）。全国（1,138,736円）より4%少ない。');
  });

  it('表示単位に寄せる指標は、県の値も全国の値も同じ単位で書く (差の割合は元の値で計算する)', () => {
    // 「141,212,322,090.16円」のように桁の多い値は、数字の途中で折り返して読めない (2026-11-14)
    const answer = buildSectionAnswer({
      metrics: [kpi({
        title: '歳出決算総額', unit: '千円', value: 8_000_000_000, nationalValue: 60_000_000_000, precision: 0,
        displayScale: { unit: '億円', factor: 0.00001, decimals: 0 },
      })],
      labels: {},
      areaName: '東京都',
      isPrefecture: true,
    });
    expect(answer).toContain('東京都の歳出決算総額は80,000億円（2025年・全国26位）');
    expect(answer).toContain('全国（600,000億円）');
    expect(answer).not.toContain('千円');
  });

  it('章の中で全国順位が 5 位以内の指標を、向きの言葉を付けずに挙げる', () => {
    const answer = buildSectionAnswer({
      metrics: [kpi({}), kpi({ metricKey: 'bread', title: '食パンへの支出', rank: 1 }), kpi({ metricKey: 'rice', title: '米', rank: 22 })],
      labels: { bread: '食パン' },
      areaName: '兵庫県',
      isPrefecture: true,
    });
    expect(answer).toContain('この章で全国順位が上位なのは食パン（1位）。');
    expect(answer).not.toContain('米');
  });

  it('全国順位が最下位から 5 位以内の指標を下位として挙げ、全国の系列があれば全国の動きを書く', () => {
    const answer = buildSectionAnswer({
      metrics: [
        kpi({ officialNationalSeries: [{ year: 2008, value: 900000 }, { year: 2025, value: 1138736 }] }),
        kpi({ metricKey: 'miso', title: 'みそ消費量', rank: 43 }),
      ],
      labels: {},
      areaName: '兵庫県',
      isPrefecture: true,
    });
    expect(answer).toContain('下位なのはみそ消費量（43位）。');
    expect(answer).toContain('全国の食料費は2008年（900,000円）から27%増えた。');
  });

  it('全国との差が 1% 未満なら多い・少ないと言わない', () => {
    const answer = buildSectionAnswer({
      metrics: [kpi({ value: 1000, nationalValue: 1005 })],
      labels: {},
      areaName: '兵庫県',
      isPrefecture: true,
    });
    expect(answer).toContain('とほぼ同じ。');
  });

  it('全国のページは順位を出さず、全国の系列の最初の年からの増減を書く', () => {
    const answer = buildSectionAnswer({
      metrics: [
        kpi({
          rank: null,
          value: 1138736,
          officialNationalSeries: [
            { year: 2008, value: 900000 },
            { year: 2025, value: 1138736 },
          ],
        }),
      ],
      labels: {},
      areaName: '全国',
      isPrefecture: false,
    });
    expect(answer).toBe('全国の食料費は1,138,736円（2025年）。2008年（900,000円）から27%増えた。');
  });

  it('値の無い章は推測で埋めず null を返す', () => {
    expect(
      buildSectionAnswer({ metrics: [kpi({ value: null })], labels: {}, areaName: '兵庫県', isPrefecture: true })
    ).toBeNull();
  });
});
