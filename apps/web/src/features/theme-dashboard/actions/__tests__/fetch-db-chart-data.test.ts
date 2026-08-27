import { describe, expect, it, vi, beforeEach } from "vitest";

import { fetchEstatData } from "@/components/stat-charts/server";

import { fetchDbChartDataAction } from "../fetch-db-chart-data";

import type { StatsSchema } from "@stats47/types";

vi.mock("@/components/stat-charts/server", () => ({
  fetchEstatData: vi.fn(),
  getEstatCacheStorage: vi.fn(async () => undefined),
}));

const fetchFormattedStats = vi.fn();
vi.mock("@stats47/estat-api/server", () => ({
  fetchFormattedStats: (...args: unknown[]) => fetchFormattedStats(...args),
}));

const readStatsValues = vi.fn();
vi.mock("@stats47/stats-r2/readers", () => ({
  readStatsValues: (...args: unknown[]) => readStatsValues(...args),
}));

const mockFetchEstatData = vi.mocked(fetchEstatData);

function row(areaCode: string, yearCode: string, value: number): StatsSchema {
  return {
    areaCode,
    areaName: areaCode === "00000" ? "全国" : `area-${areaCode}`,
    yearCode,
    yearName: `${yearCode}年度`,
    metricKey: "total-population",
    value,
    unit: "人",
  } as StatsSchema;
}

function payload(metricKey: string, value: number, unit = "人") {
  return {
    metricKey,
    entityKind: "prefecture",
    rows: [{ ...row("13000", "2023", value), metricKey, unit }],
    meta: { rowCount: 1, yearRange: ["2023", "2023"], areaCount: 1, generatedAt: "2026-08-27" },
  };
}

const LINE_PROPS = {
  seriesRefs: [{ metricKey: "total-population", label: "総人口" }],
};

/**
 * 「全国行 vs 47 県平均」の判定そのものは純粋関数
 * `lib/select-national-series.ts` のテストで固定している。
 * ここは Server Action の配線 (全国は全国系列経路・県はフィルタ経路) だけを見る。
 */
describe("fetchDbChartDataAction — 地域コードごとの取得経路", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("seriesRefs は正典 R2 だけを読み、MetricConfigで合成済みの値をそのまま描画する", async () => {
    readStatsValues
      .mockResolvedValueOnce({
        metricKey: "doctor-annual-income",
        entityKind: "prefecture",
        rows: [row("13000", "2023", 1_234.5)],
        meta: { rowCount: 1, yearRange: ["2023", "2023"], areaCount: 1, generatedAt: "2026-08-25" },
      })
      .mockResolvedValueOnce({
        metricKey: "nurse-annual-income",
        entityKind: "prefecture",
        rows: [row("13000", "2023", 567.8)],
        meta: { rowCount: 1, yearRange: ["2023", "2023"], areaCount: 1, generatedAt: "2026-08-25" },
      });

    const result = await fetchDbChartDataAction(
      "line-chart",
      {
        seriesRefs: [
          { metricKey: "doctor-annual-income", label: "医師", colorRole: "population" },
          { metricKey: "nurse-annual-income", label: "看護師", colorRole: "improve" },
        ],
      },
      "13000",
    );

    expect(readStatsValues).toHaveBeenNthCalledWith(1, "doctor-annual-income", "prefecture");
    expect(readStatsValues).toHaveBeenNthCalledWith(2, "nurse-annual-income", "prefecture");
    expect(mockFetchEstatData).not.toHaveBeenCalled();
    expect(fetchFormattedStats).not.toHaveBeenCalled();
    const points = result && result.type === "line" ? result.data.data : [];
    expect(points[0]).toMatchObject({ 医師: 1_234.5, 看護師: 567.8 });
  });

  it("seriesRefsにcolorRoleが無くても既存seriesColorsを保持する", async () => {
    readStatsValues.mockResolvedValueOnce(payload("doctor-annual-income", 1_234.5));

    const result = await fetchDbChartDataAction(
      "line-chart",
      {
        seriesRefs: [{ metricKey: "doctor-annual-income" }],
        labels: ["医師"],
        seriesColors: ["#123456"],
      },
      "13000",
    );

    expect(result?.type).toBe("line");
    expect(result && result.type === "line" ? result.data.lines[0]?.color : null).toBe("#123456");
  });

  it.each([
    [
      "mixed-chart",
      {
        columnSeriesRefs: [{ metricKey: "active-job-opening-ratio" }],
        lineSeriesRefs: [{ metricKey: "unemployment-rate" }],
        columnLabels: ["求人倍率"],
        lineLabels: ["失業率"],
      },
      [payload("active-job-opening-ratio", 1.4, "倍"), payload("unemployment-rate", 2.5, "％")],
      "mixed",
    ],
    [
      "composition-chart",
      {
        seriesRefs: [
          { metricKey: "local-tax-ratio-pref-finance", label: "地方税", colorRole: "population" },
          { metricKey: "local-allocation-tax-ratio-pref-finance", label: "地方交付税", colorRole: "series-6" },
        ],
      },
      [payload("local-tax-ratio-pref-finance", 40, "％"), payload("local-allocation-tax-ratio-pref-finance", 20, "％")],
      "composition",
    ],
    [
      "donut-chart",
      {
        seriesRefs: [
          { metricKey: "employed-people-ratio-primary", label: "第1次", colorRole: "improve" },
          { metricKey: "employed-people-ratio-secondary", label: "第2次", colorRole: "population" },
        ],
      },
      [payload("employed-people-ratio-primary", 10, "％"), payload("employed-people-ratio-secondary", 20, "％")],
      "donut",
    ],
  ])("%s のtyped refsは同じR2 readerと欠測規則を使う", async (type, props, payloads, expectedType) => {
    for (const value of payloads) readStatsValues.mockResolvedValueOnce(value);
    const result = await fetchDbChartDataAction(type, props, "13000");
    expect(result?.type).toBe(expectedType);
    expect(mockFetchEstatData).not.toHaveBeenCalled();
    expect(fetchFormattedStats).not.toHaveBeenCalled();
  });

  it("typed refsのR2欠落時は直APIへfallbackしない", async () => {
    readStatsValues.mockResolvedValueOnce(null);
    const result = await fetchDbChartDataAction(
      "donut-chart",
      { seriesRefs: [{ metricKey: "employed-people-ratio-primary" }] },
      "13000",
    );
    expect(result).toBeNull();
    expect(mockFetchEstatData).not.toHaveBeenCalled();
    expect(fetchFormattedStats).not.toHaveBeenCalled();
  });

  it.each(["cpi-profile", "cpi-heatmap"])(
    "%s のtyped refsはR2だけを読み、欠測系列を0補完しない",
    async (type) => {
      readStatsValues
        .mockResolvedValueOnce(payload("consumer-price-difference-index-food", 101.2, "（全国=100）"))
        .mockResolvedValueOnce(null);
      const result = await fetchDbChartDataAction(
        type,
        {
          seriesRefs: [
            { metricKey: "consumer-price-difference-index-food", label: "食料", colorRole: "population" },
            { metricKey: "consumer-price-difference-index-housing", label: "住居", colorRole: "count" },
          ],
        },
        "13000",
      );
      expect(result).toBeNull();
      expect(mockFetchEstatData).not.toHaveBeenCalled();
      expect(fetchFormattedStats).not.toHaveBeenCalled();
    },
  );

  it("全国 (00000) は全都道府県取得経路を通り、全国行の値を描画する", async () => {
    readStatsValues.mockResolvedValue({
      metricKey: "total-population",
      entityKind: "prefecture",
      rows: [
        row("00000", "2024", 123_802_000),
        row("01000", "2024", 5_000_000),
        row("02000", "2024", 1_000_000),
      ],
      meta: { rowCount: 3, yearRange: ["2024", "2024"], areaCount: 3, generatedAt: "fixture" },
    });

    const result = await fetchDbChartDataAction("line-chart", LINE_PROPS, "00000");

    expect(result?.type).toBe("line");
    const points = result && result.type === "line" ? result.data.data : [];
    // ★県平均 (3,000,000) になったら全国行を捨てている (2026-08-04 の不具合)
    expect(points[0]["総人口"]).toBe(123_802_000);
    expect(mockFetchEstatData).not.toHaveBeenCalled();
  });

  it("都道府県コード指定時も正典R2を読み、直API互換経路を通さない", async () => {
    readStatsValues.mockResolvedValue({
      metricKey: "total-population",
      entityKind: "prefecture",
      rows: [row("13000", "2024", 14_000_000)],
      meta: { rowCount: 1, yearRange: ["2024", "2024"], areaCount: 1, generatedAt: "fixture" },
    });

    const result = await fetchDbChartDataAction("line-chart", LINE_PROPS, "13000");

    expect(readStatsValues).toHaveBeenCalledWith("total-population", "prefecture");
    expect(mockFetchEstatData).not.toHaveBeenCalled();
    expect(fetchFormattedStats).not.toHaveBeenCalled();
    const points = result && result.type === "line" ? result.data.data : [];
    expect(points[0]["総人口"]).toBe(14_000_000);
  });

  it("全国行が無い系列は47都道府県平均であることを表示契約へ残す", async () => {
    readStatsValues.mockResolvedValue({
      metricKey: "total-population",
      entityKind: "prefecture",
      rows: [row("01000", "2024", 100), row("02000", "2024", 300)],
      meta: { rowCount: 2, yearRange: ["2024", "2024"], areaCount: 2, generatedAt: "fixture" },
    });

    const result = await fetchDbChartDataAction("line-chart", LINE_PROPS, "00000");

    expect(result?.contract.scopeLabel).toBe("47都道府県平均");
  });
});
