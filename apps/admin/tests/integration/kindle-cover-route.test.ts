import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";
import { KDP_LISTINGS } from "../../../../packages/product-factory/src/ledger-paths.mjs";

describe("kindle cover route", () => {
  let root: string;

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function setup(withDraft = false) {
    root = makeFixtureRoot({
      stateFiles: {
        [KDP_LISTINGS]: JSON.stringify({
          listings: {
            "K-S1-01": {
              coverPath: ".local/kindle-books/K-S1-01/v4-current/cover.jpg",
            },
          },
        }),
        ".local/kindle-books/K-S1-01/v1/cover.jpg": "old-cover",
        ".local/kindle-books/K-S1-01/v4-current/cover.jpg": "cover-bytes",
        ...(withDraft ? { ".local/kindle-cover-drafts/K-S1-01/cover.jpg": "draft-cover" } : {}),
      },
    });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/app/kindle-cover/[id]/route");
  }

  function call(
    mod: { GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> },
    id: string,
  ) {
    return mod.GET(new Request(`http://x/kindle-cover/${id}`), {
      params: Promise.resolve({ id }),
    });
  }

  it("既存表紙を no-store の JPEG として返す", async () => {
    const mod = await setup();
    const res = await call(mod, "K-S1-01");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("content-length")).toBe("11");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await res.text()).toBe("cover-bytes");
  });

  it("固定v1ではなくKDP台帳が指す最新版を返す", async () => {
    const mod = await setup();
    const res = await call(mod, "K-S1-01");
    const body = await res.text();

    expect(body).not.toBe("old-cover");
    expect(body).toBe("cover-bytes");
  });

  it("未承認ドラフトがあれば既刊版を上書きせず優先表示する", async () => {
    const mod = await setup(true);
    const res = await call(mod, "K-S1-01");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("draft-cover");
  });

  it("不正な書籍 ID を 404 にする", async () => {
    const mod = await setup();
    const res = await call(mod, "../secret");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("表紙がない書籍 ID を 404 にする", async () => {
    const mod = await setup();
    const res = await call(mod, "K-S4-99");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });
});
