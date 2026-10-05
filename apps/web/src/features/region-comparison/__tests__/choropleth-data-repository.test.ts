import { describe, expect, it } from "vitest";

import { PREF_CODE_TO_ROMAJI } from "../repositories/choropleth-data-repository";

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
