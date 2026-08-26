import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 「退役キーは一覧に出さない」を配線ごと固定する。
 *
 * ヘルパーの単体テストではなく **リーダー越し**に検査するのが要点。ここで守りたいのは
 * 「excludeGone という関数がある」ことではなく「R2 が古い間もリンクが出ない」ことなので、
 * リーダーを 1 つ足して filter を忘れたら落ちてほしい。
 *
 * 背景: R2 snapshot を作る sync-snapshots は main を checkout するため、
 * config が main に乗るまで退役キーを落とせない。R2 だけを信用すると
 * 「middleware は 410 / 一覧はまだリンクしている」窓が退役のたびに生まれる。
 * 正典: read-ranking-items-snapshot.ts の excludeGone コメント。
 */

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const fetchFromR2AsJson = vi.fn();
vi.mock("@stats47/r2-storage/server", () => ({
  fetchFromR2AsJson: (...args: unknown[]) => fetchFromR2AsJson(...args),
  listFromR2: vi.fn(async () => []),
  shouldSkipRemoteR2Read: () => true,
}));

// 2026-08-05 の VALUE-GATE-01 で退役した実キー。GONE に載っていることが前提。
const GONE_KEY = "bowling-alley-public";
const LIVE_KEY = "total-population";

import { GONE_RANKING_KEYS } from "../../../config/gone-ranking-keys";
import {
  readActiveKeysForSitemapFromR2,
  readActiveRankingKeysFromR2,
  readFeaturedRankingItemsFromR2,
  readFirstKeyByTagFromR2,
  readRankingItemsByAreaTypeFromR2,
  readRankingItemsByCategoryFromR2,
  readRankingItemsByGroupKeyFromR2,
  readRankingItemsBySurveyFromR2,
  readRankingItemsByTagFromR2,
} from "../read-ranking-items-snapshot";

/** 一覧 snapshot の 1 行。全リーダーの filter 条件を同時に満たす形にしてある */
function item(rankingKey: string) {
  return {
    rankingKey,
    rankingName: rankingKey,
    title: rankingKey,
    subtitle: null,
    unit: "件",
    areaType: "prefecture",
    isActive: true,
    categoryKey: "population",
    groupKey: "g1",
    dataSourceId: "estat",
    hook: `${rankingKey} は？`,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    latestYear: { yearCode: "2023" },
    tags: [{ tagKey: "t1" }],
  };
}

const ROWS = [item(GONE_KEY), item(LIVE_KEY)];

function snapshot(items: ReturnType<typeof item>[]) {
  return {
    generatedAt: "2026-08-05T00:00:00Z",
    categoryKey: "population",
    surveyId: "census",
    count: items.length,
    items,
  };
}

beforeEach(() => {
  fetchFromR2AsJson.mockReset();
  // どのキーパスを読まれても同じ 2 行を返す (all.json / category / survey / featured 共通)
  fetchFromR2AsJson.mockResolvedValue(snapshot(ROWS));
});

/** 戻り値の形が関数ごとに違うので rankingKey だけ取り出す */
function keysOf(res: { success: boolean; data?: unknown }): string[] {
  const value = res.success ? res.data : [];
  const rows = Array.isArray(value)
    ? value
    : ((value as { rankingItems?: unknown[] })?.rankingItems ?? []);
  return (rows as { rankingKey: string }[]).map((r) => r.rankingKey);
}

describe("退役キーは R2 snapshot に残っていてもリンク一覧に出ない", () => {
  it("前提: 検体が GONE / 現役として正しく分類されている", () => {
    expect(GONE_RANKING_KEYS.has(GONE_KEY)).toBe(true);
    expect(GONE_RANKING_KEYS.has(LIVE_KEY)).toBe(false);
  });

  it.each([
    ["home featured", () => readFeaturedRankingItemsFromR2()],
    ["category 一覧", () => readRankingItemsByCategoryFromR2("population")],
    ["survey 一覧", () => readRankingItemsBySurveyFromR2("census")],
    ["areaType 一覧", () => readRankingItemsByAreaTypeFromR2("prefecture")],
    ["group 切替", () => readRankingItemsByGroupKeyFromR2("g1", "prefecture")],
    ["tag 一覧", () => readRankingItemsByTagFromR2("t1")],
    ["active keys", () => readActiveRankingKeysFromR2("prefecture")],
    ["sitemap", () => readActiveKeysForSitemapFromR2()],
  ])("%s から落ち、現役キーは残る", async (_label, call) => {
    const res = await call();
    expect(res.success).toBe(true);
    const keys = keysOf(res);
    expect(keys).not.toContain(GONE_KEY);
    expect(keys).toContain(LIVE_KEY);
  });

  it("tag の代表キーに退役キーを選ばない", async () => {
    const res = await readFirstKeyByTagFromR2("t1");
    expect(res.success && res.data).toBe(LIVE_KEY);
  });

  it("★退役キーしか無いタグは「該当なし」になる (退役キーで代替しない)", async () => {
    fetchFromR2AsJson.mockResolvedValue(snapshot([item(GONE_KEY)]));
    expect((await readFirstKeyByTagFromR2("t1")).success).toBe(false);
    expect((await readRankingItemsByTagFromR2("t1")).success).toBe(false);
  });

  it("陰性対照: GONE が空なら何も落とさない (filter が効きすぎていない)", async () => {
    fetchFromR2AsJson.mockResolvedValue(snapshot([item(LIVE_KEY), item("total-households")]));
    const res = await readRankingItemsByCategoryFromR2("population");
    expect(keysOf(res)).toEqual([LIVE_KEY, "total-households"]);
  });
});
