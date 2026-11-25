/**
 * OpenNext (Cloudflare) の R2 incremental cache で、ページの ISR エントリがどのキーに置かれるかを求める。
 *
 * Next.js 16.3.8 以上 (と 15.5.27〜16.0.0 未満) では、@opennextjs/aws 4.2 の `useRouteCacheKeys` が真になり、
 * キャッシュのキーは「パス」ではなく `/route-cache/<種類>/<sha256(app の項目名)>/$<パス>` になる
 * (`@opennextjs/aws/dist/utils/routeCacheKey.js` の getRouteCacheKey / getRouteCacheOwner)。R2 のオブジェクト名は
 * そのキーをさらに sha256 にした `incremental-cache/<buildId>/<hash>.cache`
 * (`@opennextjs/cloudflare/dist/api/overrides/internal.js` の computeCacheKey)。
 *
 * 旧形式 (パスをそのまま sha256) だけを探していたため、2026-11-25 の記事公開で ISR の削除が
 * 「どの buildId にもない」で止まった。両方の形を返し、呼び手が存在するほうを消す。
 * 一致は `__tests__/isr-route-cache-key.test.ts` がインストール済みの OpenNext の関数と照らして固定する。
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const CACHE_PREFIX = "incremental-cache";

export type RouteCacheOwner = { kind: "APP_PAGE" | "APP_ROUTE"; sourceRoute: string };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** app ディレクトリの page / route ファイルを app-paths-manifest の項目名 (`/blog/[slug]/page`) にする */
export function listAppEntries(appDir: string): string[] {
  const entries: string[] = [];
  const walk = (dir: string, rel: string) => {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (d.isDirectory()) {
        if (d.name === "node_modules" || d.name.startsWith("_") || d.name === "__tests__") continue;
        walk(path.join(dir, d.name), `${rel}/${d.name}`);
        continue;
      }
      const m = /^(page|route)\.(tsx|ts|jsx|js)$/.exec(d.name);
      if (m) entries.push(`${rel}/${m[1]}`);
    }
  };
  walk(appDir, "");
  return entries;
}

/** Next.js の normalizeAppPath と同じ: route group・parallel slot・末尾の page/route を外す */
export function normalizeAppPath(entry: string): string {
  const segments = entry.split("/");
  const out = segments.reduce((acc, seg, i) => {
    if (!seg) return acc;
    if (seg.startsWith("(") && seg.endsWith(")")) return acc;
    if (seg.startsWith("@")) return acc;
    if ((seg === "page" || seg === "route") && i === segments.length - 1) return acc;
    return `${acc}/${seg}`;
  }, "");
  return out === "" ? "/" : out;
}

function routeMatches(route: string, pathname: string): boolean {
  const r = route.split("/").filter(Boolean);
  const p = pathname.split("/").filter(Boolean);
  for (let i = 0; i < r.length; i++) {
    const seg = r[i];
    if (seg.startsWith("[[...")) return true;
    if (seg.startsWith("[...")) return p.length > i;
    if (i >= p.length) return false;
    if (seg.startsWith("[")) continue;
    if (seg !== p[i]) return false;
  }
  return r.length === p.length;
}

/** パスを描く app の項目を選ぶ。静的な一致を動的な一致より優先し、slot 付きは後回しにする */
export function resolveRouteCacheOwner(pathname: string, appEntries: string[]): RouteCacheOwner | undefined {
  const candidates = appEntries
    .map((entry) => ({ entry, route: normalizeAppPath(entry) }))
    .filter(({ route }) => routeMatches(route, pathname));
  if (candidates.length === 0) return undefined;
  const dynamicCount = (route: string) => (route.match(/\[/g) ?? []).length;
  candidates.sort(
    (a, b) =>
      dynamicCount(a.route) - dynamicCount(b.route) ||
      Number(a.entry.includes("/@")) - Number(b.entry.includes("/@")) ||
      b.entry.localeCompare(a.entry),
  );
  const { entry } = candidates[0];
  return { kind: entry.endsWith("/route") ? "APP_ROUTE" : "APP_PAGE", sourceRoute: entry };
}

/** Next.js の normalizePagePath (OpenNext の写し) */
export function normalizePagePath(page: string): string {
  if (/^\/index(\/|$)/.test(page) && !/\/\[[^/]+?\](?=\/|$)/.test(page)) return `/index${page}`;
  if (page === "/") return "/index";
  return page.startsWith("/") ? page : `/${page}`;
}

/** OpenNext の getRouteCacheKey と同じキー */
export function routeCacheKey(pathname: string, owner: RouteCacheOwner): string {
  return `/route-cache/${owner.kind}/${sha256(owner.sourceRoute)}/$${normalizePagePath(pathname)}`;
}

/** OpenNext (Cloudflare) の computeCacheKey と同じ R2 のオブジェクト名 */
export function r2IncrementalCacheKey(buildId: string, key: string, type: "cache" | "fetch" = "cache"): string {
  return `${CACHE_PREFIX}/${buildId}/${sha256(key)}.${type}`.replace(/\/+/g, "/");
}

/** 1 つのパスについて、新旧どちらの形でも置かれうる R2 のオブジェクト名を返す (新形式が先) */
export function candidateIsrObjectKeys(buildId: string, pathname: string, appEntries: string[]): string[] {
  const keys: string[] = [];
  const owner = resolveRouteCacheOwner(pathname, appEntries);
  if (owner) keys.push(r2IncrementalCacheKey(buildId, routeCacheKey(pathname, owner)));
  keys.push(r2IncrementalCacheKey(buildId, pathname === "/" ? "/index" : pathname));
  return keys;
}
