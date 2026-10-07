import { describe, expect, it } from 'vitest';

import {
  availabilityQueryKey,
  availabilityQueryOf,
  diffYearAvailability,
  expandYearSpec,
  formatYearList,
  inheritedExclusionYears,
  resolveLedgerYears,
} from '../estat-availability';
import { rewriteYearsBlock, yearSpecOf } from '../../scripts/sync-estat-years';

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

  it('同じ条件でも市区町村の行は県の行と別のキーになる (同じ表に県と市区町村の数を混ぜない)', () => {
    const query = { cdCat01: 'A1101' };
    expect(availabilityQueryKey(query, 'city')).not.toBe(availabilityQueryKey(query));
    expect(availabilityQueryKey(query, 'prefecture')).toBe(availabilityQueryKey(query));
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

describe('台帳から years を決める規則', () => {
  it('全県の値がある年は除外に無ければ足し、除外に書いた年は years にあっても外す', () => {
    const resolved = resolveLedgerYears({
      configYears: [2009, 2010, 2024],
      ledgerYears: ALL_47(2009, 2024),
      excludedYears: [2010, 2011],
    });
    expect(resolved.years).toEqual([2009, ...Array.from({ length: 12 }, (_, i) => 2012 + i), 2024]);
    expect(resolved.removed).toEqual([2010]);
  });

  it('一部の県だけの年は足しも外しもしない (載せるかは人が決める)', () => {
    const resolved = resolveLedgerYears({
      configYears: [1977, 1978],
      ledgerYears: { '1976': 1, '1977': 30, '1978': 47 },
    });
    expect(resolved.years).toEqual([1977, 1978]);
  });

  it('値の無い年は既定では残し (e-Stat の一時的な欠けで配信中の年を消さない)、removeMissing のときだけ外す。補完元の年は外さない', () => {
    const base = { configYears: [2019, 2020, 2021], ledgerYears: ALL_47(2019, 2019), suppliedYears: [2021] };
    expect(resolveLedgerYears(base).years).toEqual([2019, 2020, 2021]);
    const removed = resolveLedgerYears({ ...base, removeMissing: true });
    expect(removed.years).toEqual([2019, 2021]);
    expect(removed.removed).toEqual([2020]);
  });
});

describe('移行で除外として引き継ぐ年', () => {
  it('1 年だけの設定の古い年は引き継がない (最新年だけに絞った誤りとして年を足す)', () => {
    expect(inheritedExclusionYears([2021], ALL_47(1996, 2021))).toEqual([]);
  });

  it('複数年の設定で最初の年より前の年は、基準の切り替えで外した可能性があるので引き継ぐ', () => {
    expect(inheritedExclusionYears([2000, 2001, 2024], ALL_47(1998, 2024))).toEqual([1998, 1999]);
  });

  it('e-Stat に無い年は設定の形の根拠にしない (人口増減率: 設定の国勢調査年が無く 2024 年だけが残るなら 1 年の設定と同じ)', () => {
    expect(inheritedExclusionYears([1985, 1990, 1995, 2000, 2024], ALL_47(2021, 2024))).toEqual([]);
  });

  it('穴は引き継がずに埋めるが、5 年おきに揃えた設定の間の年は引き継ぐ', () => {
    expect(inheritedExclusionYears([2009, 2010, 2024], ALL_47(2009, 2024))).toEqual([]);
    expect(inheritedExclusionYears([2005, 2010, 2015, 2020, 2023], ALL_47(2005, 2024))).toEqual([
      2006, 2007, 2008, 2009, 2011, 2012, 2013, 2014, 2016, 2017, 2018, 2019, 2021, 2022,
    ]);
  });
});

describe('metric の TS ファイルの years の書き換え', () => {
  const generated = [
    'export const m: MetricConfig = {',
    '  "key": "m",',
    '  "years": {',
    '    "years": [',
    '      2009,',
    '      2024,',
    '    ],',
    '  },',
    '  "yearFormat": "fiscal",',
    '};',
    '',
  ].join('\n');

  it('years だけを置き換え、除外はその直後に置き、ほかのプロパティは触らない', () => {
    const out = rewriteYearsBlock(generated, { from: 2009, to: 2024 }, [{ years: [2001], reason: 'r' }]);
    expect(out).toContain('  "years": {\n    "from": 2009,\n    "to": 2024,\n  },\n  "yearExclusions": [');
    expect(out.startsWith('export const m: MetricConfig = {\n  "key": "m",\n')).toBe(true);
    expect(out.endsWith('  "yearFormat": "fiscal",\n};\n')).toBe(true);
  });

  it('手書きのファイル (キーに引用符なし) は書き方を合わせ、除外が空になったら消す', () => {
    const handwritten = 'const m = {\n  key: "m",\n  years: { from: 2020, to: 2024 },\n  yearExclusions: [{ years: [2019], reason: "r" }],\n  unit: "人",\n};\n';
    const out = rewriteYearsBlock(handwritten, { from: 2019, to: 2024 }, []);
    expect(out).toBe('const m = {\n  key: "m",\n  years: {\n    from: 2019,\n    to: 2024,\n  },\n  unit: "人",\n};\n');
  });

  it('続いた年は範囲、飛びがあれば列挙で書く', () => {
    expect(yearSpecOf([2019, 2020, 2021])).toEqual({ from: 2019, to: 2021 });
    expect(yearSpecOf([2015, 2020])).toEqual({ years: [2015, 2020] });
  });
});
