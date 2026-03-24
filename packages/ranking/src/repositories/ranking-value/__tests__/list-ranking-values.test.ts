import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  rankingData: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { listRankingValues } from "../list-ranking-values";

function mockQuery(resolvedValue: unknown): any {
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

describe("listRankingValues", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return ranking values successfully", async () => {
    const dbRows = [
      {
        areaType: "prefecture",
        areaCode: "01000",
        areaName: "北海道",
        yearCode: "2022",
        yearName: "2022年",
        categoryCode: "gdp",
        categoryName: "GDP",
        value: 100,
        unit: "億円",
        rank: 1,
      },
      {
        areaType: "prefecture",
        areaCode: "13000",
        areaName: "東京都",
        yearCode: "2022",
        yearName: "2022年",
        categoryCode: "gdp",
        categoryName: "GDP",
        value: 200,
        unit: "億円",
        rank: 2,
      },
    ];
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(dbRows)) } as any;

    const result = await listRankingValues("gdp", "prefecture", "2022", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].areaCode).toBe("01000");
      expect(result.data[0].value).toBe(100);
      expect(result.data[1].areaCode).toBe("13000");
    }
  });

  it("should return empty array when no data exists", async () => {
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([])) } as any;

    const result = await listRankingValues("none", "prefecture", "2022", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("should handle null values gracefully", async () => {
    const dbRows = [
      {
        areaType: "prefecture",
        areaCode: null,
        areaName: null,
        yearCode: null,
        yearName: null,
        categoryCode: null,
        categoryName: null,
        value: null,
        unit: null,
        rank: null,
      },
    ];
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(dbRows)) } as any;

    const result = await listRankingValues("key", "prefecture", "2022", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].areaCode).toBe("");
      expect(result.data[0].value).toBe(0);
      expect(result.data[0].rank).toBe(0);
    }
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    } as any;

    const result = await listRankingValues("key", "prefecture", "2022", mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("DB error");
    }
  });
});
