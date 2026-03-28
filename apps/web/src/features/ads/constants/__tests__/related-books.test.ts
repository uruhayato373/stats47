import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { buildAmazonUrl, CATEGORY_BOOKS } from "../related-books";

describe("buildAmazonUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("アソシエイトタグが設定されている場合に URL に付与する", () => {
    process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG = "test-22";
    const result = buildAmazonUrl("https://www.amazon.co.jp/dp/123");

    expect(result).toBe("https://www.amazon.co.jp/dp/123?tag=test-22");
  });

  it("URL に既存のクエリパラメータがある場合は & で連結する", () => {
    process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG = "test-22";
    const result = buildAmazonUrl("https://www.amazon.co.jp/dp/123?ref=sr_1_1");

    expect(result).toBe("https://www.amazon.co.jp/dp/123?ref=sr_1_1&tag=test-22");
  });

  it("アソシエイトタグが未設定の場合は元の URL をそのまま返す", () => {
    delete process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
    const url = "https://www.amazon.co.jp/dp/123";
    const result = buildAmazonUrl(url);

    expect(result).toBe(url);
  });
});

describe("CATEGORY_BOOKS", () => {
  it("少なくとも1つの書籍推薦が存在する", () => {
    expect(Object.keys(CATEGORY_BOOKS).length).toBeGreaterThan(0);
  });

  it("各書籍が必須フィールドを持つ", () => {
    for (const book of Object.values(CATEGORY_BOOKS)) {
      if (!book) continue;
      expect(book.title).toBeDefined();
      expect(book.author).toBeDefined();
      expect(book.description).toBeDefined();
      expect(book.amazonDp).toContain("amazon.co.jp");
    }
  });
});
