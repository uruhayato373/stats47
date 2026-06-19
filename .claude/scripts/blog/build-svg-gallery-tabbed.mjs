#!/usr/bin/env node
/**
 * ブログ SVG カタログ別タブ切替ギャラリー
 *
 * R2 公開 URL から全ブログ SVG を取得し、svg-builder の6カタログ
 * (bar/scatter/map/line/stacked/findings) + table + unknown に機械分類して
 * タブで切り替え表示する自己完結 HTML を出力する。
 *
 *   node .claude/scripts/blog/build-svg-gallery-tabbed.mjs            # R2 取得
 *   node .claude/scripts/blog/build-svg-gallery-tabbed.mjs --limit 20
 *   node .claude/scripts/blog/build-svg-gallery-tabbed.mjs --out /tmp/g.html
 *
 * 出力既定: /tmp/blog-svg-gallery-tabbed.html
 */

import fs from "node:fs";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
const LIMIT = flag("limit", null) ? Number(flag("limit", null)) : null;
const OUT = flag("out", "/tmp/blog-svg-gallery-tabbed.html");
const CONCURRENCY = 12;

// ─── カタログ定義（svg-builder の関数に対応） ───────────
const CATALOGS = [
  { key: "bar", label: "ランキング棒/カード", desc: "generateBarChartSvg" },
  { key: "scatter", label: "散布図", desc: "generateScatterSvg" },
  { key: "map", label: "タイルマップ", desc: "generateChoroplethSvg" },
  { key: "line", label: "折れ線", desc: "generateLineSvg" },
  { key: "stacked", label: "積み上げ棒", desc: "generateStackedBarSvg" },
  { key: "findings", label: "要点カード", desc: "generateFindingsCardSvg" },
  { key: "table", label: "テーブル", desc: "generateRankingTableSvg" },
  { key: "unknown", label: "未分類", desc: "無意味名・型判別不能" },
];

/**
 * ファイル名 + SVG 内容からカタログを判定する。
 * §4 alias 表 + 内容ヒューリスティック。
 */
function classify(file, svg) {
  const f = file.toLowerCase().replace(/\.svg$/, "");
  // findings を先に（-summary-findings が -ranking より優先）
  if (/findings|要点|わかったこと/.test(f)) return "findings";
  if (/scatter|相関/.test(f)) return "scatter";
  if (/(tile-grid|tilegrid|-map$|-map-|choropleth|地図|prefecture-map)/.test(f)) return "map";
  if (/timeseries|trend|推移|時系列|national-trend/.test(f)) return "line";
  if (/stacked|breakdown|composition|内訳|構成/.test(f)) return "stacked";
  if (/ranking|rankings|top5|top10|top-bottom|bottom5|rate-ranking|income-ranking|格差|gap/.test(f))
    return "bar";
  // 内容ヒューリスティック（無意味名 inline-chart-N / chart-N 等）
  if (/<polyline/.test(svg) && /<circle/.test(svg)) return "line";
  if (svg.match(/<circle/g)?.length > 20 && /回帰|regression|dasharray="6 3"/.test(svg))
    return "scatter";
  // カード型2列ランキング（順位バッジ circle + 横バー rect 多数）
  if (/width="432"/.test(svg) && /<circle/.test(svg)) return "bar";
  // 横棒（rect 多数で polyline なし）
  if (!/<polyline/.test(svg) && (svg.match(/<rect/g)?.length ?? 0) > 6) return "bar";
  return "unknown";
}

function inspectSvg(svg) {
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/)?.[1] ?? null;
  const hasTheme = /@media\s*\(prefers-color-scheme:\s*dark\)/.test(svg);
  return { viewBox, hasTheme, hasViewBox: !!viewBox };
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}
async function pMap(items, fn, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function esc(s) {
  return String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]);
}

async function main() {
  const manifest = JSON.parse(await fetchText(`${R2_BASE}/app/blog/all.json`));
  let articles = (manifest.articles || []).filter((a) => a.hasCharts);
  if (LIMIT) articles = articles.slice(0, LIMIT);
  console.log(`[gallery-tabbed] ${articles.length} 記事を走査`);

  const groups = await pMap(
    articles,
    async (a) => {
      const md = await fetchText(`${R2_BASE}/app/blog/${a.slug}/article.md`);
      const refs = [...new Set([...md.matchAll(/\]\(data\/([^)]+\.svg)\)/g)].map((m) => m[1]))];
      const charts = await pMap(
        refs,
        async (file) => {
          const svg = await fetchText(`${R2_BASE}/app/blog/${a.slug}/data/${file}`);
          return { slug: a.slug, file, svg, cat: classify(file, svg), ...inspectSvg(svg) };
        },
        4,
      );
      return charts.filter((c) => c && c.svg);
    },
    CONCURRENCY,
  );

  const all = groups.filter(Boolean).flat();
  const byCat = new Map(CATALOGS.map((c) => [c.key, []]));
  for (const c of all) byCat.get(c.cat).push(c);

  // 集計サマリ
  console.log("\n=== カタログ別枚数 ===");
  for (const cat of CATALOGS) {
    const items = byCat.get(cat.key);
    console.log(`  ${cat.label.padEnd(18)} ${String(items.length).padStart(4)} 枚  (${cat.desc})`);
  }
  console.log(`  ${"合計".padEnd(18)} ${String(all.length).padStart(4)} 枚`);

  // タブ HTML
  const tabs = CATALOGS.filter((c) => byCat.get(c.key).length > 0);
  const tabBtns = tabs
    .map(
      (c, i) =>
        `<button class="tab${i === 0 ? " active" : ""}" data-cat="${c.key}">${esc(c.label)} <b>${byCat.get(c.key).length}</b></button>`,
    )
    .join("");

  const panels = tabs
    .map((c, i) => {
      const items = byCat.get(c.key).sort((a, b) => a.slug.localeCompare(b.slug) || a.file.localeCompare(b.file));
      const cards = items
        .map((it) => {
          const badges = [];
          if (!it.hasViewBox) badges.push('<span class="badge err">no viewBox</span>');
          if (!it.hasTheme) badges.push('<span class="badge warn">no dark</span>');
          return `<figure class="card">
            <div class="svgwrap">${it.svg}</div>
            <figcaption><code>${esc(it.slug)}/${esc(it.file)}</code>
            <span class="meta">${esc(it.viewBox || "?")}</span> ${badges.join(" ")}</figcaption>
          </figure>`;
        })
        .join("\n");
      return `<section class="panel${i === 0 ? " active" : ""}" data-cat="${c.key}">
        <p class="catdesc">${esc(c.desc)} — ${items.length} 枚</p>
        <div class="grid">${cards}</div></section>`;
    })
    .join("\n");

  const html = `<!doctype html><html lang=ja><head><meta charset=utf8>
<title>ブログSVGカタログ別ギャラリー (${all.length}枚)</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#f3f4f6;color:#1f2937}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 16px;z-index:10}
h1{font-size:16px;margin:0 0 8px}
.tabs{display:flex;flex-wrap:wrap;gap:6px}
.tab{border:1px solid #d1d5db;background:#f9fafb;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px}
.tab.active{background:#1f2937;color:#fff;border-color:#1f2937}
.tab b{opacity:.7;font-weight:600}
.panel{display:none;padding:16px}.panel.active{display:block}
.catdesc{color:#6b7280;font-size:13px;margin:0 0 12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px;margin:0}
.svgwrap svg{max-width:100%;height:auto;display:block}
figcaption{margin-top:6px;font-size:11px;color:#374151;word-break:break-all}
.meta{color:#6b7280}
.badge{display:inline-block;padding:1px 5px;border-radius:4px;font-size:10px;margin-left:4px}
.badge.err{background:#fee2e2;color:#b91c1c}.badge.warn{background:#fef3c7;color:#92400e}
</style></head><body>
<header><h1>ブログSVGカタログ別ギャラリー — 全${all.length}枚 / ${articles.length}記事</h1>
<div class="tabs">${tabBtns}</div></header>
${panels}
<script>
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  document.querySelector('.panel[data-cat="'+t.dataset.cat+'"]').classList.add('active');
});
</script></body></html>`;

  fs.writeFileSync(OUT, html);
  console.log(`\n[gallery-tabbed] 生成完了: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
