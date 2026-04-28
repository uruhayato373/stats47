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

import {
  readCorrelationStatsFromR2,
  readTopCorrelationsFromR2,
} from "../read-correlation-snapshot";
import {
  CORRELATION_STATS_KEY,
  CORRELATION_TOP_PAIRS_KEY,
} from "../../types/snapshot";

function makePair(rankingKeyX: string, rankingKeyY: string) {
  return {
    rankingKeyX,
    rankingKeyY,
    titleX: rankingKeyX,
    titleY: rankingKeyY,
    normalizationBasisX: null,
    normalizationBasisY: null,
    pearsonR: 0.5,
    effectiveR: 0.5,
    partialRPopulation: null,
    partialRArea: null,
    partialRAging: null,
    partialRDensity: null,
  };
}

describe("readTopCorrelationsFromR2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("snapshot 取得 → 上位 N 件を slice して返す", async () => {
    const pairs = Array.from({ length: 50 }, (_, i) =>
      makePair(`x${i}`, `y${i}`),
    );
    fetchFromR2AsJsonMock.mockResolvedValueOnce({
      generatedAt: "2026-04-29T00:00:00Z",
      pairs,
    });

    const result = await readTopCorrelationsFromR2(20);

    expect(fetchFromR2AsJsonMock).toHaveBeenCalledWith(CORRELATION_TOP_PAIRS_KEY);
    expect(result).toHaveLength(20);
    expect(result[0].rankingKeyX).toBe("x0");
  });

  it("snapshot 不在時は空配列を返す（500 を防ぐ）", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce(null);

    const result = await readTopCorrelationsFromR2();

    expect(result).toEqual([]);
  });
});

describe("readCorrelationStatsFromR2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("snapshot から total / strong を返す", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce({
      generatedAt: "2026-04-29T00:00:00Z",
      total: 1500,
      strong: 350,
    });

    const result = await readCorrelationStatsFromR2();

    expect(fetchFromR2AsJsonMock).toHaveBeenCalledWith(CORRELATION_STATS_KEY);
    expect(result).toEqual({ total: 1500, strong: 350 });
  });

  it("snapshot 不在時は { total: 0, strong: 0 } を返す", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce(null);

    const result = await readCorrelationStatsFromR2();

    expect(result).toEqual({ total: 0, strong: 0 });
  });
});
