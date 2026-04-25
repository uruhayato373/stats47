#!/usr/bin/env node
/**
 * INDEXABLE_RANKING_KEYS.ts 自動生成
 *
 * GSC snapshot の pages.csv から /ranking/{key} の Impressions ≥ MIN_IMPRESSIONS
 * のキーを抽出し、apps/web/src/config/indexable-ranking-keys.ts に静的 Set で出力。
 *
 * sitemap.ts の rankingPages フィルタに使われる。1,899 → 約 300 に削減することで
 * クロール予算をさらに絞る（親 issue #115 Phase 3）。
 *
 * 使い方:
 *   node .claude/scripts/gsc/build-indexable-ranking-keys.cjs
 *   node .claude/scripts/gsc/build-indexable-ranking-keys.cjs --min 5     # 閾値変更
 *   node .claude/scripts/gsc/build-indexable-ranking-keys.cjs --dry-run   # 出力せず統計のみ
 *
 * 入力: 最新の .claude/skills/analytics/gsc-improvement/reference/snapshots/<W>/pages.csv
 * 出力: apps/web/src/config/indexable-ranking-keys.ts
 */

const path = require("node:path");
const fs = require("node:fs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const MIN_IMPRESSIONS = (() => {
  const i = args.indexOf("--min");
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 1;
})();

function log(msg) {
  process.stderr.write(`[indexable-ranking-keys] ${msg}\n`);
}

function readCsv(filePath) {
  const txt = fs.readFileSync(filePath, "utf-8");
  const lines = txt.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i];
    });
    return row;
  });
}

function getLatestSnapshotDir() {
  const dir = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots",
  );
  const weeks = fs
    .readdirSync(dir)
    .filter((n) => /^\d{4}-W\d{2}$/.test(n))
    .sort()
    .reverse();
  return weeks[0] ? path.join(dir, weeks[0]) : null;
}

function loadKnownRankingKeys() {
  const p = path.join(
    PROJECT_ROOT,
    "apps/web/src/config/known-ranking-keys.ts",
  );
  const txt = fs.readFileSync(p, "utf-8");
  const matches = txt.match(/"([a-z0-9-]+)"/g) || [];
  return new Set(matches.map((m) => m.slice(1, -1)));
}

function extractRankingKey(url) {
  const m = url.match(/^https?:\/\/[^/]+\/ranking\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}

function main() {
  const snapDir = getLatestSnapshotDir();
  if (!snapDir) {
    log("ERROR: no GSC snapshot found");
    process.exit(1);
  }
  const pagesCsv = path.join(snapDir, "pages.csv");
  if (!fs.existsSync(pagesCsv)) {
    log(`ERROR: pages.csv not found at ${pagesCsv}`);
    process.exit(1);
  }

  log(`Reading ${path.relative(PROJECT_ROOT, pagesCsv)}`);
  const pages = readCsv(pagesCsv);
  const known = loadKnownRankingKeys();
  log(`Loaded ${known.size} known ranking keys`);

  // /ranking/{key} で Impressions >= 閾値、かつ known に含まれるもの
  const keyImpressions = new Map();
  for (const row of pages) {
    const key = extractRankingKey(row.page);
    if (!key) continue;
    if (!known.has(key)) continue;
    const impr = parseInt(row.impressions, 10) || 0;
    if (impr < MIN_IMPRESSIONS) continue;
    keyImpressions.set(key, (keyImpressions.get(key) || 0) + impr);
  }

  const sortedKeys = Array.from(keyImpressions.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  log(
    `Indexable ranking keys: ${sortedKeys.length} (min impressions = ${MIN_IMPRESSIONS})`,
  );
  if (sortedKeys.length > 0) {
    log(`  Top 5:`);
    for (const k of sortedKeys.slice(0, 5)) {
      log(`    ${keyImpressions.get(k).toString().padStart(5)} impr  ${k}`);
    }
  }

  if (DRY_RUN) {
    log("DRY-RUN: no file written");
    return;
  }

  const sourceWeek = path.basename(snapDir);
  const today = new Date().toISOString().slice(0, 10);
  const sortedAlpha = [...sortedKeys].sort();

  const out = `/**
 * sitemap.ts に出力する ranking キー一覧（GSC Impressions ≥ ${MIN_IMPRESSIONS} のみ）
 *
 * **このファイルは自動生成されます。手動編集しないこと。**
 *
 * sitemap.ts は known-ranking-keys.ts の全 1,901 キーから本 Set を交差して
 * 約 ${sortedKeys.length} URL に削減する。残りは middleware で 200 を返すが
 * sitemap で発見させない（クロール予算節約）。
 *
 * 生成元: ${path.relative(PROJECT_ROOT, pagesCsv)}
 * 元データ週: ${sourceWeek}
 * 生成日: ${today}
 * 閾値: Impressions ≥ ${MIN_IMPRESSIONS}（過去 28 日）
 *
 * 再生成: node .claude/scripts/gsc/build-indexable-ranking-keys.cjs
 */
export const INDEXABLE_RANKING_KEYS = new Set<string>([
${sortedAlpha.map((k) => `  "${k}",`).join("\n")}
]);
`;

  const outPath = path.join(
    PROJECT_ROOT,
    "apps/web/src/config/indexable-ranking-keys.ts",
  );
  fs.writeFileSync(outPath, out);
  log(`Wrote ${path.relative(PROJECT_ROOT, outPath)}`);
}

main();
