import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  RAKUTEN_REQUEST_INTERVAL_MS,
  PREF_TO_TRAVEL_MIDDLE_CLASS,
  RAKUTEN_ITEM_SEARCH_ENDPOINT,
  normalizeRakutenItems,
  searchRakutenItems,
  searchFurusatoItems,
  searchRakutenProductItems,
} from "../rakuten-api";

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

    await searchRakutenItems({ keyword: "納豆", excludeKeyword: "ふるさと納税" });

    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain(RAKUTEN_ITEM_SEARCH_ENDPOINT);
    // 要素をフラットにする指定が無いと呼び出し側が壊れる
    expect(calledUrl).toContain("formatVersion=2");
    expect(calledUrl).toContain("applicationId=test-app-id");
    // アフィリエイト URL を得るために必須
    expect(calledUrl).toContain("affiliateId=aff-1");
    expect(new URL(calledUrl).searchParams.get("NGKeyword")).toBe("ふるさと納税");
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

  it("収集では403を0件と混同せず、秘密を含まないエラーにする", async () => {
    setCreds();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(searchRakutenItems({ keyword: "さんま", strict: true })).rejects.toThrow("Rakuten API http (HTTP 403)");
  });

  it("不正なAPI応答は空配列ではなく収集失敗として区別する", async () => {
    setCreds();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ error: "upstream error" }) }));
    await expect(searchRakutenItems({ keyword: "さんま", strict: true })).rejects.toThrow("invalid-response");
  });

  it("通常商品は30候補から商品名に一致する良品だけ採用する", async () => {
    setCreds();
    const product = { itemName: "さんま 干物", itemPrice: 1000,
      itemUrl: "https://item.rakuten.co.jp/test/fish", affiliateUrl: "https://hb.afl.rakuten.co.jp/fish",
      mediumImageUrls: ["https://thumbnail.image.rakuten.co.jp/fish.jpg"] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Items: [
      { ...product, itemName: "ナイトブラ" }, product,
      { ...product, itemName: "【ふるさと納税】さんま" },
    ] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await searchRakutenProductItems("さんま")).toHaveLength(1);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("hits")).toBe("30");
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("field")).toBe("1");
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
  beforeEach(() => {
    vi.stubEnv("RAKUTEN_APP_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const seafood = {
    itemName: "【ふるさと納税】ホタテ 海鮮セット",
    shopName: "北海道白糠町",
    itemUrl: "https://item.rakuten.co.jp/example/seafood/",
    affiliateUrl: "https://hb.afl.rakuten.co.jp/seafood",
    itemPrice: 10000,
    mediumImageUrls: ["https://thumbnail.image.rakuten.co.jp/seafood.jpg"],
  };

  it("返礼品・県名・特産品を指定し、ギフト券ジャンルに限定しない", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Items: [seafood] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await searchFurusatoItems("北海道", 4, "海鮮")).toHaveLength(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("keyword")).toBe("ふるさと納税 北海道 海鮮");
    expect(url.searchParams.get("genreId")).toBe("100227");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("他県の自治体や通常商品を除き、県内の返礼品だけを件数上限まで採用する", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Items: [
      { ...seafood, shopName: "青森県青森市" },
      { ...seafood, itemName: "通常のホタテ通販" },
      seafood, { ...seafood, affiliateUrl: seafood.affiliateUrl + "/2" },
      { ...seafood, affiliateUrl: seafood.affiliateUrl + "/3" },
    ] }) }));
    const result = await searchFurusatoItems("北海道", 2);
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.shopName === "北海道白糠町")).toBe(true);
  });

  it("対象県の特産品が0件のとき、QPS間隔を空けて県別検索へ戻す", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Items: [{ ...seafood, shopName: "青森県青森市" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Items: [seafood] }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = searchFurusatoItems("北海道", 4, "海鮮");
    await vi.advanceTimersByTimeAsync(RAKUTEN_REQUEST_INTERVAL_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toHaveLength(1);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("keyword")).toBe("ふるさと納税 北海道");
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("genreId")).toBe("100227");
  });

  it("券のみの検索結果では間隔を空けて食品へ戻す", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Items: [{ ...seafood, itemName: "【ふるさと納税】海鮮 食事券" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Items: [seafood] }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = searchFurusatoItems("北海道", 4, "海鮮");
    await vi.advanceTimersByTimeAsync(RAKUTEN_REQUEST_INTERVAL_MS);
    expect(await result).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("strict取得の認証失敗は県別フォールバックで再試行しない", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchFurusatoItems("北海道", 4, "海鮮", 15000, true)).rejects.toThrow("HTTP 403");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("認証情報が未設定の場合に空配列を返す", async () => {
    delete process.env.RAKUTEN_APP_ID;
    delete process.env.RAKUTEN_ACCESS_KEY;
    const result = await searchFurusatoItems("東京都");
    expect(result).toEqual([]);
  });
});
