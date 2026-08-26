import { describe, expect, it } from "vitest";

import {
  CHART_COLOR_ROLE_HEX,
  CHART_COLOR_ROLES,
  isChartColorRole,
  resolveChartColorHex,
} from "../chart-color-role";

/**
 * WP5 — 色 semantic role の static resolver 全域性。
 * CHART_COLOR_ROLES に role を足したら、同じ変更で必ず有効な hex を割り当てる。
 */

describe("static resolver — 全 role を決定的なhexへ解決する", () => {
  it("static resolver (hex) は全 role に有効な hex を返す", () => {
    for (const role of CHART_COLOR_ROLES) {
      const hex = resolveChartColorHex(role);
      expect(hex, role).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("hex マップのキー集合 == CHART_COLOR_ROLES (過不足なし)", () => {
    expect(Object.keys(CHART_COLOR_ROLE_HEX).sort()).toEqual([...CHART_COLOR_ROLES].sort());
  });
});

describe("isChartColorRole", () => {
  it("既知 role は true", () => {
    expect(isChartColorRole("danger")).toBe(true);
    expect(isChartColorRole("series-3")).toBe(true);
  });
  it("生色コードや未知文字列は false (role でない)", () => {
    expect(isChartColorRole("#3b82f6")).toBe(false);
    expect(isChartColorRole("rainbow")).toBe(false);
    expect(isChartColorRole(123)).toBe(false);
  });
});
