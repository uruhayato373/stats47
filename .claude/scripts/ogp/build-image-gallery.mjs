#!/usr/bin/env node
/**
 * OGP・カバー・リンクカード画像ギャラリー生成 + 棚卸し
 *
 * OGP 画像 (Satori 動的生成)・note カバー・サイト内リンクカード画像 (light/dark) を
 * 種別タブ付きの 1 枚の自己完結 HTML に一覧化し、目視レビューできるようにする。
 * 動的 OGP は本番 URL (https://stats47.jp)、静的資産は R2 公開 URL
 * (https://storage.stats47.jp) を <img loading="lazy"> で直参照し、画像をローカルへ
 * 落とさない (read-only)。クラウドの Claude セッションでは生成 HTML を Artifact 化して閲覧する。
 *
 * 正典: .claude/rules/ogp-image-standards.md / skill: /audit-ogp-images
 *
 * ## タブ (--tabs で絞り込み)
 *   blog-ogp ranking-ogp theme-ogp category-ogp areas-ogp  … Satori 動的 OGP
 *   blog-card ranking-card                                   … リンクカード (light/dark)
 *   note-cover                                               … note カバー
 *
 * ## 使い方
 *   node .claude/scripts/ogp/build-image-gallery.mjs                       # 全タブ (ranking はサンプル 30)
 *   node .claude/scripts/ogp/build-image-gallery.mjs --tabs blog-ogp,blog-card --limit 20
 *   node .claude/scripts/ogp/build-image-gallery.mjs --tabs ranking-card --check   # 欠落を GET で確定
 *   node .claude/scripts/ogp/build-image-gallery.mjs --all                 # ranking も全量
 *   node .claude/scripts/ogp/build-image-gallery.mjs --audit               # 棚卸し → state/ogp/inventory.json
 *   node .claude/scripts/ogp/build-image-gallery.mjs --out /tmp/g.html
 *
 * 出力既定: /tmp/ogp-image-gallery.html
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SITE = process.env.SITE_ORIGIN || "https://stats47.jp";
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const CONCURRENCY = 12;
const RANKING_SAMPLE = 30; // ranking 系タブの既定サンプル件数

// ─── 引数 ─────────────────────────────────────────────
const argv = process.argv.slice(2);
function flag(name, def) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
const ALL = !!flag("all", false);
const AUDIT = !!flag("audit", false);
const CHECK = AUDIT || !!flag("check", false); // --audit は --check を含む
const LIMIT = flag("limit", null) ? Number(flag("limit", null)) : null;
const OUT = flag("out", "/tmp/ogp-image-gallery.html");
const INVENTORY_OUT = path.join(PROJECT_ROOT, ".claude/state/ogp/inventory.json");

const ALL_TABS = [
  "blog-ogp",
  "ranking-ogp",
  "theme-ogp",
  "category-ogp",
  "areas-ogp",
  "blog-card",
  "ranking-card",
  "note-cover",
];
const REQ_TABS = flag("tabs", null);
const TABS =
  REQ_TABS && REQ_TABS !== true
    ? String(REQ_TABS)
        .split(",")
        .map((t) => t.trim())
        .filter((t) => ALL_TABS.includes(t))
    : AUDIT
      ? ALL_TABS
      : ALL_TABS;

// ─── ユーティリティ ───────────────────────────────────
async function pMap(items, fn, concurrency = CONCURRENCY) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = { error: String(err?.message || err) };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

/** GET でステータス + content-type を確認 (本文はダウンロードしない) */
async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const ct = res.headers.get("content-type") || "";
    try {
      await res.body?.cancel();
    } catch {}
    return { ok: res.ok && ct.startsWith("image"), status: res.status, ct };
  } catch (err) {
    return { ok: false, status: 0, ct: String(err?.name || err) };
  } finally {
    clearTimeout(timer);
  }
}

/** 先頭 N + 等間隔でサンプリング (代表性を保つ) */
function sample(list, n) {
  if (list.length <= n) return list;
  const head = Math.min(10, n);
  const picked = list.slice(0, head);
  const remaining = n - head;
  if (remaining > 0) {
    const step = (list.length - head) / remaining;
    for (let i = 0; i < remaining; i++) {
      picked.push(list[head + Math.floor(i * step)]);
    }
  }
  return [...new Set(picked)];
}

function esc(s) {
  return String(s ?? "").replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c],
  );
}

// ─── 列挙元 ───────────────────────────────────────────
/** sitemap から live な URL を全取得し、パターンで分類 */
let _sitemapCache = null;
async function loadSitemapLocs() {
  if (_sitemapCache) return _sitemapCache;
  const index = await fetchText(`${SITE}/sitemap.xml`);
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const all = [];
  await pMap(parts, async (u) => {
    const xml = await fetchText(u);
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) all.push(m[1]);
  });
  _sitemapCache = all;
  return all;
}

async function enumerateFromSitemap(re) {
  const locs = await loadSitemapLocs();
  const keys = new Set();
  for (const loc of locs) {
    const m = loc.match(re);
    if (m) keys.add(m[1]);
  }
  return [...keys].sort();
}

async function enumerateBlogSlugs() {
  const manifest = JSON.parse(await fetchText(`${R2}/app/blog/all.json`));
  const arts = (manifest.articles || []).filter((a) => a.published !== false);
  return arts.map((a) => a.slug).sort();
}

/** 17 category キー (SSOT: packages/data-configs/src/types.ts CATEGORY_KEYS) */
const CATEGORY_KEYS = [
  "landweather",
  "population",
  "laborwage",
  "agriculture",
  "miningindustry",
  "commercial",
  "economy",
  "construction",
  "energy",
  "tourism",
  "educationsports",
  "administrativefinancial",
  "safetyenvironment",
  "socialsecurity",
  "international",
  "infrastructure",
  "ict",
];

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/**
 * note カバー: state の draft-index + published-urls から集約。
 * 注: note カバーは R2 に archive されず、公開時に生成して note.com へ直接アップロードされる
 * ephemeral (2026-07-06 確認: r2_path に draft.md はあるが cover 画像は無い)。note.com は
 * スクレイピングを弾くため、公開済みは note.com のリンクを提示し人手で確認する。
 */
function enumerateNoteCovers() {
  const out = new Map(); // slug -> { slug, status, noteUrl }
  const draft = readJsonSafe(
    path.join(PROJECT_ROOT, ".claude/state/note-draft-index.json"),
  );
  for (const [slug, v] of Object.entries(draft?.drafts || {})) {
    out.set(slug, { slug, status: v?.status || "draft", noteUrl: null });
  }
  const pub = readJsonSafe(
    path.join(PROJECT_ROOT, ".claude/state/note-published-urls.json"),
  );
  for (const [slug, v] of Object.entries(pub?.articles || {})) {
    if (slug.startsWith("_")) continue;
    out.set(slug, { slug, status: "published", noteUrl: v?.url || null });
  }
  return [...out.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

// ─── タブ定義 ─────────────────────────────────────────
// 各タブ: entries[] = { key, label, pageUrl?, images: [{variant, url}] }
// variant: "single" (OGP/note) | "light" | "dark" (カード)

/**
 * ページ HTML の og:image meta から実際に配信されている OGP 画像 URL を解決する。
 * 静的フォールバック (home/category が `/og-image.jpg` を使う等) やハッシュ付き URL、
 * ランタイム 500 をそのまま反映する = 真実を映す監査。取得失敗時は素の route を仮定する。
 */
async function resolveOgImage(pageUrl) {
  try {
    const html = await fetchText(pageUrl);
    const m = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    );
    if (m) return { url: m[1], resolved: true };
  } catch {}
  return { url: `${pageUrl}/opengraph-image`, resolved: false };
}

/** key/pageUrl のペア列から og:image を解決した OGP entry を並列生成 */
async function ogpEntries(pairs) {
  return pMap(pairs, async ({ key, pageUrl }) => {
    const og = await resolveOgImage(pageUrl);
    return {
      key,
      label: key,
      pageUrl,
      images: [{ variant: "single", url: og.url }],
      ogResolved: og.resolved,
    };
  });
}

async function buildTab(tab) {
  switch (tab) {
    case "blog-ogp": {
      let slugs = await enumerateBlogSlugs();
      if (LIMIT) slugs = slugs.slice(0, LIMIT);
      return {
        source: "satori-route",
        aspect: "1.91:1",
        r2KeyPattern: `${SITE}/blog/<slug>/opengraph-image`,
        entries: await ogpEntries(
          slugs.map((s) => ({ key: s, pageUrl: `${SITE}/blog/${s}` })),
        ),
      };
    }
    case "ranking-ogp": {
      let keys = await enumerateFromSitemap(
        /stats47\.jp\/ranking\/([a-z0-9-]+)$/,
      );
      if (LIMIT) keys = keys.slice(0, LIMIT);
      else if (!ALL) keys = sample(keys, RANKING_SAMPLE);
      return {
        source: "satori-route",
        aspect: "1.91:1",
        r2KeyPattern: `${SITE}/ranking/<key>/opengraph-image`,
        entries: await ogpEntries(
          keys.map((k) => ({ key: k, pageUrl: `${SITE}/ranking/${k}` })),
        ),
      };
    }
    case "theme-ogp": {
      let slugs = await enumerateFromSitemap(
        /stats47\.jp\/themes\/([a-z0-9-]+)$/,
      );
      if (LIMIT) slugs = slugs.slice(0, LIMIT);
      return {
        source: "satori-route",
        aspect: "1.91:1",
        r2KeyPattern: `${SITE}/themes/<slug>/opengraph-image`,
        entries: await ogpEntries(
          slugs.map((s) => ({ key: s, pageUrl: `${SITE}/themes/${s}` })),
        ),
      };
    }
    case "category-ogp": {
      let keys = [...CATEGORY_KEYS];
      if (LIMIT) keys = keys.slice(0, LIMIT);
      return {
        source: "satori-route",
        aspect: "1.91:1",
        r2KeyPattern: `${SITE}/category/<key>/opengraph-image`,
        entries: await ogpEntries(
          keys.map((k) => ({ key: k, pageUrl: `${SITE}/category/${k}` })),
        ),
      };
    }
    case "areas-ogp": {
      let codes = await enumerateFromSitemap(
        /stats47\.jp\/areas\/([0-9]{5})$/,
      );
      if (codes.length === 0)
        codes = Array.from({ length: 47 }, (_, i) =>
          String(i + 1).padStart(2, "0") + "000",
        );
      if (LIMIT) codes = codes.slice(0, LIMIT);
      return {
        source: "satori-route",
        aspect: "1.91:1",
        r2KeyPattern: `${SITE}/areas/<code>/opengraph-image`,
        entries: await ogpEntries(
          codes.map((c) => ({ key: c, pageUrl: `${SITE}/areas/${c}` })),
        ),
      };
    }
    case "blog-card": {
      let slugs = await enumerateBlogSlugs();
      if (LIMIT) slugs = slugs.slice(0, LIMIT);
      return {
        source: "r2-static",
        aspect: "16:9",
        r2KeyPattern: `app/blog/<slug>/thumbnail-{light,dark}.webp`,
        entries: slugs.map((s) => ({
          key: s,
          label: s,
          pageUrl: `${SITE}/blog/${s}`,
          images: [
            { variant: "light", url: `${R2}/app/blog/${s}/thumbnail-light.webp` },
            { variant: "dark", url: `${R2}/app/blog/${s}/thumbnail-dark.webp` },
          ],
        })),
      };
    }
    case "ranking-card": {
      let keys = await enumerateFromSitemap(
        /stats47\.jp\/ranking\/([a-z0-9-]+)$/,
      );
      if (LIMIT) keys = keys.slice(0, LIMIT);
      else if (!ALL) keys = sample(keys, RANKING_SAMPLE);
      // 年 (latestYear.yearCode) は item.json 依存のため取得する
      const entries = await pMap(keys, async (k) => {
        let year = null;
        let areaType = "prefecture";
        try {
          const item = JSON.parse(
            await fetchText(`${R2}/app/ranking/${k}/item.json`),
          );
          year = item?.item?.latestYear?.yearCode ?? null;
          areaType = item?.item?.areaType ?? "prefecture";
        } catch {}
        const base = year
          ? `${R2}/ranking/${areaType}/${k}/${year}/thumbnails/thumbnail`
          : null;
        return {
          key: k,
          label: year ? `${k} (${year})` : `${k} (年不明)`,
          pageUrl: `${SITE}/ranking/${k}`,
          images: base
            ? [
                { variant: "light", url: `${base}-light.png` },
                { variant: "dark", url: `${base}-dark.png` },
              ]
            : [],
        };
      });
      return {
        source: "none",
        aspect: "16:9",
        r2KeyPattern: `ranking/<areaType>/<key>/<year>/thumbnails/thumbnail-{light,dark}.png`,
        entries: entries.filter((e) => !e.error),
      };
    }
    case "note-cover": {
      let covers = enumerateNoteCovers();
      if (LIMIT) covers = covers.slice(0, LIMIT);
      return {
        source: "external-ephemeral",
        aspect: "1.91:1",
        r2KeyPattern: `note.com へ直接アップロード (R2 非archive)`,
        entries: covers.map((c) => ({
          key: c.slug,
          label: `${c.slug} [${c.status}]`,
          pageUrl: c.noteUrl,
          images: [],
          external: true,
        })),
      };
    }
    default:
      return { source: "none", aspect: "?", r2KeyPattern: "", entries: [] };
  }
}

// ─── HTML 生成 ───────────────────────────────────────
function imageBlock(img) {
  const frameClass =
    img.variant === "light"
      ? "frame-light"
      : img.variant === "dark"
        ? "frame-dark"
        : "frame-neutral";
  const vlabel =
    img.variant === "single" ? "" : `<span class="vtag">${img.variant}</span>`;
  return `<div class="imgcell ${frameClass}">
    ${vlabel}
    <img loading="lazy" src="${esc(img.url)}" alt="${esc(img.variant)}"
      onload="this.closest('.card').dataset.loaded=(+(this.closest('.card').dataset.loaded||0)+1)"
      onerror="this.classList.add('broken');this.closest('.card').classList.add('has-missing')"/>
  </div>`;
}

function cardBlock(entry, checkMap) {
  const link = entry.pageUrl
    ? `<a href="${esc(entry.pageUrl)}" target="_blank" rel="noopener">${entry.external ? "note.com↗" : "page↗"}</a>`
    : "";

  // 外部 ephemeral (note カバー): R2 非archive。欠落扱いにせず note.com リンクを提示
  if (entry.external) {
    return `<figure class="card external" data-key="${esc(entry.key)}">
    <div class="imgs"><div class="imgcell frame-neutral empty">R2非archive<br/>${entry.pageUrl ? "note.comで確認" : "未公開"}</div></div>
    <figcaption>
      <code class="fname">${esc(entry.label)}</code>
      <span class="meta">${link}</span>
    </figcaption>
  </figure>`;
  }

  const imgs = entry.images.map(imageBlock).join("");
  const missing = entry.images.length === 0;
  // --check 結果を反映
  let checkBadge = "";
  if (checkMap) {
    const results = entry.images.map((im) => checkMap.get(im.url));
    const bad = results.filter((r) => r && !r.ok).length;
    if (bad > 0)
      checkBadge = `<span class="badge err">✗ ${bad}/${entry.images.length}</span>`;
    else if (results.every((r) => r && r.ok))
      checkBadge = `<span class="badge ok">✓</span>`;
  }
  const noImg = missing
    ? `<span class="badge err">画像URL未解決</span>`
    : `<span class="badge warn hidden onerror-badge">404?</span>`;
  const firstUrl = entry.images[0]?.url || "";
  return `<figure class="card${missing ? " has-missing" : ""}" data-key="${esc(entry.key)}">
    <div class="imgs">${imgs || '<div class="imgcell frame-neutral empty">no url</div>'}</div>
    <figcaption>
      <code class="fname">${esc(entry.label)}</code>
      <span class="meta">${link}</span>
      ${checkBadge}${noImg}
      <button class="copy" data-url="${esc(firstUrl)}" title="URLコピー">⧉</button>
    </figcaption>
  </figure>`;
}

function buildHtml(tabData, checkMap) {
  const tabIds = Object.keys(tabData);
  const totalEntries = tabIds.reduce(
    (n, t) => n + tabData[t].entries.length,
    0,
  );

  const tabButtons = tabIds
    .map(
      (t, i) =>
        `<button class="tab${i === 0 ? " active" : ""}" data-tab="${esc(t)}">${esc(t)} <span class="tabcount" id="tc-${esc(t)}">${tabData[t].entries.length}</span></button>`,
    )
    .join("");

  const panels = tabIds
    .map((t, i) => {
      const d = tabData[t];
      const cards = d.entries
        .map((e) => cardBlock(e, checkMap))
        .join("");
      return `<section class="panel${i === 0 ? " active" : ""}" data-tab="${esc(t)}">
      <div class="panelmeta">source: <b>${esc(d.source)}</b> · aspect: ${esc(d.aspect)} · <code>${esc(d.r2KeyPattern)}</code></div>
      <div class="grid">${cards || '<p class="empty">エントリなし</p>'}</div>
    </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>OGP・カバー・リンクカード ギャラリー (${totalEntries})</title>
<style>
  :root { color-scheme: light dark; --bg:#f1f5f9; --card:#fff; --fg:#0f172a; --muted:#64748b; --border:#e2e8f0; --accent:#2563eb; }
  html.dark { --bg:#0f172a; --card:#1e293b; --fg:#e2e8f0; --muted:#94a3b8; --border:#334155; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,'Hiragino Kaku Gothic ProN',sans-serif; background:var(--bg); color:var(--fg); }
  header { position:sticky; top:0; z-index:20; background:var(--card); border-bottom:1px solid var(--border); padding:10px 16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  header h1 { font-size:15px; margin:0; }
  header input { flex:1; min-width:180px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; background:var(--bg); color:var(--fg); font-size:14px; }
  header button { padding:6px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg); color:var(--fg); cursor:pointer; font-size:13px; }
  header button.on { background:var(--accent); color:#fff; border-color:var(--accent); }
  .tabbar { position:sticky; top:49px; z-index:19; background:var(--card); border-bottom:1px solid var(--border); padding:6px 16px; display:flex; gap:6px; flex-wrap:wrap; }
  .tab { padding:5px 12px; border:1px solid var(--border); border-radius:16px; background:var(--bg); color:var(--fg); cursor:pointer; font-size:12px; }
  .tab.active { background:var(--accent); color:#fff; border-color:var(--accent); }
  .tabcount { opacity:.7; font-size:11px; }
  main { padding:16px; }
  .panel { display:none; }
  .panel.active { display:block; }
  .panelmeta { font-size:12px; color:var(--muted); margin-bottom:12px; }
  .panelmeta code { font-size:11px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:14px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:8px; margin:0; }
  .card.has-missing { border-color:#f59e0b; }
  .imgs { display:flex; gap:6px; }
  .imgcell { flex:1; border-radius:4px; overflow:hidden; position:relative; display:flex; align-items:center; justify-content:center; min-height:80px; }
  .frame-light { background:#ffffff; }
  .frame-dark { background:#0f172a; }
  .frame-neutral { background:var(--bg); }
  .imgcell img { width:100%; height:auto; display:block; }
  .imgcell img.broken { min-height:80px; opacity:.15; }
  .imgcell.empty { color:var(--muted); font-size:12px; min-height:80px; }
  .vtag { position:absolute; top:3px; left:3px; font-size:9px; padding:1px 5px; border-radius:3px; background:rgba(0,0,0,.55); color:#fff; z-index:2; }
  figcaption { margin-top:7px; display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
  .fname { font-size:12px; word-break:break-all; }
  .meta a { font-size:11px; color:var(--accent); text-decoration:none; }
  .badge { font-size:10px; padding:1px 6px; border-radius:4px; }
  .badge.err { background:#fee2e2; color:#b91c1c; }
  .badge.warn { background:#fef3c7; color:#92400e; }
  .badge.ok { background:#dcfce7; color:#166534; }
  html.dark .badge.err { background:#7f1d1d; color:#fecaca; }
  html.dark .badge.warn { background:#78350f; color:#fde68a; }
  html.dark .badge.ok { background:#14532d; color:#bbf7d0; }
  .copy { padding:1px 6px !important; font-size:11px !important; }
  .empty { color:var(--muted); }
  .hidden { display:none !important; }
</style>
</head>
<body>
<header>
  <h1>🖼 OGP・カバー・リンクカード</h1>
  <input id="q" type="search" placeholder="key・slug で絞り込み..." />
  <button id="missingOnly">⚠ 欠落のみ</button>
  <button id="theme">🌓 ダーク</button>
</header>
<div class="tabbar">${tabButtons}</div>
<main>${panels}</main>
<script>
  const q = document.getElementById('q');
  function activePanel(){ return document.querySelector('.panel.active'); }
  function applyFilter() {
    const term = q.value.trim().toLowerCase();
    const missingOnly = document.body.dataset.missingOnly === '1';
    for (const p of document.querySelectorAll('.panel')) {
      let vis = 0;
      for (const card of p.querySelectorAll('.card')) {
        const key = card.dataset.key.toLowerCase();
        const matchTerm = !term || key.includes(term);
        const matchMissing = !missingOnly || card.classList.contains('has-missing');
        const show = matchTerm && matchMissing;
        card.classList.toggle('hidden', !show);
        if (show) vis++;
      }
    }
  }
  q.addEventListener('input', applyFilter);
  document.getElementById('missingOnly').addEventListener('click', (e) => {
    const on = document.body.dataset.missingOnly === '1';
    document.body.dataset.missingOnly = on ? '0' : '1';
    e.target.classList.toggle('on', !on);
    applyFilter();
  });
  document.getElementById('theme').addEventListener('click', (e) => {
    document.documentElement.classList.toggle('dark');
    e.target.classList.toggle('on');
  });
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      for (const t of document.querySelectorAll('.tab')) t.classList.toggle('active', t === tab);
      for (const p of document.querySelectorAll('.panel')) p.classList.toggle('active', p.dataset.tab === id);
      applyFilter();
    });
  }
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy')) {
      navigator.clipboard?.writeText(e.target.dataset.url);
      e.target.textContent = '✓';
      setTimeout(() => (e.target.textContent = '⧉'), 900);
    }
  });
  // onerror バッジ表示 (画像が壊れたカードの 404? バッジを出す)
  window.addEventListener('load', () => setTimeout(() => {
    for (const card of document.querySelectorAll('.card.has-missing .onerror-badge')) {
      card.classList.remove('hidden');
    }
  }, 2500));
</script>
</body>
</html>`;
}

// ─── 棚卸し (--check / --audit) ──────────────────────
async function runCheck(tabData) {
  const checkMap = new Map();
  const urls = [];
  for (const t of Object.keys(tabData))
    for (const e of tabData[t].entries)
      for (const im of e.images) urls.push(im.url);
  const uniq = [...new Set(urls)];
  console.error(`[ogp-gallery] --check: probing ${uniq.length} images...`);
  await pMap(uniq, async (u) => {
    checkMap.set(u, await probe(u));
  });
  return checkMap;
}

function summarize(tabData, checkMap) {
  const rows = [];
  for (const t of Object.keys(tabData)) {
    const d = tabData[t];
    let expected = 0;
    let ok = 0;
    const missing = [];
    for (const e of d.entries) {
      if (e.external) continue; // 外部 ephemeral は欠落集計の対象外
      if (e.images.length === 0) {
        missing.push(e.key);
        continue;
      }
      for (const im of e.images) {
        expected++;
        const r = checkMap?.get(im.url);
        if (r?.ok) ok++;
        else if (checkMap) missing.push(e.key);
      }
    }
    rows.push({
      type: t,
      source: d.source,
      aspect: d.aspect,
      entries: d.entries.length,
      expected,
      ok: checkMap ? ok : null,
      missing: checkMap ? [...new Set(missing)] : null,
      r2KeyPattern: d.r2KeyPattern,
    });
  }
  return rows;
}

// ─── main ────────────────────────────────────────────
(async () => {
  console.error(
    `[ogp-gallery] tabs=${TABS.join(",")}${ALL ? " (all)" : ""}${LIMIT ? ` limit=${LIMIT}` : ""}${CHECK ? " check" : ""}`,
  );
  const tabData = {};
  for (const tab of TABS) {
    tabData[tab] = await buildTab(tab);
    console.error(
      `[ogp-gallery]   ${tab}: ${tabData[tab].entries.length} entries (${tabData[tab].source})`,
    );
  }

  const checkMap = CHECK ? await runCheck(tabData) : null;
  const rows = summarize(tabData, checkMap);

  // stdout: 集計表
  console.log("\ntab              | source        | entries | images | ok   | missing");
  console.log("-----------------|---------------|---------|--------|------|--------");
  for (const r of rows) {
    console.log(
      `${r.type.padEnd(16)} | ${r.source.padEnd(13)} | ${String(r.entries).padStart(7)} | ${String(r.expected).padStart(6)} | ${String(r.ok ?? "-").padStart(4)} | ${r.missing ? r.missing.length : "-"}`,
    );
  }
  if (checkMap) {
    for (const r of rows) {
      if (r.missing && r.missing.length > 0) {
        console.log(
          `\n[missing] ${r.type} (${r.missing.length}): ${r.missing.slice(0, 20).join(", ")}${r.missing.length > 20 ? " …" : ""}`,
        );
      }
    }
  }

  if (AUDIT) {
    const inventory = {
      generatedAt: new Date().toISOString(),
      site: SITE,
      r2: R2,
      sampled: !ALL,
      types: rows,
    };
    fs.mkdirSync(path.dirname(INVENTORY_OUT), { recursive: true });
    fs.writeFileSync(INVENTORY_OUT, JSON.stringify(inventory, null, 2) + "\n");
    console.error(`[ogp-gallery] inventory: ${INVENTORY_OUT}`);
  }

  const html = buildHtml(tabData, checkMap);
  fs.writeFileSync(OUT, html, "utf8");
  console.error(`[ogp-gallery] gallery: ${OUT}`);
  console.log(`\n${OUT}`);
})();
