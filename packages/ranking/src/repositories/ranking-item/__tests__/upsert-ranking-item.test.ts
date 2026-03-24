import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  rankingItems: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import type { RankingItem } from "../../../types";
import { upsertRankingItem } from "../upsert-ranking-item";

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

const testItem: RankingItem = {
  rankingKey: "test-key",
  areaType: "prefecture",
  rankingName: "テスト",
  title: "テストタイトル",
  unit: "件",
  dataSourceId: "estat",
  sourceConfig: { survey: { name: "test" }, statsDataId: "001" },
  availableYears: [{ yearCode: "2022", yearName: "2022年" }],
  isActive: true,
  isFeatured: false,
  featuredOrder: 0,
  valueDisplay: {},
  visualization: { colorScheme: "interpolateBlues", colorSchemeType: "sequential" },
  calculation: { isCalculated: false },
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

describe("upsertRankingItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should upsert successfully", async () => {
    const mockDb = { insert: vi.fn().mockReturnValue(mockQuery(undefined)) } as any;

    const result = await upsertRankingItem(testItem, mockDb);

    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockRejectedValue(new Error("constraint violation")),
        }),
      }),
    } as any;

    const result = await upsertRankingItem(testItem, mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("constraint violation");
    }
  });
});
