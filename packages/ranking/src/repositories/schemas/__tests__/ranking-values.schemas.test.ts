import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  RankingValueSchema,
  parseRankingValuesKeySnapshot,
} from "../ranking-values.schemas";

const baseValue = {
  metricKey: "population",
  areaType: "prefecture",
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2020",
  yearName: "2020年",
  value: 14000000,
  unit: "人",
  rank: 1,
};

const baseSnapshot = {
  generatedAt: "2026-06-20T00:00:00.000Z",
  rankingKey: "population",
  areaType: "prefecture",
  partitions: [
    {
      yearCode: "2020",
      count: 1,
      values: [baseValue],
    },
  ],
};

describe("RankingValueSchema", () => {
  it("valid RankingValue を parse できる", () => {
    const result = RankingValueSchema.parse(baseValue);

    expect(result.metricKey).toBe("population");
    expect(result.rank).toBe(1);
  });

  it("value は null を許可する", () => {
    const result = RankingValueSchema.parse({ ...baseValue, value: null });

    expect(result.value).toBeNull();
  });

  it("rank が数値でない場合は拒否する", () => {
    expect(() => RankingValueSchema.parse({ ...baseValue, rank: "1" })).toThrow();
  });
});

describe("parseRankingValuesKeySnapshot", () => {
  it("valid snapshot を parse できる", () => {
    const result = parseRankingValuesKeySnapshot(baseSnapshot);

    expect(result.rankingKey).toBe("population");
    expect(result.partitions[0]?.values[0]?.areaCode).toBe("13000");
  });

  it("partitions が配列でない場合は拒否する", () => {
    expect(() =>
      parseRankingValuesKeySnapshot({ ...baseSnapshot, partitions: null }),
    ).toThrow("ランキング値スナップショットが不正です");
  });

  it("value が finite number でない場合は拒否する", () => {
    expect(() =>
      parseRankingValuesKeySnapshot({
        ...baseSnapshot,
        partitions: [
          {
            yearCode: "2020",
            count: 1,
            values: [{ ...baseValue, value: Number.NaN }],
          },
        ],
      }),
    ).toThrow("ランキング値スナップショットが不正です");
  });
});
