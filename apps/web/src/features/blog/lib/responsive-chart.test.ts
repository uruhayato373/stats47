import { describe, expect, it } from "vitest";

import { isResponsiveRankingChart, resolveMobileChartSource } from "./responsive-chart";

describe("resolveMobileChartSource", () => {
  it("maps canonical ranking SVGs to their mobile editorial variant", () => {
    expect(resolveMobileChartSource("https://storage.example/data/golf-ranking.svg"))
      .toBe("https://storage.example/data/golf-ranking-mobile.svg");
    expect(resolveMobileChartSource("data/population-prefecture-rankings.svg"))
      .toBe("data/population-prefecture-rankings-mobile.svg");
    expect(resolveMobileChartSource("data/golf-ranking.svg?v=2#chart"))
      .toBe("data/golf-ranking-mobile.svg?v=2#chart");
  });

  it("does not rewrite non-ranking or already specialized assets", () => {
    expect(resolveMobileChartSource("data/golf-map.svg")).toBeNull();
    expect(resolveMobileChartSource("data/golf-ranking-mobile.svg")).toBeNull();
    expect(resolveMobileChartSource("data/golf-ranking-ig.svg")).toBeNull();
  });

  it("maps stacked bar SVGs (-stacked / -breakdown / -composition) to their mobile variant", () => {
    expect(resolveMobileChartSource("data/household-spending-stacked.svg"))
      .toBe("data/household-spending-stacked-mobile.svg");
    expect(resolveMobileChartSource("https://storage.example/data/tax-breakdown.svg?v=3"))
      .toBe("https://storage.example/data/tax-breakdown-mobile.svg?v=3");
    expect(resolveMobileChartSource("data/industry-composition.svg"))
      .toBe("data/industry-composition-mobile.svg");
    expect(resolveMobileChartSource("data/industry-composition-mobile.svg")).toBeNull();
  });

  it("treats only ranking cards as fixed 2:3 portraits", () => {
    expect(isResponsiveRankingChart("data/golf-ranking.svg")).toBe(true);
    expect(isResponsiveRankingChart("data/tax-breakdown.svg")).toBe(false);
    expect(isResponsiveRankingChart("data/golf-ranking-mobile.svg")).toBe(false);
  });
});
