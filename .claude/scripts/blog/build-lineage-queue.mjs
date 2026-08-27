#!/usr/bin/env node
/**
 * build-lineage-queue.mjs — 全ブログ SVG のデータ系譜を棚卸しし、復元キューを生成する。
 *
 * 「元データ消失 (SVG だけ残り data/json・source.json が無い)」を体系的に復元するための真実源。
 * 各 SVG を chartType (ranking/tilemap/scatter/line/stacked/findings/unknown) で分類し、
 * 復元手法 (restoreMethod) を割り当てる:
 *   - done           : json+source 両方あり (系譜完全)
 *   - source-backfill: json あり source 無し → SSOT対応付けで source.json 後付け (軽)
 *   - ssot-restore   : 元データ消失 + ranking/tilemap → regenerate-{ranking-cards,tile-maps} で SSOT復元
 *   - ssot-restore-new: 元データ消失 + scatter/line/findings → 復元手法の新規実装が要る
 *   - manual         : 元データ消失 + unknown (無意味名) → 個別手当て
 *
 * 出力: .claude/state/blog/svg-lineage-queue.json (機械用) + LATEST.md (人間用要約)
 * 正典: blog-data-schema.md §1.7 / .claude/rules/blog-data-schema.md
 *
 *   node .claude/scripts/blog/build-lineage-queue.mjs            # R2 公開URLから棚卸し
 *   node .claude/scripts/blog/build-lineage-queue.mjs --limit 20
 *   node .claude/scripts/blog/build-lineage-queue.mjs --staged   # .local/r2 を優先
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/blog");
const LIMIT = process.argv.includes("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1])
  : null;
const STAGED = process.argv.includes("--staged");

/**
 * CDN のキャッシュを迂回する URL を作る。
 *
 * R2 公開 URL は Cloudflare CDN 経由で、**404 も一定時間キャッシュされる**
 * (2026-07-29 実測: push 成功済みのファイルが `cf-cache-status: HIT` / `age: 157` で 404 を返した)。
 * 監査がこれを踏むと「push したのに欠落」と誤判定し、ラチェットが誤警報を出す。
 * クエリを変えると Cloudflare は別 URL として扱うので必ず origin まで読める。
 */
function noCache(u) {
  return `${u}${u.includes("?") ? "&" : "?"}__audit=${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
async function ft(u) { const r = await fetch(noCache(u)); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }
async function head(u) { try { const r = await fetch(noCache(u)); return r.ok; } catch { return false; } }
async function hasBlogData(slug, base, suffix) {
  if (
    STAGED &&
    fs.existsSync(
      path.join(PROJECT_ROOT, ".local/r2/app/blog", slug, "data", `${base}${suffix}`),
    )
  ) {
    return true;
  }
  return head(`${R2}/app/blog/${slug}/data/${base}${suffix}`);
}
async function pMap(items, fn, c) {
  const out = []; let i = 0;
  const w = async () => { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k]); } catch { out[k] = null; } } };
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, w));
  return out;
}

/** ファイル名から chartType を推定 (build-svg-gallery-tabbed の classify と整合) */
function classifyByName(base) {
  const f = base.toLowerCase();
  if (/-ig$/.test(f)) return "ranking";
  if (/^(inline-)?chart[-_]?\d+$/.test(f) || /inline-chart/.test(f)) return "unknown";
  if (/findings|要点|わかったこと|summary-findings/.test(f)) return "findings";
  if (/scatter|相関/.test(f)) return "scatter";
  if (/tile-?map|tile[-_]?grid|choropleth|地図|-map$|-map-/.test(f)) return "tilemap";
  if (/timeseries|trend|推移|時系列|line-chart|折れ線/.test(f)) return "line";
  if (/stacked|breakdown|composition|内訳|構成/.test(f)) return "stacked";
  if (/ranking|rankings|top5|top10|top-bottom|bottom5|rate-ranking|格差|gap|comparison|比較/.test(f)) return "ranking";
  return "unknown";
}

function restoreMethod(chartType, hasJson, hasSource) {
  if (hasJson && hasSource) return "done";
  if (hasJson && !hasSource) return "source-backfill";
  // 元データ消失 (json 無し)
  if (chartType === "ranking" || chartType === "tilemap") return "ssot-restore";
  if (chartType === "scatter" || chartType === "line" || chartType === "stacked" || chartType === "findings")
    return "ssot-restore-new";
  return "manual";
}

async function main() {
  const manifest = JSON.parse(await ft(`${R2}/app/blog/all.json`));
  let arts = (manifest.articles || []).filter((a) => a.hasCharts);
  if (LIMIT) arts = arts.slice(0, LIMIT);
  console.error(`[lineage] ${arts.length} 記事(hasCharts)を棚卸し`);

  const rows = await pMap(arts, async (a) => {
    const md = await ft(`${R2}/app/blog/${a.slug}/article.md`);
    const svgs = [...new Set([...md.matchAll(/\]\(data\/([^)]+)\.svg\)/g)].map((m) => m[1]))];
    const rankingRefs = svgs.filter((base) => classifyByName(base) === "ranking");
    const rankingKeys = [
      ...new Set([...md.matchAll(/\/ranking\/([a-z0-9-]+)/gi)].map((match) => match[1])),
    ];
    return await pMap(svgs, async (base) => {
      const [hasJson, hasSource] = await Promise.all([
        hasBlogData(a.slug, base, ".json"),
        hasBlogData(a.slug, base, ".source.json"),
      ]);
      const chartType = classifyByName(base);
      const status = hasJson && hasSource ? "both" : hasJson ? "jsonOnly" : "neither";
      // 現行 ranking 自動復元器が確証できるのは「記事内ranking SVGが1枚だけ」かつ
      // `/ranking/<key>` がある場合だけ。これ以外や他chart種は推測を避け、個別cardへ渡す。
      const autoRecoverable =
        status !== "both" &&
        chartType === "ranking" &&
        rankingRefs.length === 1 &&
        rankingKeys.length > 0;
      const residualCard =
        status === "both"
          ? null
          : chartType === "tilemap"
            ? "TILEMAP-LINEAGE-01"
            : "CHART-LINEAGE-RESIDUAL-01";
      return {
        slug: a.slug,
        base,
        chartType,
        hasJson,
        hasSource,
        status,
        restoreMethod: restoreMethod(chartType, hasJson, hasSource),
        autoRecoverable,
        residualCard,
      };
    }, 4);
  }, 12);

  const all = rows.filter(Boolean).flat().filter(Boolean);
  // 集計
  const byMethod = {};
  const byStatus = { both: 0, jsonOnly: 0, neither: 0 };
  let autoRecoverableCount = 0;
  for (const r of all) {
    byMethod[r.restoreMethod] = (byMethod[r.restoreMethod] || 0) + 1;
    byStatus[r.status]++;
    if (r.autoRecoverable) autoRecoverableCount++;
  }
  const n = all.length;

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STATE_DIR, "svg-lineage-queue.json"),
    JSON.stringify(
      { total: n, staged: STAGED, byStatus, byMethod, autoRecoverableCount, entries: all },
      null,
      2,
    ),
  );
  const pct = (x) => `${((x / n) * 100).toFixed(0)}%`;
  const md = `# ブログSVGデータ系譜 復元キュー (LATEST)

棚卸し対象: ${arts.length} 記事 / SVG ${n} 枚

## 系譜の整備状況
- ✅ both (json+source・系譜完全): **${byStatus.both}** (${pct(byStatus.both)})
- 🟡 jsonOnly (再生成可・出典無): **${byStatus.jsonOnly}** (${pct(byStatus.jsonOnly)})
- 🔴 neither (元データ消失・再生成不可): **${byStatus.neither}** (${pct(byStatus.neither)})
- 🤖 現行ranking自動復元器で確証可能: **${autoRecoverableCount}**

## 復元手法別 (restoreMethod)
${Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- \`${k}\`: ${v}`).join("\n")}

## 復元順 (軽い順)
1. \`source-backfill\` (${byMethod["source-backfill"] || 0}): 既存 json を SSOT に対応付け source.json 後付け
2. \`ssot-restore\` (${byMethod["ssot-restore"] || 0}): regenerate-tile-maps.ts / regenerate-ranking-cards.mjs で SSOT復元
3. \`ssot-restore-new\` (${byMethod["ssot-restore-new"] || 0}): scatter/line/findings の復元手法を新規実装
4. \`manual\` (${byMethod["manual"] || 0}): 無意味名・型不明 → 個別手当て

真実源: \`.claude/state/blog/svg-lineage-queue.json\` / 正典: \`.claude/rules/blog-data-schema.md §1.7\`
`;
  fs.writeFileSync(path.join(STATE_DIR, "svg-lineage-LATEST.md"), md);
  console.error(`[lineage] queue: ${n} 枚 / both ${byStatus.both} / jsonOnly ${byStatus.jsonOnly} / neither ${byStatus.neither}`);
  console.error(`[lineage] 書込: .claude/state/blog/svg-lineage-queue.json + svg-lineage-LATEST.md`);
}
main();
