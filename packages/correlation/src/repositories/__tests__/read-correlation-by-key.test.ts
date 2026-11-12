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
  writeR2Staging: vi.fn(),
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
    populationAdjustedR: pearsonR,
    partialRPopulation: null,
    partialRArea: null,
    partialRAging: null,
    partialRDensity: null,
    scatterData: [],
  };
}

function snapshot(groups = { positive: [makePair("p", 0.8)], negative: [makePair("n", -0.7)] }) {
  return { generatedAt: "2026-11-12T00:00:00Z", rankingKey: "x", selectionPolicyVersion: 1, groups };
}
describe("readHighlyCorrelatedFromR2", () => {
  beforeEach(() => vi.clearAllMocks());
  it("正負の2群を保存された件数のまま返す", async () => {
    const value = snapshot();
    fetchFromR2AsJsonMock.mockResolvedValueOnce(value);
    const result = await readHighlyCorrelatedFromR2("x");
    expect(fetchFromR2AsJsonMock).toHaveBeenCalledWith(correlationByKeyPath("x"));
    expect(result.success && result.data).toEqual(value.groups);
  });
  it("snapshotがなければ空の2群を返す", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce(null);
    const result = await readHighlyCorrelatedFromR2("missing");
    expect(result.success && result.data).toEqual({ positive: [], negative: [] });
  });
  it.each([
    snapshot({ positive: [makePair("p", -0.8)], negative: [] }),
    snapshot({ positive: [makePair("p", 0.8), makePair("p", 0.7)], negative: [] }),
    snapshot({ positive: [makePair("x", 0.8)], negative: [] }),
    snapshot({ positive: [makePair("a", 0.6), makePair("b", 0.8)], negative: [] }),
    snapshot({ positive: [makePair("p", 0)], negative: [] }),
    snapshot({ positive: [makePair("p", 1.1)], negative: [] }),
    snapshot({ positive: Array.from({ length: 11 }, (_, i) => makePair("p" + i, 0.8)), negative: [] }),
    { ...snapshot(), rankingKey: "wrong" },
    { ...snapshot(), selectionPolicyVersion: 999 },
  ])("契約違反を表示前に拒否する", async (value) => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce(value);
    expect((await readHighlyCorrelatedFromR2("x")).success).toBe(false);
  });
  it("取得失敗を隠さずerrにする", async () => {
    fetchFromR2AsJsonMock.mockRejectedValueOnce(new Error("R2 down"));
    expect((await readHighlyCorrelatedFromR2("x")).success).toBe(false);
  });
});
