import { describe, expect, it } from 'vitest';

import {
  availabilityQueryKey,
  availabilityQueryOf,
  diffYearAvailability,
  expandYearSpec,
  formatYearList,
  yearExclusionProblems,
  resolveCityLedgerYears,
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

describe('市区町村だけの metric の years を市区町村の台帳から決める規則', () => {
  it('設定の最新年より新しく、値のある市区町村が 9 割以上ある年を足す (財政力指数の 2022 年度)', () => {
    const resolved = resolveCityLedgerYears({
      configYears: [2020, 2021],
      ledgerYears: { '2020': 1718, '2021': 1718, '2022': 1718 },
    });
    expect(resolved.years).toEqual([2020, 2021, 2022]);
    expect(resolved.added).toEqual([2022]);
  });

  it('値のある市区町村が大きく減った年は足さない (取りこぼしや途中の公表を配信しない)', () => {
    const resolved = resolveCityLedgerYears({
      configYears: [2021],
      ledgerYears: { '2021': 1718, '2022': 900 },
    });
    expect(resolved.added).toEqual([]);
  });

  it('古い年は足さず、年を外すこともしない (合併で古い年ほど市区町村が少ない)', () => {
    const resolved = resolveCityLedgerYears({
      configYears: [2015, 2021],
      ledgerYears: { '2010': 1718, '2015': 0, '2021': 1718 },
    });
    expect(resolved.years).toEqual([2015, 2021]);
    expect(resolved.removed).toEqual([]);
  });

  it('除外に書いた年は足さない', () => {
    const resolved = resolveCityLedgerYears({
      configYears: [2021],
      ledgerYears: { '2021': 1718, '2022': 1718 },
      excludedYears: [2022],
    });
    expect(resolved.added).toEqual([]);
  });
});

// 2026-10-30 オーナー決定「利用できるデータは全て利用する」: 移行時の未判断の除外が 421 指標・延べ 3,563 年を隠していた。
// 外してよいのは理由の種類 (kind) と理由がある除外だけ
describe('年の除外の書き方', () => {
  it('理由の種類と理由がそろった除外は通す', () => {
    expect(
      yearExclusionProblems([{ years: [2015], kind: 'series-break', reason: '2016 年に調査の対象が変わり同じ系列として比べられない' }])
    ).toEqual([]);
  });
  it('理由の種類が無い・語彙外の除外は止める', () => {
    expect(yearExclusionProblems([{ years: [2015], reason: '2016 年に調査の対象が変わり同じ系列として比べられない' }])).toHaveLength(1);
    expect(yearExclusionProblems([{ years: [2015], kind: 'just-in-case', reason: '2016 年に調査の対象が変わり同じ系列として比べられない' }])).toHaveLength(1);
  });
  it('判断していない除外は種類があっても止める', () => {
    expect(
      yearExclusionProblems([
        { years: [2015], kind: 'series-break', reason: '2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない)' },
      ])
    ).toHaveLength(1);
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
    const out = rewriteYearsBlock(generated, { from: 2009, to: 2024 }, [{ years: [2001], kind: 'series-break', reason: 'r' }]);
    expect(out).toContain('  "years": {\n    "from": 2009,\n    "to": 2024,\n  },\n  "yearExclusions": [');
    expect(out.startsWith('export const m: MetricConfig = {\n  "key": "m",\n')).toBe(true);
    expect(out.endsWith('  "yearFormat": "fiscal",\n};\n')).toBe(true);
  });

  it('手書きのファイル (キーに引用符なし) は書き方を合わせ、除外が空になったら消す', () => {
    const handwritten = 'const m = {\n  key: "m",\n  years: { from: 2020, to: 2024 },\n  yearExclusions: [{ years: [2019], kind: "series-break", reason: "r" }],\n  unit: "人",\n};\n';
    const out = rewriteYearsBlock(handwritten, { from: 2019, to: 2024 }, []);
    expect(out).toBe('const m = {\n  key: "m",\n  years: {\n    from: 2019,\n    to: 2024,\n  },\n  unit: "人",\n};\n');
  });

  it('続いた年は範囲、飛びがあれば列挙で書く', () => {
    expect(yearSpecOf([2019, 2020, 2021])).toEqual({ from: 2019, to: 2021 });
    expect(yearSpecOf([2015, 2020])).toEqual({ years: [2015, 2020] });
  });
});
