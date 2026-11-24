import * as path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

import {
  candidateIsrObjectKeys,
  listAppEntries,
  r2IncrementalCacheKey,
  resolveRouteCacheOwner,
  routeCacheKey,
} from "../isr-route-cache-key";

const ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");
const APP_DIR = path.join(ROOT, "apps", "web", "src", "app");
const require = createRequire(path.join(ROOT, "apps", "web", "package.json"));

// インストール済みの OpenNext の実装 (本番の Worker が使うもの) を読み、同じキーになることを固定する
async function loadOpenNext() {
  const cfDir = path.dirname(require.resolve("@opennextjs/cloudflare/package.json"));
  const awsDir = path.join(cfDir, "node_modules", "@opennextjs", "aws");
  const routeKey = await import(pathToFileURL(path.join(awsDir, "dist", "utils", "routeCacheKey.js")).href);
  const internal = await import(pathToFileURL(path.join(cfDir, "dist", "api", "overrides", "internal.js")).href);
  return { routeKey, internal };
}

const ENTRIES = listAppEntries(APP_DIR);
const PATHS = ["/blog/traffic-accident-deaths-regional-risk", "/blog", "/themes", "/blog/tags", "/"];

describe("ISR のキャッシュキー", () => {
  it("app の項目は app-paths-manifest の形 (/blog/[slug]/page) で列挙される", () => {
    expect(ENTRIES).toContain("/blog/[slug]/page");
    expect(ENTRIES).toContain("/blog/page");
    expect(ENTRIES).toContain("/themes/page");
  });

  it("記事のパスは動的ルート /blog/[slug]/page が持ち、一覧 /blog/tags は静的ルートが持つ", () => {
    expect(resolveRouteCacheOwner("/blog/foo", ENTRIES)?.sourceRoute).toBe("/blog/[slug]/page");
    expect(resolveRouteCacheOwner("/blog/tags", ENTRIES)?.sourceRoute).toBe("/blog/tags/page");
  });

  it.each(PATHS)("%s のキーが OpenNext の getRouteCacheKey と computeCacheKey に一致する", async (pathname) => {
    const { routeKey, internal } = await loadOpenNext();
    const ours = resolveRouteCacheOwner(pathname, ENTRIES);
    expect(ours).toBeDefined();
    const theirs = routeKey.getRouteCacheOwner(routeKey.normalizeAppPath(ours!.sourceRoute), {
      appPaths: ENTRIES,
      pagesManifest: {},
    });
    expect(theirs).toEqual(ours);
    const key = routeCacheKey(pathname, ours!);
    expect(key).toBe(routeKey.getRouteCacheKey(pathname, theirs));
    expect(r2IncrementalCacheKey("B1", key)).toBe(internal.computeCacheKey(key, { buildId: "B1" }));
  });

  it("新形式のキーを先に、旧形式 (パスそのもの) を後に返す", () => {
    const keys = candidateIsrObjectKeys("B1", "/blog/foo", ENTRIES);
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(r2IncrementalCacheKey("B1", "/blog/foo"));
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("本番の Next.js の版では新形式のキーが使われる (版が下がると旧形式だけになる)", async () => {
    const { routeKey } = await loadOpenNext();
    const nextVersion: string = require("next/package.json").version;
    expect(routeKey.useRouteCacheKeys(nextVersion)).toBe(true);
  });
});
