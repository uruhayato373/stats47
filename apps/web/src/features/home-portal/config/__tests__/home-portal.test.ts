import {
  CATEGORIES,
  HOME_PORTAL_CATEGORIES,
  HOME_PORTAL_TERMS,
  HOME_PORTAL_USE_CASES,
  validateHomePortal,
  type HomePortalCategory,
  type HomePortalUseCase,
} from "@stats47/data-configs";
import { describe, it, expect } from "vitest";

import { ALL_THEMES } from "@/features/theme-dashboard/server";

const THEME_KEYS = new Set(ALL_THEMES.map((t) => t.themeKey));

describe("validateHomePortal", () => {
  it("現行の home-portal 設定は妥当 (違反ゼロ)", () => {
    expect(validateHomePortal(THEME_KEYS)).toEqual([]);
  });

  it("代表カテゴリの categoryKey はすべて CATEGORIES に実在する", () => {
    const keys = new Set(CATEGORIES.map((c) => c.categoryKey));
    for (const c of HOME_PORTAL_CATEGORIES) {
      expect(keys.has(c.categoryKey)).toBe(true);
    }
  });

  it("use case の themeKey はすべて ALL_THEMES に実在する", () => {
    for (const u of HOME_PORTAL_USE_CASES) {
      expect(THEME_KEYS.has(u.themeKey)).toBe(true);
    }
  });

  it("popular term は空でなく重複しない", () => {
    expect(HOME_PORTAL_TERMS.length).toBeGreaterThan(0);
    const terms = HOME_PORTAL_TERMS.map((t) => t.term);
    expect(new Set(terms).size).toBe(terms.length);
    for (const t of terms) expect(t.trim()).not.toBe("");
  });

  it("実在しない categoryKey を拒否する", () => {
    const bad: HomePortalCategory[] = [
      { categoryKey: "does-not-exist", label: "x", order: 1 },
    ];
    expect(validateHomePortal(THEME_KEYS, { categories: bad })).toContain(
      "categoryKey が CATEGORIES に不在: does-not-exist",
    );
  });

  it("実在しない themeKey を拒否する", () => {
    const bad: HomePortalUseCase[] = [
      {
        id: "x",
        label: "x",
        description: "x",
        themeKey: "no-such-theme",
        order: 1,
        isActive: true,
      },
    ];
    const errors = validateHomePortal(THEME_KEYS, { useCases: bad });
    expect(errors.some((e) => e.includes("no-such-theme"))).toBe(true);
  });

  it("category order の重複を拒否する", () => {
    const bad: HomePortalCategory[] = [
      { categoryKey: "population", label: "a", order: 1 },
      { categoryKey: "economy", label: "b", order: 1 },
    ];
    const errors = validateHomePortal(THEME_KEYS, { categories: bad });
    expect(errors.some((e) => e.includes("category order 重複"))).toBe(true);
  });

  it("use case id / href の重複を拒否する", () => {
    const bad: HomePortalUseCase[] = [
      {
        id: "dup",
        label: "a",
        description: "a",
        themeKey: "healthcare",
        order: 1,
        isActive: true,
      },
      {
        id: "dup",
        label: "b",
        description: "b",
        themeKey: "healthcare",
        order: 2,
        isActive: true,
      },
    ];
    const errors = validateHomePortal(THEME_KEYS, { useCases: bad });
    expect(errors.some((e) => e.includes("use case id 重複: dup"))).toBe(true);
    expect(errors.some((e) => e.includes("use case href 重複"))).toBe(true);
  });

  it("空の popular term を拒否する", () => {
    const errors = validateHomePortal(THEME_KEYS, { terms: [{ term: "  " }] });
    expect(errors.some((e) => e.includes("popular term が空文字"))).toBe(true);
  });
});
