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

const LINE_PROPS = {
  estatParams: { statsDataId: "0000010101", cdCat01: "A1101" },
  labels: ["総人口"],
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

  it("全国 (00000) は全都道府県取得経路を通り、全国行の値を描画する", async () => {
    fetchFormattedStats.mockResolvedValue([
      row("00000", "2024", 123_802_000),
      row("01000", "2024", 5_000_000),
      row("02000", "2024", 1_000_000),
    ]);

    const result = await fetchDbChartDataAction("line-chart", LINE_PROPS, "00000");

    expect(result?.type).toBe("line");
    const points = result && result.type === "line" ? result.data.data : [];
    // ★県平均 (3,000,000) になったら全国行を捨てている (2026-08-04 の不具合)
    expect(points[0]["総人口"]).toBe(123_802_000);
    expect(mockFetchEstatData).not.toHaveBeenCalled();
  });

  it("都道府県コード指定時は fetchEstatData 経由のまま (全国ロジックを通さない)", async () => {
    mockFetchEstatData.mockResolvedValue({
      data: [row("13000", "2024", 14_000_000)],
    });

    const result = await fetchDbChartDataAction("line-chart", LINE_PROPS, "13000");

    expect(mockFetchEstatData).toHaveBeenCalledWith(
      "13000",
      expect.objectContaining({ statsDataId: "0000010101" }),
    );
    expect(fetchFormattedStats).not.toHaveBeenCalled();
    const points = result && result.type === "line" ? result.data.data : [];
    expect(points[0]["総人口"]).toBe(14_000_000);
  });
});
