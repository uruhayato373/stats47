import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cleanupFixtureRoot,
  makeFixtureRoot,
  type SeedPost,
} from "../helpers/fixture-root";

/**
 * GET 系 Route Handler (limits / inventory / ig-consistency) の integration。
 * Route module を直接 import し Request を渡す (dev server 不要)。top-level key と
 * Cache-Control: no-store ヘッダを検証する。
 */
describe("GET read routes", () => {
  let root: string;

  afterEach(() => {
    vi.useRealTimers();
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  function setup(opts: Parameters<typeof makeFixtureRoot>[0]) {
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
  }

  it("GET /api/limits → limits + galleryState を返し no-store", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z"));
    const posts: SeedPost[] = [
      { id: 1, platform: "x", status: "posted", posted_at: "2026-07-14 10:00:00", content_key: "a" },
    ];
    setup({ posts, galleryState: { lastPublishXSuccess: "2026-07-14T10:00:00Z" } });
    const { GET } = await import("@/app/api/limits/route");
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json();
    expect(json.limits.x.used).toBe(1);
    expect(json.galleryState.lastPublishXSuccess).toBe("2026-07-14T10:00:00Z");
  });

  it("GET /api/inventory → posts + extras を返し no-store", async () => {
    setup({
      posts: [{ id: 1, platform: "x", status: "posted", domain: "ranking", content_key: "k" }],
      localSnsFiles: ["ranking/extra-key/x/stills/a.png"],
    });
    const { GET } = await import("@/app/api/inventory/route");
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json();
    expect(Array.isArray(json.posts)).toBe(true);
    expect(Array.isArray(json.extras)).toBe(true);
    expect(json.extras.some((e: { content_key: string }) => e.content_key === "extra-key")).toBe(true);
  });

  it("GET /api/ig-consistency → onlyInJson/onlyInPosts を返し no-store", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z"));
    setup({
      posts: [],
      igSchedules: {
        "instagram-w29-schedule.json": [
          { date: "2026-07-20", type: "reel", domain: "ranking", content_key: "orphan" },
        ],
      },
    });
    const { GET } = await import("@/app/api/ig-consistency/route");
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json();
    expect(json).toHaveProperty("onlyInJson");
    expect(json).toHaveProperty("onlyInPosts");
    expect(json.onlyInJson.some((e: { content_key: string }) => e.content_key === "orphan")).toBe(true);
  });
});
