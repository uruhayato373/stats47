import { describe, expect, it } from "vitest";

import { generateStackedBarSvg } from "../stacked-bar";
import type { StatsSchema } from "../../shared/stats-schema";

function rows(groups: string[], series: string[], value: (gi: number, si: number) => number): StatsSchema[] {
  return groups.flatMap((g, gi) =>
    series.map((s, si) => ({
      metricKey: "value",
      areaCode: String(si + 1).padStart(2, "0"),
      areaName: s,
      yearCode: g,
      yearName: g,
      value: value(gi, si),
      unit: "千kL",
    })),
  );
}

const segmentLabels = (svg: string) =>
  [...svg.matchAll(/fill="#fff">([^<]+)<\/text>/g)].map((m) => m[1]);

const legendSwatchColors = (svg: string) =>
  [...svg.matchAll(/<rect [^>]*width="12" height="10" fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);

describe("generateStackedBarSvg (縦・100%)", () => {
  it("縦軸が構成比なので、棒の中も生値ではなく構成比を出す", () => {
    const svg = generateStackedBarSvg(rows(["2018年度"], ["ビール", "焼酎"], (_g, si) => (si === 0 ? 3000 : 1000)), {
      title: "構成比",
      xKey: "yearCode",
      seriesKey: "areaCode",
      normalized: true,
    });
    expect(segmentLabels(svg)).toEqual(["75.0%", "25.0%"]);
  });

  it("100% でない積み上げは従来どおり生値を出す", () => {
    const svg = generateStackedBarSvg(rows(["2018年度"], ["ビール", "焼酎"], (_g, si) => (si === 0 ? 3000 : 1000)), {
      title: "数量",
      xKey: "yearCode",
      seriesKey: "areaCode",
    });
    expect(segmentLabels(svg)).not.toContain("75.0%");
  });

  it("8 系列でも凡例の色が重複しない", () => {
    const series = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const svg = generateStackedBarSvg(rows(["2018年度"], series, () => 100), {
      title: "8 区分",
      xKey: "yearCode",
      seriesKey: "areaCode",
      normalized: true,
    });
    const colors = legendSwatchColors(svg);
    expect(colors).toHaveLength(8);
    expect(new Set(colors).size).toBe(8);
  });
});
