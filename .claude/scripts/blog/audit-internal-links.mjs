#!/usr/bin/env node
/**
 * audit-internal-links.mjs — 公開ブログ全記事の内部リンクを live で実測し、リンク切れを洗い出す
 *
 * オフライン lint (`.claude/scripts/lib/internal-link-lint.mjs`) が判定できるのは
 * repo 内に key 集合がある型 (ranking / category / areas / blog の GONE) だけ。本スクリプトは
 * themes / tag / survey / blog の実在も含めて **live の応答で確定** させる全量監査。
 *
 * ★ HTTP ステータスだけで判定してはならない
 *   `/ranking/<存在しないkey>` は **HTTP 200 + タイトル「ランキングが見つかりません」** を返す
 *   (soft 404)。2026-07-24 実測で 37 件の壊れリンクのうち 29 件がこの形だった。
 *   `nextjs-ssg-preservation.md` の smoke-test と同じく **タイトルの内容**で判定する。
 *
 * 使い方:
 *   node .claude/scripts/blog/audit-internal-links.mjs                 # 全公開記事を監査
 *   node .claude/scripts/blog/audit-internal-links.mjs --limit 20      # 先頭 20 記事だけ
 *   node .claude/scripts/blog/audit-internal-links.mjs --base <dir>    # ローカルの記事ツリーを対象
 *   node .claude/scripts/blog/audit-internal-links.mjs --json /tmp/x.json
 *
 * 出力: 壊れリンク一覧 (stdout) + 詳細 JSON。壊れが 1 件でもあれば exit 1 (cron のゲート用)。
 */
import fs from "node:fs";
import path from "node:path";

import { extractInternalLinks } from "../lib/internal-link-lint.mjs";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const SITE_BASE = process.env.SITE_BASE_URL || "https://stats47.jp";
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const ARTICLE_CONCURRENCY = 8;
const LINK_CONCURRENCY = 6;

/** タイトルにこれが出たら soft 404 (HTTP 200 でも実質リンク切れ) */
const NOT_FOUND_TITLE = /(見つかりません|ページが存在しません|not found)/i;

function getArg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const LIMIT = Number(getArg("--limit", "0")) || 0;
const BASE_DIR = getArg("--base", "");
const JSON_OUT = getArg("--json", "/tmp/internal-link-audit.json");

async function fetchText(url, { ua = null, timeout = 25000 } = {}) {
  const res = await fetch(url, {
    headers: ua ? { "user-agent": ua } : {},
    signal: AbortSignal.timeout(timeout),
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function runPool(items, concurrency, worker) {
  let i = 0;
  const out = new Array(items.length);
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await worker(items[idx], idx);
      }
    }),
  );
  return out;
}

/** 記事本文を集める (既定は R2 の公開記事、--base でローカルツリー) */
async function loadArticles() {
  if (BASE_DIR) {
    const dirs = fs
      .readdirSync(BASE_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(BASE_DIR, d.name, "article.md")))
      .map((d) => d.name);
    const slugs = LIMIT ? dirs.slice(0, LIMIT) : dirs;
    return slugs.map((slug) => ({
      slug,
      content: fs.readFileSync(path.join(BASE_DIR, slug, "article.md"), "utf8"),
    }));
  }

  const { body } = await fetchText(`${R2_BASE}/app/blog/all.json`);
  const all = JSON.parse(body);
  const list = (Array.isArray(all) ? all : all.articles || []).filter((a) => a.published !== false);
  const slugs = (LIMIT ? list.slice(0, LIMIT) : list).map((a) => a.slug);

  const results = await runPool(slugs, ARTICLE_CONCURRENCY, async (slug) => {
    try {
      const { status, body } = await fetchText(`${R2_BASE}/app/blog/${slug}/article.md`);
      if (status !== 200) return null;
      return { slug, content: body };
    } catch {
      return null;
    }
  });
  return results.filter(Boolean);
}

/** live のリンク先を判定する (status + title) */
async function checkUrl(href) {
  const url = `${SITE_BASE}${href}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { status, body } = await fetchText(url, { ua: UA });
      const title = (body.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
      const softNotFound = status === 200 && NOT_FOUND_TITLE.test(title);
      return {
        href,
        status,
        title: title.trim(),
        ok: status === 200 && !softNotFound,
        reason: status !== 200 ? `HTTP ${status}` : softNotFound ? "soft 404 (200 だが不在ページ)" : "",
      };
    } catch (e) {
      if (attempt === 2) {
        return { href, status: 0, title: "", ok: false, reason: `取得失敗: ${e.message}` };
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

async function main() {
  const articles = await loadArticles();
  console.log(`対象記事: ${articles.length} 件`);

  // href → 参照している記事
  const refs = new Map();
  let totalLinks = 0;
  let absoluteLinks = 0;
  for (const { slug, content } of articles) {
    for (const link of extractInternalLinks(content)) {
      totalLinks++;
      if (link.absolute) absoluteLinks++;
      if (!refs.has(link.href)) refs.set(link.href, new Set());
      refs.get(link.href).add(slug);
    }
  }
  const hrefs = [...refs.keys()].sort();
  console.log(`内部リンク: 延べ ${totalLinks} 本 / ユニーク ${hrefs.length} 件 (絶対URL ${absoluteLinks} 本)`);
  console.log(`live 実測中 (${SITE_BASE}) …`);

  let done = 0;
  const results = await runPool(hrefs, LINK_CONCURRENCY, async (href) => {
    const r = await checkUrl(href);
    if (++done % 100 === 0) console.log(`  ${done}/${hrefs.length} …`);
    return r;
  });

  const broken = results.filter((r) => !r.ok);
  const byType = {};
  for (const r of results) {
    const t = r.href.split("/")[1] || "?";
    byType[t] ??= { total: 0, broken: 0 };
    byType[t].total++;
    if (!r.ok) byType[t].broken++;
  }

  console.log("\n| 種別 | ユニーク | 壊れ |");
  console.log("|---|---:|---:|");
  for (const [t, v] of Object.entries(byType).sort((a, b) => b[1].broken - a[1].broken)) {
    console.log(`| /${t}/ | ${v.total} | ${v.broken} |`);
  }

  if (broken.length) {
    console.log(`\n壊れリンク ${broken.length} 件:`);
    console.log("\n| URL | 理由 | 参照記事数 |");
    console.log("|---|---|---:|");
    for (const b of broken.sort((a, b2) => refs.get(b2.href).size - refs.get(a.href).size)) {
      console.log(`| ${b.href} | ${b.reason} | ${refs.get(b.href).size} |`);
    }
  } else {
    console.log("\n✓ 壊れリンクなし");
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    site: SITE_BASE,
    articles: articles.length,
    totalLinks,
    absoluteLinks,
    uniqueLinks: hrefs.length,
    byType,
    broken: broken.map((b) => ({ ...b, referencedBy: [...refs.get(b.href)].sort() })),
  };
  fs.writeFileSync(JSON_OUT, JSON.stringify(payload, null, 2));
  console.log(`\nJSON: ${JSON_OUT}`);

  if (broken.length) process.exit(1);
}

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(2);
});
