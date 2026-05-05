import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  metrics: {},
  stats: {
    metricId: "metric_id",
    areaType: "area_type",
    areaCode: "area_code",
    yearCode: "year_code",
  },
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import type { RankingValue } from "../../../types";
import { upsertRankingValues } from "../upsert-ranking-values";

function makeSelectProxy(resolvedValue: unknown): any {
  const p: any = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "then") return (resolve: any) => resolve(resolvedValue);
        return vi.fn().mockReturnValue(p);
      },
    }
  );
  return p;
}

const testValues: RankingValue[] = [
  {
    areaType: "prefecture",
    areaCode: "01000",
    areaName: "北海道",
    yearCode: "2022",
    yearName: "2022年度",
    metricKey: "gdp",
    value: 100,
    unit: "億円",
    rank: 1,
  },
];

describe("upsertRankingValues", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should upsert successfully", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue(makeSelectProxy([{ id: 1 }])),
      insert: vi.fn().mockReturnValue(makeSelectProxy(undefined)),
    } as any;

    const result = await upsertRankingValues("gdp", "prefecture", "2022", testValues, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(1);
    }
  });

  it("should return 0 for empty values array", async () => {
    const mockDb = { insert: vi.fn() } as any;

    const result = await upsertRankingValues("gdp", "prefecture", "2022", [], mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(0);
    }
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue(makeSelectProxy([{ id: 1 }])),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockRejectedValue(new Error("upsert failed")),
        }),
      }),
    } as any;

    const result = await upsertRankingValues("gdp", "prefecture", "2022", testValues, mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("upsert failed");
    }
  });
});
