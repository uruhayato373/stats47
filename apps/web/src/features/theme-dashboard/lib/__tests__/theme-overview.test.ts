import { describe, expect, it } from 'vitest';

import {
  formatOverviewDifference,
  getOverviewMedian,
  getOverviewValues,
} from '../theme-overview';

import type { ThemeIndicatorData } from '../../types';
import type { RankingValue } from '@stats47/ranking';

const row = (
  areaCode: string,
  value: number | null,
  yearCode = '2023'
): RankingValue =>
  ({
    areaCode,
    value,
    yearCode,
    yearName: `${yearCode}年`,
    rank: 0,
  }) as RankingValue;

function data(values: RankingValue[]): ThemeIndicatorData {
  return {
    rankingItem: { latestYear: { yearCode: '2023', yearName: '2023年' } },
    rankingValues: values,
  } as ThemeIndicatorData;
}

describe('theme overview comparison', () => {
  it('全国値・別年・市区町村・欠測を県比較に混ぜず、同値を同順位にする', () => {
    const rows = getOverviewValues(
      data([
        row('01000', 20),
        row('02000', 20),
        row('03000', 10),
        row('00000', 999),
        row('01100', 999),
        row('47000', 999, '2018'),
        row('04000', null),
        row('05000', NaN),
        row('06000', Infinity),
      ])
    );
    expect(rows.map(({ areaCode, rank }) => [areaCode, rank])).toEqual([
      ['01000', 1],
      ['02000', 1],
      ['03000', 3],
    ]);
    expect(getOverviewMedian(rows)).toBe(20);
  });

  it('0を有効値として保持し、偶数県の中央値は中央2値から求める', () => {
    expect(
      getOverviewMedian(
        getOverviewValues(data([row('01000', 0), row('02000', 10)]))
      )
    ).toBe(5);
  });

  it('県を重複計上せず、空データから比較値を捏造しない', () => {
    expect(
      getOverviewValues(data([row('01000', 10), row('01000', 10)]))
    ).toHaveLength(1);
    expect(getOverviewMedian([])).toBeNull();
    expect(formatOverviewDifference(null, 10, '％')).toBe('—');
  });

  it('率の差をポイントで表し、面積差には元の単位を用いる', () => {
    expect(formatOverviewDifference(13.8, 15.5, '％')).toBe('-1.7 ポイント');
    expect(formatOverviewDifference(20, 10, '%')).toBe('+10 ポイント');
    expect(formatOverviewDifference(114.2, 100, 'ｍ2')).toBe('+14.2 m2');
    expect(formatOverviewDifference(10, 10, '％')).toBe('0 ポイント');
  });
});
