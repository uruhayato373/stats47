import { describe, expect, it } from "vitest";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";
import { AREA_THEME_SLUGS } from "@/features/theme-dashboard/config/area-theme-slugs";

import {
  AREA_CATEGORY_TO_THEME,
  LEGACY_THEME_PATH_REDIRECTS,
  resolveLegacyThemePathRedirect,
} from "../legacy-theme-redirects";

/**
 * 旧 URL → テーマの 301 表 (middleware が読む) の転送先が実在することを固定する。
 * 転送先のテーマを改名・廃止したとき、旧 URL が 404 へ 301 する状態を CI で止める。
 */
const THEME_KEYS = new Set(ALL_THEMES.map((theme) => theme.themeKey));

describe("LEGACY_THEME_PATH_REDIRECTS の転送先", () => {
  it("転送先テーマが ALL_THEMES に実在する", () => {
    const missing = LEGACY_THEME_PATH_REDIRECTS.filter((row) => row.themeSlug && !THEME_KEYS.has(row.themeSlug));
    expect(missing.map((row) => `${row.pattern} → ${row.themeSlug}`)).toEqual([]);
  });

  it("具体 path がハブのフォールバックより先に照合される (照合順)", () => {
    expect(resolveLegacyThemePathRedirect("/gis-cross/sunshine-map")).toBe("/themes/climate");
    expect(resolveLegacyThemePathRedirect("/gis-cross/other")).toBe("/themes");
    expect(resolveLegacyThemePathRedirect("/ports/")).toBe("/themes/ports");
    expect(resolveLegacyThemePathRedirect("/ports/x")).toBeUndefined();
    expect(resolveLegacyThemePathRedirect("/themes/ports")).toBeUndefined();
  });
});

describe("AREA_CATEGORY_TO_THEME の転送先", () => {
  it("転送先が /areas/{pref}/{themeSlug} で 200 を返す Type A テーマ (空文字はエリアプロフィール)", () => {
    const missing = Object.entries(AREA_CATEGORY_TO_THEME).filter(([, slug]) => slug && !AREA_THEME_SLUGS.has(slug));
    expect(missing).toEqual([]);
  });

  it("旧カテゴリキーと転送先が同じ (301 ループ) にならない", () => {
    const loops = Object.entries(AREA_CATEGORY_TO_THEME).filter(([key, slug]) => key === slug || AREA_THEME_SLUGS.has(key));
    expect(loops).toEqual([]);
  });
});
