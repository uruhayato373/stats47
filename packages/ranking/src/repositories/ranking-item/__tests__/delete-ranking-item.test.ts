import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  rankingItems: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { deleteRankingItem } from "../delete-ranking-item";

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

describe("deleteRankingItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should delete successfully", async () => {
    const mockDb = { delete: vi.fn().mockReturnValue(mockQuery(undefined)) } as any;

    const result = await deleteRankingItem("key1", "prefecture", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("delete failed")),
      }),
    } as any;

    const result = await deleteRankingItem("key1", "prefecture", mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("delete failed");
    }
  });
});
