import { EventEmitter } from "node:events";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * actions.ts のガードを検証する: REGEN whitelist 外 kind 拒否 / keys 正規表現違反 /
 * X 7 日ガード (lastPublishXSuccess)。
 * spawn は mock して実プロセスを起動しない。
 * (YouTube pilot は Studio 手動投稿のため publishYt action を持たない)
 */
class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}
const spawnMock = vi.fn<(...args: unknown[]) => FakeChild>(() => new FakeChild());
vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

describe("actions guards", () => {
  let root: string;

  function setup(galleryState: Record<string, unknown> = {}) {
    root = makeFixtureRoot({ posts: [], galleryState });
    process.env.STATS47_PROJECT_ROOT = root;
    spawnMock.mockClear();
    spawnMock.mockImplementation(() => new FakeChild());
    delete (globalThis as { __galleryJobs?: unknown }).__galleryJobs;
    vi.resetModules();
    return import("@/lib/server/actions");
  }

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
    delete (globalThis as { __galleryJobs?: unknown }).__galleryJobs;
  });

  describe("regenerate — kind whitelist", () => {
    it("whitelist 外 kind を 400", async () => {
      const { regenerate } = await setup();
      expect(regenerate({ kind: "rm-rf" }).status).toBe(400);
      expect(regenerate({}).status).toBe(400);
    });

    it("whitelist 内 kind (blog-thumbnails) は 202 で spawn する", async () => {
      const { regenerate } = await setup();
      const r = regenerate({ kind: "blog-thumbnails" });
      expect(r.status).toBe(202);
      expect(spawnMock).toHaveBeenCalledTimes(1);
      expect(spawnMock.mock.calls[0]?.[0]).toBe("npx");
      expect(spawnMock.mock.calls[0]?.[1]).toEqual(
        expect.arrayContaining(["tsx", "apps/web/scripts/generate-blog-thumbnails-cloud.ts"]),
      );
    });
  });

  describe("regenerate — keys 正規表現 ^[a-z0-9,_-]+$", () => {
    it("正常な keys (英数字・カンマ・ハイフン・アンダースコア) は 202", async () => {
      const { regenerate } = await setup();
      expect(regenerate({ kind: "ogp-ranking", keys: "a1,b-2,c_3" }).status).toBe(202);
    });

    it("大文字を 400", async () => {
      const { regenerate } = await setup();
      expect(regenerate({ kind: "ogp-ranking", keys: "ABC" }).status).toBe(400);
    });

    it("スペースを 400", async () => {
      const { regenerate } = await setup();
      expect(regenerate({ kind: "ogp-ranking", keys: "a b" }).status).toBe(400);
    });

    it("セミコロン (コマンド注入) を 400", async () => {
      const { regenerate } = await setup();
      expect(regenerate({ kind: "ogp-ranking", keys: "a;rm -rf" }).status).toBe(400);
      // ガードで弾かれ spawn されない。
      expect(spawnMock).not.toHaveBeenCalled();
    });

    it("$() / バッククォート等のシェルメタ文字を 400", async () => {
      const { regenerate } = await setup();
      expect(regenerate({ kind: "ogp-ranking", keys: "$(whoami)" }).status).toBe(400);
      expect(regenerate({ kind: "ogp-ranking", keys: "a&&b" }).status).toBe(400);
    });
  });

  describe("publishX — 7 日ガード", () => {
    function daysAgoIso(days: number): string {
      return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    }

    it("8 日前 + !dry_run + !force → 428 (先に dry-run を強制)", async () => {
      const { publishX } = await setup({ lastPublishXSuccess: daysAgoIso(8) });
      const r = publishX({ content_key: "k", datetime: "2026-12-01T10:00", force: false });
      expect(r.status).toBe(428);
      expect(spawnMock).not.toHaveBeenCalled();
    });

    it("8 日前でも force:true なら通過 (202)", async () => {
      const { publishX } = await setup({ lastPublishXSuccess: daysAgoIso(8) });
      const r = publishX({ content_key: "k", datetime: "2026-12-01T10:00", force: true });
      expect(r.status).toBe(202);
    });

    it("8 日前でも dry_run:true なら通過 (202)", async () => {
      const { publishX } = await setup({ lastPublishXSuccess: daysAgoIso(8) });
      const r = publishX({ content_key: "k", dry_run: true });
      expect(r.status).toBe(202);
    });

    it("6 日前なら通過 (202)", async () => {
      const { publishX } = await setup({ lastPublishXSuccess: daysAgoIso(6) });
      const r = publishX({ content_key: "k", datetime: "2026-12-01T10:00" });
      expect(r.status).toBe(202);
    });

    it("成功実績が無い (state 空) + !dry_run → last=Infinity で 428", async () => {
      const { publishX } = await setup({});
      const r = publishX({ content_key: "k", datetime: "2026-12-01T10:00" });
      expect(r.status).toBe(428);
    });

    it("content_key 欠落を 400", async () => {
      const { publishX } = await setup({ lastPublishXSuccess: daysAgoIso(1) });
      expect(publishX({}).status).toBe(400);
    });

    it("予約なのに datetime/immediate/dry_run いずれも無い → 400", async () => {
      const { publishX } = await setup({ lastPublishXSuccess: daysAgoIso(1) });
      expect(publishX({ content_key: "k" }).status).toBe(400);
    });
  });
});
