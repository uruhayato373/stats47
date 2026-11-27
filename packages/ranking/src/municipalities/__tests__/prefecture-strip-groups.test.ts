import { describe, expect, it } from 'vitest';

import { buildMunicipalityPrefectureRanking } from '../municipality-prefecture-ranking';
import {
  buildPrefectureStripGroups,
  formatPowerOfTenTick,
  LOG_SCALE_MIN_RATIO,
  resolveStripScale,
  stripPosition,
} from '../prefecture-strip-groups';

import type { MunicipalityRankingValue } from '../../types/municipality-snapshot';

function row(areaCode: string, prefectureCode: string, value: number, rank: number): MunicipalityRankingValue {
  return { areaCode, areaName: areaCode, prefectureCode, value, rank };
}

const PREFECTURES = [
  { prefCode: '01000', prefName: '北海道' },
  { prefCode: '13000', prefName: '東京都' },
  { prefCode: '14000', prefName: '神奈川県' },
];
const SPECIAL_WARDS: ReadonlySet<string> = new Set(['13101']);
const VALUES = [
  row('14100', '14000', 3_750_000, 1),
  row('13101', '13000', 900_000, 2),
  row('13201', '13000', 500_000, 3),
  row('14382', '14000', 2_900, 5),
  row('13361', '13000', 168, 6),
];

describe('buildPrefectureStripGroups: 県ごとの点の帯のデータ', () => {
  it('値のある県だけを、県内の中央値の大きい順に並べる (値の無い北海道は出さない)', () => {
    const groups = buildPrefectureStripGroups(VALUES, PREFECTURES, SPECIAL_WARDS);
    expect(groups.map((group) => group.prefectureName)).toEqual(['東京都', '神奈川県']);
    expect(groups[0]!.values.sort((a, b) => a - b)).toEqual([168, 500_000, 900_000]);
  });

  it('県内の中央値は県別ページと同じ定義 (下側中央値) にする', () => {
    for (const group of buildPrefectureStripGroups(VALUES, PREFECTURES, SPECIAL_WARDS)) {
      const ranking = buildMunicipalityPrefectureRanking(VALUES, group.prefectureCode, SPECIAL_WARDS);
      expect(group.median).toBe(ranking!.median);
    }
    // 神奈川は 2 件 (2,900 と 375 万) なので下側の 2,900
    expect(buildPrefectureStripGroups(VALUES, PREFECTURES, SPECIAL_WARDS)[1]!.median).toBe(2_900);
  });
});

describe('resolveStripScale: 軸の種類', () => {
  it('正の値が 100 倍以上に広がる指標 (総人口 168〜375 万) は対数の軸で、目盛りは 10 の累乗', () => {
    const scale = resolveStripScale([168, 2_900, 3_750_000])!;
    expect(scale.kind).toBe('log');
    expect(scale.ticks).toEqual([100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000]);
    expect([scale.min, scale.max]).toEqual([100, 10_000_000]);
  });

  it('広がりが 100 倍未満の率 (高齢化率 12〜62%) は普通の軸', () => {
    const scale = resolveStripScale([12.4, 30, 62.1])!;
    expect(scale.kind).toBe('linear');
    expect([scale.min, scale.max]).toEqual([12.4, 62.1]);
    expect(scale.ticks.length).toBeGreaterThan(1);
    expect(scale.clipped).toBe(false);
  });

  it('普通の軸は 2%〜98% の範囲にし、1 つの外れ値 (転入超過率 -15% の村) で軸を広げない', () => {
    const values = [-15, ...Array.from({ length: 98 }, (_, index) => -2 + index * 0.05), 3.2];
    const scale = resolveStripScale(values)!;
    expect(scale.kind).toBe('linear');
    expect(scale.min).toBeGreaterThan(-15);
    expect(scale.max).toBeLessThan(3.2);
    expect(scale.clipped).toBe(true);
    expect(stripPosition(scale, -15)).toBe(0);
  });

  it('負の値や 0 を含む指標は、広がりが大きくても普通の軸 (対数にできない)', () => {
    expect(resolveStripScale([-15, 0, 3])!.kind).toBe('linear');
    expect(resolveStripScale([0, 1, LOG_SCALE_MIN_RATIO * 10])!.kind).toBe('linear');
  });

  it('値が無ければ null を返す', () => {
    expect(resolveStripScale([])).toBeNull();
  });
});

describe('stripPosition: 軸の上の位置', () => {
  it('対数の軸では 10 倍ごとに等しい間隔で並ぶ', () => {
    const scale = resolveStripScale([100, 10_000])!;
    expect(scale.kind).toBe('log');
    expect(stripPosition(scale, 100)).toBe(0);
    expect(stripPosition(scale, 1_000)).toBeCloseTo(50);
    expect(stripPosition(scale, 10_000)).toBe(100);
  });

  it('普通の軸では値に比例し、範囲の外は端に止める', () => {
    const scale = resolveStripScale([10, 30])!;
    expect(stripPosition(scale, 20)).toBeCloseTo(50);
    expect(stripPosition(scale, 99)).toBe(100);
  });
});

describe('formatPowerOfTenTick: 対数の目盛りの文字', () => {
  it('1 万以上は万・億に寄せ、書き方を全部の目盛りでそろえる', () => {
    expect([100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000].map(formatPowerOfTenTick))
      .toEqual(['100', '1,000', '1万', '10万', '100万', '1,000万', '1億']);
  });
});
