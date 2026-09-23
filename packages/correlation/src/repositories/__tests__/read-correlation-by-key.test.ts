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
  createSnapshotReader: (options: {
    key: string;
    parse: (value: unknown) => unknown;
    select: (value: unknown) => unknown;
  }) => ({
    readResult: async () => {
      try {
        const value = await fetchFromR2AsJsonMock(options.key);
        if (value === null) return { status: "no-data", attempts: 1 };
        try {
          return { status: "ok", data: options.select(options.parse(value)), attempts: 1 };
        } catch (error) {
          return { status: "schema-invalid", reason: "schema-invalid", error, attempts: 1 };
        }
      } catch (error) {
        return { status: "source-unavailable", reason: "transport-error", error, attempts: 1 };
      }
    },
  }),
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

  // 画面は populationAdjustedR を表示する。旧形式 (2026-09-23 以前・再生成されない除外指標) の
  // snapshot を schema-invalid にするとセクションごと消えるため、人口の偏相関から補う。
  it("populationAdjustedR を持たない旧 snapshot は人口の偏相関から補って返す", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce({
      generatedAt: "2026-09-05T00:00:00Z",
      rankingKey: "x",
      pairs: [
        { ...makePair("proxy", 0.99), partialRPopulation: 0.2, partialRArea: 0.95 },
        makePair("no-partial", 0.5),
        { ...makePair("new", -0.6), populationAdjustedR: -0.4 },
      ],
    });

    const result = await readHighlyCorrelatedFromR2("x");

    expect(result.success).toBe(true);
    if (result.success) {
      // 旧 snapshot は生の |r| 順 (0.99, 0.5, -0.6) で並ぶが、表示値の絶対値順に並べ直す
      expect(result.data.map((p) => [p.rankingKey, p.populationAdjustedR])).toEqual([
        ["no-partial", 0.5],
        ["new", -0.4],
        ["proxy", 0.2],
      ]);
    }
  });

  it("fetch が throw した場合は err を返す", async () => {
    fetchFromR2AsJsonMock.mockRejectedValueOnce(new Error("R2 down"));

    const result = await readHighlyCorrelatedFromR2("x");

    expect(result.success).toBe(false);
  });
});
