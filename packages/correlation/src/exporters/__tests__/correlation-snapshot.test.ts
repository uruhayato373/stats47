import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(),
  correlationAnalysis: { pearsonR: { name: "pearson_r" } },
}));

vi.mock("@stats47/logger/server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { saveToR2Mock, listTopCorrelationsMock } = vi.hoisted(() => ({
  saveToR2Mock: vi.fn(),
  listTopCorrelationsMock: vi.fn(),
}));

vi.mock("@stats47/r2-storage/server", () => ({
  saveToR2: saveToR2Mock,
  fetchFromR2AsJson: vi.fn(),
}));

vi.mock("../../repositories/list-top-correlations", () => ({
  listTopCorrelations: listTopCorrelationsMock,
}));

import { getDrizzle } from "@stats47/database/server";

import { exportCorrelationSnapshot } from "../correlation-snapshot";
import {
  CORRELATION_STATS_KEY,
  CORRELATION_TOP_PAIRS_KEY,
  type CorrelationStatsSnapshot,
  type CorrelationTopPairsSnapshot,
} from "../../types/snapshot";

function makeDrizzleStub(countResult: { total: number; strong: number }) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockResolvedValue([countResult]),
    }),
  };
}

function makePair(rankingKeyX: string, rankingKeyY: string, pearsonR: number) {
  return {
    rankingKeyX,
    rankingKeyY,
    titleX: rankingKeyX,
    titleY: rankingKeyY,
    normalizationBasisX: null,
    normalizationBasisY: null,
    pearsonR,
    effectiveR: pearsonR,
    partialRPopulation: null,
    partialRArea: null,
    partialRAging: null,
    partialRDensity: null,
  };
}

describe("exportCorrelationSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveToR2Mock.mockResolvedValue({
      key: "ignored",
      size: 0,
    });
  });

  it("R2 に top-pairs と stats の 2 ファイルを保存する", async () => {
    const pairs = [
      makePair("a", "b", 0.92),
      makePair("a", "c", 0.85),
      makePair("b", "c", 0.71),
    ];
    listTopCorrelationsMock.mockResolvedValue(pairs);
    vi.mocked(getDrizzle).mockReturnValue(
      makeDrizzleStub({ total: 1234, strong: 56 }) as never,
    );

    const result = await exportCorrelationSnapshot();

    expect(saveToR2Mock).toHaveBeenCalledTimes(2);

    const calls = saveToR2Mock.mock.calls;
    const topPairsCall = calls.find((c) => c[0] === CORRELATION_TOP_PAIRS_KEY);
    const statsCall = calls.find((c) => c[0] === CORRELATION_STATS_KEY);

    expect(topPairsCall).toBeDefined();
    expect(statsCall).toBeDefined();

    const topPairsSnapshot = JSON.parse(
      topPairsCall![1] as string,
    ) as CorrelationTopPairsSnapshot;
    expect(topPairsSnapshot.pairs).toHaveLength(3);
    expect(topPairsSnapshot.pairs[0].rankingKeyX).toBe("a");
    expect(topPairsSnapshot.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const statsSnapshot = JSON.parse(
      statsCall![1] as string,
    ) as CorrelationStatsSnapshot;
    expect(statsSnapshot.total).toBe(1234);
    expect(statsSnapshot.strong).toBe(56);
    expect(statsSnapshot.generatedAt).toBe(topPairsSnapshot.generatedAt);

    expect(result.topPairs.pairCount).toBe(3);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("stats 行の strong が文字列でも数値に変換される", async () => {
    listTopCorrelationsMock.mockResolvedValue([]);
    vi.mocked(getDrizzle).mockReturnValue(
      makeDrizzleStub({ total: 100, strong: "42" as unknown as number }) as never,
    );

    await exportCorrelationSnapshot();

    const statsCall = saveToR2Mock.mock.calls.find(
      (c) => c[0] === CORRELATION_STATS_KEY,
    );
    const statsSnapshot = JSON.parse(
      statsCall![1] as string,
    ) as CorrelationStatsSnapshot;
    expect(statsSnapshot.strong).toBe(42);
    expect(typeof statsSnapshot.strong).toBe("number");
  });
});
