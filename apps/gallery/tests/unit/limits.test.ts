import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cleanupFixtureRoot,
  makeFixtureRoot,
  type SeedPost,
} from "../helpers/fixture-root";

/**
 * limits.ts は posts-store + instagram(schedule) + time を統合する。
 * fixture root を差し込み、platform 別カウント + IG schedule 未来分の加算を検証する。
 * project-root / posts-store はモジュールキャッシュを持つため、毎回 resetModules + 再 import する。
 */
describe("computeLimits", () => {
  let root: string;

  afterEach(() => {
    vi.useRealTimers();
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function load(opts: Parameters<typeof makeFixtureRoot>[0]) {
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/lib/server/limits");
  }

  it("platform 別に posted/scheduled を週/月枠でカウントする", async () => {
    // 週初 = 2026-07-13 (月) になるよう時刻固定。
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z")); // 12:00 JST 水

    const posts: SeedPost[] = [
      // 今週の X posted 2 件
      { id: 1, platform: "x", status: "posted", posted_at: "2026-07-14 10:00:00", content_key: "a" },
      { id: 2, platform: "x", status: "posted", posted_at: "2026-07-13 10:00:00", content_key: "b" },
      // 先週の X posted (枠外)
      { id: 3, platform: "x", status: "posted", posted_at: "2026-07-06 10:00:00", content_key: "c" },
      // 過去実績の YouTube posted (撤退済・limits 集計の対象外)
      { id: 4, platform: "youtube", status: "posted", posted_at: "2026-07-02 10:00:00", content_key: "yt" },
      // draft は数えない
      { id: 5, platform: "x", status: "draft", content_key: "d" },
    ];
    const { computeLimits } = await load({ posts });
    const r = computeLimits();
    expect(r.x.used).toBe(2); // 今週の posted 2 件のみ
    expect(r.x.max).toBe(3);
    expect((r as Record<string, unknown>).youtube).toBeUndefined();
  });

  it("IG schedule の未来 entry を scheduledInJson に加算する", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z")); // JST 2026-07-15

    const { computeLimits } = await load({
      posts: [],
      igSchedules: {
        "instagram-w29-schedule.json": [
          { date: "2026-07-20", type: "reel", domain: "ranking", content_key: "future1" },
          { date: "2026-07-21", type: "carousel", domain: "ranking", content_key: "future2" },
          // 過去日は含めない
          { date: "2026-07-10", type: "reel", domain: "ranking", content_key: "past1" },
        ],
      },
    });
    const r = computeLimits();
    expect(r.instagram.scheduledInJson).toBe(2); // 未来 2 件のみ
  });

  it("posts が空でも例外を投げず 0 を返す", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z"));
    const { computeLimits } = await load({ posts: [] });
    const r = computeLimits();
    expect(r.x.used).toBe(0);
    expect(r.instagram.used).toBe(0);
  });
});
