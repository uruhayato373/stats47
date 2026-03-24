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

import { listRankingItems } from "../list-ranking-items";

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

describe("listRankingItems", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return all items when no options provided", async () => {
    const rows = [
      { rankingKey: "a", title: "A" },
      { rankingKey: "b", title: "B" },
    ];
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(rows)) } as any;

    const result = await listRankingItems(undefined, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it("should return empty array when no items exist", async () => {
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([])) } as any;

    const result = await listRankingItems(undefined, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("should filter by areaType when provided", async () => {
    const rows = [{ rankingKey: "a", areaType: "prefecture" }];
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(rows)) } as any;

    const result = await listRankingItems({ areaType: "prefecture" }, mockDb);

    expect(result.success).toBe(true);
  });

  it("should return error on failure", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              $dynamic: vi.fn().mockRejectedValue(new Error("query failed")),
            }),
          }),
        }),
      }),
    } as any;

    const result = await listRankingItems(undefined, mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("query failed");
    }
  });

  it("should skip items that fail parsing", async () => {
    const { parseRankingItemDB } = await import("../../schemas/ranking-items.schemas");
    const rows = [
      { rankingKey: "a", title: "A" },
      { rankingKey: "bad", title: "Bad" },
    ];
    vi.mocked(parseRankingItemDB)
      .mockReturnValueOnce(rows[0] as any)
      .mockImplementationOnce(() => { throw new Error("parse error"); });

    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(rows)) } as any;

    const result = await listRankingItems(undefined, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].rankingKey).toBe("a");
    }
  });
});
