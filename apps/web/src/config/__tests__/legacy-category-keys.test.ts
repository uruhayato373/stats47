import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { listCategories } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import { LEGACY_CATEGORY_KEYS_SET } from "../legacy-category-keys";

describe("LEGACY_CATEGORY_KEYS", () => {
  it("カテゴリマスタのキー集合と完全一致する", () => {
    const currentKeys = new Set(listCategories().map((c) => c.categoryKey));
    expect(LEGACY_CATEGORY_KEYS_SET).toEqual(currentKeys);
  });

  it("手で書いた配列ではなく、生成した軽量 subpath から導出している (Edge の middleware に指標の一覧を入れない)", () => {
    const src = readFileSync(resolve(__dirname, "../legacy-category-keys.ts"), "utf8");
    expect(src).toMatch(/from "@stats47\/data-configs\/category-keys"/);
    expect(src).not.toMatch(/from "@stats47\/data-configs"/);
    expect(src).not.toMatch(/"landweather"/);
  });

  it("subpath の先は何も import しない (指標の一覧を巻き込まない)", () => {
    const generated = readFileSync(
      resolve(__dirname, "../../../../../packages/data-configs/src/category-keys.generated.ts"),
      "utf8",
    );
    expect(generated).not.toMatch(/^\s*(import|export .* from)\b/m);
  });
});
