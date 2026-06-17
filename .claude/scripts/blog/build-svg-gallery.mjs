#!/usr/bin/env node
/**
 * ブログ記事 SVG ギャラリー生成
 *
 * 記事に埋め込まれた SVG チャートを 1 枚の自己完結 HTML に一覧化し、
 * ローカルでレビューできるようにする。
 *
 * ## ソース
 * - `--source local` (既定): `.local/r2/app/blog/<slug>/data/*.svg` +
 *   `docs/21_ブログ記事原稿/<slug>/data/*.svg` を走査
 * - `--source r2`: R2 公開 URL (https://storage.stats47.jp) から
 *   blog manifest → 各 article.md の SVG 参照 → SVG を取得
 *
 * ## 使い方
 *   node .claude/scripts/blog/build-svg-gallery.mjs                 # local 走査
 *   node .claude/scripts/blog/build-svg-gallery.mjs --source r2     # R2 取得
 *   node .claude/scripts/blog/build-svg-gallery.mjs --source r2 --limit 20
 *   node .claude/scripts/blog/build-svg-gallery.mjs --out /tmp/g.html
 *
 * 出力既定: /tmp/blog-svg-gallery.html
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

// ─── 引数 ─────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
const SOURCE = flag("source", "local");
const LIMIT = flag("limit", null) ? Number(flag("limit", null)) : null;
const OUT = flag("out", "/tmp/blog-svg-gallery.html");
const CONCURRENCY = 12;

// ─── ユーティリティ ───────────────────────────────────
/** SVG から viewBox / 寸法 / provenance を抽出 */
function inspectSvg(svg) {
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/)?.[1] ?? null;
  const width = svg.match(/<svg[^>]*\swidth=["']([^"']+)["']/)?.[1] ?? null;
  const height = svg.match(/<svg[^>]*\sheight=["']([^"']+)["']/)?.[1] ?? null;
  const generated = svg.match(/generated:\s*([0-9T:.\-Z]+)/)?.[1] ?? null;
  const hasTheme = /@media\s*\(prefers-color-scheme:\s*dark\)/.test(svg);
  const hasViewBox = !!viewBox;
  return { viewBox, width, height, generated, hasTheme, hasViewBox };
}

/** 簡易並列マップ */
async function pMap(items, fn, concurrency) {
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

// ─── ソース: local ───────────────────────────────────
function collectLocal() {
  const roots = [
    path.join(PROJECT_ROOT, ".local/r2/app/blog"),
    path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿"),
  ];
  const bySlug = new Map();
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root)) {
      const dataDir = path.join(root, slug, "data");
      if (!fs.existsSync(dataDir)) continue;
      const svgs = fs
        .readdirSync(dataDir)
        .filter((f) => f.endsWith(".svg"));
      for (const file of svgs) {
        const svg = fs.readFileSync(path.join(dataDir, file), "utf8");
        if (!bySlug.has(slug)) bySlug.set(slug, { slug, title: slug, charts: [] });
        bySlug.get(slug).charts.push({ file, svg, ...inspectSvg(svg) });
      }
    }
  }
  return [...bySlug.values()];
}

// ─── ソース: r2 ──────────────────────────────────────
async function collectR2() {
  const manifest = JSON.parse(await fetchText(`${R2_BASE}/app/blog/all.json`));
  let articles = (manifest.articles || []).filter((a) => a.hasCharts);
  if (LIMIT) articles = articles.slice(0, LIMIT);

  const groups = await pMap(
    articles,
    async (a) => {
      const md = await fetchText(`${R2_BASE}/app/blog/${a.slug}/article.md`);
      // ![alt](data/xxx.svg) の参照を抽出
      const refs = [...md.matchAll(/\]\(data\/([^)]+\.svg)\)/g)].map(
        (m) => m[1],
      );
      const uniq = [...new Set(refs)];
      const charts = await pMap(
        uniq,
        async (file) => {
          const svg = await fetchText(
            `${R2_BASE}/app/blog/${a.slug}/data/${file}`,
          );
          return { file, svg, ...inspectSvg(svg) };
        },
        4,
      );
      return {
        slug: a.slug,
        title: a.title || a.slug,
        charts: charts.filter((c) => c && c.svg),
      };
    },
    CONCURRENCY,
  );
  return groups.filter((g) => g && g.charts && g.charts.length > 0);
}

// ─── HTML 生成 ───────────────────────────────────────
function esc(s) {
  return String(s ?? "").replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c],
  );
}

function buildHtml(groups) {
  const totalCharts = groups.reduce((n, g) => n + g.charts.length, 0);
  const warnCount = groups.reduce(
    (n, g) =>
      n + g.charts.filter((c) => !c.hasTheme || !c.hasViewBox).length,
    0,
  );

  const sections = groups
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((g) => {
      const cards = g.charts
        .sort((a, b) => a.file.localeCompare(b.file))
        .map((c) => {
          const badges = [];
          if (!c.hasViewBox)
            badges.push('<span class="badge err">no viewBox</span>');
          if (!c.hasTheme)
            badges.push('<span class="badge warn">no dark</span>');
          const dim = c.viewBox
            ? c.viewBox
            : [c.width, c.height].filter(Boolean).join(" × ") || "?";
          return `
        <figure class="card" data-file="${esc(c.file)}">
          <div class="svgwrap">${c.svg}</div>
          <figcaption>
            <code class="fname">${esc(c.file)}</code>
            <span class="meta">${esc(dim)}${c.generated ? " · " + esc(c.generated.slice(0, 10)) : ""}</span>
            ${badges.join(" ")}
          </figcaption>
        </figure>`;
        })
        .join("");
      return `
    <section class="group" data-slug="${esc(g.slug)}">
      <h2>${esc(g.title)} <span class="slug">${esc(g.slug)}</span> <span class="count">${g.charts.length}</span></h2>
      <div class="grid">${cards}</div>
    </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ブログ SVG ギャラリー (${totalCharts}枚 / ${groups.length}記事)</title>
<style>
  :root { color-scheme: light dark; --bg:#f8fafc; --card:#fff; --fg:#0f172a; --muted:#64748b; --border:#e2e8f0; }
  html.dark { --bg:#0f172a; --card:#1e293b; --fg:#e2e8f0; --muted:#94a3b8; --border:#334155; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, 'Hiragino Kaku Gothic ProN', sans-serif; background:var(--bg); color:var(--fg); }
  header { position:sticky; top:0; z-index:10; background:var(--card); border-bottom:1px solid var(--border); padding:12px 20px; display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
  header h1 { font-size:16px; margin:0; }
  header .stat { color:var(--muted); font-size:13px; }
  header input { flex:1; min-width:200px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; background:var(--bg); color:var(--fg); font-size:14px; }
  header button { padding:6px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg); color:var(--fg); cursor:pointer; font-size:13px; }
  main { padding:20px; }
  .group { margin-bottom:32px; }
  .group h2 { font-size:15px; border-bottom:2px solid var(--border); padding-bottom:6px; display:flex; align-items:center; gap:10px; }
  .group .slug { font-family:monospace; font-size:11px; color:var(--muted); font-weight:normal; }
  .group .count { margin-left:auto; font-size:12px; color:var(--muted); background:var(--bg); padding:2px 8px; border-radius:10px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; margin-top:14px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:10px; margin:0; }
  .svgwrap { background:var(--bg); border-radius:4px; overflow:hidden; }
  .svgwrap svg { width:100%; height:auto; display:block; }
  figcaption { margin-top:8px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .fname { font-size:12px; word-break:break-all; }
  .meta { font-size:11px; color:var(--muted); }
  .badge { font-size:10px; padding:1px 6px; border-radius:4px; }
  .badge.err { background:#fee2e2; color:#b91c1c; }
  .badge.warn { background:#fef3c7; color:#92400e; }
  html.dark .badge.err { background:#7f1d1d; color:#fecaca; }
  html.dark .badge.warn { background:#78350f; color:#fde68a; }
  .hidden { display:none !important; }
</style>
</head>
<body>
<header>
  <h1>ブログ SVG ギャラリー</h1>
  <span class="stat">${groups.length} 記事 / ${totalCharts} 枚 / ⚠ ${warnCount}</span>
  <input id="q" type="search" placeholder="slug・ファイル名で絞り込み..." />
  <button id="warnOnly">⚠ 要確認のみ</button>
  <button id="theme">🌓 ダーク切替</button>
</header>
<main>${sections}</main>
<script>
  const q = document.getElementById('q');
  const groups = [...document.querySelectorAll('.group')];
  function applyFilter() {
    const term = q.value.trim().toLowerCase();
    const warnOnly = document.body.dataset.warnOnly === '1';
    for (const g of groups) {
      const slug = g.dataset.slug.toLowerCase();
      let visibleCards = 0;
      for (const card of g.querySelectorAll('.card')) {
        const file = card.dataset.file.toLowerCase();
        const matchTerm = !term || slug.includes(term) || file.includes(term);
        const matchWarn = !warnOnly || card.querySelector('.badge');
        const show = matchTerm && matchWarn;
        card.classList.toggle('hidden', !show);
        if (show) visibleCards++;
      }
      g.classList.toggle('hidden', visibleCards === 0);
    }
  }
  q.addEventListener('input', applyFilter);
  document.getElementById('warnOnly').addEventListener('click', () => {
    document.body.dataset.warnOnly = document.body.dataset.warnOnly === '1' ? '0' : '1';
    applyFilter();
  });
  document.getElementById('theme').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
</script>
</body>
</html>`;
}

// ─── main ────────────────────────────────────────────
(async () => {
  console.error(`[svg-gallery] source=${SOURCE}${LIMIT ? ` limit=${LIMIT}` : ""}`);
  const groups = SOURCE === "r2" ? await collectR2() : collectLocal();
  const total = groups.reduce((n, g) => n + g.charts.length, 0);

  if (total === 0) {
    console.error(
      `[svg-gallery] SVG が見つかりません。` +
        (SOURCE === "local"
          ? " ローカルに SVG が無い場合は --source r2 を試してください。"
          : ""),
    );
  }

  const html = buildHtml(groups);
  fs.writeFileSync(OUT, html, "utf8");
  console.error(
    `[svg-gallery] 生成完了: ${OUT} (${groups.length} 記事 / ${total} 枚)`,
  );
  console.log(OUT);
})();
