import { describe, it, expect } from "vitest";

import { AD_SIZES } from "../types";

describe("AD_SIZES", () => {
  it("全5フォーマットが定義されている", () => {
    expect(Object.keys(AD_SIZES)).toHaveLength(5);
    expect(AD_SIZES).toHaveProperty("rectangle");
    expect(AD_SIZES).toHaveProperty("banner");
    expect(AD_SIZES).toHaveProperty("skyscraper");
    expect(AD_SIZES).toHaveProperty("infeed");
    expect(AD_SIZES).toHaveProperty("article");
  });

  it("各フォーマットが desktop/mobile サイズと description を持つ", () => {
    for (const [, size] of Object.entries(AD_SIZES)) {
      expect(size.desktop).toHaveProperty("width");
      expect(size.desktop).toHaveProperty("height");
      expect(size.mobile).toHaveProperty("width");
      expect(size.mobile).toHaveProperty("height");
      expect(size.description.length).toBeGreaterThan(0);
    }
  });

  it("rectangle のデスクトップサイズが 336x280", () => {
    expect(AD_SIZES.rectangle.desktop).toEqual({ width: 336, height: 280 });
  });
});
