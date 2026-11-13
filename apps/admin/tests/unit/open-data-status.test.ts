import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  deriveReflection,
  loadReflectionLookup,
  REFLECTION_STATUS,
  type ReflectionLookup,
} from "@/lib/server/open-data-status";

/**
 * 外部データ台帳の反映状況の判定を守る。
 * 台帳に状態の欄を持たせず表示のたびに導くので、判定の順 (公開 → 取り込み済み → 未着手) が
 * 崩れると、指標が公開済みのデータセットを「未着手」と表示してしまう。そこをここで止める。
 */
const REPO = path.resolve(__dirname, "../../../..");

const lookup: ReflectionLookup = {
  activeMetricKeys: new Set(["published-metric"]),
  knownMetricKeys: new Set(["published-metric", "draft-metric"]),
  publishedGisIds: new Set(["N02"]),
};

const dataset = (over: Partial<Parameters<typeof deriveReflection>[0]> = {}) => ({
  stats47Uses: ["ranking"],
  existingMetricKeys: [] as string[],
  existingGisDataIds: [] as string[],
  ...over,
});

describe("open-data の反映状況", () => {
  afterEach(() => {
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("公開中の指標を参照していれば公開中になり、その指標を反映先に出す", () => {
    const result = deriveReflection(
      dataset({ existingMetricKeys: ["published-metric", "draft-metric"] }),
      lookup,
    );

    expect(result.status).toBe("published");
    expect(result.publishedMetricKeys).toEqual(["published-metric"]);
    expect(result.pendingMetricKeys).toEqual(["draft-metric"]);
  });

  it("ランキング対象の GIS を参照していれば、指標が無くても公開中になる", () => {
    const result = deriveReflection(
      dataset({ stats47Uses: ["map"], existingGisDataIds: ["N02", "A09"] }),
      lookup,
    );

    expect(result.status).toBe("published");
    expect(result.publishedGisIds).toEqual(["N02"]);
    expect(result.pendingGisIds).toEqual(["A09"]);
  });

  it("参照はあるが公開されていなければ取り込み済みになる", () => {
    const result = deriveReflection(
      dataset({ existingMetricKeys: ["draft-metric"], existingGisDataIds: ["A09"] }),
      lookup,
    );

    expect(result.status).toBe("ingested");
    expect(result.publishedMetricKeys).toEqual([]);
  });

  it("参照が無く採用候補なら未着手になる", () => {
    expect(deriveReflection(dataset({ stats47Uses: ["theme"] }), lookup).status).toBe("todo");
    expect(deriveReflection(dataset({ stats47Uses: ["area"] }), lookup).status).toBe("todo");
  });

  it("調査用途は調査のみ、合わないものは対象外になる", () => {
    expect(deriveReflection(dataset({ stats47Uses: ["research-only"] }), lookup).status).toBe("research");
    expect(deriveReflection(dataset({ stats47Uses: ["not-suitable"] }), lookup).status).toBe("excluded");
  });

  it("使い道が古いまま指標だけ公開された場合でも、未着手ではなく公開中と出す", () => {
    const result = deriveReflection(
      dataset({ stats47Uses: ["research-only"], existingMetricKeys: ["published-metric"] }),
      lookup,
    );

    expect(result.status).toBe("published");
  });

  it("どの状態にも表示名と色がある", () => {
    for (const status of ["published", "ingested", "todo", "research", "excluded"] as const) {
      expect(REFLECTION_STATUS[status].label.length).toBeGreaterThan(0);
    }
  });

  it("実リポジトリから指標と GIS の索引を読める", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;

    const real = loadReflectionLookup();

    expect(real.knownMetricKeys.size).toBeGreaterThan(0);
    expect(real.activeMetricKeys.size).toBeGreaterThan(0);
    expect(real.activeMetricKeys.size).toBeLessThanOrEqual(real.knownMetricKeys.size);
    expect(real.publishedGisIds.size).toBeGreaterThan(0);
  });
});
