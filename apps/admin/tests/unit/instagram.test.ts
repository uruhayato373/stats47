import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanupFixtureRoot,
  makeFixtureRoot,
  readIgSchedule,
  readPosts,
  type SeedPost,
} from "../helpers/fixture-root";

/**
 * instagram.ts の週ファイル選択 / 過去日・同一日拒否 / 二重書込 (schedule JSON + posts.json) /
 * igConsistency を fixture root で検証する。時刻は JST 2026-07-15 に固定。
 */
describe("instagram schedule", () => {
  let root: string;

  afterEach(() => {
    vi.useRealTimers();
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function load(opts: Parameters<typeof makeFixtureRoot>[0]) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z")); // JST 2026-07-15 12:00
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/lib/server/instagram");
  }

  describe("scheduleIg — 週ファイル選択", () => {
    it("該当週ファイル (date が範囲内) に追記する", async () => {
      const { scheduleIg } = await load({
        posts: [],
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-13", type: "reel", domain: "ranking", content_key: "existing" },
            { date: "2026-07-25", type: "reel", domain: "ranking", content_key: "existing2" },
          ],
          "instagram-w30-schedule.json": [
            { date: "2026-08-01", type: "reel", domain: "ranking", content_key: "aug" },
          ],
        },
      });
      const r = scheduleIg({
        date: "2026-07-20",
        type: "carousel",
        domain: "ranking",
        content_key: "new-key",
      });
      // 07-20 は w29 (07-13..07-25) の範囲内 → w29 に追記される。
      expect(r.file).toBe("instagram-w29-schedule.json");
      const w29 = readIgSchedule(root, "instagram-w29-schedule.json") as Array<{
        content_key: string;
      }>;
      expect(w29.some((e) => e.content_key === "new-key")).toBe(true);
      // w30 は触られない。
      const w30 = readIgSchedule(root, "instagram-w30-schedule.json");
      expect(w30.length).toBe(1);
    });

    it("どの週の範囲にも入らない date は最新ファイルに追記する", async () => {
      const { scheduleIg } = await load({
        posts: [],
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-13", type: "reel", domain: "ranking", content_key: "e1" },
          ],
          "instagram-w30-schedule.json": [
            { date: "2026-08-01", type: "reel", domain: "ranking", content_key: "e2" },
          ],
        },
      });
      // 2026-12-25 はどの範囲にも入らない → 名前順最後 = w30。
      const r = scheduleIg({
        date: "2026-12-25",
        type: "reel",
        domain: "ranking",
        content_key: "xmas",
      });
      expect(r.file).toBe("instagram-w30-schedule.json");
    });
  });

  describe("scheduleIg — 拒否", () => {
    it("過去日を拒否 (Error throw)", async () => {
      const { scheduleIg } = await load({
        posts: [],
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-14", type: "reel", domain: "ranking", content_key: "e" },
          ],
        },
      });
      expect(() =>
        scheduleIg({
          date: "2026-07-10", // 今日 (07-15) より前
          type: "reel",
          domain: "ranking",
          content_key: "past",
        }),
      ).toThrow(/過去日/);
    });

    it("同一日に既に entry があれば拒否 (1 日 1 件)", async () => {
      const { scheduleIg } = await load({
        posts: [],
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-20", type: "reel", domain: "ranking", content_key: "already" },
          ],
        },
      });
      expect(() =>
        scheduleIg({
          date: "2026-07-20",
          type: "carousel",
          domain: "ranking",
          content_key: "second",
        }),
      ).toThrow(/既に予約/);
    });

    it("必須欠落 (content_key 無し) を拒否", async () => {
      const { scheduleIg } = await load({
        posts: [],
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-13", type: "reel", domain: "ranking", content_key: "e" },
          ],
        },
      });
      expect(() =>
        // @ts-expect-error content_key を意図的に欠落
        scheduleIg({ date: "2026-07-20", type: "reel", domain: "ranking" }),
      ).toThrow(/必須/);
    });

    it("schedule ファイルが 1 つも無ければ拒否", async () => {
      const { scheduleIg } = await load({ posts: [], igSchedules: {} });
      expect(() =>
        scheduleIg({
          date: "2026-07-20",
          type: "reel",
          domain: "ranking",
          content_key: "k",
        }),
      ).toThrow(/見つからない/);
    });
  });

  describe("scheduleIg — 二重書込 (schedule JSON + posts.json)", () => {
    it("成功時に schedule JSON へ entry 追加 + posts.json へ scheduled insert の両方が起きる", async () => {
      const { scheduleIg } = await load({
        posts: [],
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-13", type: "reel", domain: "ranking", content_key: "e" },
          ],
        },
      });
      const before = readPosts(root).length;
      const r = scheduleIg({
        date: "2026-07-20",
        type: "carousel",
        domain: "ranking",
        content_key: "dual-write",
        caption: "テスト caption",
      });
      // (1) schedule JSON に追加
      const sched = readIgSchedule(root, "instagram-w29-schedule.json") as Array<{
        content_key: string;
      }>;
      expect(sched.some((e) => e.content_key === "dual-write")).toBe(true);
      // (2) posts.json に scheduled で insert
      const posts = readPosts(root);
      expect(posts.length).toBe(before + 1);
      const inserted = posts.find((p) => p.id === r.postId);
      expect(inserted).toBeDefined();
      expect(inserted?.platform).toBe("instagram");
      expect(inserted?.status).toBe("scheduled");
      expect(inserted?.content_key).toBe("dual-write");
      expect(inserted?.scheduled_at).toBe("2026-07-20 08:00:00");
      expect(inserted?.caption).toBe("テスト caption");
    });
  });

  describe("igConsistency", () => {
    it("schedule JSON にあり posts.json に無い → onlyInJson で検出", async () => {
      const { igConsistency } = await load({
        posts: [], // posts に scheduled が無い
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-20", type: "reel", domain: "ranking", content_key: "orphan-json" },
          ],
        },
      });
      const r = igConsistency();
      expect(r.onlyInJson.some((e) => e.content_key === "orphan-json")).toBe(true);
      expect(r.onlyInPosts.length).toBe(0);
    });

    it("posts.json にあり schedule JSON に無い → onlyInPosts で検出", async () => {
      const posts: SeedPost[] = [
        {
          id: 1,
          platform: "instagram",
          status: "scheduled",
          domain: "ranking",
          content_key: "orphan-post",
          scheduled_at: "2026-07-22 08:00:00",
        },
      ];
      const { igConsistency } = await load({
        posts,
        igSchedules: {
          "instagram-w29-schedule.json": [],
        },
      });
      const r = igConsistency();
      expect(r.onlyInPosts.some((p) => p.content_key === "orphan-post")).toBe(true);
      expect(r.onlyInJson.length).toBe(0);
    });

    it("両側に揃っていれば差分ゼロ", async () => {
      const posts: SeedPost[] = [
        {
          id: 1,
          platform: "instagram",
          status: "scheduled",
          domain: "ranking",
          content_key: "matched",
          scheduled_at: "2026-07-20 08:00:00",
        },
      ];
      const { igConsistency } = await load({
        posts,
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-20", type: "reel", domain: "ranking", content_key: "matched" },
          ],
        },
      });
      const r = igConsistency();
      expect(r.onlyInJson.length).toBe(0);
      expect(r.onlyInPosts.length).toBe(0);
    });
  });
});
