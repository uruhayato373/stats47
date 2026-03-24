import { describe, expect, it, vi, afterEach } from "vitest";

import { buildAmazonUrl, CATEGORY_BOOKS } from "../constants/related-books";

describe("buildAmazonUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("環境変数未設定の場合、元の URL をそのまま返す", () => {
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "");
    const url = buildAmazonUrl("https://www.amazon.co.jp/dp/4478022216");
    expect(url).toBe("https://www.amazon.co.jp/dp/4478022216");
  });

  it("環境変数が設定されている場合、tag パラメータを付与する", () => {
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "stats47-22");
    const url = buildAmazonUrl("https://www.amazon.co.jp/dp/4478022216");
    expect(url).toBe("https://www.amazon.co.jp/dp/4478022216?tag=stats47-22");
  });

  it("既にクエリパラメータがある URL には & で連結する", () => {
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "stats47-22");
    const url = buildAmazonUrl("https://www.amazon.co.jp/dp/4478022216?ref=sr_1_1");
    expect(url).toBe("https://www.amazon.co.jp/dp/4478022216?ref=sr_1_1&tag=stats47-22");
  });
});

describe("CATEGORY_BOOKS", () => {
  it("全書籍エントリに必須フィールドが存在する", () => {
    for (const [category, book] of Object.entries(CATEGORY_BOOKS)) {
      expect(book, `${category} の書籍データが undefined`).toBeDefined();
      expect(book!.title, `${category}.title が空`).toBeTruthy();
      expect(book!.author, `${category}.author が空`).toBeTruthy();
      expect(book!.description, `${category}.description が空`).toBeTruthy();
      expect(book!.amazonDp, `${category}.amazonDp が空`).toBeTruthy();
      expect(book!.amazonDp).toMatch(/^https:\/\/www\.amazon\.co\.jp\/dp\//);
    }
  });
});
