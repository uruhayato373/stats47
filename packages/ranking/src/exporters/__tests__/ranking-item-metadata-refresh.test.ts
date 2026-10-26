import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * refresh が builder と同じく「config だけが正本」で item.json を作り直すことを固定する。
 *
 * 2026-10-26 まで note と additionalCategories は「config に無ければ既存値を温存」していたため、
 * config から消した注釈・副カテゴリが R2 の item.json に残り続けた。
 */

const fetchFromR2AsJson = vi.fn();
const writeR2Staging = vi.fn(async (_key: string, _body: string) => undefined);
vi.mock("@stats47/r2-storage/server", () => ({
  fetchFromR2AsJson: (...args: unknown[]) => fetchFromR2AsJson(...args),
  writeR2Staging: (key: string, body: string) => writeR2Staging(key, body),
}));

const metric = {
  key: "sample-metric",
  title: "サンプル指標",
  category: "population",
  subtitle: undefined as string | undefined,
  note: undefined as string | undefined,
  additionalCategories: undefined as string[] | undefined,
};
vi.mock("@stats47/data-configs", () => ({
  listAllMetrics: () => [metric],
}));

import { refreshRankingItemMetadata } from "../ranking-item-metadata-refresh";

function staleItem() {
  return {
    generatedAt: "2026-10-01T00:00:00.000Z",
    item: {
      rankingKey: "sample-metric",
      title: "サンプル指標",
      categoryKey: "population",
      subtitle: "古い補足",
      annotation: "config から消した注釈",
      additionalCategories: ["economy"],
    },
  };
}

describe("refreshRankingItemMetadata", () => {
  beforeEach(() => {
    fetchFromR2AsJson.mockReset();
    writeR2Staging.mockClear();
  });

  it("config に無い注釈・副カテゴリ・補足を item.json から消す", async () => {
    fetchFromR2AsJson.mockResolvedValue(staleItem());

    const result = await refreshRankingItemMetadata({ dryRun: false });

    expect(result.patched).toBe(1);
    const [, body] = writeR2Staging.mock.calls[0];
    const written = JSON.parse(body).item;
    expect(written.annotation).toBeUndefined();
    expect(written.subtitle).toBeUndefined();
    expect(written.additionalCategories).toBeNull();
  });

  it("config の値と一致していれば書き込まない", async () => {
    fetchFromR2AsJson.mockResolvedValue({
      item: {
        rankingKey: "sample-metric",
        title: "サンプル指標",
        categoryKey: "population",
        additionalCategories: null,
      },
    });

    const result = await refreshRankingItemMetadata({ dryRun: false });

    expect(result.unchanged).toBe(1);
    expect(writeR2Staging).not.toHaveBeenCalled();
  });
});
