import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PageComponent } from "@/components/stat-charts";

const { fetchDbChartDataAction, fetchPopulationPyramidAction } = vi.hoisted(() => ({
  fetchDbChartDataAction: vi.fn(),
  fetchPopulationPyramidAction: vi.fn(),
}));

vi.mock("../../actions", () => ({
  fetchDbChartDataAction,
  fetchPopulationPyramidAction,
}));

import { loadThemeChartResult } from "../theme-chart-result";

const CHART = {
  id: 1,
  componentKey: "fixture-line",
  componentType: "line-chart",
  title: "fixture",
  componentProps: {},
  sortOrder: 1,
} as unknown as PageComponent;

describe("loadThemeChartResult state contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("空のreader結果はno-dataとして表示障害と区別する", async () => {
    fetchDbChartDataAction.mockResolvedValue(null);
    await expect(loadThemeChartResult(CHART, "13000")).resolves.toEqual({
      state: "no-data",
    });
  });

  it("reader例外はsource-unavailableとして空データに化けさせない", async () => {
    fetchDbChartDataAction.mockRejectedValue(new Error("R2 503"));
    await expect(loadThemeChartResult(CHART, "13000")).resolves.toEqual({
      state: "source-unavailable",
    });
  });

  it("非空chartはunit/year/series contractを保ってreadyにする", async () => {
    const result = {
      type: "line",
      data: { xAxisKey: "year", data: [], lines: [], unit: "人" },
      contract: { unit: "人", year: "2024", seriesCount: 1 },
    };
    fetchDbChartDataAction.mockResolvedValue(result);
    await expect(loadThemeChartResult(CHART, "13000")).resolves.toEqual({
      state: "ready",
      result,
    });
  });
});
