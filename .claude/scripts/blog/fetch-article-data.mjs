#!/usr/bin/env node
/**
 * fetch-article-data
 *
 * Aggregator script for blog article data.
 *
 * - Parses planning MD under docs/20_ブログ記事企画/backlog/ for the given slug
 * - Extracts ranking_key list from the "使用データ" table
 * - Queries local D1 (metrics + stats_prefecture) to materialize:
 *     <slug>/data/<ranking_key>-prefecture-rankings.json
 *     <slug>/data/<ranking_key>-timeseries.json
 *
 * Scope (per Phase 3 task):
 * - D1 existing data only. New e-Stat statsDataId fetch is OUT OF SCOPE (warn only).
 * - chart_specs interpretation OUT OF SCOPE (scatter / tile-grid / stacked / findings = future TODO).
 *
 * Usage:
 *   node .claude/scripts/blog/fetch-article-data.mjs --slug <slug> [--dry-run]
 *
 * Exit codes:
 *   0 success
 *   1 bad args
 *   2 D1 missing
 *   3 slug section / ranking_key not found in backlog
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ---- CLI args ----
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SLUG = getArg("--slug");
const DRY_RUN = args.includes("--dry-run");

if (!SLUG) {
  console.error("Usage: fetch-article-data.mjs --slug <slug> [--dry-run]");
  process.exit(1);
}

// ---- D1 path (fixed per CLAUDE.md / local-environment.md) ----
const D1_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

if (!existsSync(D1_PATH)) {
  console.error(`[fatal] D1 not found: ${D1_PATH}`);
  process.exit(2);
}

const BACKLOG_DIR = path.join(PROJECT_ROOT, "docs/20_ブログ記事企画/backlog");

/**
 * Parse all MD files under backlog/ and find the section for the given slug.
 * Section delimiter: `## 記事企画: <slug>` (canonical) or `slug: <slug>` (inline frontmatter).
 * Returns { file, sectionText, rankingKeys }.
 */
function findRankingKeysInBacklog(slug) {
  if (!existsSync(BACKLOG_DIR)) {
    console.error(`[error] backlog dir missing: ${BACKLOG_DIR}`);
    return { file: null, sectionText: "", rankingKeys: [] };
  }

  const mdFiles = readdirSync(BACKLOG_DIR).filter((f) => f.endsWith(".md"));
  const sectionHeader = new RegExp(`^##\\s*記事企画\\s*[::]\\s*${escapeRe(slug)}\\s*$`, "m");

  for (const f of mdFiles) {
    const abs = path.join(BACKLOG_DIR, f);
    const text = readFileSync(abs, "utf8");
    const match = text.match(sectionHeader);
    if (!match) continue;

    // Extract section: from match.index to next `## ` or EOF
    const start = match.index;
    const rest = text.slice(start + match[0].length);
    const nextHeader = rest.search(/^##\s/m);
    const sectionText = nextHeader >= 0 ? rest.slice(0, nextHeader) : rest;

    const rankingKeys = extractRankingKeys(sectionText);
    return { file: abs, sectionText, rankingKeys };
  }

  return { file: null, sectionText: "", rankingKeys: [] };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract ranking_key tokens from a section.
 *
 * Supported patterns:
 *   1. Markdown table row "| 指標 | ソース | <ranking_key> | 備考 |"
 *      Heuristic: cell that matches /^[a-z0-9][a-z0-9-]+$/ (kebab-case, ASCII).
 *   2. Inline "ranking_key: <key>" or "ranking_key=<key>"
 *   3. Heading "#### <kebab-key>"
 *
 * Order preserved, duplicates removed.
 */
function extractRankingKeys(sectionText) {
  const keys = [];
  const seen = new Set();
  const add = (k) => {
    if (!k) return;
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
  };

  // Pattern 2 + 3
  const inlineRe = /ranking_key\s*[:=]\s*([a-z0-9][a-z0-9-]+)/gi;
  let m;
  while ((m = inlineRe.exec(sectionText)) !== null) add(m[1]);

  const headingRe = /^####\s+([a-z0-9][a-z0-9-]+)\s*$/gm;
  while ((m = headingRe.exec(sectionText)) !== null) add(m[1]);

  // Pattern 1: markdown table rows. Skip header / separator.
  const lines = sectionText.split("\n");
  let inTable = false;
  let rankingCol = -1;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      inTable = false;
      rankingCol = -1;
      continue;
    }
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    // Header row: detect ranking_key column position
    const lcCells = cells.map((c) => c.toLowerCase());
    if (lcCells.includes("ranking_key")) {
      rankingCol = lcCells.indexOf("ranking_key");
      inTable = true;
      continue;
    }
    // Separator row: |---|---|
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;

    if (inTable && rankingCol >= 0 && cells[rankingCol]) {
      const cell = cells[rankingCol];
      if (/^[a-z0-9][a-z0-9-]+$/.test(cell)) add(cell);
    }
  }

  return keys;
}

/**
 * Fetch ranking for latest year_code of metric.
 * Returns { ranking_key, title, unit, year, data_source, items[] }.
 */
function fetchRanking(db, key) {
  const meta = db
    .prepare(
      `SELECT key, title, unit, source_id, year_code AS metric_year_code
       FROM metrics WHERE key = ?`,
    )
    .get(key);

  if (!meta) {
    return {
      ranking_key: key,
      _missing: "metric not found in D1.metrics",
      items: [],
    };
  }

  const latestRow = db
    .prepare(
      `SELECT MAX(year_code) AS y FROM stats_prefecture WHERE metric_key = ?`,
    )
    .get(key);
  const latestYear = latestRow?.y ?? meta.metric_year_code ?? null;

  const rows = latestYear
    ? db
        .prepare(
          `SELECT area_code, area_name, value, unit AS row_unit, year_name
           FROM stats_prefecture
           WHERE metric_key = ? AND year_code = ?
           ORDER BY value DESC NULLS LAST, area_code ASC`,
        )
        .all(key, latestYear)
    : [];

  const unit = meta.unit || rows[0]?.row_unit || "";

  return {
    ranking_key: key,
    title: meta.title,
    unit,
    year: latestYear,
    year_name: rows[0]?.year_name ?? null,
    data_source: meta.source_id ? `D1 metrics.source_id=${meta.source_id}` : "D1 (source_id null)",
    items: rows.map((r) => ({
      area_code: r.area_code,
      area_name: r.area_name,
      value: r.value,
    })),
  };
}

/**
 * Fetch timeseries (all years) for a metric, pivoted to one row per prefecture.
 * Returns { ranking_key, title, unit, years[], series[] }.
 */
function fetchTimeseries(db, key) {
  const meta = db
    .prepare(`SELECT key, title, unit, source_id FROM metrics WHERE key = ?`)
    .get(key);

  if (!meta) {
    return {
      ranking_key: key,
      _missing: "metric not found in D1.metrics",
      years: [],
      series: [],
    };
  }

  const rows = db
    .prepare(
      `SELECT year_code, area_code, area_name, value
       FROM stats_prefecture
       WHERE metric_key = ?
       ORDER BY year_code ASC, area_code ASC`,
    )
    .all(key);

  // Pivot: years[] + series by area_code
  const yearSet = new Set();
  const byArea = new Map(); // area_code -> { area_name, values: Map<year, value> }

  for (const r of rows) {
    yearSet.add(r.year_code);
    if (!byArea.has(r.area_code)) {
      byArea.set(r.area_code, { area_name: r.area_name, values: new Map() });
    }
    byArea.get(r.area_code).values.set(r.year_code, r.value);
  }

  const years = [...yearSet].sort();
  const series = [...byArea.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([area_code, { area_name, values }]) => ({
      area_code,
      area_name,
      values: years.map((y) => (values.has(y) ? values.get(y) : null)),
    }));

  return {
    ranking_key: key,
    title: meta.title,
    unit: meta.unit || "",
    data_source: meta.source_id ? `D1 metrics.source_id=${meta.source_id}` : "D1 (source_id null)",
    years,
    series,
  };
}

// ---- main ----
function main() {
  const { file, rankingKeys } = findRankingKeysInBacklog(SLUG);
  if (!file) {
    console.error(
      `[error] no backlog section found for slug=${SLUG} under docs/20_ブログ記事企画/backlog/`,
    );
    process.exit(3);
  }
  if (rankingKeys.length === 0) {
    console.error(
      `[error] backlog section found (${path.basename(file)}) but ranking_key列を抽出できず`,
    );
    process.exit(3);
  }

  console.log(`[info] slug=${SLUG}`);
  console.log(`[info] backlog=${path.relative(PROJECT_ROOT, file)}`);
  console.log(`[info] ranking_keys=${JSON.stringify(rankingKeys)}`);

  const dataDir = path.join(
    PROJECT_ROOT,
    "docs/21_ブログ記事原稿",
    SLUG,
    "data",
  );
  if (DRY_RUN) {
    console.log(`[dry] would mkdir -p ${path.relative(PROJECT_ROOT, dataDir)}`);
  } else {
    mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(D1_PATH, { readonly: true });

  let writtenCount = 0;
  let warnCount = 0;

  for (const key of rankingKeys) {
    const ranking = fetchRanking(db, key);
    const timeseries = fetchTimeseries(db, key);

    if (ranking._missing) {
      console.warn(
        `  [warn] ${key}: metric_key not found in D1.metrics (statsDataId 取得は scope 外、要手動 /fetch-estat-data)`,
      );
      warnCount++;
      continue;
    }
    if (ranking.items.length === 0) {
      console.warn(`  [warn] ${key}: stats_prefecture に 0 件 (data 未投入の可能性)`);
      warnCount++;
    }
    if (ranking.items.length > 0 && ranking.items.length !== 47) {
      console.warn(
        `  [warn] ${key}: ranking items=${ranking.items.length} (47 未満、欠損あり)`,
      );
    }

    const rankingPath = path.join(dataDir, `${key}-prefecture-rankings.json`);
    const tsPath = path.join(dataDir, `${key}-timeseries.json`);

    if (DRY_RUN) {
      console.log(
        `  [dry] would write ${path.relative(PROJECT_ROOT, rankingPath)} (year=${ranking.year}, items=${ranking.items.length})`,
      );
      console.log(
        `  [dry] would write ${path.relative(PROJECT_ROOT, tsPath)} (years=${timeseries.years.length}, series=${timeseries.series.length})`,
      );
    } else {
      writeFileSync(rankingPath, JSON.stringify(ranking, null, 2));
      writeFileSync(tsPath, JSON.stringify(timeseries, null, 2));
      console.log(
        `  [ok] wrote ${path.basename(rankingPath)} (year=${ranking.year}, items=${ranking.items.length})`,
      );
      console.log(
        `  [ok] wrote ${path.basename(tsPath)} (years=${timeseries.years.length}, series=${timeseries.series.length})`,
      );
      writtenCount += 2;
    }
  }

  db.close();

  console.log(
    `[done] slug=${SLUG} keys=${rankingKeys.length} ${DRY_RUN ? "dry-run" : `written=${writtenCount} files`} warn=${warnCount}`,
  );
}

main();
