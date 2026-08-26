import { beforeEach, describe, expect, it, vi } from "vitest";

import { prefetchThemeKpiData } from "../prefetch-theme-kpi";

import type { PageComponent } from "../load-page-components";

const { fetchEstatDataAllAreas, readJapanSeries, readStatsValues } = vi.hoisted(() => ({
  fetchEstatDataAllAreas: vi.fn(),
  readJapanSeries: vi.fn(),
  readStatsValues: vi.fn(),
}));

vi.mock("../fetchEstatData", () => ({
  fetchEstatDataAllAreas: (...args: unknown[]) => fetchEstatDataAllAreas(...args),
}));

vi.mock("@stats47/stats-r2/readers", () => ({
  readJapanSeries: (...args: unknown[]) => readJapanSeries(...args),
  readStatsValues: (...args: unknown[]) => readStatsValues(...args),
}));

function chart(componentProps: Record<string, unknown>): PageComponent {
  return {
    componentKey: "kpi-lf-current-balance",
    componentType: "kpi-card",
    title: "経常収支比率",
    description: null,
    componentProps,
    sourceName: "社会・人口統計体系",
    sourceLink: null,
    rankingLink: "/ranking/current-balance-ratio",
    gridColumnSpan: 12,
    gridColumnSpanTablet: null,
    gridColumnSpanSm: null,
    dataSource: "ranking",
    section: "財政健全度",
    sortOrder: 2,
  };
}

describe("prefetchThemeKpiData — StatSeriesRef", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readStatsValues.mockResolvedValue({
      metricKey: "current-balance-ratio",
      entityKind: "prefecture",
      rows: [
        {
          areaCode: "13000",
          areaName: "東京都",
          yearCode: "2018",
          yearName: "2018年度",
          value: 80.2,
          unit: "％",
        },
        {
          areaCode: "13000",
          areaName: "東京都",
          yearCode: "2022",
          yearName: "2022年度",
          value: 79.5,
          unit: "％",
        },
        {
          areaCode: "14000",
          areaName: "神奈川県",
          yearCode: "2022",
          yearName: "2022年度",
          value: null,
          unit: "％",
        },
      ],
      meta: {
        rowCount: 3,
        yearRange: ["2018", "2022"],
        areaCount: 2,
        generatedAt: "2026-08-26",
      },
    });
    readJapanSeries.mockResolvedValue({
      schemaVersion: 1,
      metricKey: "current-balance-ratio",
      geographyScope: "japan",
      sourceMode: "official",
      rows: [
        {
          yearCode: "2022",
          yearName: "2022年度",
          value: 92.1,
          unit: "％",
        },
      ],
      meta: {
        generatedAt: "2026-08-26",
        configHash: "config",
        recipeHash: "recipe",
        sourceId: "0000010104",
      },
    });
  });

  it("QG2 readerの値・年・unit・欠測を保ち、直APIへfallbackしない", async () => {
    const result = await prefetchThemeKpiData([
      chart({ seriesRefs: [{ metricKey: "current-balance-ratio" }] }),
    ]);

    expect(readStatsValues).toHaveBeenCalledWith("current-balance-ratio", "prefecture");
    expect(readJapanSeries).toHaveBeenCalledWith("current-balance-ratio");
    expect(fetchEstatDataAllAreas).not.toHaveBeenCalled();
    expect(result["kpi-lf-current-balance"]["13000"]).toMatchObject({
      value: 79.5,
      year: "2022年度",
      unit: "％",
    });
    expect(result["kpi-lf-current-balance"]["14000"]).toMatchObject({
      value: null,
      year: "2022年度",
      unit: "％",
    });
    expect(result["kpi-lf-current-balance"]["00000"]).toMatchObject({
      value: 92.1,
      year: "2022年度",
      unit: "％",
    });
  });
});
