import { describe, expect, it } from "vitest";

import { getCategoryKeysForBlogTagKeys } from "../category-blog-tag-keys";

describe("getCategoryKeysForBlogTagKeys", () => {
  it("ブログ代表タグをランキングカテゴリへ明示的に変換する", () => {
    expect(getCategoryKeysForBlogTagKeys(["人口", "教育"])).toEqual([
      "population",
      "educationsports",
    ]);
  });

  it("カテゴリキー自身も受け入れ、無関係なタグは候補にしない", () => {
    expect(getCategoryKeysForBlogTagKeys(["population", "餃子"])).toEqual([
      "population",
    ]);
  });
});
