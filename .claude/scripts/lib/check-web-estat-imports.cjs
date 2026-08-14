#!/usr/bin/env node
/**
 * 本番 apps/web の e-Stat 直呼び境界チェック (CROSS-PAGE-DATA-SSOT-01 WP2)
 *
 * ★狙い: 本番 `apps/web` の production source が `@stats47/estat-api` を**値 import**
 *   (実際に e-Stat を叩く) する箇所を **shrink-only ratchet** で監視する。最終形は 0
 *   (全ページが R2 snapshot を読む) だが、移行中は現行 allowlist を上限とし、
 *   **新規の値 import が増えたら CI を失敗**させる。type-only import と test/script は対象外。
 *
 * WP6 で caller を R2 reader へ移すたびに allowlist から該当ファイルを削除する
 *   (削除 = 進捗、追加 = 原則禁止)。allowlist が空になったら本番 e-Stat 直呼び 0。
 *
 * 使い方:
 *   node .claude/scripts/lib/check-web-estat-imports.cjs           # ratchet 検査 (CI)
 *   node .claude/scripts/lib/check-web-estat-imports.cjs --list    # 現行の値 import 一覧
 */
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const WEB_SRC = path.join(PROJECT_ROOT, "apps/web/src");
/**
 * `import ... from '@stats47/estat-api...'` を複数行跨ぎで捕捉する。
 * `import(` から始まるインライン import 型 (`import("...").Foo`) は `import\s+` に
 * 一致しないので除外される (= 型のみ参照は値 import に数えない)。
 * 型のみ判定はマッチ文字列の先頭 (`import type`) で行う (下記 hasEstatValueImport)。
 */
const IMPORT_RE =
  /import\s+(?:(?!\bfrom\b|;)[\s\S])*?from\s+['"]@stats47\/estat-api(?:\/[^'"]*)?['"]/g;

/**
 * 現行 allowlist (2026-08-13 実測の**直接値 import** 10 ファイル・apps/web/src 相対)。
 * ★shrink-only: WP6 の R2 移行で不要になったら削除する。追加は原則禁止 (新規直呼び)。
 * ※ fetch-db-chart-data.ts はインライン import 型のみ (fetchEstatData は app wrapper 経由) で
 *   直接値 import ではないため対象外。RankingChart.tsx / prefetch-theme-kpi.ts は `import type`。
 */
const ALLOWLIST = [
  "components/stat-charts/adapters/toBarChartData.ts",
  "components/stat-charts/adapters/toKpiCardData.ts",
  "components/stat-charts/adapters/toStatsTableData.ts",
  "components/stat-charts/adapters/toSunburstData.ts",
  "components/stat-charts/services/fetchEstatData.ts",
  "components/stat-charts/utils/computeSharedYDomain.ts",
  "components/stat-charts/utils/computeYAxisDomain.ts",
  "features/theme-dashboard/actions/fetch-indicator-for-year.ts",
  "features/theme-dashboard/actions/fetch-metric-timeseries.ts",
  "features/theme-dashboard/actions/fetch-population-pyramid.ts",
];

/** production source か (test/spec/stories を除外)。 */
function isProductionSource(relPath) {
  if (!/\.(ts|tsx)$/.test(relPath)) return false;
  return !/(^|\/)__tests__\//.test(relPath) &&
    !/\.(test|spec|stories)\.tsx?$/.test(relPath);
}

/**
 * ファイル本文が `@stats47/estat-api` を**値 import** しているか (pure)。
 * `import type ... from '@stats47/estat-api'` (単一/複数行) と インライン import 型は false。
 * 混在 `import { type A, valueB } from '...'` は値 import (true)。
 */
function hasEstatValueImport(text) {
  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(text)) !== null) {
    // マッチ文字列の先頭が "import type" なら型のみ (混在 import { type A, valueB } は値)。
    const isTypeOnly = /^import\s+type\b/.test(m[0]);
    if (!isTypeOnly) return true;
  }
  return false;
}

/** apps/web/src を走査して値 import する production ファイル (相対 path) を返す。 */
function collectValueImportFiles(root = WEB_SRC) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (!isProductionSource(rel)) continue;
      const text = fs.readFileSync(full, "utf8");
      if (hasEstatValueImport(text)) found.push(rel);
    }
  };
  walk(root);
  return found.sort();
}

/** allowlist との差分 (pure)。newOnes = 新規違反、resolved = 移行済み。 */
function diffAgainstAllowlist(found, allowlist = ALLOWLIST) {
  const allow = new Set(allowlist);
  const foundSet = new Set(found);
  return {
    newOnes: found.filter((f) => !allow.has(f)),
    resolved: allowlist.filter((f) => !foundSet.has(f)),
  };
}

module.exports = {
  hasEstatValueImport,
  collectValueImportFiles,
  diffAgainstAllowlist,
  ALLOWLIST,
};

if (require.main === module) {
  const found = collectValueImportFiles();
  if (process.argv.includes("--list")) {
    console.log(found.join("\n"));
    process.exit(0);
  }
  const { newOnes, resolved } = diffAgainstAllowlist(found);
  if (resolved.length) {
    console.log(`✓ 移行済み (allowlist から削除可) ${resolved.length} 件:`);
    resolved.forEach((f) => console.log(`  - ${f}`));
  }
  if (newOnes.length) {
    console.error(
      `❌ 本番 apps/web に新規の e-Stat 値 import ${newOnes.length} 件 (R2 reader を使うこと):`,
    );
    newOnes.forEach((f) => console.error(`  + ${f}`));
    console.error(
      "  最終形は本番 e-Stat 直呼び 0。新規追加は禁止。R2 snapshot reader (WP2) を使う。",
    );
    process.exit(1);
  }
  console.log(`✓ 本番 e-Stat 値 import は allowlist ${found.length} 件以内 (新規なし)`);
}
