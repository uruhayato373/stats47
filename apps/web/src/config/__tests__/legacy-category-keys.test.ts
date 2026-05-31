import { listCategories } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import { LEGACY_CATEGORY_KEYS_SET } from "../legacy-category-keys";

describe("LEGACY_CATEGORY_KEYS", () => {
  it("data-configs CATEGORIES のキー集合と完全一致する (silent drift 検出)", () => {
    // middleware の legacy URL 判定キーは現行カテゴリと一致している必要がある。
    // カテゴリ追加/リネーム時に legacy-category-keys.ts を更新し忘れたらここで fail する。
    const currentKeys = new Set(listCategories().map((c) => c.categoryKey));
    expect(LEGACY_CATEGORY_KEYS_SET).toEqual(currentKeys);
  });
});
