import { describe, expect, it } from "vitest";

import { areaCodeToPrefCode, PREF_CODE_TO_ROMAJI } from "../repositories/choropleth-data-repository";

describe("areaCodeToPrefCode", () => {
  it("5桁エリアコードから先頭2桁を抽出する", () => {
    expect(areaCodeToPrefCode("13000")).toBe("13");
    expect(areaCodeToPrefCode("01000")).toBe("01");
    expect(areaCodeToPrefCode("47000")).toBe("47");
  });

  it("市区町村コードでも先頭2桁を返す", () => {
    expect(areaCodeToPrefCode("13101")).toBe("13");
    expect(areaCodeToPrefCode("27128")).toBe("27");
  });
});

describe("PREF_CODE_TO_ROMAJI", () => {
  it("全47都道府県のマッピングが存在する", () => {
    for (let i = 1; i <= 47; i++) {
      const code = String(i).padStart(2, "0");
      expect(PREF_CODE_TO_ROMAJI[code], `コード ${code} のマッピングがない`).toBeTruthy();
    }
  });

  it("代表的なマッピングが正しい", () => {
    expect(PREF_CODE_TO_ROMAJI["01"]).toBe("hokkaido");
    expect(PREF_CODE_TO_ROMAJI["13"]).toBe("tokyo");
    expect(PREF_CODE_TO_ROMAJI["27"]).toBe("osaka");
    expect(PREF_CODE_TO_ROMAJI["47"]).toBe("okinawa");
  });

  it("存在しないコードは undefined を返す", () => {
    expect(PREF_CODE_TO_ROMAJI["00"]).toBeUndefined();
    expect(PREF_CODE_TO_ROMAJI["48"]).toBeUndefined();
    expect(PREF_CODE_TO_ROMAJI["99"]).toBeUndefined();
  });
});
