import { EventEmitter } from "node:events";

import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * action 系 Route Handler (publish-x / regenerate) の integration。
 * spawn を mock し実プロセスを起動しない。7日ガード・whitelist・job 実行中 409 を検証。
 * (YouTube は撤退済のため publish-yt 系テストは削除)
 */
class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}
const spawnMock = vi.fn(() => new FakeChild());
vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...(args as [])),
}));

function req(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

describe("action routes", () => {
  let root: string;

  function setup(galleryState: Record<string, unknown> = {}) {
    root = makeFixtureRoot({ posts: [], galleryState });
    process.env.STATS47_PROJECT_ROOT = root;
    spawnMock.mockClear();
    spawnMock.mockImplementation(() => new FakeChild());
    delete (globalThis as { __galleryJobs?: unknown }).__galleryJobs;
    vi.resetModules();
  }

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
    delete (globalThis as { __galleryJobs?: unknown }).__galleryJobs;
  });

  describe("POST /api/actions/publish-x", () => {
    it("content_key 欠落 → 400", async () => {
      setup({ lastPublishXSuccess: daysAgoIso(1) });
      const { POST } = await import("@/app/api/actions/publish-x/route");
      const res = await POST(req("http://x", {}));
      expect(res.status).toBe(400);
    });

    it("7日超 + !force → 428", async () => {
      setup({ lastPublishXSuccess: daysAgoIso(8) });
      const { POST } = await import("@/app/api/actions/publish-x/route");
      const res = await POST(req("http://x", { content_key: "k", datetime: "2026-12-01T10:00" }));
      expect(res.status).toBe(428);
    });

    it("7日超でも force:true → 202", async () => {
      setup({ lastPublishXSuccess: daysAgoIso(8) });
      const { POST } = await import("@/app/api/actions/publish-x/route");
      const res = await POST(
        req("http://x", { content_key: "k", datetime: "2026-12-01T10:00", force: true }),
      );
      expect(res.status).toBe(202);
    });

    it("job 実行中は 409 (spawn mock で close させない)", async () => {
      setup({ lastPublishXSuccess: daysAgoIso(1) });
      const { POST } = await import("@/app/api/actions/publish-x/route");
      // 1 個目: spawn は返るが close させない → running のまま。
      const first = await POST(req("http://x", { content_key: "k1", dry_run: true }));
      expect(first.status).toBe(202);
      // 2 個目: 同時実行 1 で 409。
      const second = await POST(req("http://x", { content_key: "k2", dry_run: true }));
      expect(second.status).toBe(409);
    });
  });

  describe("POST /api/actions/regenerate", () => {
    it("whitelist 外 kind → 400", async () => {
      setup();
      const { POST } = await import("@/app/api/actions/regenerate/route");
      const res = await POST(req("http://x", { kind: "danger" }));
      expect(res.status).toBe(400);
    });

    it("keys 不正 (セミコロン) → 400", async () => {
      setup();
      const { POST } = await import("@/app/api/actions/regenerate/route");
      const res = await POST(req("http://x", { kind: "ogp-ranking", keys: "a;b" }));
      expect(res.status).toBe(400);
    });

    it("正常 → 202", async () => {
      setup();
      const { POST } = await import("@/app/api/actions/regenerate/route");
      const res = await POST(req("http://x", { kind: "blog-thumbnails" }));
      expect(res.status).toBe(202);
    });
  });

  describe("エラーレスポンスに機微情報を含まない", () => {
    it("publish-x 428 の body は { error } のみ (stack / env / コマンド全文なし)", async () => {
      setup({ lastPublishXSuccess: daysAgoIso(8) });
      const { POST } = await import("@/app/api/actions/publish-x/route");
      const res = await POST(req("http://x", { content_key: "k", datetime: "2026-12-01T10:00" }));
      const json = await res.json();
      expect(Object.keys(json)).toEqual(["error"]);
      const s = JSON.stringify(json);
      expect(s).not.toMatch(/at .*\.ts:\d+/); // stack trace の形跡なし
      expect(s).not.toContain("STATS47_PROJECT_ROOT");
      expect(s).not.toContain("/.claude/skills/sns/publish-x"); // コマンド全文なし
      expect(s).not.toContain(root); // fixture path (env 値) が漏れない
    });

    it("regenerate 400 の body は { error } のみ", async () => {
      setup();
      const { POST } = await import("@/app/api/actions/regenerate/route");
      const res = await POST(req("http://x", { kind: "ogp-ranking", keys: "$(whoami)" }));
      const json = await res.json();
      expect(Object.keys(json)).toEqual(["error"]);
      expect(JSON.stringify(json)).not.toContain("whoami");
    });
  });
});
