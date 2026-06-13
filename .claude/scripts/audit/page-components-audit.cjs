#!/usr/bin/env node
/**
 * page_components の pageType 別配置を棚卸しし、area / theme 責務分離違反を検出する。
 *
 * 判定基準: docs/01_技術設計/07_情報設計.md
 *
 * 出力: docs/04_レビュー/YYYY-MM-DD-area-theme-audit.md
 *
 * 使い方:
 *   node .claude/scripts/audit/page-components-audit.cjs
 *
 * 必要: ローカル D1 が存在すること
 *   .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
 */

const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

if (!fs.existsSync(DB_PATH)) {
  console.error(`[ERROR] ローカル D1 が見つかりません: ${DB_PATH}`);
  console.error("  /pull-r2 または DB 初期化を実行してください");
  process.exit(1);
}

// better-sqlite3 は packages/database 配下に install されている想定
let Database;
try {
  Database = require(path.join(PROJECT_ROOT, "packages/database/node_modules/better-sqlite3"));
} catch {
  try {
    Database = require("better-sqlite3");
  } catch {
    console.error("[ERROR] better-sqlite3 が見つかりません。`npm install --workspace=packages/database` を実行してください");
    process.exit(1);
  }
}

const db = new Database(DB_PATH, { readonly: true });

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
  return db
    .prepare(
      `SELECT page_type, page_key, chart_key AS component_key, component_type, title, section, is_active
         FROM page_components
        WHERE page_type = ?
        ORDER BY page_key, sort_order`,
    )
    .all(pageType);
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
lines.push("判定基準: [`docs/01_技術設計/07_情報設計.md`](../../01_技術設計/07_情報設計.md)");
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

const outDir = path.join(PROJECT_ROOT, "docs/04_レビュー");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${today}-area-theme-audit.md`);
fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

console.log(`✓ 出力: ${path.relative(PROJECT_ROOT, outPath)}`);
console.log(`  area unique components: ${areaUnique.length}`);
console.log(`  theme unique components: ${themeUnique.length}`);
console.log(`  違反候補 (area→theme): ${moveCandidates.length}`);
console.log(`  レビュー必要 (theme 内): ${reviewNeeded.length}`);

db.close();
