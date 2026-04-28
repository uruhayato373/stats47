import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { fetchFromR2AsJsonMock } = vi.hoisted(() => ({
  fetchFromR2AsJsonMock: vi.fn(),
}));

vi.mock("@stats47/r2-storage/server", () => ({
  fetchFromR2AsJson: fetchFromR2AsJsonMock,
  saveToR2: vi.fn(),
}));

import { readHighlyCorrelatedFromR2 } from "../read-correlation-by-key";
import { correlationByKeyPath } from "../../types/snapshot";

function makePair(otherKey: string, pearsonR: number) {
  return {
    rankingKey: otherKey,
    title: otherKey,
    subtitle: null,
    unit: "件",
    pearsonR,
    partialRPopulation: null,
    partialRArea: null,
    partialRAging: null,
    partialRDensity: null,
    scatterData: [],
  };
}

describe("readHighlyCorrelatedFromR2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("snapshot 取得 → 上位 N 件を slice して ok で返す", async () => {
    const pairs = Array.from({ length: 20 }, (_, i) =>
      makePair(`other-${i}`, 0.9 - i * 0.01),
    );
    fetchFromR2AsJsonMock.mockResolvedValueOnce({
      generatedAt: "2026-04-29T00:00:00Z",
      rankingKey: "x",
      pairs,
    });

    const result = await readHighlyCorrelatedFromR2("x", 10);

    expect(fetchFromR2AsJsonMock).toHaveBeenCalledWith(correlationByKeyPath("x"));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(10);
      expect(result.data[0].rankingKey).toBe("other-0");
    }
  });

  it("snapshot 不在時は ok([]) を返す（500 を防ぐ）", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce(null);

    const result = await readHighlyCorrelatedFromR2("missing-key");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("fetch が throw した場合は err を返す", async () => {
    fetchFromR2AsJsonMock.mockRejectedValueOnce(new Error("R2 down"));

    const result = await readHighlyCorrelatedFromR2("x");

    expect(result.success).toBe(false);
  });
});
