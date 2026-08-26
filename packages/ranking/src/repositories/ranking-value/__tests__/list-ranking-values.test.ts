import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { error: vi.fn() },
}));
vi.mock("@stats47/stats-r2", () => ({
  readStatsValues: vi.fn(),
}));

import { readStatsValues } from "@stats47/stats-r2";

import { listRankingValues } from "../list-ranking-values";

describe("listRankingValues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未観測のnull行を除外し、実在する0は観測値として残す", async () => {
    vi.mocked(readStatsValues).mockResolvedValue({
      metricKey: "sample-metric",
      entityKind: "prefecture",
      rows: [
        {
          areaCode: "01000",
          areaName: "北海道",
          yearCode: "2024",
          yearName: "2024年",
          value: 12,
          unit: "件",
          rank: 1,
        },
        {
          areaCode: "02000",
          areaName: "青森県",
          yearCode: "2024",
          yearName: "2024年",
          value: null,
          unit: "件",
          rank: null,
        },
        {
          areaCode: "03000",
          areaName: "岩手県",
          yearCode: "2024",
          yearName: "2024年",
          value: 0,
          unit: "件",
          rank: 2,
        },
      ],
      meta: {
        rowCount: 3,
        yearRange: ["2024", "2024"],
        areaCount: 3,
        generatedAt: "2026-08-25T00:00:00.000Z",
      },
    });

    const result = await listRankingValues(
      "sample-metric",
      "prefecture",
      "2024",
    );

    expect(result).toEqual({
      success: true,
      data: [
        expect.objectContaining({ areaCode: "01000", value: 12, rank: 1 }),
        expect.objectContaining({ areaCode: "03000", value: 0, rank: 2 }),
      ],
    });
  });
});
