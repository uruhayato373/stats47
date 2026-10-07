import { describe, expect, it } from 'vitest';

import {
  availabilityQueryKey,
  availabilityQueryOf,
  diffYearAvailability,
  expandYearSpec,
  formatYearList,
} from '../estat-availability';

const ALL_47 = (from: number, to: number) =>
  Object.fromEntries(Array.from({ length: to - from + 1 }, (_, i) => [String(from + i), 47]));

describe('台帳の取り出し条件', () => {
  it('表示用の名前・出典 URL・単位換算は条件に入れない (同じ取り出しを別の行にしない)', () => {
    const a = availabilityQueryOf({
      kind: 'estat',
      statsDataId: '0000010207',
      cdCat01: '#G04308',
      displayName: '社会・人口統計体系',
      url: 'https://example.invalid',
      valueScale: 0.1,
    });
    const b = availabilityQueryOf({ kind: 'estat', statsDataId: '0000010207', cdCat01: '#G04308' });
    expect(a).toEqual({ cdCat01: '#G04308' });
    expect(availabilityQueryKey(a)).toBe(availabilityQueryKey(b));
  });

  it('取り込みの値を変える条件 (軸・tab・合算・年計) は条件に残し、違えば別の行になる', () => {
    const summed = availabilityQueryOf({
      kind: 'estat',
      statsDataId: '0003348235',
      axisSum: { axis: 'cat01', codes: ['1', '2'] },
      timeScope: 'annual',
    });
    expect(summed).toEqual({ axisSum: { axis: 'cat01', codes: ['1', '2'] }, timeScope: 'annual' });
    const plain = availabilityQueryOf({ kind: 'estat', statsDataId: '0003348235' });
    expect(availabilityQueryKey(summed)).not.toBe(availabilityQueryKey(plain));
  });

  it('キーの書き順が違っても同じ条件は同じキーになる', () => {
    expect(availabilityQueryKey({ cdTab: '01', cdCat01: 'A' })).toBe(
      availabilityQueryKey({ cdCat01: 'A', cdTab: '01' }),
    );
  });
});

describe('years の展開', () => {
  it('範囲と列挙を 4 桁の年にし、フルタイムコードも 4 桁へ寄せる', () => {
    expect(expandYearSpec({ from: 2009, to: 2011 })).toEqual([2009, 2010, 2011]);
    expect(expandYearSpec({ years: [2024, 2009100000, 2010] })).toEqual([2009, 2010, 2024]);
  });

  it("'all' は許可リストが無いので比べない", () => {
    expect(expandYearSpec('all')).toBeNull();
  });
});

describe('設定の年と台帳の差分', () => {
  it('客室稼働率: e-Stat に 2009〜2024 年があるのに設定が 2009〜2014・2024 年なら、間の 9 年を取り込み忘れにする', () => {
    const diff = diffYearAvailability({
      configYears: [2009, 2010, 2011, 2012, 2013, 2014, 2024],
      ledgerYears: ALL_47(2009, 2024),
    });
    expect(diff.missingInside).toEqual([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]);
    expect(diff.newer).toEqual([]);
    expect(diff.older).toEqual([]);
    expect(diff.notInEstat).toEqual([]);
  });

  it('最後の年より後は新しい年、最初の年より前は範囲より前として取り込み忘れと分ける', () => {
    const diff = diffYearAvailability({ configYears: [2015, 2016], ledgerYears: ALL_47(2013, 2018) });
    expect(diff.missingInside).toEqual([]);
    expect(diff.newer).toEqual([2017, 2018]);
    expect(diff.older).toEqual([2013, 2014]);
  });

  it('設定にあるのに 1 県も値が無い年は e-Stat に無い年。補完元から入れる年は除く', () => {
    const diff = diffYearAvailability({
      configYears: [2018, 2019, 2020, 2021],
      ledgerYears: ALL_47(2018, 2019),
      suppliedYears: [2021],
    });
    expect(diff.notInEstat).toEqual([2020]);
  });

  it('一部の県だけの年は取り込み忘れにしない (全年を足すかどうかは人が決める)', () => {
    const diff = diffYearAvailability({
      configYears: [1975, 1978],
      ledgerYears: { '1975': 47, '1976': 1, '1977': 30, '1978': 47 },
    });
    expect(diff.missingInside).toEqual([]);
    expect(diff.partial).toEqual({ '1976': 1, '1977': 30 });
  });

  it('47 県がそろわない統計 (港湾など) は、最も多く値が出た年の県の数を全県とみなす', () => {
    const diff = diffYearAvailability({
      configYears: [2020, 2022],
      ledgerYears: { '2020': 39, '2021': 39, '2022': 39, '2023': 38 },
    });
    expect(diff.missingInside).toEqual([2021]);
    expect(diff.partial).toEqual({ '2023': 38 });
  });
});

describe('年の一覧の表示', () => {
  it('続いた年はまとめ、飛んだ年は区切る', () => {
    expect(formatYearList([2024, 2009, 2010, 2011, 2015])).toBe('2009–2011, 2015, 2024');
    expect(formatYearList([])).toBe('');
  });
});
