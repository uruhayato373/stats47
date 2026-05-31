#!/usr/bin/env node
/**
 * build-sitemap-ranking-keys.cjs
 *
 * sitemap.ts の /ranking 出力対象キーを「複数週の GSC impressions 和集合」で生成する。
 *
 * ## なぜ和集合か (2026-05-05 インシデント回避)
 * 過去に INDEXABLE_RANKING_KEYS (単一週 W17 の impressions≥1 = 338 件) で sitemap を
 * 絞ったところ、1,584 件がサイトマップから消えて大量インデックス削除が発生した。
 * 原因は「単一週スナップショットの 0 impression」を「価値なし」と誤判定し、
 * indexed 済みページまで落としたこと。
 *
 * 本スクリプトは利用可能な **全週の pages.csv の和集合** を取ることで、
 * 「ある時点で indexed され検索表示された実績がある」キーを保守的に拾う。
 * 一度も impressions を得ていないキー (= 実質 crawled-not-indexed の長期滞留) のみを
 * sitemap から外し、クロール予算を温存する。
 *
 * さらに既存 INDEXABLE_RANKING_KEYS も和集合に含め、過去に indexable 判定された
 * キーの取りこぼしを防ぐ (二重の安全弁)。
 *
 * 出力: apps/web/src/config/sitemap-ranking-keys.ts (SITEMAP_RANKING_KEYS)
 * 再生成: node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SNAPSHOTS_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
);
const OUT_FILE = path.join(
  PROJECT_ROOT,
  "apps/web/src/config/sitemap-ranking-keys.ts",
);

const IMPRESSION_THRESHOLD = 1;
const RANKING_PREFIX_RE = /^https?:\/\/[^/]+\/ranking\/([^/?#]+)/;

/** pages.csv (page,clicks,impressions,ctr,position) を読み、imp>=閾値 の ranking キーを返す */
function keysFromPagesCsv(csvPath) {
  const keys = new Set();
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    // page は URL なのでカンマを含まない前提 (GSC export 仕様)。先頭4カラムを単純分割。
    const cols = line.split(",");
    const url = cols[0];
    const impressions = Number(cols[2]);
    if (!Number.isFinite(impressions) || impressions < IMPRESSION_THRESHOLD) continue;
    const m = RANKING_PREFIX_RE.exec(url);
    if (!m) continue;
    keys.add(decodeURIComponent(m[1]).replace(/\/$/, ""));
  }
  return keys;
}

/** 既存 INDEXABLE_RANKING_KEYS を二次安全弁として取り込む (正規表現抽出) */
function existingIndexableKeys() {
  const p = path.join(
    PROJECT_ROOT,
    "apps/web/src/config/indexable-ranking-keys.ts",
  );
  const keys = new Set();
  if (!fs.existsSync(p)) return keys;
  const text = fs.readFileSync(p, "utf8");
  const re = /"([a-z0-9][a-z0-9-]*)"/g;
  let m;
  while ((m = re.exec(text))) keys.add(m[1]);
  return keys;
}

function main() {
  const weeks = fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d))
    .filter((d) => fs.existsSync(path.join(SNAPSHOTS_DIR, d, "pages.csv")))
    .sort();

  if (weeks.length === 0) {
    console.error("[build-sitemap-ranking-keys] no pages.csv snapshots found");
    process.exit(1);
  }

  const union = new Set();
  const perWeek = [];
  for (const w of weeks) {
    const csvPath = path.join(SNAPSHOTS_DIR, w, "pages.csv");
    const keys = keysFromPagesCsv(csvPath);
    perWeek.push(`${w}: ${keys.size}`);
    for (const k of keys) union.add(k);
  }

  const indexableCount = existingIndexableKeys().size;
  let addedFromIndexable = 0;
  for (const k of existingIndexableKeys()) {
    if (!union.has(k)) {
      union.add(k);
      addedFromIndexable++;
    }
  }

  const sorted = [...union].sort();

  const header = `/**
 * SITEMAP_RANKING_KEYS — sitemap.ts /ranking 出力対象キー (自動生成・手動編集禁止)
 *
 * **生成: node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs**
 *
 * 複数週 GSC impressions の和集合 + 既存 INDEXABLE_RANKING_KEYS。
 * 「過去に検索表示された実績がある = indexed 済み」を保守的に拾い、
 * 一度も impressions を得ていない長期 crawled-not-indexed キーのみ sitemap から外す。
 * 2026-05-05 の単一週絞り込みによる大量インデックス削除を回避する設計 (詳細はスクリプト docstring)。
 *
 * 集計週: ${weeks.join(", ")}
 *   週別 impressions>=1 キー数: ${perWeek.join(" / ")}
 * 和集合: ${sorted.length} キー (うち既存 INDEXABLE から追加 ${addedFromIndexable} / INDEXABLE 総数 ${indexableCount})
 * 生成日: ${new Date().toISOString().slice(0, 10)}
 *
 * 安全弁: url-policy.ts shouldIncludeInSitemap は本セットが空の場合 KNOWN 全件に
 *         フォールバックする (生成失敗時の大量削除を防ぐ)。
 */
export const SITEMAP_RANKING_KEYS = new Set<string>([
${sorted.map((k) => `  "${k}",`).join("\n")}
]);
`;

  fs.writeFileSync(OUT_FILE, header);
  console.log(
    `[build-sitemap-ranking-keys] wrote ${sorted.length} keys to ${path.relative(PROJECT_ROOT, OUT_FILE)}`,
  );
  console.log(`  weeks: ${weeks.join(", ")}`);
  console.log(`  per-week: ${perWeek.join(" / ")}`);
  console.log(`  added from INDEXABLE: ${addedFromIndexable}`);
}

main();
