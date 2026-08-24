import { describe, it, expect } from "vitest";

import { ALL_THEMES } from "../all-themes";
import { AREA_THEMES, isAreaTheme } from "../area-theme-slugs";

/**
 * `/areas/{prefCode}/{themeSlug}` で 200 を返す Type A テーマ。
 * middleware.ts の `TYPE_A_THEME_SLUGS` / sitemap.ts の `TYPE_B_THEMES` と一致すること。
 * ここがドリフト検知の基準（存在しない / 410 URL を切替リンクに出さないための保証）。
 */
const EXPECTED_TYPE_A = [
  "population-dynamics", "aging-society", "living-housing", "local-economy",
  "labor-wages", "manufacturing", "healthcare", "safety", "education-culture",
  "tourism", "consumer-prices", "foreign-residents", "occupation-salary",
  "real-income", "labor-mobility", "local-finance", "fishery-marine", "climate",
];

const EXPECTED_TYPE_B = ["ports", "railway", "roads"];

describe("area-theme-slugs", () => {
  it("Type B テーマ (都道府県ページ非対応) は isAreaTheme=false", () => {
    for (const key of EXPECTED_TYPE_B) {
      expect(isAreaTheme(key)).toBe(false);
    }
  });

  it("Type A テーマは isAreaTheme=true", () => {
    for (const key of EXPECTED_TYPE_A) {
      expect(isAreaTheme(key)).toBe(true);
    }
  });

  it("AREA_THEMES は middleware/sitemap の Type A 集合と一致する（ドリフト検知）", () => {
    const keys = AREA_THEMES.map((t) => t.themeKey).sort();
    expect(keys).toEqual([...EXPECTED_TYPE_A].sort());
  });

  it("AREA_THEMES は ALL_THEMES から Type B を除いた集合である", () => {
    const excluded = new Set(EXPECTED_TYPE_B);
    const expected = ALL_THEMES.map((t) => t.themeKey).filter((k) => !excluded.has(k));
    expect(AREA_THEMES.map((t) => t.themeKey)).toEqual(expected);
  });
});
