import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CorrelationByKeySnapshot,
  CorrelationStatsSnapshot,
  CorrelationTopPairsSnapshot,
} from "../../types/snapshot";

// ── server-only / logger は no-op ──────────────────────────────────────────────
vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ── R2: saveToR2 は呼び出しを記録、fetch は all.json メタを返す ──────────────────
const saved = new Map<string, string>();
const fetchFromR2AsJsonMock = vi.fn();
vi.mock("@stats47/r2-storage/server", () => ({
  assertR2WriteAllowed: vi.fn(),
  saveToR2: vi.fn(async (key: string, body: string) => {
    saved.set(key, body);
    return { key, size: body.length };
  }),
  fetchFromR2AsJson: (key: string) => fetchFromR2AsJsonMock(key),
}));

// ── data-configs: 3 つの合成 metric (a,b,c) + 制御変数 ─────────────────────────
const CONTROL_KEYS = [
  "total-population",
  "total-area-excluding-northern-territories-and-takeshima",
  "ratio-65-plus",
  "population-density-per-km2-total-area",
];
function metric(key: string, title: string) {
  return {
    key,
    title,
    subtitle: undefined,
    unit: "件",
    category: "population",
    entities: ["prefecture"],
    years: { from: 2020, to: 2020 },
    isActive: true,
    source: { kind: "estat" },
  };
}
const METRICS = [
  metric("metric-a", "指標A"),
  metric("metric-b", "指標B"),
  metric("metric-c", "指標C"),
  ...CONTROL_KEYS.map((k) => metric(k, `制御:${k}`)),
];
vi.mock("@stats47/data-configs", () => ({
  listAllMetrics: () => METRICS,
  getMetricConfig: (k: string) => METRICS.find((m) => m.key === k),
  getMetricMeta: (k: string) =>
    METRICS.some((m) => m.key === k)
      ? { latestYear: { yearCode: "2020", yearName: "2020年度" }, availableYears: [], entities: ["prefecture"] }
      : null,
}));

// ── stats-r2: 47 県の合成観測値。a と b は強相関、c は無相関気味 ──────────────────
function makeRows(fn: (i: number) => number) {
  return Array.from({ length: 47 }, (_, i) => ({
    areaCode: String(i + 1).padStart(2, "0") + "000",
    areaName: `pref-${i + 1}`,
    yearCode: "2020",
    yearName: "2020年度",
    value: fn(i),
    unit: "件",
    rank: null,
  }));
}
const STATS: Record<string, ReturnType<typeof makeRows>> = {
  "metric-a": makeRows((i) => i + 1),
  // a と強相関だが完全線形ではない (ノイズ付与) → r≈0.9 で 0.99 フィルタを通過し top に出る
  "metric-b": makeRows((i) => (i + 1) * 2 + 3 + ((i * 13) % 7)),
  "metric-c": makeRows((i) => ((i * 7) % 47) + 1), // 疑似ランダム
  "total-population": makeRows((i) => 1000 + i * 13),
  "total-area-excluding-northern-territories-and-takeshima": makeRows((i) => 500 + ((i * 11) % 40)),
  "ratio-65-plus": makeRows((i) => 20 + ((i * 3) % 15)),
  "population-density-per-km2-total-area": makeRows((i) => 100 + ((i * 5) % 60)),
};
vi.mock("@stats47/stats-r2/readers", () => ({
  readStatsValues: vi.fn(async (key: string) => {
    const rows = STATS[key];
    if (!rows) return null;
    return {
      metricKey: key,
      entityKind: "prefecture",
      rows,
      meta: { rowCount: rows.length, yearRange: ["2020", "2020"], areaCount: 47, generatedAt: "x" },
    };
  }),
}));

describe("buildCorrelationSnapshot shape", () => {
  beforeEach(() => {
    saved.clear();
    // all.json メタ (title/subtitle/unit/normalizationBasis)
    fetchFromR2AsJsonMock.mockReset();
    fetchFromR2AsJsonMock.mockImplementation((key: string) => {
      if (key === "app/ranking-items/all.json") {
        return {
          generatedAt: "x",
          count: METRICS.length,
          items: METRICS.map((m) => ({
            rankingKey: m.key,
            title: m.title,
            subtitle: null,
            unit: m.unit,
            normalizationBasis: null,
          })),
        };
      }
      return null;
    });
  });

  it("writes top-pairs / stats / by-key with reader-expected field shapes", async () => {
    const { buildCorrelationSnapshot } = await import("../build-correlation-snapshot");
    const result = await buildCorrelationSnapshot({ dryRun: false });

    // 7 configs のうち相関ランキング除外キーは total-population のみ (trivial-pairs.ts の
    // EXCLUDED_CORRELATION_KEYS に含まれるのは total-population だけ) → 6 が pair 対象。
    expect(result.consideredMetrics).toBe(6);

    // top-pairs snapshot の field 名・型が reader 期待 (TopCorrelation) と一致
    const topRaw = saved.get("app/correlation/top-pairs.json");
    expect(topRaw).toBeTruthy();
    const top = JSON.parse(topRaw!) as CorrelationTopPairsSnapshot;
    expect(typeof top.generatedAt).toBe("string");
    expect(Array.isArray(top.pairs)).toBe(true);
    expect(top.pairs.length).toBeGreaterThan(0);
    const pair = top.pairs[0];
    for (const f of [
      "rankingKeyX",
      "rankingKeyY",
      "titleX",
      "titleY",
      "normalizationBasisX",
      "normalizationBasisY",
      "pearsonR",
      "effectiveR",
      "partialRPopulation",
      "partialRArea",
      "partialRAging",
      "partialRDensity",
    ]) {
      expect(pair).toHaveProperty(f);
    }
    // stats snapshot
    const stats = JSON.parse(saved.get("app/correlation/stats.json")!) as CorrelationStatsSnapshot;
    expect(typeof stats.generatedAt).toBe("string");
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.strong).toBe("number");
    expect(stats.total).toBeGreaterThanOrEqual(stats.strong);

    // per-key snapshot (metric-a)
    const byKeyRaw = saved.get("app/correlation/by-ranking-key/metric-a.json");
    expect(byKeyRaw).toBeTruthy();
    const byKey = JSON.parse(byKeyRaw!) as CorrelationByKeySnapshot;
    expect(byKey.rankingKey).toBe("metric-a");
    expect(Array.isArray(byKey.pairs)).toBe(true);
    const item = byKey.pairs[0];
    for (const f of ["rankingKey", "title", "subtitle", "unit", "pearsonR", "scatterData"]) {
      expect(item).toHaveProperty(f);
    }
    // by-key の counterpart は自身ではない & scatter の x は自身軸
    expect(item.rankingKey).not.toBe("metric-a");
    expect(item.scatterData.length).toBeGreaterThanOrEqual(30);

    // by-key は raw ABS(pearsonR) DESC 順 (旧 find-highly-correlated と同じ)。
    // metric-a と最も raw 相関が高いのは metric-b (r≈0.9) なので先頭に来る。
    expect(byKey.pairs[0].rankingKey).toBe("metric-b");
    expect(Math.abs(byKey.pairs[0].pearsonR)).toBeGreaterThan(0.7);
  });
});
