import { describe, it, expect } from "vitest";

import { BREAKPOINTS, MEDIA_QUERIES } from "../breakpoints";

describe("BREAKPOINTS", () => {
  it("Tailwind CSS のデフォルト値と一致する", () => {
    expect(BREAKPOINTS.sm).toBe(640);
    expect(BREAKPOINTS.md).toBe(768);
    expect(BREAKPOINTS.lg).toBe(1024);
    expect(BREAKPOINTS.xl).toBe(1280);
    expect(BREAKPOINTS["2xl"]).toBe(1536);
  });

  it("昇順に並んでいる", () => {
    expect(BREAKPOINTS.sm).toBeLessThan(BREAKPOINTS.md);
    expect(BREAKPOINTS.md).toBeLessThan(BREAKPOINTS.lg);
    expect(BREAKPOINTS.lg).toBeLessThan(BREAKPOINTS.xl);
    expect(BREAKPOINTS.xl).toBeLessThan(BREAKPOINTS["2xl"]);
  });
});

describe("MEDIA_QUERIES", () => {
  it("mobile が max-width クエリ", () => {
    expect(MEDIA_QUERIES.mobile).toContain("max-width");
    expect(MEDIA_QUERIES.mobile).toContain("767px");
  });

  it("desktop が min-width クエリ", () => {
    expect(MEDIA_QUERIES.desktop).toContain("min-width");
    expect(MEDIA_QUERIES.desktop).toContain("1024px");
  });

  it("tablet が min-width と max-width の範囲クエリ", () => {
    expect(MEDIA_QUERIES.tablet).toContain("min-width");
    expect(MEDIA_QUERIES.tablet).toContain("max-width");
  });

  it("below/above の対応が正しい", () => {
    expect(MEDIA_QUERIES.belowMd).toContain("767px");
    expect(MEDIA_QUERIES.aboveMd).toContain("768px");
  });
});
