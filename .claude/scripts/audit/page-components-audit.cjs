#!/usr/bin/env node
/**
 * page_components の pageType 別配置を棚卸しし、area / theme 責務分離違反を検出する。
 *
 * 判定基準: docs/01_技術設計/03_情報設計.md
 *
 * 出力: .claude/skills/analytics/seo-audit/reference/audits/YYYY-MM-DD-area-theme-audit.md
 *
 * 使い方:
 *   node .claude/scripts/audit/page-components-audit.cjs
 *
 * データ源: apps/web/scripts/data/page-components/<pageType>/<pageKey>.json (git TS SSOT)
 *
 * ★2026-08-03 に D1 から git TS へ移植した。
 *   完全DBレス移行で .local/d1 の miniflare sqlite は無くなっていたのに、このスクリプトは
 *   そこを読み続けており「ローカル D1 が見つかりません」と出したうえで **exit 0** していた。
 *   つまり呼んでも何も検査せず成功したように見える状態で、どの CI からも呼ばれていなかった
 *   ため誰も気づいていなかった (UNWIRED_CHECKER)。
 *   正典: docs/01_技術設計/02_データアーキテクチャ.md (SSOT は git TS と R2 のみ)
 */

const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const COMPONENTS_DIR = path.join(PROJECT_ROOT, "apps/web/scripts/data/page-components");

if (!fs.existsSync(COMPONENTS_DIR)) {
  console.error(`[ERROR] page_components の SSOT が見つかりません: ${COMPONENTS_DIR}`);
  process.exit(1);
}

/**
 * 主題深掘り可視化と判定するヒューリスティック。
 * - componentType が地図/コロプレス/散布図系
 * - title に「47都道府県」「全国」「比較」「相関」「ピラミッド」「フロー」などを含む
 * 主題側 (theme) に配置すべきもの。
 */
const THEME_LEVEL_COMPONENT_TYPES = new Set([
  "choropleth-map",
  "choropleth",
  "japan-map",
  "scatter-plot",
  "scatter",
  "migration-flow",
  "population-pyramid",
  "pyramid",
]);

const THEME_LEVEL_TITLE_PATTERNS = [
  /47都道府県/,
  /全国比較/,
  /相関/,
  /ピラミッド/,
  /移動フロー/,
  /移動\s*フロー/,
  /人口移動/,
];

function classifyForArea(row) {
  if (THEME_LEVEL_COMPONENT_TYPES.has(row.component_type)) {
    return { verdict: "MOVE_TO_THEME", reason: `componentType=${row.component_type} は主題横断可視化` };
  }
  for (const pattern of THEME_LEVEL_TITLE_PATTERNS) {
    if (pattern.test(row.title)) {
      return { verdict: "MOVE_TO_THEME", reason: `title「${row.title}」が主題横断パターンに該当 (${pattern})` };
    }
  }
  return { verdict: "KEEP_ON_AREA", reason: "県固有時系列/構成と推定" };
}

function classifyForTheme(row) {
  // theme に置かれているチャートが「県固有時系列」ぽくないか軽くチェック
  if (/年次推移|時系列/.test(row.title) && row.component_type === "line-chart") {
    return {
      verdict: "REVIEW_NEEDED",
      reason: `title「${row.title}」は単一県の時系列の可能性。47県横並びか確認`,
    };
  }
  return { verdict: "KEEP_ON_THEME", reason: "主題横断可視化と推定" };
}

const today = new Date().toISOString().slice(0, 10);

function fetchRows(pageType) {
  // <pageType>/<pageKey>.json を読む。page_key はファイル名、is_active は
  // 「ファイルに載っている = 配信対象」なので常に真 (git TS には無効行を置かない)。
  const dir = path.join(COMPONENTS_DIR, pageType);
  if (!fs.existsSync(dir)) return [];
  const rows = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const pageKey = path.basename(file, ".json");
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (error) {
      // 壊れた SSOT を「0 件」として黙って通さない
      console.error(`[ERROR] ${pageType}/${file} を読めません: ${error.message}`);
      process.exit(1);
    }
    const list = Array.isArray(parsed) ? parsed : (parsed.components ?? []);
    for (const entry of list) {
      rows.push({
        page_type: pageType,
        page_key: pageKey,
        component_key: entry.componentKey,
        component_type: entry.componentType,
        title: entry.title,
        section: entry.section ?? null,
        is_active: 1,
        sort_order: entry.sortOrder ?? 0,
      });
    }
  }
  return rows.sort((a, b) =>
    a.page_key === b.page_key ? a.sort_order - b.sort_order : a.page_key.localeCompare(b.page_key),
  );
}

const areaRows = fetchRows("area");
const themeRows = fetchRows("theme");
const areaCategoryRows = fetchRows("area-category");
const cityCategoryRows = fetchRows("city-category");

// page_key 単位で集約 (area は 47 県あるので unique な component_key だけ抽出)
function dedupeByComponentKey(rows) {
  const seen = new Map();
  for (const row of rows) {
    if (!seen.has(row.component_key)) {
      seen.set(row.component_key, { ...row, page_keys: new Set([row.page_key]) });
    } else {
      seen.get(row.component_key).page_keys.add(row.page_key);
    }
  }
  return Array.from(seen.values());
}

const areaUnique = dedupeByComponentKey(areaRows);
const themeUnique = dedupeByComponentKey(themeRows);

const areaClassified = areaUnique.map((row) => ({ ...row, ...classifyForArea(row) }));
const themeClassified = themeUnique.map((row) => ({ ...row, ...classifyForTheme(row) }));

const moveCandidates = areaClassified.filter((r) => r.verdict === "MOVE_TO_THEME");
const reviewNeeded = themeClassified.filter((r) => r.verdict === "REVIEW_NEEDED");

// Markdown 出力
const lines = [];
lines.push("---");
lines.push("type: area-theme-audit");
lines.push(`date: ${today}`);
lines.push("status: draft");
lines.push("tags: [audit, page-components, area, theme]");
lines.push("---");
lines.push("");
lines.push(`# area / theme 責務分離 棚卸し (${today})`);
lines.push("");
lines.push("判定基準: [`docs/01_技術設計/03_情報設計.md`](../../01_技術設計/03_情報設計.md)");
lines.push("");
lines.push("## サマリ");
lines.push("");
lines.push(`| pageType | unique component数 | 総 assignment 数 |`);
lines.push(`|---|---|---|`);
lines.push(`| area | ${areaUnique.length} | ${areaRows.length} |`);
lines.push(`| theme | ${themeUnique.length} | ${themeRows.length} |`);
lines.push(`| area-category | ${dedupeByComponentKey(areaCategoryRows).length} | ${areaCategoryRows.length} |`);
lines.push(`| city-category | ${dedupeByComponentKey(cityCategoryRows).length} | ${cityCategoryRows.length} |`);
lines.push("");
lines.push(`## 違反候補: pageType=area → theme へ移すべき (${moveCandidates.length} 件)`);
lines.push("");
if (moveCandidates.length === 0) {
  lines.push("該当なし。area に登録された全コンポーネントは県固有可視化と推定。");
} else {
  lines.push("| componentKey | componentType | title | 配置 page_key 数 | 理由 |");
  lines.push("|---|---|---|---|---|");
  for (const r of moveCandidates) {
    lines.push(`| \`${r.component_key}\` | ${r.component_type} | ${r.title} | ${r.page_keys.size} | ${r.reason} |`);
  }
}
lines.push("");
lines.push(`## レビュー必要: pageType=theme で疑わしい (${reviewNeeded.length} 件)`);
lines.push("");
if (reviewNeeded.length === 0) {
  lines.push("該当なし。");
} else {
  lines.push("| componentKey | componentType | title | 配置 page_key 数 | 理由 |");
  lines.push("|---|---|---|---|---|");
  for (const r of reviewNeeded) {
    lines.push(`| \`${r.component_key}\` | ${r.component_type} | ${r.title} | ${r.page_keys.size} | ${r.reason} |`);
  }
}
lines.push("");
lines.push(`## 参考: pageType=area の全 unique component (${areaUnique.length} 件)`);
lines.push("");
lines.push("| componentKey | componentType | title | section | verdict |");
lines.push("|---|---|---|---|---|");
for (const r of areaClassified) {
  lines.push(`| \`${r.component_key}\` | ${r.component_type} | ${r.title} | ${r.section ?? "-"} | ${r.verdict} |`);
}
lines.push("");
lines.push(`## 参考: pageType=theme の全 unique component (${themeUnique.length} 件)`);
lines.push("");
lines.push("| componentKey | componentType | title | section | page_keys |");
lines.push("|---|---|---|---|---|");
for (const r of themeClassified) {
  lines.push(`| \`${r.component_key}\` | ${r.component_type} | ${r.title} | ${r.section ?? "-"} | ${Array.from(r.page_keys).join(", ")} |`);
}
lines.push("");
lines.push("## next action");
lines.push("");
lines.push("1. 上記「違反候補」テーブルを目視確認し、本当に theme へ移すべきものを確定");
lines.push("2. 確定した component に対し `page_components` の `page_type` を `theme` に UPDATE (or 新規 INSERT + 旧 row DELETE)");
lines.push("3. ローカル D1 で反映後、`/sync-snapshots --only page-components` で R2 に push");
lines.push("4. 該当 area ページ・theme ページの表示を browser で確認");
lines.push("");

const outDir = path.join(PROJECT_ROOT, ".claude/skills/analytics/seo-audit/reference/audits");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${today}-area-theme-audit.md`);
fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

console.log(`✓ 出力: ${path.relative(PROJECT_ROOT, outPath)}`);
console.log(`  area unique components: ${areaUnique.length}`);
console.log(`  theme unique components: ${themeUnique.length}`);
console.log(`  違反候補 (area→theme): ${moveCandidates.length}`);
console.log(`  レビュー必要 (theme 内): ${reviewNeeded.length}`);

