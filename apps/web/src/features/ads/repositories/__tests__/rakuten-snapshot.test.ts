/**
 * 楽天 R2 snapshot のキー設計と削り込みのテスト。
 *
 * 2026-08-04 に実際に踏んだ事故を固定する:
 *   - キーを encodeURIComponent していたため R2 上のキーが literal %E3%82%... になり、
 *     公開 URL から引くと HTTP が decode してキー不一致 → 404 (検証手段を失った)
 *   - 47 県の列挙を module 内定数に依存して undefined.slice で落ちた
 *   - url に itemUrl を使うとクリックが成果にならない (affiliateUrl 優先が必須)
 */
import { describe, expect, it } from "vitest";

import {
  allPrefCodes,
  rakutenFurusatoKey,
  rakutenItemsKey,
  toSnapshotItems,
} from "../rakuten-snapshot";

describe("rakutenItemsKey", () => {
  it("日本語をそのままキーにする (encode しない)", () => {
    // encode すると R2 のキーが %E3%82%... になり、公開 URL から引けなくなる
    expect(rakutenItemsKey("納豆")).toBe("app/rakuten/items/納豆.json");
    expect(rakutenItemsKey("納豆")).not.toContain("%");
  });

  it("app/ 名前空間に置く (r2-storage-design.md)", () => {
    expect(rakutenItemsKey("牛肉").startsWith("app/rakuten/items/")).toBe(true);
  });
});

describe("rakutenFurusatoKey", () => {
  it("都道府県コード単位のキーを作る", () => {
    expect(rakutenFurusatoKey("13000")).toBe("app/rakuten/furusato/13000.json");
  });
});

describe("allPrefCodes", () => {
  it("47 件を返す", () => {
    expect(allPrefCodes()).toHaveLength(47);
  });

  it("北海道から沖縄まで 5 桁ゼロ埋めで並ぶ", () => {
    const codes = allPrefCodes();
    expect(codes[0]).toBe("01000");
    expect(codes[12]).toBe("13000"); // 東京
    expect(codes[46]).toBe("47000"); // 沖縄
    expect(codes.every((c) => /^\d{5}$/.test(c))).toBe(true);
  });
});

describe("toSnapshotItems", () => {
  const base = {
    itemName: "納豆セット",
    itemPrice: 3000,
    itemUrl: "https://item.rakuten.co.jp/x",
    mediumImageUrls: [{ imageUrl: "https://img/m.jpg" }],
    smallImageUrls: [{ imageUrl: "https://img/s.jpg" }],
    reviewCount: 7,
    reviewAverage: 4.71,
  };

  it("affiliateUrl があれば url に採用する (成果計測の要)", () => {
    const [item] = toSnapshotItems([{ ...base, affiliateUrl: "https://hb.afl.rakuten.co.jp/x" }]);
    expect(item.url).toBe("https://hb.afl.rakuten.co.jp/x");
  });

  it("affiliateUrl が無ければ itemUrl にフォールバックする", () => {
    const [item] = toSnapshotItems([base]);
    expect(item.url).toBe("https://item.rakuten.co.jp/x");
  });

  it("medium を優先し、無ければ small を使う", () => {
    expect(toSnapshotItems([base])[0].image).toBe("https://img/m.jpg");
    const [noMedium] = toSnapshotItems([{ ...base, mediumImageUrls: [] }]);
    expect(noMedium.image).toBe("https://img/s.jpg");
  });

  it("画像が無ければ null (カード側が画像ブロックを出さない)", () => {
    const [item] = toSnapshotItems([{ ...base, mediumImageUrls: [], smallImageUrls: [] }]);
    expect(item.image).toBeNull();
  });

  it("配信に要らないフィールドを持ち込まない (R2 容量と転送量)", () => {
    const [item] = toSnapshotItems([base]);
    expect(Object.keys(item).sort()).toEqual(
      ["image", "name", "price", "reviewCount", "reviewAverage", "url"].sort(),
    );
  });

  it("空配列でも落ちない", () => {
    expect(toSnapshotItems([])).toEqual([]);
  });
});
