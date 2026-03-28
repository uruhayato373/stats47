import { describe, it, expect } from "vitest";

import { ALL_THEMES } from "../all-themes";

describe("ALL_THEMES", () => {
  it("テーマが1つ以上定義されている", () => {
    expect(ALL_THEMES.length).toBeGreaterThan(0);
  });

  it("全テーマが themeKey を持つ", () => {
    for (const theme of ALL_THEMES) {
      expect(theme.themeKey).toBeDefined();
      expect(typeof theme.themeKey).toBe("string");
      expect(theme.themeKey.length).toBeGreaterThan(0);
    }
  });

  it("全テーマが title を持つ", () => {
    for (const theme of ALL_THEMES) {
      expect(theme.title).toBeDefined();
      expect(theme.title).toContain("ダッシュボード");
    }
  });

  it("全テーマが rankingKeys を持つ", () => {
    for (const theme of ALL_THEMES) {
      expect(theme.rankingKeys.length).toBeGreaterThan(0);
    }
  });

  it("全テーマが defaultRankingKey を持つ", () => {
    for (const theme of ALL_THEMES) {
      expect(theme.defaultRankingKey).toBeDefined();
      expect(theme.rankingKeys).toContain(theme.defaultRankingKey);
    }
  });

  it("themeKey が重複していない", () => {
    const keys = ALL_THEMES.map((t) => t.themeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
