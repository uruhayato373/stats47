import { describe, it, expect } from "vitest";
import { productIndicatorLabel } from "../src/data/product-indicator-label";
import { VERIFIED_PRODUCT_LABELS } from "../src/data/verified-product-labels";

describe("delivery indicator definitions", () => {
  it("retains the official denominator even when the site title omits it", () => {
    const source = { statsDataId: "0000010207", cdCat01: "#G01104" };
    expect(productIndicatorLabel("library-count-per-million", { title: "図書館数", source })).toBe("図書館数（人口100万人当たり）");
  });
  it("does not infer raw counts from a misleading per-100k slug", () => {
    const pin = VERIFIED_PRODUCT_LABELS["serious-crime-per-100k"];
    expect(productIndicatorLabel("serious-crime-per-100k", { source: pin })).toBe("凶悪犯認知件数");
  });
  it("fails closed when the source filter changes", () => {
    expect(() => productIndicatorLabel("library-count-per-million", { source: { statsDataId: "other", cdCat01: "#G01104" } })).toThrow(/Source changed/);
  });
  it("retains subtitles for other sources", () => {
    expect(productIndicatorLabel("other", { title: "持家率", subtitle: "二人以上世帯" })).toBe("持家率（二人以上世帯）");
  });
  it("requires official definitions for newly added SSDS ratio indicators", () => {
    expect(() => productIndicatorLabel("new-ratio", { title: "施設数", source: { statsDataId: "0000010207" } })).toThrow(/not verified/);
  });
  it("retains the frozen definition when current metadata cannot confirm a historical code", () => {
    expect(productIndicatorLabel("historical", { title: "短縮名" }, "旧版の完全な定義")).toBe("旧版の完全な定義");
  });
});
