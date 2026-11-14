import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@stats47/r2-storage/server", () => ({ fetchFromR2AsJson: vi.fn() }));
vi.mock("../../ranking-item", () => ({ readRankingItemFromR2: vi.fn() }));

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { readAllYearsRankingValuesFromR2, readRankingValuesFromR2 } from "../read-ranking-values-from-r2";

const KEY = "sample-metric";
const value = {
  metricKey: KEY, areaType: "prefecture", areaCode: "13000", areaName: "東京都",
  yearCode: "2024", yearName: "2024年", value: 100, unit: "人", rank: 1,
};

/**
 * values.json の generatedAt は「中身が最後に変わった生成の時刻」(generate-ranking-values.ts が
 * 前回配信と同じ中身なら引き継ぐ)。年次の統計は 1 年近く変わらないのが正常なので、
 * 時刻の古さを読むたびに警告すると、ほぼ全指標のページ描画で誤った警告が出る。
 */
describe("values.json の generatedAt が古いだけでは警告しない", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchFromR2AsJson).mockResolvedValue({
      generatedAt: "2025-11-01T03:00:00.000Z",
      rankingKey: KEY,
      areaType: "prefecture",
      partitions: [{ yearCode: "2024", count: 1, values: [value] }],
    });
  });

  it("1 年前から中身が変わっていない values.json を警告なしで読む", async () => {
    const single = await readRankingValuesFromR2(KEY, "prefecture", "2024");
    const all = await readAllYearsRankingValuesFromR2(KEY, "prefecture");

    expect(single).toEqual({ success: true, data: [value] });
    expect(all).toEqual({ success: true, data: [value] });
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
