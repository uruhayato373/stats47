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

  it("手動投入 metric で正典の行が rank を持たない年は、値の降順・同値同順位で rank を導出する", async () => {
    const row = (areaCode: string, value: number | null) => ({
      areaCode, areaName: areaCode, yearCode: "2024", yearName: "2024年", value, unit: "g/日",
    });
    vi.mocked(readStatsValues).mockResolvedValue({
      metricKey: "manual-metric",
      entityKind: "prefecture",
      rows: [row("01000", 8.2), row("02000", 9.8), row("03000", 8.2), row("04000", null)],
      meta: { rowCount: 4, yearRange: ["2024", "2024"], areaCount: 4, generatedAt: "2026-10-09T00:00:00.000Z" },
    } as never);

    const result = await listRankingValues("manual-metric", "prefecture", "2024");

    expect(result.success).toBe(true);
    if (!result.success) return;
    const rankOf = Object.fromEntries(result.data.map((v) => [v.areaCode, v.rank]));
    expect(rankOf).toEqual({ "02000": 1, "01000": 2, "03000": 2 });
  });

  it("正典が rank を持つ年は導出せず、そのまま使う (rank の無い行は除外)", async () => {
    vi.mocked(readStatsValues).mockResolvedValue({
      metricKey: "sample-metric",
      entityKind: "prefecture",
      rows: [
        { areaCode: "01000", areaName: "北海道", yearCode: "2024", yearName: "2024年", value: 1, unit: "件", rank: 5 },
        { areaCode: "02000", areaName: "青森県", yearCode: "2024", yearName: "2024年", value: 9, unit: "件", rank: null },
      ],
      meta: { rowCount: 2, yearRange: ["2024", "2024"], areaCount: 2, generatedAt: "2026-10-09T00:00:00.000Z" },
    } as never);

    const result = await listRankingValues("sample-metric", "prefecture", "2024");

    expect(result.success && result.data.map((v) => [v.areaCode, v.rank])).toEqual([["01000", 5]]);
  });
});
