import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  FURUSATO_NOZEI_GENRE_ID,
  PREF_TO_TRAVEL_MIDDLE_CLASS,
  RAKUTEN_ITEM_SEARCH_ENDPOINT,
  normalizeRakutenItems,
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

/**
 * ★2026-08-04: 新 Rakuten Developers ポータル (openapi.rakuten.co.jp) へ移行した。
 *   実機プローブで確定した差分をここで固定する。
 *   - applicationId と accessKey の **両方必須** (片方だけなら呼ばない)
 *   - accessKey は**ヘッダ** (`X-Access-Key` は認識されない)
 *   - 応答は `Items` (大文字) / formatVersion=2 で要素はフラット
 *   - 画像は **string[]** で返る。コンポーネントは `{imageUrl}` を読むため正規化が要る
 */
describe("normalizeRakutenItems", () => {
  it("新 API の string[] 画像を {imageUrl}[] に正規化する", () => {
    const [item] = normalizeRakutenItems({
      Items: [
        {
          itemName: "納豆セット",
          itemPrice: 14000,
          itemUrl: "https://item.rakuten.co.jp/x",
          mediumImageUrls: ["https://img/m.jpg"],
          smallImageUrls: ["https://img/s.jpg"],
        },
      ],
    });
    expect(item.mediumImageUrls).toEqual([{ imageUrl: "https://img/m.jpg" }]);
    expect(item.smallImageUrls).toEqual([{ imageUrl: "https://img/s.jpg" }]);
  });

  it("旧形式の {imageUrl}[] もそのまま受ける", () => {
    const [item] = normalizeRakutenItems({
      Items: [{ itemName: "x", mediumImageUrls: [{ imageUrl: "https://img/old.jpg" }] }],
    });
    expect(item.mediumImageUrls).toEqual([{ imageUrl: "https://img/old.jpg" }]);
  });

  it("要素が {Item:{...}} でラップされていてもアンラップする", () => {
    const [item] = normalizeRakutenItems({
      Items: [{ Item: { itemName: "ラップされた商品", itemPrice: 500 } }],
    });
    expect(item.itemName).toBe("ラップされた商品");
    expect(item.itemPrice).toBe(500);
  });

  it("配列キーが小文字 items でも受ける", () => {
    expect(normalizeRakutenItems({ items: [{ itemName: "a" }] })).toHaveLength(1);
  });

  it("配列が無ければ空配列", () => {
    expect(normalizeRakutenItems({})).toEqual([]);
    expect(normalizeRakutenItems(null)).toEqual([]);
    expect(normalizeRakutenItems({ Items: "not-an-array" })).toEqual([]);
  });

  it("画像が空・欠落でも落ちない", () => {
    const [item] = normalizeRakutenItems({ Items: [{ itemName: "画像なし" }] });
    expect(item.mediumImageUrls).toEqual([]);
    expect(item.smallImageUrls).toEqual([]);
  });
});

describe("searchRakutenItems", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  const setCreds = () => {
    process.env.RAKUTEN_APP_ID = "test-app-id";
    process.env.RAKUTEN_ACCESS_KEY = "test-access-key";
  };

  it("RAKUTEN_APP_ID が未設定の場合に空配列を返す", async () => {
    delete process.env.RAKUTEN_APP_ID;
    process.env.RAKUTEN_ACCESS_KEY = "test-access-key";
    expect(await searchRakutenItems({ keyword: "test" })).toEqual([]);
  });

  it("RAKUTEN_ACCESS_KEY が未設定の場合も空配列を返す (新 API は両方必須)", async () => {
    process.env.RAKUTEN_APP_ID = "test-app-id";
    delete process.env.RAKUTEN_ACCESS_KEY;
    expect(await searchRakutenItems({ keyword: "test" })).toEqual([]);
  });

  it("新エンドポイントへ accessKey をヘッダで送る", async () => {
    setCreds();
    process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID = "aff-1";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ Items: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await searchRakutenItems({ keyword: "納豆" });

    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain(RAKUTEN_ITEM_SEARCH_ENDPOINT);
    // 要素をフラットにする指定が無いと呼び出し側が壊れる
    expect(calledUrl).toContain("formatVersion=2");
    expect(calledUrl).toContain("applicationId=test-app-id");
    // アフィリエイト URL を得るために必須
    expect(calledUrl).toContain("affiliateId=aff-1");
    // accessKey は URL ではなくヘッダ (ログ・キャッシュキーに残さない)
    expect(init.headers).toEqual({ accessKey: "test-access-key" });
    expect(calledUrl).not.toContain("test-access-key");
  });

  it("fetch エラー時に空配列を返す", async () => {
    setCreds();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    expect(await searchRakutenItems({ keyword: "test" })).toEqual([]);
  });

  it("fetch が非 OK レスポンスを返した場合に空配列を返す", async () => {
    setCreds();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    expect(await searchRakutenItems({ keyword: "test" })).toEqual([]);
  });

  it("正常レスポンスを正規化して返す", async () => {
    setCreds();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          Items: [
            {
              itemName: "テスト商品",
              itemPrice: 1000,
              itemUrl: "https://item/x",
              affiliateUrl: "https://hb.afl/x",
              mediumImageUrls: ["https://img/m.jpg"],
            },
          ],
        }),
    }));

    const [item] = await searchRakutenItems({ keyword: "test" });
    expect(item.itemName).toBe("テスト商品");
    expect(item.affiliateUrl).toBe("https://hb.afl/x");
    expect(item.mediumImageUrls[0].imageUrl).toBe("https://img/m.jpg");
  });
});

describe("searchFurusatoItems", () => {
  it("認証情報が未設定の場合に空配列を返す", async () => {
    delete process.env.RAKUTEN_APP_ID;
    delete process.env.RAKUTEN_ACCESS_KEY;
    const result = await searchFurusatoItems("東京都");
    expect(result).toEqual([]);
  });
});
