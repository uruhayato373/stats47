#!/usr/bin/env node
/**
 * audit-site-links — サイト横断の内部リンク切れ監査 (決定的・LLM 不使用)
 *
 * なぜ必要か:
 *   ブログ記事の内部リンク検査 (.claude/scripts/blog/audit-internal-links.mjs) は article.md に
 *   書かれたリンクしか見ない。実際にはリンクの大半は**ページ側コンポーネントが生成**する
 *   (タグ・パンくず・サイドバー・関連ランキング・県データブックの KPI グリッド等)。
 *   これらは記事本文にもリポジトリの 1 箇所にも現れないため、レンダリング済み HTML を
 *   走査しないと検知できない。
 *
 *   2026-07-24 の初回実測ではこの経路でしか見つからない壊れが 2 系統出た:
 *     - 公開記事のタグリンク 1,988 本が 410 (known-tag-keys.ts が D1 廃止で 2026-04-26 に凍結)
 *     - 全 47 県の県ページが isActive:false のランキングへリンク (410 / 空ページ)
 *
 * 判定 (★status だけでは足りない):
 *   /ranking/<不在キー> は **HTTP 200** を返し <title> だけが「ランキングが見つかりません」になる
 *   (soft 404)。したがって status に加えて <title> の内容で判定する。
 *   同じ考え方の先例: .github/scripts/check-prerender-notfound.sh / smoke-test-routes.sh
 *
 * サンプリング:
 *   リンク先の集合は route テンプレート駆動で収束が速い (実測: 30 ページ走査で 2,279 リンク先)。
 *   既定は route テンプレートごとに --per-route 件を層化抽出する。--all で sitemap 全数。
 *
 * 使い方:
 *   node .claude/scripts/site/audit-site-links.mjs                # 既定サンプリング
 *   node .claude/scripts/site/audit-site-links.mjs --per-route 20 # 標本を増やす
 *   node .claude/scripts/site/audit-site-links.mjs --all          # sitemap 全数 (重い)
 *   node .claude/scripts/site/audit-site-links.mjs --json out.json
 * Exit: 壊れが 1 件でもあれば 1。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = (process.env.SITE_ORIGIN ?? "https://stats47.jp").replace(/\/$/, "");
const R2_PUBLIC = (process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp").replace(/\/$/, "");
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const NOT_FOUND_TITLE = /(見つかりません|ページが存在しません|not found)/i;
const CONCURRENCY = 8;

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const PER_ROUTE = Number(flag("--per-route", "8"));
const ALL = argv.includes("--all");
const JSON_OUT = flag("--json", null);

/* ---------------------------------------------------------------- fetch */

async function get(url, { method = "GET" } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: { "user-agent": UA },
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      const text = res.status === 200 && method === "GET" ? await res.text() : "";
      return { status: res.status, text, location: res.headers.get("location") };
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return { status: 0, text: "", location: null };
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const titleOf = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1]?.trim() ?? "";

/* ------------------------------------------------------ ページ集合の構築 */

/** URL パスを route テンプレートに畳む (層化抽出のキー) */
function routeTemplate(p) {
  if (p === "/") return "/";
  const seg = p.split("/").filter(Boolean);
  const head = seg[0];
  if (head === "areas") {
    if (seg.length === 1) return "/areas";
    if (seg[2] === "cities") return seg.length >= 5 ? "/areas/[c]/cities/[c]/[k]" : "/areas/[c]/cities/[c]";
    return seg.length >= 3 ? "/areas/[c]/[theme]" : "/areas/[c]";
  }
  if (["ranking", "blog", "themes", "survey", "tag", "category"].includes(head)) {
    if (seg.length === 1) return `/${head}`;
    if (head === "category" && seg[2] === "compare") return "/category/[k]/compare";
    return `/${head}/[k]`;
  }
  return `/${head}`;
}

async function collectSitemapUrls() {
  const index = await get(`${ORIGIN}/sitemap.xml`);
  const locs = [...index.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const children = locs.filter((u) => /\/sitemap\/\d+\.xml$/.test(u));
  if (children.length === 0) return locs.map((u) => u.replace(ORIGIN, ""));
  const pages = await pool(children, 4, async (u) => (await get(u)).text);
  return pages
    .flatMap((xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
    .map((u) => u.replace(ORIGIN, ""));
}

/**
 * sitemap に載らないが実在する route を補う。
 * blog 記事 / tag / category / survey は sitemap 対象外だが、内部リンクの主要な発生源。
 */
async function collectNonSitemapUrls() {
  const urls = ["/blog", "/blog/tags", "/search", "/about", "/terms", "/privacy", "/survey", "/ranking"];
  try {
    const res = await fetch(`${R2_PUBLIC}/app/blog/all.json`, { signal: AbortSignal.timeout(30_000) });
    if (res.ok) {
      const snap = await res.json();
      for (const a of (snap.articles ?? []).filter((a) => a.published === true)) {
        urls.push(`/blog/${a.slug}`);
      }
      for (const t of snap.tagMeta ?? []) {
        urls.push(`/tag/${encodeURIComponent(t.tagKey)}`);
      }
    }
  } catch {
    /* R2 が読めなくても sitemap 分は検査できるので継続 */
  }
  // category / survey はリポジトリの定義から (ネットワーク非依存)
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const catSrc = path.join(root, "packages/data-configs/src/types.ts");
  if (fs.existsSync(catSrc)) {
    const m = fs.readFileSync(catSrc, "utf8").match(/CATEGORY_KEYS\s*=\s*\[([\s\S]*?)\]/);
    for (const k of [...(m?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1])) {
      urls.push(`/category/${k}`);
    }
  }
  const surveySrc = path.join(root, "packages/ranking/src/data/surveys.json");
  if (fs.existsSync(surveySrc)) {
    for (const s of JSON.parse(fs.readFileSync(surveySrc, "utf8"))) {
      if (s?.id) urls.push(`/survey/${s.id}`);
    }
  }
  return urls;
}

/** route テンプレートごとに上限 n 件を等間隔で抽出 (先頭固定 + 分散) */
function stratify(urls, n) {
  const byRoute = new Map();
  for (const u of urls) {
    const r = routeTemplate(u);
    if (!byRoute.has(r)) byRoute.set(r, []);
    byRoute.get(r).push(u);
  }
  const picked = [];
  for (const [, list] of byRoute) {
    if (list.length <= n) {
      picked.push(...list);
      continue;
    }
    const step = list.length / n;
    for (let i = 0; i < n; i++) picked.push(list[Math.floor(i * step)]);
  }
  return picked;
}

/* -------------------------------------------------------- リンクの抽出 */

const HREF_RE = /href="((?:https?:\/\/(?:www\.)?stats47\.jp)?\/[^"]*)"/g;

function extractInternalLinks(html) {
  const out = new Set();
  for (const m of html.matchAll(HREF_RE)) {
    let href = m[1].replace(/^https?:\/\/(?:www\.)?stats47\.jp/, "");
    href = href.split("#")[0]; // fragment のみ除去。クエリは残す (/api/... は必須)
    if (!href.startsWith("/")) continue;
    if (href.startsWith("//")) continue;
    out.add(href);
  }
  return out;
}

/* ------------------------------------------------------------------ main */

async function main() {
  console.log(`🔎 サイト横断リンク監査 — ${ORIGIN}`);

  const [sitemapUrls, extraUrls] = await Promise.all([collectSitemapUrls(), collectNonSitemapUrls()]);
  const allPages = [...new Set([...sitemapUrls, ...extraUrls, "/"])];
  const pages = ALL ? allPages : stratify(allPages, PER_ROUTE);
  console.log(`   走査対象ページ: ${pages.length} / 既知 ${allPages.length}${ALL ? " (全数)" : ` (route ごと最大 ${PER_ROUTE} 件)`}`);

  // --- ページを取得して href を集める
  const refs = new Map(); // target -> Set(referrer)
  const unreachablePages = [];
  let done = 0;
  await pool(pages, CONCURRENCY, async (p) => {
    const r = await get(ORIGIN + p);
    done++;
    if (done % 50 === 0) process.stdout.write(`\r   取得 ${done}/${pages.length}`);
    if (r.status !== 200) {
      // 301/308/410 は意図的な場合があるのでページ側の失敗としては 4xx/5xx/0 のみ記録
      if (r.status === 0 || r.status >= 400) unreachablePages.push({ page: p, status: r.status });
      return;
    }
    for (const t of extractInternalLinks(r.text)) {
      if (!refs.has(t)) refs.set(t, new Set());
      refs.get(t).add(p);
    }
  });
  process.stdout.write(`\r   取得 ${done}/${pages.length}\n`);
  console.log(`   ユニークな内部リンク先: ${refs.size}`);

  // --- リンク先を 1 回ずつ検査
  const targets = [...refs.keys()].sort();
  const broken = [];
  const redirects = [];
  const statusCount = {};
  let checked = 0;
  await pool(targets, CONCURRENCY, async (t) => {
    const r = await get(ORIGIN + t);
    checked++;
    if (checked % 100 === 0) process.stdout.write(`\r   検査 ${checked}/${targets.length}`);
    statusCount[r.status] = (statusCount[r.status] ?? 0) + 1;
    const title = titleOf(r.text);
    const from = [...refs.get(t)];

    if (r.status === 301 || r.status === 302 || r.status === 307 || r.status === 308) {
      // リダイレクト先が壊れていないか (301 → 410 のチェーンを検知)
      const dest = (r.location ?? "").replace(/^https?:\/\/(?:www\.)?stats47\.jp/, "");
      if (dest.startsWith("/")) {
        const d = await get(ORIGIN + dest);
        if (d.status >= 400 || (d.status === 200 && NOT_FOUND_TITLE.test(titleOf(d.text)))) {
          redirects.push({ target: t, dest, status: d.status, from: from.slice(0, 3), refCount: from.length });
        }
      }
      return;
    }
    const softNotFound = r.status === 200 && NOT_FOUND_TITLE.test(title);
    if (softNotFound || r.status === 0 || r.status >= 400) {
      broken.push({
        target: t,
        status: r.status,
        kind: softNotFound ? "soft-404" : r.status === 410 ? "gone" : `http-${r.status}`,
        title: title.slice(0, 60),
        refCount: from.length,
        from: from.slice(0, 5),
      });
    }
  });
  process.stdout.write(`\r   検査 ${checked}/${targets.length}\n`);

  // --- レポート
  broken.sort((a, b) => b.refCount - a.refCount || a.target.localeCompare(b.target));
  const byRoute = {};
  for (const b of broken) {
    const r = routeTemplate(b.target);
    byRoute[r] = (byRoute[r] ?? 0) + 1;
  }

  console.log("");
  console.log(`ステータス分布: ${JSON.stringify(statusCount)}`);
  if (unreachablePages.length) {
    console.log(`\n⚠️  取得できなかったページ: ${unreachablePages.length}`);
    for (const u of unreachablePages.slice(0, 10)) console.log(`   [${u.status}] ${u.page}`);
  }
  if (redirects.length) {
    console.log(`\n⚠️  リダイレクト先が壊れている (301→410 等): ${redirects.length}`);
    for (const r of redirects.slice(0, 10)) {
      console.log(`   ${r.target} → ${r.dest} [${r.status}]  (参照 ${r.refCount} ページ)`);
    }
  }

  console.log(`\n壊れリンク: ${broken.length} / ${targets.length}`);
  if (broken.length) {
    console.log(`   route 別: ${JSON.stringify(byRoute)}`);
    for (const b of broken.slice(0, 40)) {
      console.log(`   [${b.kind}] ${b.target}  (参照 ${b.refCount} ページ)`);
      console.log(`        ← ${b.from.join(", ")}${b.refCount > b.from.length ? " …" : ""}`);
    }
    if (broken.length > 40) console.log(`   … 他 ${broken.length - 40} 件`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    origin: ORIGIN,
    mode: ALL ? "all" : `per-route:${PER_ROUTE}`,
    pagesCrawled: pages.length,
    pagesKnown: allPages.length,
    uniqueTargets: targets.length,
    statusCount,
    brokenCount: broken.length,
    brokenByRoute: byRoute,
    broken,
    redirectToBroken: redirects,
    unreachablePages,
  };
  const outPath = JSON_OUT
    ? path.resolve(JSON_OUT)
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../state/site/link-audit.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`\n📄 ${outPath}`);

  if (broken.length > 0) process.exit(1);
  console.log("✅ 壊れリンクなし");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
