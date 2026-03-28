import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  FURUSATO_NOZEI_GENRE_ID,
  PREF_TO_TRAVEL_MIDDLE_CLASS,
  searchRakutenItems,
  searchFurusatoItems,
} from "../rakuten-api";

describe("FURUSATO_NOZEI_GENRE_ID", () => {
  it("ふるさと納税ジャンル ID が定義されている", () => {
    expect(FURUSATO_NOZEI_GENRE_ID).toBe("553283");
  });
});

describe("PREF_TO_TRAVEL_MIDDLE_CLASS", () => {
  it("47都道府県分のマッピングが存在する", () => {
    expect(Object.keys(PREF_TO_TRAVEL_MIDDLE_CLASS)).toHaveLength(47);
  });

  it("北海道のコードが正しい", () => {
    expect(PREF_TO_TRAVEL_MIDDLE_CLASS["01"]).toBe("hokkaido");
  });

  it("東京のコードが正しい", () => {
    expect(PREF_TO_TRAVEL_MIDDLE_CLASS["13"]).toBe("tokyo");
  });

  it("沖縄のコードが正しい", () => {
    expect(PREF_TO_TRAVEL_MIDDLE_CLASS["47"]).toBe("okinawa");
  });
});

describe("searchRakutenItems", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("RAKUTEN_APP_ID が未設定の場合に空配列を返す", async () => {
    delete process.env.RAKUTEN_APP_ID;
    const result = await searchRakutenItems({ keyword: "test" });
    expect(result).toEqual([]);
  });

  it("fetch エラー時に空配列を返す", async () => {
    process.env.RAKUTEN_APP_ID = "test-id";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const result = await searchRakutenItems({ keyword: "test" });
    expect(result).toEqual([]);
  });

  it("fetch が非 OK レスポンスを返した場合に空配列を返す", async () => {
    process.env.RAKUTEN_APP_ID = "test-id";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const result = await searchRakutenItems({ keyword: "test" });
    expect(result).toEqual([]);
  });

  it("正常レスポンスから Items を返す", async () => {
    process.env.RAKUTEN_APP_ID = "test-id";
    const mockItems = [{ itemName: "テスト商品", itemPrice: 1000 }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Items: mockItems }),
    }));

    const result = await searchRakutenItems({ keyword: "test" });
    expect(result).toEqual(mockItems);
  });
});

describe("searchFurusatoItems", () => {
  it("RAKUTEN_APP_ID が未設定の場合に空配列を返す", async () => {
    delete process.env.RAKUTEN_APP_ID;
    const result = await searchFurusatoItems("東京都");
    expect(result).toEqual([]);
  });
});
