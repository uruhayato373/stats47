import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  rankingItems: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../../schemas/ranking-items.schemas", () => ({
  parseRankingItemDB: vi.fn((row: any) => row),
}));
vi.mock("../../shared/ranking-item-selection", () => ({
  rankingItemSelection: {},
}));

import { findRankingItemByKey } from "../find-ranking-item-by-key";

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

describe("findRankingItemByKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return the item when found", async () => {
    const row = { rankingKey: "gdp", areaType: "prefecture", title: "GDP" };
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([row])) } as any;

    const result = await findRankingItemByKey("gdp", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(row);
    }
  });

  it("should return null when not found", async () => {
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([])) } as any;

    const result = await findRankingItemByKey("nonexistent", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      }),
    } as any;

    const result = await findRankingItemByKey("key", mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("DB error");
    }
  });
});
