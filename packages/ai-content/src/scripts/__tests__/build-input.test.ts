import { beforeEach, describe, expect, it, vi } from "vitest";

const { readItem } = vi.hoisted(() => ({ readItem: vi.fn() }));

vi.mock("@stats47/logger/server", () => ({ logger: { error: vi.fn() } }));
vi.mock("@stats47/stats-r2", () => ({ readStatsValues: vi.fn() }));
vi.mock("@stats47/ranking/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@stats47/ranking/server")>();
  return {
    readRankingItemFromR2: readItem,
    // Keep the real canonical observation reader in this integration boundary.
    listRankingValues: actual.listRankingValues,
  };
});

import { readStatsValues } from "@stats47/stats-r2";

import { buildRankingContentInput } from "../build-input";

describe("buildRankingContentInput canonical observations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readItem.mockResolvedValue({
      success: true,
      data: {
        title: "一般国道実延長",
        unit: "km",
        latestYear: { yearCode: "2023年度" },
      },
    });
  });

  it("uses the selected canonical year without mixing older values or converting null observations to zero", async () => {
    const row = {
      areaCode: "01000", areaName: "北海道", yearCode: "2023",
      yearName: "2023年度", value: 6815.9, unit: "km", rank: 1,
    };
    vi.mocked(readStatsValues).mockResolvedValue({
      metricKey: "road-national-route-length",
      entityKind: "prefecture",
      rows: [
        { ...row, yearCode: "2022", yearName: "2022年度", value: 7361.6 },
        { ...row, areaCode: "03000", areaName: "岩手県", value: 0, rank: 3 },
        { ...row, areaCode: "02000", areaName: "青森県", value: 100, rank: 2 },
        { ...row, areaCode: "05000", areaName: "秋田県", value: null, rank: null },
        row,
      ],
      meta: {
        rowCount: 5, yearRange: ["2022", "2023"], areaCount: 4,
        generatedAt: "2026-09-07T00:00:00.000Z",
      },
    });

    const result = await buildRankingContentInput("road-national-route-length");

    expect(readStatsValues).toHaveBeenCalledWith("road-national-route-length", "prefecture");
    expect(result?.yearCode).toBe("2023");
    expect(result?.input.allPrefectures).toEqual([
      { rank: 1, areaName: "北海道", value: 6815.9 },
      { rank: 2, areaName: "青森県", value: 100 },
      { rank: 3, areaName: "岩手県", value: 0 },
    ]);
    expect(result?.input).toMatchObject({ average: 2305.3, min: 0, max: 6815.9, totalCount: 3 });
  });

  it("passes the metric's own year label so calendar-year metrics are not written as 年度", async () => {
    // 2026-09-27: プロンプトが全 metric に「○年度」と書かせ、暦年の metric (出生数など) の FAQ が「2023年度」になっていた
    const row = { areaCode: "01000", areaName: "北海道", yearCode: "2023", yearName: "2023年", value: 1, unit: "人", rank: 1 };
    vi.mocked(readStatsValues).mockResolvedValue({
      metricKey: "births", entityKind: "prefecture", rows: [row],
      meta: { rowCount: 1, yearRange: ["2023", "2023"], areaCount: 1, generatedAt: "2026-09-27T00:00:00.000Z" },
    });
    readItem.mockResolvedValue({ success: true, data: { title: "出生数", unit: "人", latestYear: { yearCode: "2023", yearName: "2023年" } } });
    expect((await buildRankingContentInput("births"))?.input.yearName).toBe("2023年");

    readItem.mockResolvedValue({ success: true, data: { title: "出生数", unit: "人", latestYear: { yearCode: "2023", yearName: "2023年度" } } });
    expect((await buildRankingContentInput("births"))?.input.yearName).toBe("2023年度");
  });

  it("does not fabricate input when canonical observations are unavailable", async () => {
    vi.mocked(readStatsValues).mockResolvedValue(null);

    expect(await buildRankingContentInput("road-national-route-length")).toBeNull();
  });
});
