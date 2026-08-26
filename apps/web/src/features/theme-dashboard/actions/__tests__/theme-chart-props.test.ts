import { describe, expect, it } from "vitest";

import { parseThemeDbChartComponentProps } from "../theme-chart-props";

describe("theme chart componentProps boundary", () => {
  it.each([
    ["statsDataId 欠落", { estatParams: [{ cdCat01: "A" }] }],
    ["空 estatParams", { estatParams: [] }],
    ["非 string filter", { estatParams: [{ statsDataId: "X", cdCat01: 1 }] }],
    ["未知 field", { estatParams: [{ statsDataId: "X" }], mystery: true }],
    ["未登録 metricKey", { seriesRefs: [{ metricKey: "not-in-metrics-registry" }] }],
  ])("%s を拒否する", (_name, props) => {
    expect(parseThemeDbChartComponentProps("line-chart", props)).toBeNull();
  });

  it("未知 chart を拒否する", () => {
    expect(parseThemeDbChartComponentProps("bar-chart-race", {})).toBeNull();
  });
});
