import { describe, expect, it } from "vitest";

import { isResponsiveRankingChart, resolveDarkChartSource, resolveMobileChartSource } from "./responsive-chart";

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

  it("treats only ranking cards as ranking charts", () => {
    expect(isResponsiveRankingChart("data/golf-ranking.svg")).toBe(true);
    expect(isResponsiveRankingChart("data/tax-breakdown.svg")).toBe(false);
    expect(isResponsiveRankingChart("data/golf-ranking-mobile.svg")).toBe(false);
  });
});

describe("resolveDarkChartSource", () => {
  it("maps ranking and map SVGs to their dark variant", () => {
    expect(resolveDarkChartSource("data/golf-ranking.svg")).toBe("data/golf-ranking-dark.svg");
    expect(resolveDarkChartSource("data/sales-prefecture-rankings.svg?v=2")).toBe("data/sales-prefecture-rankings-dark.svg?v=2");
    expect(resolveDarkChartSource("data/sales-map.svg")).toBe("data/sales-map-dark.svg");
    expect(resolveDarkChartSource("data/sales-tile-grid.svg")).toBe("data/sales-tile-grid-dark.svg");
  });

  it("leaves other charts and variants alone", () => {
    expect(resolveDarkChartSource("data/x-scatter.svg")).toBeNull();
    expect(resolveDarkChartSource("data/tax-breakdown.svg")).toBeNull();
    expect(resolveDarkChartSource("data/golf-ranking-dark.svg")).toBeNull();
    expect(resolveDarkChartSource("data/golf-ranking-mobile.svg")).toBeNull();
  });
});
