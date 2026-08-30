import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot, type SeedPost } from "../helpers/fixture-root";

/**
 * 読み取り専用 posts.ts (filterPosts) と project-root.ts の検証。
 */
describe("posts server", () => {
  let root: string;

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function load(opts: Parameters<typeof makeFixtureRoot>[0]) {
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/lib/server/posts");
  }

  describe("filterPosts", () => {
    const seed: SeedPost[] = [
      { id: 1, platform: "x", status: "posted", domain: "ranking", content_key: "aaa", caption: "hello", posted_at: "2026-07-10 10:00:00" },
      { id: 2, platform: "instagram", status: "scheduled", domain: "compare", content_key: "bbb", scheduled_at: "2026-07-20 08:00:00" },
      { id: 3, platform: "x", status: "deleted", domain: "ranking", content_key: "ccc" },
    ];

    it("deleted を除外して返す", async () => {
      const { filterPosts } = await load({ posts: seed });
      const r = filterPosts({});
      expect(r.count).toBe(2);
      expect(r.posts.some((p) => p.content_key === "ccc")).toBe(false);
    });

    it("platform で絞る", async () => {
      const { filterPosts } = await load({ posts: seed });
      expect(filterPosts({ platform: "x" }).count).toBe(1);
    });

    it("q で content_key / caption を部分一致検索", async () => {
      const { filterPosts } = await load({ posts: seed });
      expect(filterPosts({ q: "hello" }).count).toBe(1);
      expect(filterPosts({ q: "bbb" }).count).toBe(1);
    });

    it("media_candidates を付与して decorate する", async () => {
      const { filterPosts } = await load({ posts: seed });
      const r = filterPosts({ platform: "x" });
      expect(Array.isArray(r.posts[0].media_candidates)).toBe(true);
    });
  });

});

describe("projectRoot 検証", () => {
  afterEach(() => {
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("name !== stats47-monorepo なら throw", async () => {
    const bad = fs.mkdtempSync(path.join(os.tmpdir(), "bad-root-"));
    fs.writeFileSync(path.join(bad, "package.json"), JSON.stringify({ name: "other" }));
    process.env.STATS47_PROJECT_ROOT = bad;
    vi.resetModules();
    const { projectRoot } = await import("@/lib/server/project-root");
    expect(() => projectRoot()).toThrow(/検証失敗/);
    fs.rmSync(bad, { recursive: true, force: true });
  });

  it("package.json 不在なら throw", async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "empty-root-"));
    process.env.STATS47_PROJECT_ROOT = empty;
    vi.resetModules();
    const { projectRoot } = await import("@/lib/server/project-root");
    expect(() => projectRoot()).toThrow(/project root not found/);
    fs.rmSync(empty, { recursive: true, force: true });
  });

  it("正しい fixture root を解決してキャッシュする", async () => {
    const good = makeFixtureRoot({ posts: [] });
    process.env.STATS47_PROJECT_ROOT = good;
    vi.resetModules();
    const { projectRoot } = await import("@/lib/server/project-root");
    expect(projectRoot()).toBe(good);
    // 2 回目もキャッシュから同じ値 (env を消しても効く)。
    delete process.env.STATS47_PROJECT_ROOT;
    expect(projectRoot()).toBe(good);
    cleanupFixtureRoot(good);
  });
});
