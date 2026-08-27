import { beforeEach, describe, expect, it, vi } from "vitest";

const { readJapanSeries, readStatsValues } = vi.hoisted(() => ({
  readJapanSeries: vi.fn(),
  readStatsValues: vi.fn(),
}));

vi.mock("@stats47/stats-r2/readers", () => ({
  readJapanSeries: (...args: unknown[]) => readJapanSeries(...args),
  readStatsValues: (...args: unknown[]) => readStatsValues(...args),
}));

import {
  fetchEstatData,
  fetchEstatDataAllAreas,
} from "../fetchEstatData";

const params = { statsDataId: "0000010101", cdCat01: "A1101" };

describe("legacy stat params — MetricConfigから正典R2へ解決", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readStatsValues.mockResolvedValue({
      metricKey: "total-population",
      entityKind: "prefecture",
      rows: [
        { areaCode: "13000", areaName: "東京都", yearCode: "2024", yearName: "2024年", value: 14, unit: "人" },
        { areaCode: "28000", areaName: "兵庫県", yearCode: "2024", yearName: "2024年", value: 5, unit: "人" },
      ],
      meta: { rowCount: 2, yearRange: ["2024", "2024"], areaCount: 2, generatedAt: "fixture" },
    });
    readJapanSeries.mockResolvedValue({
      rows: [{ yearCode: "2024", yearName: "2024年", value: 124, unit: "人" }],
    });
  });

  it("生parameterをtotal-populationへ一意に解決し、指定県だけを返す", async () => {
    const result = await fetchEstatData("28000", params);
    expect(readStatsValues).toHaveBeenCalledWith("total-population", "prefecture");
    expect(result).toMatchObject({ data: [{ areaCode: "28000", value: 5, metricKey: "total-population" }] });
  });

  it("全地域取得はR2の47県系列と利用可能な日本系列を結合する", async () => {
    const result = await fetchEstatDataAllAreas(params);
    expect("data" in result ? result.data.map((row) => row.areaCode) : []).toEqual([
      "13000",
      "28000",
      "00000",
    ]);
  });

  it("MetricConfigへ解決できないparameterは外部APIへfallbackしない", async () => {
    const result = await fetchEstatData("28000", { statsDataId: "unknown", cdCat01: "X" });
    expect(result).toEqual({ error: "データが見つかりません" });
    expect(readStatsValues).not.toHaveBeenCalled();
  });
});
