import { describe, expect, it } from "vitest";

import {
  CHART_COLOR_ROLE_HEX,
  collectColorFieldViolations,
  HEX_TO_ROLE,
  isChartColorRole,
  isRawColorValue,
  resolveChartColorHex,
  resolveComponentPropsColors,
  roleForHex,
} from "../chart-color-role";
import { collectCatalogBaseline } from "../baseline-collector";
import { THEME_CATALOGS } from "../index";

/**
 * ★移行前 catalog に実在した 14 色 (固定 fixture)。移行後は catalog から生色が消えるため、
 *   live baseline を走査すると空集合で vacuous green になる (2026-08-13 concurrent review 指摘)。
 *   逆写像 (role→hex が元 hex を再現) は**この固定集合**で閉じる。
 */
const MIGRATED_COLORS = [
  "#06b6d4",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#3b82f6",
  "#6b7280",
  "#84cc16",
  "#8b5cf6",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#f97316",
] as const;

/**
 * WP5 — 色 role 移行の resolver (catalog は role・生成物は hex)。
 *
 * ★狙い:
 *   ① 生成器が componentProps を deep-walk し、色キー文脈の role を hex へ解決する。
 *   ② 解決は現行 hex を **完全再現** する (HEX_TO_ROLE と resolveChartColorHex が逆写像)。
 *   ③ 色キー文脈の外 (e-Stat コード `cdCat01: "#F01201"` 等) は触らない。
 */

describe("HEX_TO_ROLE — 移行 14 色を role へ写せる (逆写像で hex を再現)", () => {
  it("HEX_TO_ROLE は移行 14 色をちょうど覆う (過不足なし)", () => {
    expect(Object.keys(HEX_TO_ROLE).sort()).toEqual([...MIGRATED_COLORS].sort());
    expect(MIGRATED_COLORS.length).toBe(14);
  });

  it("14 色すべてに妥当な role が割り当たる", () => {
    for (const hex of MIGRATED_COLORS) {
      const role = HEX_TO_ROLE[hex];
      expect(role, `色 ${hex} に role が無い`).toBeTruthy();
      expect(isChartColorRole(role)).toBe(true);
    }
  });

  it("role → hex が元の hex を完全再現する (zero-regression の条件・非空 fixture)", () => {
    for (const hex of MIGRATED_COLORS) {
      const role = HEX_TO_ROLE[hex];
      expect(resolveChartColorHex(role).toLowerCase()).toBe(hex);
    }
  });

  it("roleForHex は HEX_TO_ROLE と一致 (未知色は null・大小無視)", () => {
    expect(roleForHex("#3b82f6")).toBe(HEX_TO_ROLE["#3b82f6"]);
    expect(roleForHex("#3B82F6")).toBe(HEX_TO_ROLE["#3b82f6"]);
    expect(roleForHex("#ffffff")).toBeNull();
  });

  it("移行後の live catalog に生色は残っていない (移行完了の不変量)", () => {
    const baseline = collectCatalogBaseline(Object.values(THEME_CATALOGS));
    expect(baseline.rawColorPlaces).toBe(0);
    expect(baseline.distinctColors).toEqual([]);
  });
});

describe("collectColorFieldViolations — 色キーの role でない値を弾く (raw-color / unknown-role)", () => {
  it("生 hex は raw-color として拾う", () => {
    expect(collectColorFieldViolations({ seriesColors: ["#3b82f6", "population"] })).toEqual([
      { value: "#3b82f6", kind: "raw-color" },
    ]);
  });

  it("未知の role 名 (typo) は unknown-role として拾う", () => {
    expect(collectColorFieldViolations({ segments: [{ code: "A", label: "a", color: "populaton" }] })).toEqual([
      { value: "populaton", kind: "unknown-role" },
    ]);
  });

  it.each([
    ["rainbow", "unknown-role"],
    ["red", "unknown-role"],
    ["var(--chart-danger)", "unknown-role"],
    ["oklch(60% 0.2 30)", "unknown-role"],
    ["series-99", "unknown-role"],
  ] as const)("role欄の不許可値 %s を拒否する", (value, kind) => {
    expect(collectColorFieldViolations({ color: value })).toEqual([{ value, kind }]);
  });

  it("正しい role だけなら違反ゼロ", () => {
    expect(
      collectColorFieldViolations({
        seriesColors: ["population", "series-12"],
        categories: [{ code: "A", label: "a", color: "female" }],
      }),
    ).toEqual([]);
  });

  it("色キー外の #-code / 文字列は無視する", () => {
    expect(
      collectColorFieldViolations({
        estatParams: [{ statsDataId: "S", cdCat01: "#F01201" }],
        labels: ["#F01201", "populaton"],
      }),
    ).toEqual([]);
  });
});

describe("resolveComponentPropsColors — 色キー文脈だけを role→hex に解決", () => {
  it("seriesColors / color の role を hex へ解決する", () => {
    const out = resolveComponentPropsColors({
      seriesColors: ["population", "count"],
      segments: [{ code: "A", label: "a", color: "danger" }],
      categories: [{ code: "B", label: "b", color: "female" }],
    });
    expect(out).toEqual({
      seriesColors: [CHART_COLOR_ROLE_HEX.population, CHART_COLOR_ROLE_HEX.count],
      segments: [{ code: "A", label: "a", color: CHART_COLOR_ROLE_HEX.danger }],
      categories: [{ code: "B", label: "b", color: CHART_COLOR_ROLE_HEX.female }],
    });
  });

  it("色キー以外 (statsDataId / cdCat01 の #-code) は触らない", () => {
    const input = {
      statsDataId: "0000010201",
      estatParams: [{ statsDataId: "0000010201", cdCat01: "#F01201" }],
      labels: ["#F01201"], // 色キーでない配列は不変
    };
    expect(resolveComponentPropsColors(input)).toEqual(input);
  });

  it("入力を破壊しない (deep clone)", () => {
    const input = { seriesColors: ["population"] };
    resolveComponentPropsColors(input);
    expect(input.seriesColors).toEqual(["population"]);
  });

  it("既に hex の色値は素通し (部分移行に耐える)", () => {
    const out = resolveComponentPropsColors({ seriesColors: ["#3b82f6"] });
    expect(out).toEqual({ seriesColors: ["#3b82f6"] });
  });
});

describe("isRawColorValue — 生色の判定 (validator の enforcement 用)", () => {
  it("hex / hsl / rgb は生色", () => {
    expect(isRawColorValue("#3b82f6")).toBe(true);
    expect(isRawColorValue("hsl(210,50%,50%)")).toBe(true);
    expect(isRawColorValue("rgb(1,2,3)")).toBe(true);
  });
  it("role 名・e-Stat コードは生色でない", () => {
    expect(isRawColorValue("population")).toBe(false);
    expect(isRawColorValue("#F01201")).toBe(true); // 構文上は hex (色キー文脈でのみ問題)
  });
});
