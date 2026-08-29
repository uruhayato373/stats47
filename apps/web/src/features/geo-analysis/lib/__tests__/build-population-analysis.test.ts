import { describe, expect, it } from 'vitest';

import { buildPopulationAnalysis } from '../build-population-analysis';

import type { RankingValue } from '@stats47/ranking';

const row = (
  areaCode: string,
  areaName: string,
  value: number | null,
  rank: number
): RankingValue => ({
  metricKey: 'future-population-change-rate-2050',
  areaType: 'prefecture',
  areaCode,
  areaName,
  yearCode: '2050',
  yearName: '2050年',
  value,
  unit: '％',
  rank,
});

describe('buildPopulationAnalysis', () => {
  it('nullと全国値を除外し、順位・符号・中央値・格差を決定的に集計する', () => {
    const result = buildPopulationAnalysis([
      row('05000', '秋田県', -41.59, 4),
      row('00000', '全国', -20, 0),
      row('13000', '東京都', 2.5, 1),
      row('47000', '沖縄県', -5.21, 2),
      row('27000', '大阪府', -17.82, 3),
      row('01000', '北海道', null, 5),
    ]);

    expect(result.rows.map((value) => value.areaCode)).toEqual([
      '13000',
      '47000',
      '27000',
      '05000',
    ]);
    expect(result.positiveCount).toBe(1);
    expect(result.negativeCount).toBe(3);
    expect(result.zeroCount).toBe(0);
    expect(result.median).toBe(-11.52);
    expect(result.range).toBe(44.09);
    expect(result.top[0]?.areaName).toBe('東京都');
    expect(result.bottom[0]?.areaName).toBe('秋田県');
  });

  it('有効値が無い場合は空の要約を返す', () => {
    expect(buildPopulationAnalysis([row('01000', '北海道', null, 1)])).toEqual({
      rows: [],
      top: [],
      bottom: [],
      positiveCount: 0,
      negativeCount: 0,
      zeroCount: 0,
      average: 0,
      median: 0,
      range: 0,
    });
  });
});
