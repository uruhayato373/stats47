import { describe, expect, it } from "vitest";

import {
  assertPublishedTotals,
  buildCityRows,
  joinToMunicipalities,
  parseWaitingRows,
  tally,
  waitingRate,
  type MunicipalityRef,
  type SheetRows,
} from "../../scripts/lib/childcare-waiting-rate";

const sheet = (rows: Record<number, Record<string, string>>): SheetRows =>
  new Map(Object.entries(rows).map(([r, cells]) => [Number(r), new Map(Object.entries(cells))]));

// 実物と同じ並び: 合計の 申込者数(E)・待機児童(P) が、年齢別の同名列(Q 以降)より左にある
const header = { C: "都道府県", D: "市区町村", E: "申込者数", P: "待機児童", Q: "申込者数", AB: "待機児童" };

describe("parseWaitingRows", () => {
  it("年齢別の同名列ではなく、いちばん左(合計)の申込者数と待機児童を読む", () => {
    const rows = parseWaitingRows(
      sheet({
        8: header,
        10: { C: "北海道", D: "札幌市", E: "34262", P: "0", Q: "999", AB: "999" },
        11: { C: "東京都", D: "三宅村", E: "49", P: "12", Q: "999", AB: "999" },
      }),
    );
    expect(rows).toEqual([
      { prefecture: "北海道", municipality: "札幌市", applicants: 34262, waiting: 0 },
      { prefecture: "東京都", municipality: "三宅村", applicants: 49, waiting: 12 },
    ]);
  });

  it("見出しが無い・数値でない行は黙って捨てず例外にする", () => {
    expect(() => parseWaitingRows(sheet({ 1: { A: "x" } }))).toThrow(/見出し行/);
    expect(() => parseWaitingRows(sheet({ 8: header, 10: { C: "北海道", D: "札幌市", E: "-", P: "0" } }))).toThrow(/数値でない/);
  });
});

const refs: MunicipalityRef[] = [
  { code: "01100", name: "北海道 札幌市", prefectureName: "北海道" },
  { code: "13101", name: "東京都 特別区部 千代田区", prefectureName: "東京都" },
  { code: "39402", name: "高知県 檮原町", prefectureName: "高知県" },
];

describe("joinToMunicipalities", () => {
  const rows = [
    { prefecture: "北海道", municipality: "札幌市", applicants: 100, waiting: 1 },
    { prefecture: "東京都", municipality: "千代田区", applicants: 50, waiting: 0 },
    // 公表資料は「梼原町」、マスタは「檮原町」
    { prefecture: "高知県", municipality: "梼原町", applicants: 69, waiting: 0 },
  ];

  it("県名＋市区町村名(末尾の語)で結合し、梼原町の表記ゆれだけ別名で救う", () => {
    expect(joinToMunicipalities(rows, refs).joined.map((j) => j.code)).toEqual(["01100", "13101", "39402"]);
  });

  it("結合できない行・資料に無い自治体・資料側の重複は止める", () => {
    expect(() => joinToMunicipalities([...rows, { prefecture: "北海道", municipality: "存在しない町", applicants: 1, waiting: 0 }], refs)).toThrow(/結合できない/);
    expect(() => joinToMunicipalities(rows.slice(0, 2), refs)).toThrow(/資料に行が無い/);
    expect(() => joinToMunicipalities([...rows, rows[0]], refs)).toThrow(/重複/);
  });
});

describe("検算と率", () => {
  it("公表値(自治体数・待機児童のいる自治体・合計)がずれたら止める", () => {
    const t = tally([
      { applicants: 10, waiting: 2 },
      { applicants: 0, waiting: 0 },
      { applicants: 5, waiting: 0 },
    ]);
    expect(t).toMatchObject({ municipalityCount: 3, waitingMunicipalityCount: 1, waitingTotal: 2, zeroWaitingCount: 2, noApplicantsCount: 1 });
    expect(() => assertPublishedTotals(t, { municipalityCount: 3, waitingMunicipalityCount: 1, waitingTotal: 2 })).not.toThrow();
    expect(() => assertPublishedTotals(t, { municipalityCount: 3, waitingMunicipalityCount: 1, waitingTotal: 3 })).toThrow(/待機児童の合計/);
  });

  it("率は％で小数4桁、申込者0は定義できず null", () => {
    expect(waitingRate(12, 49)).toBe(24.4898);
    expect(waitingRate(0, 100)).toBe(0);
    expect(waitingRate(0, 0)).toBeNull();
  });
});

describe("buildCityRows", () => {
  it("順位は値が正の自治体にだけ、同値は同順位。0 は順位なし、申込者0は値なし", () => {
    const rows = buildCityRows(
      [
        { code: "01100", name: "A", applicants: 100, waiting: 5 },
        { code: "01101", name: "B", applicants: 200, waiting: 10 },
        { code: "01102", name: "C", applicants: 100, waiting: 20 },
        { code: "01103", name: "D", applicants: 100, waiting: 0 },
        { code: "01104", name: "E", applicants: 0, waiting: 0 },
      ],
      { year: 2025, unit: "％" },
    );
    const by = Object.fromEntries(rows.map((r) => [r.areaName, r]));
    expect([by.C.rank, by.A.rank, by.B.rank]).toEqual([1, 2, 2]);
    expect(by.D).toMatchObject({ value: 0, rank: null });
    expect(by.E).toMatchObject({ value: null, rank: null });
    expect(by.A).toMatchObject({ yearCode: "2025", yearName: "2025年度", unit: "％", prefectureCode: "01" });
  });
});
