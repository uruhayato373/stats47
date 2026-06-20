#!/usr/bin/env node
/**
 * regenerate-ranking-cards.mjs
 *
 * 公開済みブログ記事のランキング棒を「カード型(横長columns + 縦長portrait)」へ一括再生成する
 * オーケストレータ。SSOT (R2 app/ranking ← metric config → e-Stat) からデータを取得し、
 * 型付き JSON + 出典 manifest (.source.json) + SVG 2レイアウトを staging に生成する。
 *
 * 既存の検証済みスクリプトを再利用:
 *   fetch-ranking-data-r2.mjs  (取得 + manifest)
 *   generate-article-charts.ts (columns + portrait 生成)
 *
 * デフォルトは dry-run (R2 push しない / staging = .local/regen-staging に出力)。
 * R2 反映は別途 diff-push-r2 で行う (本スクリプトは push しない)。
 *
 * Usage:
 *   node .claude/scripts/blog/regenerate-ranking-cards.mjs            # 全件 triage + 先頭から再生成 + gallery
 *   node .claude/scripts/blog/regenerate-ranking-cards.mjs --limit 20 # tractable な先頭20本だけ再生成
 *   node .claude/scripts/blog/regenerate-ranking-cards.mjs --slugs a,b # 指定slugのみ
 *   node .claude/scripts/blog/regenerate-ranking-cards.mjs --triage-only # 集計のみ(再生成しない)
 *
 * 出力:
 *   .local/regen-staging/<slug>/data/<name>.{json,source.json,svg}, <name>-ig.svg
 *   /tmp/regen-cards-gallery.html  (before=R2旧SVG / after=新columns / 新portrait)
 *   /tmp/regen-cards-triage.json   (全slugのtractable/ambiguous分類)
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STAGING_REL = ".local/regen-staging";
const STAGING_ABS = path.join(PROJECT_ROOT, STAGING_REL);

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : true;
};
const LIMIT = flag("limit", null) ? Number(flag("limit", null)) : null;
const SLUGS_ARG = flag("slugs", null);
const TRIAGE_ONLY = args.includes("--triage-only");

// ランキング系SVG名のヒューリスティック (basename)
const isRankingName = (base) =>
  /(?:rank|rankings?|top\d|bottom\d|top-bottom|top5-bottom5)/i.test(base);

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** article.md から ranking SVG 参照 と /ranking/<key> を抽出して triage */
function triage(md) {
  const svgRefs = [
    ...new Set([...md.matchAll(/\]\(data\/([^)]+)\.svg\)/g)].map((m) => m[1])),
  ];
  const rankingRefs = svgRefs.filter(isRankingName);
  const keys = [...new Set([...md.matchAll(/\/ranking\/([a-z0-9-]+)/gi)].map((m) => m[1]))];
  let status, reason;
  if (rankingRefs.length === 0) {
    status = "no-ranking";
    reason = "ランキングSVG参照なし(対象外)";
  } else if (keys.length === 0) {
    status = "ambiguous";
    reason = "ランキングSVGはあるが /ranking/<key> 参照なし(出典不明)";
  } else if (rankingRefs.length === 1) {
    status = "tractable";
    reason = `1ランキング → key=${keys[0]}`;
  } else {
    status = "ambiguous";
    reason = `ランキングSVG ${rankingRefs.length}枚 / key ${keys.length}個 → 自動対応不可`;
  }
  return { svgRefs, rankingRefs, keys, status, reason };
}

async function pMap(items, fn, c) {
  const out = [];
  let i = 0;
  const w = async () => {
    while (i < items.length) {
      const k = i++;
      try { out[k] = await fn(items[k], k); } catch (e) { out[k] = { error: String(e?.message || e) }; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, w));
  return out;
}

/** 1 slug を staging に再生成 (tractable のみ) */
function regenerate(slug, rankingBase, key) {
  const slugDir = path.join(STAGING_ABS, slug);
  fs.mkdirSync(path.join(slugDir, "data"), { recursive: true });
  // article.md は triage で取得済を書いておく必要がある (fetch スクリプトが読む)
  // ここでは呼び出し側が事前に書く。
  // 1) 取得 + manifest
  execFileSync("node", [
    ".claude/scripts/blog/fetch-ranking-data-r2.mjs",
    "--slug", slug, "--base", STAGING_REL, "--keys", key, "--data-name", rankingBase,
  ], { cwd: PROJECT_ROOT, stdio: "pipe" });
  // 2) columns + portrait 生成
  execFileSync("npx", [
    "tsx", ".claude/scripts/blog/generate-article-charts.ts",
    "--slug", slug, "--base", STAGING_REL,
  ], { cwd: PROJECT_ROOT, stdio: "pipe", env: { ...process.env, NODE_OPTIONS: "--conditions react-server" } });
  const dataDir = path.join(slugDir, "data");
  return {
    columns: path.join(dataDir, `${rankingBase}.svg`),
    portrait: path.join(dataDir, `${rankingBase}-ig.svg`),
    json: path.join(dataDir, `${rankingBase}.json`),
    manifest: path.join(dataDir, `${rankingBase}.source.json`),
  };
}

// ---------- main ----------
const manifest = JSON.parse(await fetchText(`${R2_BASE}/app/blog/all.json`));
let slugs = (manifest.articles || []).map((a) => a.slug).filter(Boolean);
if (SLUGS_ARG) {
  const want = new Set(String(SLUGS_ARG).split(",").map((s) => s.trim()));
  slugs = slugs.filter((s) => want.has(s));
}
console.error(`[regen] ${slugs.length} 記事を triage 中...`);

// article.md を取得して triage
const triaged = await pMap(slugs, async (slug) => {
  const md = await fetchText(`${R2_BASE}/app/blog/${slug}/article.md`);
  return { slug, md, ...triage(md) };
}, 12);

const valid = triaged.filter((t) => t && !t.error);
const byStatus = { tractable: [], ambiguous: [], "no-ranking": [] };
for (const t of valid) byStatus[t.status].push(t);

console.error("\n=== Triage 集計 ===");
console.error(`  tractable (自動再生成可) : ${byStatus.tractable.length}`);
console.error(`  ambiguous (要個別対応)   : ${byStatus.ambiguous.length}`);
console.error(`  no-ranking (対象外)      : ${byStatus["no-ranking"].length}`);
fs.writeFileSync("/tmp/regen-cards-triage.json", JSON.stringify(
  valid.map(({ md, ...rest }) => rest), null, 2));
console.error("  → /tmp/regen-cards-triage.json");

if (TRIAGE_ONLY) process.exit(0);

// tractable を再生成 (--limit 件)
let targets = byStatus.tractable;
if (LIMIT) targets = targets.slice(0, LIMIT);
console.error(`\n[regen] ${targets.length} 本を staging に再生成 (dry-run, R2 push なし)...`);

const results = [];
for (const t of targets) {
  const rankingBase = t.rankingRefs[0];
  const key = t.keys[0];
  const slugDir = path.join(STAGING_ABS, t.slug);
  fs.mkdirSync(path.join(slugDir, "data"), { recursive: true });
  fs.writeFileSync(path.join(slugDir, "article.md"), t.md, "utf8");
  try {
    const out = regenerate(t.slug, rankingBase, key);
    const newColumns = fs.existsSync(out.columns) ? fs.readFileSync(out.columns, "utf8") : null;
    const newPortrait = fs.existsSync(out.portrait) ? fs.readFileSync(out.portrait, "utf8") : null;
    // before = R2 公開中の旧 SVG
    let oldSvg = null;
    try { oldSvg = await fetchText(`${R2_BASE}/app/blog/${t.slug}/data/${rankingBase}.svg`); } catch {}
    results.push({ slug: t.slug, rankingBase, key, oldSvg, newColumns, newPortrait });
    console.error(`  ✓ ${t.slug} (${rankingBase})`);
  } catch (e) {
    results.push({ slug: t.slug, rankingBase, key, error: String(e?.message || e).slice(0, 200) });
    console.error(`  ✗ ${t.slug}: ${String(e?.message || e).slice(0, 120)}`);
  }
}

// ---------- gallery ----------
const esc = (s) => String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]);
const cards = results.map((r) => {
  if (r.error) return `<section class="row err"><h3>${esc(r.slug)} <span>✗ ${esc(r.error)}</span></h3></section>`;
  return `<section class="row">
    <h3>${esc(r.slug)} <code>${esc(r.rankingBase)}</code> <span>key=${esc(r.key)}</span></h3>
    <div class="grid">
      <figure><figcaption>BEFORE (現在のR2)</figcaption><div class="box">${r.oldSvg || "<p>無し</p>"}</div></figure>
      <figure><figcaption>AFTER 横長 columns (ブログ/X)</figcaption><div class="box">${r.newColumns || "<p>失敗</p>"}</div></figure>
      <figure><figcaption>AFTER 縦長 portrait (IG)</figcaption><div class="box port">${r.newPortrait || "<p>失敗</p>"}</div></figure>
    </div>
  </section>`;
}).join("\n");

const html = `<!doctype html><meta charset=utf8><title>ランキングカード再生成 dry-run</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
header{position:sticky;top:0;background:#1e293b;padding:12px 20px;border-bottom:1px solid #334155}
main{padding:20px}.row{margin-bottom:32px;border-bottom:1px solid #334155;padding-bottom:20px}
h3{font-size:15px} h3 code{color:#93c5fd;font-size:12px} h3 span{color:#94a3b8;font-size:12px;font-weight:normal}
.grid{display:grid;grid-template-columns:1fr 1fr 0.6fr;gap:16px;align-items:start}
figcaption{font-size:12px;color:#94a3b8;margin-bottom:6px}
.box{background:#fff;border-radius:6px;padding:6px;overflow:hidden}
.box svg{width:100%;height:auto;display:block}
.box.port svg{max-height:520px;width:auto;margin:0 auto}
.err h3 span{color:#fca5a5}
</style>
<header><b>ランキングカード再生成 dry-run</b> — ${results.length}本 (tractable ${byStatus.tractable.length} / ambiguous ${byStatus.ambiguous.length} / no-ranking ${byStatus["no-ranking"].length})。R2には未反映。</header>
<main>${cards}</main>`;
fs.writeFileSync("/tmp/regen-cards-gallery.html", html, "utf8");
console.error(`\n[regen] gallery: /tmp/regen-cards-gallery.html`);
console.log(JSON.stringify({
  triage: { tractable: byStatus.tractable.length, ambiguous: byStatus.ambiguous.length, noRanking: byStatus["no-ranking"].length },
  regenerated: results.filter((r) => !r.error).length,
  failed: results.filter((r) => r.error).length,
  gallery: "/tmp/regen-cards-gallery.html",
}, null, 2));
