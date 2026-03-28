import { describe, it, expect } from "vitest";

import { generateCanonicalUrl } from "../canonical-generator";

describe("generateCanonicalUrl", () => {
  it("カテゴリのみの場合", () => {
    expect(generateCanonicalUrl({ category: "population" })).toBe("/population");
  });

  it("カテゴリ + 地域コードの場合", () => {
    expect(
      generateCanonicalUrl({ category: "population", areaCode: "13000" })
    ).toBe("/population/13000");
  });

  it("カテゴリ + セグメントの場合", () => {
    expect(
      generateCanonicalUrl({ category: "population", segments: ["ranking"] })
    ).toBe("/population/ranking");
  });

  it("カテゴリ + 地域コード + セグメントの場合", () => {
    expect(
      generateCanonicalUrl({
        category: "population",
        areaCode: "13000",
        segments: ["dashboard"],
      })
    ).toBe("/population/13000/dashboard");
  });

  it("空セグメント配列の場合", () => {
    expect(
      generateCanonicalUrl({ category: "economy", segments: [] })
    ).toBe("/economy");
  });
});
