/**
 * アフィリエイト在庫 管理画面 (単体 HTML 生成)。
 *
 * SSOT = apps/web/scripts/affiliate-ads-data.ts の AFFILIATE_ADS[] を読み、
 * 依存なしの自己完結 HTML (インライン CSS/JS + データ埋め込み) を 1 ファイル出力する。
 * 本番アプリには触れない。ブラウザで開けばバナー画像プレビュー付きで在庫を確認・絞り込みできる。
 *
 * 実行:
 *   npx tsx .claude/scripts/ads/build-affiliate-dashboard.ts            # → /tmp/stats47-affiliate-dashboard.html
 *   npx tsx .claude/scripts/ads/build-affiliate-dashboard.ts /tmp/x.html
 *
 * 生成 HTML は派生物 (git 管理しない・commit-back 廃止 2026-07-15)。都度この script で再生成する。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { AFFILIATE_ADS } from "../../../apps/web/scripts/affiliate-ads-data";
import { buildAffiliatePortfolioViewModel } from "../../../apps/admin/lib/server/affiliate-portfolio-view";

// SSOT: packages/data-configs/src/types.ts の CATEGORY_KEYS (17 軸)
const CATEGORY_KEYS = [
  "landweather", "population", "laborwage", "agriculture", "miningindustry",
  "commercial", "economy", "construction", "energy", "tourism",
  "educationsports", "administrativefinancial", "safetyenvironment",
  "socialsecurity", "international", "infrastructure", "ict",
] as const;

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main(): void {
  const outArg = process.argv[2];
  const outPath = outArg
    ? resolve(process.cwd(), outArg)
    : "/tmp/stats47-affiliate-dashboard.html";

  const ads = [...AFFILIATE_ADS].sort((a, b) => {
    const ca = a.categoryKey ?? "";
    const cb = b.categoryKey ?? "";
    if (ca !== cb) return ca < cb ? -1 : 1;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });

  const active = ads.filter((a) => a.isActive);
  const byCat: Record<string, number> = {};
  for (const a of active) byCat[a.categoryKey ?? "(null)"] = (byCat[a.categoryKey ?? "(null)"] ?? 0) + 1;
  const covered = CATEGORY_KEYS.filter((k) => (byCat[k] ?? 0) > 0).length;
  const gaps = CATEGORY_KEYS.filter((k) => !(byCat[k] ?? 0));
  const advertisers = new Set(active.map((a) => a.title)).size;
  const generatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  const portfolioPath = resolve(process.cwd(), ".claude/state/ads/affiliate-portfolio-latest.json");
  const portfolio = buildAffiliatePortfolioViewModel(
    existsSync(portfolioPath) ? JSON.parse(readFileSync(portfolioPath, "utf8")) : {},
  );

  // クライアント JS に渡すデータ (絞り込み用に必要な field だけ)
  const data = ads.map((a) => ({
    id: a.id,
    programRef: a.programRef ?? "",
    lane: a.offerProfile?.lane ?? "unknown",
    frictionTier: a.offerProfile?.frictionTier ?? "unknown",
    title: a.title,
    categoryKey: a.categoryKey ?? "",
    locationCode: a.locationCode ?? "",
    adType: a.adType ?? "",
    isActive: !!a.isActive,
    priority: a.priority ?? 0,
    imageUrl: a.adType === "banner" ? (a.imageUrl ?? "") : "",
    href: a.htmlContent ?? "",
    width: a.width ?? null,
    height: a.height ?? null,
    areaCode: a.areaCode ?? null,
  }));

  const categories = CATEGORY_KEYS.filter((k) => (byCat[k] ?? 0) >= 0);
  const locations = Array.from(new Set(ads.map((a) => a.locationCode ?? ""))).sort();

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>アフィリエイト在庫 管理画面 — stats47</title>
<style>
  :root { --bd:#e2e8f0; --mut:#64748b; --fg:#0f172a; --bg:#f8fafc; --accent:#0f766e; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system, "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif; color:var(--fg); background:var(--bg); }
  header { background:#fff; border-bottom:1px solid var(--bd); padding:16px 20px; position:sticky; top:0; z-index:5; }
  h1 { font-size:18px; margin:0 0 4px; }
  .gen { color:var(--mut); font-size:12px; }
  .kpis { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }
  .kpi { border:1px solid var(--bd); background:#fff; padding:8px 12px; min-width:110px; }
  .kpi b { display:block; font-size:20px; }
  .kpi span { color:var(--mut); font-size:11px; }
  .gaps { margin-top:10px; font-size:12px; color:#b91c1c; }
  .gaps code { background:#fef2f2; border:1px solid #fecaca; padding:1px 5px; margin:0 2px; }
  .controls { display:flex; flex-wrap:wrap; gap:8px; padding:12px 20px; background:#fff; border-bottom:1px solid var(--bd); position:sticky; top:0; }
  .controls input, .controls select { border:1px solid var(--bd); padding:6px 8px; font-size:13px; background:#fff; }
  .controls input[type=search] { min-width:200px; flex:1; }
  .count { color:var(--mut); font-size:12px; align-self:center; margin-left:auto; }
  main { padding:16px 20px; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:12px; }
  .card { border:1px solid var(--bd); background:#fff; padding:10px; display:flex; flex-direction:column; gap:8px; }
  .card.inactive { opacity:.5; }
  .thumb { height:130px; display:flex; align-items:center; justify-content:center; background:#f1f5f9; border:1px solid var(--bd); overflow:hidden; }
  .thumb img { max-width:100%; max-height:100%; object-fit:contain; }
  .thumb .txt { color:var(--mut); font-size:12px; }
  .title { font-weight:600; font-size:14px; line-height:1.3; }
  .badges { display:flex; flex-wrap:wrap; gap:4px; }
  .b { font-size:11px; padding:1px 6px; border:1px solid var(--bd); background:#f8fafc; color:var(--mut); }
  .b.cat { color:var(--accent); border-color:#99f6e4; background:#f0fdfa; }
  .b.on { color:#166534; border-color:#bbf7d0; background:#f0fdf4; }
  .b.off { color:#b91c1c; border-color:#fecaca; background:#fef2f2; }
  .meta { color:var(--mut); font-size:11px; }
  .card a.link { font-size:12px; color:var(--accent); word-break:break-all; text-decoration:none; }
  .card a.link:hover { text-decoration:underline; }
</style>
</head>
<body>
<header>
  <h1>アフィリエイト在庫 管理画面 <span class="gen">stats47 / 確認用 (read-only)</span></h1>
  <div class="gen">生成: ${esc(generatedAt)} ・ SSOT: apps/web/scripts/affiliate-ads-data.ts ・ 再生成: <code>npx tsx .claude/scripts/ads/build-affiliate-dashboard.ts</code></div>
  <div class="kpis">
    <div class="kpi"><b>${ads.length}</b><span>総枠数</span></div>
    <div class="kpi"><b>${active.length}</b><span>active</span></div>
    <div class="kpi"><b>${advertisers}</b><span>実広告主</span></div>
    <div class="kpi"><b>${covered}/${CATEGORY_KEYS.length}</b><span>カテゴリ軸カバー</span></div>
    <div class="kpi"><b>${gaps.length}</b><span>広告ゼロ軸</span></div>
    <div class="kpi"><b>${esc(portfolio.gates.portfolio?.status ?? "unknown")}</b><span>portfolio gate</span></div>
    <div class="kpi"><b>${portfolio.totals.unclassified}</b><span>未分類案件</span></div>
    <div class="kpi"><b>${portfolio.confirmedRevenueYen == null ? "—" : `¥${portfolio.confirmedRevenueYen.toLocaleString()}`}</b><span>確定収益</span></div>
  </div>
  ${gaps.length ? `<div class="gaps">広告ゼロ軸 (impression 機会損失): ${gaps.map((g) => `<code>${esc(g)}</code>`).join("")}</div>` : ""}
</header>
<div class="controls">
  <input type="search" id="q" placeholder="タイトル / id で検索…">
  <select id="cat"><option value="">全カテゴリ</option>${categories.map((c) => `<option value="${esc(c)}">${esc(c)} (${byCat[c] ?? 0})</option>`).join("")}</select>
  <select id="loc"><option value="">全配置</option>${locations.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("")}</select>
  <select id="type"><option value="">全 adType</option><option value="banner">banner</option><option value="text">text</option></select>
  <select id="act"><option value="">全状態</option><option value="active">active のみ</option><option value="inactive">inactive のみ</option></select>
  <span class="count" id="count"></span>
</div>
<main><div class="grid" id="grid"></div></main>
<script>
const ADS = ${JSON.stringify(data)};
const $ = (id) => document.getElementById(id);
function render() {
  const q = $("q").value.trim().toLowerCase();
  const cat = $("cat").value, loc = $("loc").value, type = $("type").value, act = $("act").value;
  const rows = ADS.filter(a => {
    if (q && !(a.title.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))) return false;
    if (cat && a.categoryKey !== cat) return false;
    if (loc && a.locationCode !== loc) return false;
    if (type && a.adType !== type) return false;
    if (act === "active" && !a.isActive) return false;
    if (act === "inactive" && a.isActive) return false;
    return true;
  });
  $("count").textContent = rows.length + " / " + ADS.length + " 件";
  $("grid").innerHTML = rows.map(a => {
    const thumb = a.imageUrl
      ? '<div class="thumb"><img loading="lazy" src="' + a.imageUrl + '" alt=""></div>'
      : '<div class="thumb"><span class="txt">' + (a.adType === "text" ? "テキスト広告" : "画像なし") + '</span></div>';
    const dim = (a.width && a.height) ? a.width + "×" + a.height : "";
    return '<div class="card ' + (a.isActive ? "" : "inactive") + '">'
      + thumb
      + '<div class="title">' + escapeHtml(a.title) + '</div>'
      + '<div class="badges">'
      +   '<span class="b cat">' + escapeHtml(a.categoryKey || "—") + '</span>'
      +   '<span class="b">' + escapeHtml(a.locationCode || "—") + '</span>'
      +   '<span class="b">' + escapeHtml(a.adType || "—") + '</span>'
      +   '<span class="b">' + escapeHtml(a.lane) + '/' + escapeHtml(a.frictionTier) + '</span>'
      +   '<span class="b">P' + a.priority + '</span>'
      +   (a.areaCode ? '<span class="b">area:' + escapeHtml(a.areaCode) + '</span>' : '')
      +   '<span class="b ' + (a.isActive ? "on" : "off") + '">' + (a.isActive ? "active" : "inactive") + '</span>'
      + '</div>'
      + '<div class="meta">' + escapeHtml(a.id) + ' ・ ' + escapeHtml(a.programRef || "参照なし") + (dim ? " ・ " + dim : "") + '</div>'
      + (a.href ? '<a class="link" href="' + a.href + '" target="_blank" rel="noopener">クリックURLを開く ↗</a>' : '')
      + '</div>';
  }).join("") || '<p style="color:#64748b">該当なし</p>';
}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]));}
["q","cat","loc","type","act"].forEach(id => { $(id).addEventListener("input", render); });
render();
</script>
</body>
</html>
`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  process.stderr.write(`[dashboard] ${ads.length} 枠 → ${outPath}\n`);
  process.stdout.write(outPath + "\n");
}

main();
