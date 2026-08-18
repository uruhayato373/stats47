import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * GET /media/[...path] の integration。全量 200 / Range 206 / 416 / traversal 403 / 不在 404。
 * fixture の .local/r2/sns 配下に既知サイズのファイルを置く。
 */
describe("media route", () => {
  let root: string;
  const CONTENT = "0123456789ABCDEF"; // 16 bytes

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function setup() {
    root = makeFixtureRoot({ posts: [] });
    // .local/r2/sns/ranking/mk/x/stills/a.png に既知内容を書く。
    const abs = path.join(root, ".local/r2/sns/ranking/mk/x/stills/a.png");
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, CONTENT);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/app/media/[...path]/route");
  }

  function call(
    mod: { GET: (req: Request, ctx: { params: Promise<{ path: string[] }> }) => Promise<Response> },
    segments: string[],
    range?: string,
  ) {
    const headers: Record<string, string> = {};
    if (range) headers.range = range;
    const req = new Request(`http://x/media/${segments.join("/")}`, { headers });
    return mod.GET(req, { params: Promise.resolve({ path: segments }) });
  }

  const OK_SEGS = ["ranking", "mk", "x", "stills", "a.png"];

  it("全量 → 200 + content-length=16 + accept-ranges", async () => {
    const mod = await setup();
    const res = await call(mod, OK_SEGS);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe("16");
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(await res.text()).toBe(CONTENT);
  });

  it("Range bytes=0-3 → 206 + content-range + content-length=4", async () => {
    const mod = await setup();
    const res = await call(mod, OK_SEGS, "bytes=0-3");
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-3/16");
    expect(res.headers.get("content-length")).toBe("4");
    expect(await res.text()).toBe("0123");
  });

  it("Range bytes=10- → 206 + 末尾まで (10..15)", async () => {
    const mod = await setup();
    const res = await call(mod, OK_SEGS, "bytes=10-");
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 10-15/16");
    expect(await res.text()).toBe("ABCDEF");
  });

  it("start >= size → 416 + content-range bytes */size", async () => {
    const mod = await setup();
    const res = await call(mod, OK_SEGS, "bytes=100-200");
    expect(res.status).toBe(416);
    expect(res.headers.get("content-range")).toBe("bytes */16");
  });

  it("traversal (..) → 403", async () => {
    const mod = await setup();
    const res = await call(mod, ["..", "..", "etc", "passwd"]);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("不在ファイル → 404", async () => {
    const mod = await setup();
    const res = await call(mod, ["ranking", "mk", "x", "stills", "nope.png"]);
    expect(res.status).toBe(404);
  });

  it("404/403 レスポンスに機微情報を含まない (error のみ)", async () => {
    const mod = await setup();
    const res = await call(mod, ["..", "secret"]);
    const json = await res.json();
    expect(Object.keys(json)).toEqual(["error"]);
    expect(JSON.stringify(json)).not.toContain(root);
  });
});
