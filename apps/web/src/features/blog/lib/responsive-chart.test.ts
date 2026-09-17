import { describe, expect, it } from "vitest";

import { resolveMobileChartSource } from "./responsive-chart";

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
});
