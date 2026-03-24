import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  correlationAnalysis: {},
  rankingItems: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { findHighlyCorrelated } from "../find-highly-correlated";

const scatterData = [
  { areaCode: "01000", areaName: "北海道", x: 1, y: 2 },
];

describe("findHighlyCorrelated", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return correlated items with metadata", async () => {
    const corrRows = [{
      rankingKeyX: "targetKey",
      rankingKeyY: "otherKey",
      pearsonR: 0.95,
      scatterData: JSON.stringify(scatterData),
    }];
    const itemRows = [{
      ranking_key: "otherKey",
      title: "Other Ranking",
      subtitle: null,
      unit: "件",
    }];

    // Need to support two separate select() calls (correlations then items)
    const selectCall = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(corrRows),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(itemRows),
        }),
      });

    const mockDb = { select: selectCall } as any;

    const result = await findHighlyCorrelated("targetKey", 5, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].rankingKey).toBe("otherKey");
      expect(result.data[0].title).toBe("Other Ranking");
      expect(result.data[0].pearsonR).toBe(0.95);
      expect(result.data[0].scatterData).toEqual(scatterData);
    }
  });

  it("should swap x/y when target is keyY", async () => {
    const corrRows = [{
      rankingKeyX: "otherKey",
      rankingKeyY: "targetKey",
      pearsonR: -0.8,
      scatterData: JSON.stringify(scatterData),
    }];
    const itemRows = [{
      ranking_key: "otherKey",
      title: "Other",
      subtitle: null,
      unit: "人",
    }];

    const selectCall = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(corrRows),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(itemRows),
        }),
      });

    const mockDb = { select: selectCall } as any;
    const result = await findHighlyCorrelated("targetKey", 5, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].scatterData[0].x).toBe(2);
      expect(result.data[0].scatterData[0].y).toBe(1);
    }
  });

  it("should return empty array when no correlations found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    } as any;

    const result = await findHighlyCorrelated("targetKey", 5, mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("should return error on DB failure", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error("connection error")),
            }),
          }),
        }),
      }),
    } as any;

    const result = await findHighlyCorrelated("targetKey", 5, mockDb);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("connection error");
    }
  });
});
