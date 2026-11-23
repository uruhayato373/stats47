import { NATIONAL_AREA_CODE } from '@stats47/area';
import { describe, expect, it } from 'vitest';

import { calculateMatchedPearsonR } from '../utils/calculate-pearson';
import { AREA_CODES, buildYearSeries, latestCommonYear, pairedPearsonR, ranksOf } from '../utils/year-slices';

const row = (year: string, i: number, value: number | null) => ({ areaCode: AREA_CODES[i], yearCode: year, value });
const yearRows = (year: string, fn: (i: number) => number | null, n = 47) =>
  AREA_CODES.slice(0, n).map((_, i) => row(year, i, fn(i)));
const all = () => true;

describe('buildYearSeries', () => {
  it('年ごとに県の並びの配列を作り、値のある県が足りない年と範囲外の年と全国の行を捨てる', () => {
    const series = buildYearSeries(
      [
        ...yearRows('2020', (i) => i),
        ...yearRows('2021', (i) => (i < 10 ? i : null)), // 10 県だけ → 落とす
        ...yearRows('2019', (i) => i * 2),
        { areaCode: NATIONAL_AREA_CODE, yearCode: '2020', value: 999 },
      ],
      (y) => y !== '2019',
      30
    );
    expect(series.years).toEqual(['2020']);
    const slice = series.slices.get('2020')!;
    expect(slice.count).toBe(47);
    expect(Array.from(slice.values).includes(999)).toBe(false);
  });
});

describe('pairedPearsonR', () => {
  it('行と Map で照合する calculateMatchedPearsonR と同じ r と件数を返す (欠けた県を飛ばす)', () => {
    const xs = AREA_CODES.map((_, i) => (i % 5 === 0 ? NaN : (i * 7) % 13));
    const ys = AREA_CODES.map((_, i) => (i % 7 === 0 ? NaN : i + ((i * 3) % 5)));
    const xRows = xs.flatMap((v, i) => (Number.isNaN(v) ? [] : [{ areaCode: AREA_CODES[i], value: v }]));
    const yMap = new Map(ys.flatMap((v, i) => (Number.isNaN(v) ? [] : [[AREA_CODES[i], v] as const])));
    const expected = calculateMatchedPearsonR(xRows, yMap);
    const actual = pairedPearsonR(Float64Array.from(xs), Float64Array.from(ys));
    expect(actual.count).toBe(expected.count);
    expect(actual.r).toBeCloseTo(expected.r, 12);
  });
});

describe('ranksOf', () => {
  it('値のある県だけで平均順位を付け、値の無い県は NaN のまま', () => {
    const series = buildYearSeries(yearRows('2020', (i) => (i === 3 ? null : i < 2 ? 5 : i)), all, 30);
    const ranks = ranksOf(series.slices.get('2020')!);
    expect(ranks[0]).toBe(ranks[1]); // 同値は同じ順位
    expect(Number.isNaN(ranks[3])).toBe(true);
    expect(Math.max(...Array.from(ranks).filter((v) => !Number.isNaN(v)))).toBe(46);
  });
});

describe('latestCommonYear', () => {
  it('年の違う最新年どうしを組まず、両方に値のある最新の共通年で計算する (農業産出額 2024 年 × 農業就業人口 2014 年の再発防止)', () => {
    const x = buildYearSeries([...yearRows('2024', (i) => 47 - i), ...yearRows('2014', (i) => i)], all, 30);
    const y = buildYearSeries([...yearRows('2014', (i) => i * 2 + 1)], all, 30);
    const common = latestCommonYear(x, y, 30);
    expect(common?.year).toBe('2014');
    // 2014 年どうしなら完全な正の相関。2024 年の x と組むと負になる
    expect(common?.matched.r).toBeCloseTo(1, 12);
  });

  it('共通年が無ければ出さず、共通年でも両方に値のある県が足りなければ次の年へ進む', () => {
    const x = buildYearSeries([...yearRows('2020', (i) => i), ...yearRows('2015', (i) => i)], all, 30);
    const onlyOther = buildYearSeries(yearRows('2010', (i) => i), all, 30);
    expect(latestCommonYear(x, onlyOther, 30)).toBeNull();
    const sparse2020 = buildYearSeries(
      [...yearRows('2020', (i) => (i < 30 ? null : i)), ...yearRows('2015', (i) => i * 3)],
      all,
      10
    );
    expect(latestCommonYear(x, sparse2020, 30)?.year).toBe('2015');
  });
});
