import { describe, expect, it } from "vitest";
import { fetchPrefectures } from "../../repositories/fetch-prefectures";
import {
  NATIONAL_AREA_CODE,
  NATIONAL_OR_PREFECTURE_AREA_CODE_RE,
  PREFECTURE_AREA_CODE_RE,
  PREFECTURE_AREA_CODES,
  PREFECTURE_CODE_2DIGIT_RE,
} from "../prefecture-codes";
import { NATIONAL_AREA } from "../national";

describe("PREFECTURE_AREA_CODES", () => {
  it("47 都道府県の 5 桁コードをコード順に重複なく持つ", () => {
    expect(PREFECTURE_AREA_CODES).toHaveLength(47);
    expect(new Set(PREFECTURE_AREA_CODES).size).toBe(47);
    expect([...PREFECTURE_AREA_CODES].sort()).toEqual(PREFECTURE_AREA_CODES);
    expect(PREFECTURE_AREA_CODES[0]).toBe("01000");
    expect(PREFECTURE_AREA_CODES[46]).toBe("47000");
  });
});

describe("都道府県コードの正規表現", () => {
  it("5 桁版は 01000〜47000 だけを通し、全国と範囲外を弾く", () => {
    expect(PREFECTURE_AREA_CODES.every((code) => PREFECTURE_AREA_CODE_RE.test(code))).toBe(true);
    for (const code of ["00000", "48000", "13101", "1300", "130000"]) {
      expect(PREFECTURE_AREA_CODE_RE.test(code)).toBe(false);
    }
  });

  it("全国込みの 5 桁版は 00000 も通す", () => {
    expect(NATIONAL_OR_PREFECTURE_AREA_CODE_RE.test(NATIONAL_AREA_CODE)).toBe(true);
    expect(PREFECTURE_AREA_CODES.every((code) => NATIONAL_OR_PREFECTURE_AREA_CODE_RE.test(code))).toBe(true);
    expect(NATIONAL_OR_PREFECTURE_AREA_CODE_RE.test("48000")).toBe(false);
  });

  it("2 桁版は 01〜47 だけを通す", () => {
    expect(PREFECTURE_CODE_2DIGIT_RE.test("01")).toBe(true);
    expect(PREFECTURE_CODE_2DIGIT_RE.test("47")).toBe(true);
    for (const code of ["00", "48", "1", "13000"]) {
      expect(PREFECTURE_CODE_2DIGIT_RE.test(code)).toBe(false);
    }
  });
});

describe("NATIONAL_AREA_CODE", () => {
  it("NATIONAL_AREA の areaCode と同じ値である", () => {
    expect(NATIONAL_AREA.areaCode).toBe(NATIONAL_AREA_CODE);
  });
});

describe("prefectures.json の romaji", () => {
  // 楽天のエリア slug・楽天トラベルの middleClassCode・IPSS のファイル名がこの値をそのまま URL / パスに使う
  it("47 件すべてが小文字英字のみで重複しない", () => {
    const romaji = fetchPrefectures().map((p) => p.romaji);
    expect(romaji).toHaveLength(47);
    expect(romaji.every((value) => /^[a-z]+$/.test(value))).toBe(true);
    expect(new Set(romaji).size).toBe(47);
  });

  it("代表的な県の表記が URL で使われている綴りと一致する", () => {
    const byCode = new Map(fetchPrefectures().map((p) => [p.prefCode, p.romaji]));
    expect(byCode.get("01000")).toBe("hokkaido");
    expect(byCode.get("13000")).toBe("tokyo");
    expect(byCode.get("26000")).toBe("kyoto");
    expect(byCode.get("39000")).toBe("kochi");
    expect(byCode.get("47000")).toBe("okinawa");
  });
});
