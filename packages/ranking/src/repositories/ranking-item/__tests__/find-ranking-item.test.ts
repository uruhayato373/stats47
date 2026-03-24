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

import { findRankingItem } from "../find-ranking-item";

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

describe("findRankingItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return item when found by key and areaType", async () => {
    const row = { rankingKey: "gdp", areaType: "prefecture", title: "GDP" };
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([row])) } as any;

    const result = await findRankingItem("gdp", "prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(row);
    }
  });

  it("should return null when not found", async () => {
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([])) } as any;

    const result = await findRankingItem("missing", "prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return error on failure", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error("connection lost")),
          }),
        }),
      }),
    } as any;

    const result = await findRankingItem("key", "prefecture", mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("connection lost");
    }
  });
});
