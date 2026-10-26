import { describe, expect, it } from "vitest";
import { CATEGORIES } from "../categories";
import { CATEGORY_KEYS } from "../types";

describe("CATEGORY_KEYS ⇄ CATEGORY_DEFS", () => {
  it("型 union の 17 キーとカテゴリマスタのキーが同じ集合・同じ順序 (displayOrder) で並ぶ", () => {
    expect(CATEGORIES.map((c) => c.categoryKey)).toEqual([...CATEGORY_KEYS]);
  });

  it("displayOrder は配列 index と一致し、表示名は重複しない", () => {
    CATEGORIES.forEach((c, i) => expect(c.displayOrder).toBe(i));
    expect(new Set(CATEGORIES.map((c) => c.categoryName)).size).toBe(CATEGORIES.length);
  });
});
