import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot, type SeedPost } from "../helpers/fixture-root";

/** 読み取り専用の schedule JSON / posts.json 整合性表示を検証する。 */
describe("instagram schedule consistency", () => {
  let root: string;

  afterEach(() => {
    vi.useRealTimers();
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function load(opts: Parameters<typeof makeFixtureRoot>[0]) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T03:00:00Z"));
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/lib/server/instagram");
  }

  it("schedule JSON にあり posts.json に無い項目を検出する", async () => {
    const { igConsistency } = await load({
      posts: [],
      igSchedules: {
        "instagram-w29-schedule.json": [
          { date: "2026-07-20", type: "reel", domain: "ranking", content_key: "orphan-json" },
        ],
      },
    });
    const result = igConsistency();
    expect(result.onlyInJson.some((entry) => entry.content_key === "orphan-json")).toBe(true);
    expect(result.onlyInPosts).toHaveLength(0);
  });

  it("posts.json にあり schedule JSON に無い項目を検出する", async () => {
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
      igSchedules: { "instagram-w29-schedule.json": [] },
    });
    const result = igConsistency();
    expect(result.onlyInPosts.some((post) => post.content_key === "orphan-post")).toBe(true);
    expect(result.onlyInJson).toHaveLength(0);
  });

  it("両側が一致していれば差分はない", async () => {
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
    expect(igConsistency()).toMatchObject({ onlyInJson: [], onlyInPosts: [] });
  });
});
