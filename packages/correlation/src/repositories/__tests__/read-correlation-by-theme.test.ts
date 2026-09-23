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

import { readThemeCorrelatedMetricsFromR2 } from "../read-correlation-by-theme";
import { correlationByThemePath } from "../../types/snapshot";

const item = {
  rankingKey: "dependent-population-index",
  title: "従属人口指数",
  populationAdjustedR: 0.64,
  via: { rankingKey: "pachinko-shop-density-per-10k", title: "パチンコ店舗数" },
};

describe("readThemeCorrelatedMetricsFromR2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("テーマの snapshot を読み、関連指標をそのまま返す", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce({
      generatedAt: "2026-09-23T00:00:00Z",
      themeKey: "leisure",
      items: [item],
    });

    const result = await readThemeCorrelatedMetricsFromR2("leisure");

    expect(fetchFromR2AsJsonMock).toHaveBeenCalledWith(correlationByThemePath("leisure"));
    expect(result).toEqual({ success: true, data: [item] });
  });

  it("snapshot が無ければ空配列 (セクションを出さない)", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce(null);

    await expect(readThemeCorrelatedMetricsFromR2("missing")).resolves.toEqual({ success: true, data: [] });
  });

  it("経由指標の欠けた snapshot は schema 不正として err を返す", async () => {
    fetchFromR2AsJsonMock.mockResolvedValueOnce({
      generatedAt: "2026-09-23T00:00:00Z",
      themeKey: "leisure",
      items: [{ ...item, via: undefined }],
    });

    const result = await readThemeCorrelatedMetricsFromR2("leisure");

    expect(result.success).toBe(false);
  });
});
