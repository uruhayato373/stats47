import { buildPopulationPyramidSeriesRefs } from "@stats47/data-configs/theme-catalog";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { readStatsValues } = vi.hoisted(() => ({ readStatsValues: vi.fn() }));

vi.mock("@stats47/stats-r2/readers", () => ({
  readStatsValues: (...args: unknown[]) => readStatsValues(...args),
}));

import { fetchPopulationPyramidAction } from "../fetch-population-pyramid";

const refs = buildPopulationPyramidSeriesRefs();

function payload(metricKey: string, index: number, years = ["2023", "2024"]) {
  return {
    metricKey,
    entityKind: "prefecture",
    rows: years.map((year) => ({
      areaCode: "28000",
      areaName: "兵庫県",
      yearCode: year,
      yearName: `${year}年`,
      value: index + 1,
      unit: "人",
    })),
    meta: { rowCount: years.length, yearRange: [years[0], years.at(-1)], areaCount: 1, generatedAt: "fixture" },
  };
}

describe("fetchPopulationPyramidAction — R2 typed refs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("34系列に共通する最新年だけを使い、男女の符号を決定的に付ける", async () => {
    readStatsValues.mockImplementation(async (metricKey: string) => {
      const index = refs.findIndex((ref) => ref.metricKey === metricKey);
      return payload(metricKey, index, index === 0 ? ["2023"] : ["2023", "2024"]);
    });

    const result = await fetchPopulationPyramidAction("28000", refs);

    expect(readStatsValues).toHaveBeenCalledTimes(34);
    expect(result?.yearName).toBe("2023年");
    expect(result?.pyramidData).toHaveLength(17);
    expect(result?.pyramidData[0]).toEqual({ ageGroup: "0〜4歳", male: -1, female: 2 });
  });

  it("1系列でも欠測なら0埋めせずno-dataにする", async () => {
    readStatsValues.mockImplementation(async (metricKey: string) => {
      const index = refs.findIndex((ref) => ref.metricKey === metricKey);
      const value = payload(metricKey, index, ["2023"]);
      if (index === 10) value.rows[0]!.value = null as unknown as number;
      return value;
    });

    await expect(fetchPopulationPyramidAction("28000", refs)).resolves.toBeNull();
  });

  it("34系列の契約が崩れた入力はR2を読まず拒否する", async () => {
    await expect(fetchPopulationPyramidAction("28000", refs.slice(1))).resolves.toBeNull();
    expect(readStatsValues).not.toHaveBeenCalled();
  });
});
