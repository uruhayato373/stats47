import { describe, expect, it } from "vitest";

import {
  CHART_COLOR_ROLE_HEX,
  CHART_COLOR_ROLES,
  isChartColorRole,
  resolveChartColorCssVar,
  resolveChartColorHex,
} from "../chart-color-role";

/**
 * WP5 — 色 semantic role の resolver parity。
 *
 * ★web (CSS var) resolver と static/SVG (hex) resolver が **同じ role 集合** を実装することを固定する。
 *   片方だけに role を足すと、その面だけ色が解決できず崩れる。両 resolver を CHART_COLOR_ROLES から
 *   駆動して parity を保証する。
 */

describe("resolver parity — 両 resolver が全 role を解決する", () => {
  it("static resolver (hex) は全 role に有効な hex を返す", () => {
    for (const role of CHART_COLOR_ROLES) {
      const hex = resolveChartColorHex(role);
      expect(hex, role).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("web resolver (CSS var) は全 role に var(--chart-<role>) を返す", () => {
    for (const role of CHART_COLOR_ROLES) {
      expect(resolveChartColorCssVar(role)).toBe(`var(--chart-${role})`);
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
