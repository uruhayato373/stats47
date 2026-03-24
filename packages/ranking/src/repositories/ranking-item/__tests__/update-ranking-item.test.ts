import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  rankingItems: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { updateRankingItem } from "../update-ranking-item";

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

describe("updateRankingItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should update successfully with valid fields", async () => {
    const mockDb = { update: vi.fn().mockReturnValue(mockQuery(undefined)) } as any;

    const result = await updateRankingItem("key1", "prefecture", { title: "New Title" }, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should return error when no fields to update", async () => {
    const mockDb = { update: vi.fn() } as any;

    const result = await updateRankingItem("key1", "prefecture", {}, mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("No fields to update");
    }
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("should handle JSON serialization for config fields", async () => {
    const mockDb = { update: vi.fn().mockReturnValue(mockQuery(undefined)) } as any;

    const result = await updateRankingItem(
      "key1",
      "prefecture",
      {
        latestYear: { yearCode: "2024", yearName: "2024年" },
        visualization: { colorScheme: "interpolateReds", colorSchemeType: "sequential" },
      },
      mockDb
    );

    expect(result.success).toBe(true);
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("update failed")),
        }),
      }),
    } as any;

    const result = await updateRankingItem("key1", "prefecture", { title: "x" }, mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("update failed");
    }
  });
});
