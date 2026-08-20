import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanupFixtureRoot,
  makeFixtureRoot,
  readIgSchedule,
  readPosts,
} from "../helpers/fixture-root";

/**
 * POST /api/actions/schedule-ig の integration。
 * 必須欠落 400 / 業務エラー (過去日・重複) 400 / 正常 200 + 二重書込を検証。
 */
describe("schedule-ig route", () => {
  let root: string;

  afterEach(() => {
    vi.useRealTimers();
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  function setup(opts: Parameters<typeof makeFixtureRoot>[0]) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z")); // JST 2026-07-15
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
  }

  function req(body: unknown): Request {
    return new Request("http://x/api/actions/schedule-ig", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const baseSchedule = {
    "instagram-w29-schedule.json": [
      { date: "2026-07-13", type: "reel", domain: "ranking", content_key: "e" },
    ],
  };

  it("必須欠落 (content_key 無し) → 400", async () => {
    setup({ posts: [], igSchedules: baseSchedule });
    const { POST } = await import("@/app/api/actions/schedule-ig/route");
    const res = await POST(req({ date: "2026-07-20", type: "reel", domain: "ranking" }));
    expect(res.status).toBe(400);
  });

  it("過去日 → 400 (業務エラー)", async () => {
    setup({ posts: [], igSchedules: baseSchedule });
    const { POST } = await import("@/app/api/actions/schedule-ig/route");
    const res = await POST(
      req({ date: "2026-07-01", type: "reel", domain: "ranking", content_key: "past" }),
    );
    expect(res.status).toBe(400);
  });

  it("正常 → 200 + schedule JSON と posts.json の両方に書かれる", async () => {
    setup({ posts: [], igSchedules: baseSchedule });
    const { POST } = await import("@/app/api/actions/schedule-ig/route");
    const res = await POST(
      req({
        date: "2026-07-20",
        type: "carousel",
        domain: "ranking",
        content_key: "route-dual",
        caption: "テスト",
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.file).toBe("instagram-w29-schedule.json");
    expect(typeof json.postId).toBe("number");
    // 二重書込の確認
    const sched = readIgSchedule(root, "instagram-w29-schedule.json") as Array<{ content_key: string }>;
    expect(sched.some((e) => e.content_key === "route-dual")).toBe(true);
    const post = readPosts(root).find((p) => p.content_key === "route-dual");
    expect(post?.status).toBe("scheduled");
    expect(post?.platform).toBe("instagram");
  });
});
