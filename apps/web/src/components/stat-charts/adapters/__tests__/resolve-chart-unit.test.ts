import { describe, expect, it } from "vitest";

import { resolveChartUnit } from "../resolve-chart-unit";

import type { StatsSchema } from "@stats47/types";

function row(unit = ""): StatsSchema {
  return {
    metricKey: "population",
    areaCode: "01000",
    areaName: "北海道",
    yearCode: "2024",
    yearName: "2024年",
    value: 1,
    unit,
  };
}

describe("resolveChartUnit", () => {
  it("カタログで明示した単位を観測値より優先する", () => {
    expect(resolveChartUnit("万人", [[row("人")]])).toBe("万人");
  });

  it("明示単位がない場合は空系列を飛ばして観測値の単位を使う", () => {
    expect(resolveChartUnit(undefined, [[], [row("人")]])).toBe("人");
  });

  it("空白だけの単位を表示値として採用しない", () => {
    expect(resolveChartUnit(" ", [[row(""), row("件")]])).toBe("件");
  });
});
