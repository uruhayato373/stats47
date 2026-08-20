import type { NextRequest } from "next/server";

import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest as ShimRequest } from "@/vitest.shims";
import {
  cleanupFixtureRoot,
  makeFixtureRoot,
  readPosts,
  type SeedPost,
} from "../helpers/fixture-root";

/**
 * POST /api/posts と PATCH /api/posts/[id] の integration。
 * status 強制 (draft) と caption/scheduled_at ホワイトリストを検証する。
 */
describe("posts routes", () => {
  let root: string;

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  function setup(opts: Parameters<typeof makeFixtureRoot>[0]) {
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
  }

  // ランタイムは shim の NextRequest (nextUrl getter 付き)。型は route が要求する
  // next/server の NextRequest に合わせてキャスト (shim は最小互換のため構造が異なる)。
  function jsonReq(url: string, method: string, body: unknown): NextRequest {
    return new ShimRequest(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  }

  describe("POST /api/posts", () => {
    it("必須欠落 → 400", async () => {
      setup({ posts: [] });
      const { POST } = await import("@/app/api/posts/route");
      const res = await POST(jsonReq("http://x/api/posts", "POST", { platform: "x" }));
      expect(res.status).toBe(400);
    });

    it("成功 → 201 + status は常に draft (body で posted を指定しても無視)", async () => {
      setup({ posts: [] });
      const { POST } = await import("@/app/api/posts/route");
      const res = await POST(
        jsonReq("http://x/api/posts", "POST", {
          platform: "x",
          domain: "ranking",
          content_key: "created-key",
          // status は CreatePost schema に無いので落ちる。仮に来ても createDraft が draft 固定。
          status: "posted",
        }),
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.status).toBe("draft");
      expect(readPosts(root).find((p) => p.content_key === "created-key")?.status).toBe("draft");
    });

    it("platform enum 外 (tiktok) → 400", async () => {
      setup({ posts: [] });
      const { POST } = await import("@/app/api/posts/route");
      const res = await POST(
        jsonReq("http://x/api/posts", "POST", {
          platform: "tiktok",
          domain: "ranking",
          content_key: "k",
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/posts/[id]", () => {
    const seed: SeedPost[] = [
      { id: 5, platform: "x", status: "posted", domain: "ranking", content_key: "k", caption: "old" },
    ];

    async function patch(id: string, body: unknown) {
      const { PATCH } = await import("@/app/api/posts/[id]/route");
      return PATCH(jsonReq(`http://x/api/posts/${id}`, "PATCH", body), {
        params: Promise.resolve({ id }),
      });
    }

    it("caption 更新 → 200 + fixture posts.json が更新される", async () => {
      setup({ posts: seed });
      const res = await patch("5", { caption: "updated" });
      expect(res.status).toBe(200);
      expect(readPosts(root).find((p) => p.id === 5)?.caption).toBe("updated");
    });

    it("許可外キー (status) → 400", async () => {
      setup({ posts: seed });
      const res = await patch("5", { status: "deleted" });
      expect(res.status).toBe(400);
      expect(readPosts(root).find((p) => p.id === 5)?.status).toBe("posted");
    });

    it("空 patch → 400", async () => {
      setup({ posts: seed });
      const res = await patch("5", {});
      expect(res.status).toBe(400);
    });

    it("不在 id → 404", async () => {
      setup({ posts: seed });
      const res = await patch("999", { caption: "x" });
      expect(res.status).toBe(404);
    });

    it("非整数 id → 400", async () => {
      setup({ posts: seed });
      const res = await patch("abc", { caption: "x" });
      expect(res.status).toBe(400);
    });
  });
});
