import { describe, expect, it, vi } from "vitest";

const { fetchMock, readerOptionsMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  readerOptionsMock: vi.fn(),
}));
vi.mock("@stats47/r2-storage/server", () => ({
  createSnapshotReader: (options: {
    key: string;
    parse: (value: unknown) => unknown;
    select: (value: unknown) => unknown;
    timeoutMs?: number;
    maxAttempts?: number;
  }) => {
    readerOptionsMock(options);
    const readResult = async () => {
      const value = await fetchMock(options.key);
      if (value === null) return { status: "no-data", attempts: 1 };
      try {
        return {
          status: "ok",
          data: options.select(options.parse(value)),
          attempts: 1,
        };
      } catch (error) {
        return {
          status: "schema-invalid",
          reason: "schema-invalid",
          error,
          attempts: 1,
        };
      }
    };
    return Object.assign(async () => undefined, { readResult });
  },
}));

import { readJapanSeries } from "../index";

const validArtifact = {
  schemaVersion: 1,
  metricKey: "library-count-per-million",
  geographyScope: "japan",
  sourceMode: "official",
  rows: [{ yearCode: "2021", yearName: "2021年度", value: 27, unit: "館" }],
  meta: {
    generatedAt: "2026-08-20T00:00:00.000Z",
    configHash: "abc",
    recipeHash: "def",
    sourceId: "0000010207",
  },
};

describe("readJapanSeries (GEO-SCOPE-SEPARATION-01 WP3)", () => {
  it("app/japan/<metric>/series.json を正しいキーで読む", async () => {
    fetchMock.mockResolvedValue(validArtifact);
    await readJapanSeries("library-count-per-million");
    expect(fetchMock).toHaveBeenCalledWith(
      "app/japan/library-count-per-million/series.json",
    );
    expect(readerOptionsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ timeoutMs: 30_000, maxAttempts: 3 }),
    );
  });

  it("404 (data=null) のとき null を返す (推測で埋めない)", async () => {
    fetchMock.mockResolvedValue(null);
    const result = await readJapanSeries("unsupported-metric");
    expect(result).toBeNull();
  });

  it("取得できたら schema 検証済みの artifact を返す", async () => {
    fetchMock.mockResolvedValue(validArtifact);
    const result = await readJapanSeries("library-count-per-million");
    expect(result?.sourceMode).toBe("official");
    expect(result?.rows[0].value).toBe(27);
  });

  it("壊れた payload は throw する (黙って null にしない)", async () => {
    fetchMock.mockResolvedValue({ ...validArtifact, sourceMode: "average" });
    await expect(readJapanSeries("library-count-per-million")).rejects.toThrow();
  });
});
