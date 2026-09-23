import { describe, expect, it } from "vitest";

import { yearInSpec } from "../metric-meta";

// ランキング (item/values) と相関が同じ年集合を見るための共有判定
describe("yearInSpec", () => {
  it.each([
    ["all は全年を含む", "1970", "all", true],
    ["範囲の端を含む", "2023", { from: 2020, to: 2023 }, true],
    ["範囲外", "2024", { from: 2020, to: 2023 }, false],
    ["列挙された年", "2015", { years: [2010, 2015] }, true],
    ["列挙されていない年", "2012", { years: [2010, 2015] }, false],
    ["数値でない yearCode", "unknown", { from: 2020, to: 2023 }, false],
  ] as const)("%s", (_label, yearCode, spec, expected) => {
    expect(yearInSpec(yearCode, spec as Parameters<typeof yearInSpec>[1])).toBe(expected);
  });
});
