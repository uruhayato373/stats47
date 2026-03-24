import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  correlationAnalysis: {},
}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { findCorrelationPair } from "../find-correlation-pair";

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

const scatterData = [
  { areaCode: "01000", areaName: "北海道", x: 1, y: 2 },
  { areaCode: "13000", areaName: "東京都", x: 3, y: 4 },
];

describe("findCorrelationPair", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return pair when found in forward direction", async () => {
    const rows = [{
      rankingKeyX: "keyA",
      rankingKeyY: "keyB",
      pearsonR: 0.85,
      scatterData: JSON.stringify(scatterData),
    }];
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(rows)) } as any;

    const result = await findCorrelationPair("keyA", "keyB", mockDb);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.pearsonR).toBe(0.85);
      expect(result.data.scatterData[0].x).toBe(1);
      expect(result.data.scatterData[0].y).toBe(2);
    }
  });

  it("should swap x/y when found in reverse direction", async () => {
    const rows = [{
      rankingKeyX: "keyB",
      rankingKeyY: "keyA",
      pearsonR: 0.85,
      scatterData: JSON.stringify(scatterData),
    }];
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(rows)) } as any;

    const result = await findCorrelationPair("keyA", "keyB", mockDb);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.scatterData[0].x).toBe(2);
      expect(result.data.scatterData[0].y).toBe(1);
    }
  });

  it("should return null when not found", async () => {
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery([])) } as any;

    const result = await findCorrelationPair("a", "b", mockDb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should handle invalid JSON scatter data gracefully", async () => {
    const rows = [{
      rankingKeyX: "keyA",
      rankingKeyY: "keyB",
      pearsonR: 0.5,
      scatterData: "invalid json",
    }];
    const mockDb = { select: vi.fn().mockReturnValue(mockQuery(rows)) } as any;

    const result = await findCorrelationPair("keyA", "keyB", mockDb);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.scatterData).toEqual([]);
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

    const result = await findCorrelationPair("a", "b", mockDb);

    expect(result.success).toBe(false);
  });
});
