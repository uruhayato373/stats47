import { describe, expect, it, vi } from "vitest";

vi.mock("@stats47/stats-r2/readers", () => ({ readStatsValues: vi.fn() }));
vi.mock("@stats47/r2-storage/server", () => ({
  assertR2WriteAllowed: vi.fn(),
  carryTimestamp: vi.fn(),
  writeR2Staging: vi.fn(),
  readPublishedSnapshot: vi.fn(),
}));

import { buildPartitions } from "../generate-ranking-values";

/**
 * DATA-WAGE-TEACHER-COVERAGE-01 (2026-11-14 オーナー決定): 推計 10 人未満の県・年は順位から外して参考値にする。
 * 2021 年の小中学校教員の年収では、岩手県の推計の労働者数が 0 人で 39 位に入っていた。
 */
const row = (areaCode: string, areaName: string, value: number, extra: Record<string, unknown>) => ({
  areaCode, areaName, yearCode: "2021", yearName: "2021年", value, unit: "万円", ...extra,
});

describe("buildPartitions の参考値", () => {
  it("推計の人数が下限未満の行は順位に入れず、参考値として別に配る", () => {
    const rows = [
      row("23000", "愛知県", 800, { rank: 1, sampleCount: 2400 }),
      row("13000", "東京都", 700, { rank: 2, sampleCount: 3100 }),
      row("03000", "岩手県", 650, { rank: null, sampleCount: 0, reference: true }),
    ];
    const [partition] = buildPartitions("school-teacher-annual-income", rows, "all");
    expect(partition?.values.map((v) => [v.areaCode, v.rank, v.sampleCount])).toEqual([
      ["23000", 1, 2400],
      ["13000", 2, 3100],
    ]);
    expect(partition?.count).toBe(2);
    expect(partition?.referenceValues).toEqual([
      expect.objectContaining({ areaCode: "03000", areaName: "岩手県", value: 650, sampleCount: 0 }),
    ]);
  });

  it("正典が順位を持たない年に順位を導くときも、参考値の県を数えない", () => {
    const rows = [
      row("03000", "岩手県", 900, { sampleCount: 5, reference: true }),
      row("23000", "愛知県", 800, { sampleCount: 2400 }),
      row("13000", "東京都", 700, { sampleCount: 3100 }),
    ];
    const [partition] = buildPartitions("school-teacher-annual-income", rows, "all");
    expect(partition?.values.map((v) => [v.areaCode, v.rank])).toEqual([["23000", 1], ["13000", 2]]);
    expect(partition?.referenceValues?.map((v) => v.areaCode)).toEqual(["03000"]);
  });

  it("推計の人数を持たない指標の partition は従来の形のまま (referenceValues を足さない)", () => {
    const [partition] = buildPartitions("total-population", [
      row("13000", "東京都", 1400, { rank: 1 }),
      row("27000", "大阪府", 880, { rank: 2 }),
    ], "all");
    expect(partition).not.toHaveProperty("referenceValues");
    expect(partition?.values[0]).not.toHaveProperty("sampleCount");
  });
});
