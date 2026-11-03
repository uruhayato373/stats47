import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AD_FREE_PATH_PREFIXES, AD_FREE_THEME_KEYS } from "@/lib/google-adsense/ad-free-paths";
import { isAdFreePath } from "@/lib/google-adsense/constants";

import { ALL_THEMES } from "../all-themes";
import { isAreaTheme } from "../area-theme-slugs";

/**
 * 高速道路網の変遷の節 (`highway`) は非商用の時系列データ (N06) を描く。了承の範囲は
 * 広告・アフィリエイトのないページだけなので (packages/gis/src/infra-history/networks.ts)、
 * 節を埋め込むテーマはすべて広告なしの一覧に載り、県のページ (/areas/<code>/<theme>) を持たないこと。
 */
const NON_COMMERCIAL_SECTION_KEYS = ["highway"];

const themesWithNonCommercialSections = ALL_THEMES.filter((theme) =>
  (theme.embeddedSections ?? []).some((key) => NON_COMMERCIAL_SECTION_KEYS.includes(key)),
).map((theme) => theme.themeKey);

describe("非商用データの節を埋め込むテーマは広告なし", () => {
  it("節を埋め込むテーマと広告なしのテーマの一覧が一致する", () => {
    expect(themesWithNonCommercialSections).toEqual(["roads"]);
    expect([...AD_FREE_THEME_KEYS].sort()).toEqual([...themesWithNonCommercialSections].sort());
  });

  it("全国のテーマのページは広告なし", () => {
    for (const key of themesWithNonCommercialSections) {
      expect(isAdFreePath(`/themes/${key}`, AD_FREE_PATH_PREFIXES)).toBe(true);
    }
  });

  it("県のページを持たない (県の URL は 410 で、節が広告のあるページに出ない)", () => {
    for (const key of themesWithNonCommercialSections) {
      expect(isAreaTheme(key)).toBe(false);
    }
  });
});
