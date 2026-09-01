import { describe, expect, it } from 'vitest';

import { binMunicipalityValues } from '../bin-municipality-values';

function makeRows(values: number[], prefectureCode = '01000') {
  return values.map((value, index) => ({
    areaCode: String(10000 + index),
    areaName: `自治体${index}`,
    prefectureCode,
    value,
    rank: index + 1,
  }));
}

describe('binMunicipalityValues', () => {
  it('ビンの合計が総件数と一致し、min/median/maxがpage.tsxと同じ定義で出る', () => {
    const rows = makeRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const dist = binMunicipalityValues(rows);
    expect(dist).not.toBeNull();
    const sum = dist!.bins.reduce((acc, bin) => acc + bin.count, 0);
    expect(sum).toBe(10);
    expect(dist!.min).toBe(1);
    expect(dist!.max).toBe(10);
    // 下側中央値 (偶数件は下側): sorted[floor((10-1)/2)] = sorted[4] = 5
    expect(dist!.median).toBe(5);
    // 整数データセットは precision 0、小数を含むと桁が付く (表示揃えの入力)
    expect(dist!.precision).toBe(0);
    expect(binMunicipalityValues(makeRows([1.5, 2, 3]))!.precision).toBeGreaterThan(0);
  });

  it('強い右歪みではoverflowビンに裾を畳み、本体の分布が潰れない', () => {
    // 98% は 100 前後、1 件だけ 1,000,000 (総人口型の歪み)
    const body = Array.from({ length: 99 }, (_, i) => i + 1);
    const rows = makeRows([...body, 1_000_000]);
    const dist = binMunicipalityValues(rows)!;
    const overflow = dist.bins[dist.bins.length - 1];
    expect(overflow.isOverflow).toBe(true);
    expect(overflow.count).toBeGreaterThanOrEqual(1);
    // 本体側 (非overflow) に 2 つ以上のビンへ分散している
    const populatedBody = dist.bins.filter(
      (bin) => !bin.isOverflow && bin.count > 0
    );
    expect(populatedBody.length).toBeGreaterThan(2);
    const sum = dist.bins.reduce((acc, bin) => acc + bin.count, 0);
    expect(sum).toBe(100);
  });

  it('裾が短い一様分布ではoverflow/underflowビンを作らない', () => {
    const rows = makeRows(Array.from({ length: 100 }, (_, i) => i));
    const dist = binMunicipalityValues(rows)!;
    expect(dist.bins.every((bin) => !bin.isOverflow && !bin.isUnderflow)).toBe(
      true
    );
    const sum = dist.bins.reduce((acc, bin) => acc + bin.count, 0);
    expect(sum).toBe(100);
  });

  it('強い左歪み (転入超過率型) ではunderflowビンに左裾を畳む', () => {
    // 本体は 1〜99、1 件だけ -1,000,000 の外れ値
    const body = Array.from({ length: 99 }, (_, i) => i + 1);
    const rows = makeRows([-1_000_000, ...body]);
    const dist = binMunicipalityValues(rows)!;
    const underflow = dist.bins[0];
    expect(underflow.isUnderflow).toBe(true);
    expect(underflow.count).toBeGreaterThanOrEqual(1);
    const populatedBody = dist.bins.filter(
      (bin) => !bin.isUnderflow && !bin.isOverflow && bin.count > 0
    );
    expect(populatedBody.length).toBeGreaterThan(2);
    const sum = dist.bins.reduce((acc, bin) => acc + bin.count, 0);
    expect(sum).toBe(100);
  });

  it('県オーバーレイ: countInPrefの合計 = その県の行数、prefValuesも一致する', () => {
    const rows = [
      ...makeRows([1, 2, 3, 4, 5], '01000'),
      ...makeRows([6, 7, 8], '02000'),
    ];
    const dist = binMunicipalityValues(rows, { prefectureCode: '02000' })!;
    const prefSum = dist.bins.reduce((acc, bin) => acc + bin.countInPref, 0);
    expect(prefSum).toBe(3);
    expect(dist.prefTotal).toBe(3);
    expect(dist.prefValues.sort((a, b) => a - b)).toEqual([6, 7, 8]);
  });

  it('境界値: max がちょうど最終ビンに入り、負値も min から数える', () => {
    const rows = makeRows([-10, -5, 0, 5, 10]);
    const dist = binMunicipalityValues(rows, { binCount: 4 })!;
    const sum = dist.bins.reduce((acc, bin) => acc + bin.count, 0);
    expect(sum).toBe(5);
    expect(dist.bins[0].x0).toBe(-10);
    // max=10 が取りこぼされない
    const last = dist.bins[dist.bins.length - 1];
    expect(last.count).toBeGreaterThanOrEqual(1);
  });

  it('全件同値は1ビンに畳む / 空入力はnull', () => {
    const same = binMunicipalityValues(makeRows([7, 7, 7]))!;
    expect(same.bins).toHaveLength(1);
    expect(same.bins[0].count).toBe(3);
    expect(binMunicipalityValues([])).toBeNull();
  });
});
