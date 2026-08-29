import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

describe("kindle cover route", () => {
  let root: string;

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function setup() {
    root = makeFixtureRoot({
      stateFiles: {
        ".local/kindle-books/K-S1-01/v1/cover.jpg": "cover-bytes",
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
