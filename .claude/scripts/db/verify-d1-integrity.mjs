#!/usr/bin/env node
// ローカル D1 整合性検証 (high-volume tables 向けに sampling + EXISTS パターン)
// usage:
//   node .claude/scripts/db/verify-d1-integrity.mjs
//   node .claude/scripts/db/verify-d1-integrity.mjs --metric japanese-population
//   node .claude/scripts/db/verify-d1-integrity.mjs --strict
//   node .claude/scripts/db/verify-d1-integrity.mjs --full-fk    (LEFT JOIN で全件 scan)
//
// exit code: 0 (clean), 1 (warnings only), 2 (errors)

import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const D1_PATH = path.join(
  REPO_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const FULL_FK = args.includes("--full-fk");
const METRIC_FILTER = (() => {
  const i = args.indexOf("--metric");
  return i >= 0 ? args[i + 1] : null;
})();

if (!existsSync(D1_PATH)) {
  console.error(`D1 not found: ${D1_PATH}`);
  process.exit(2);
}

const db = new Database(D1_PATH, { readonly: true });

let errors = 0;
let warnings = 0;

const ok = (m) => console.log(`  ✓ ${m}`);
const warn = (m) => {
  warnings++;
  console.log(`  ⚠ ${m}`);
};
const err = (m) => {
  errors++;
  console.log(`  ✗ ${m}`);
};

const tableExists = (name) =>
  Boolean(
    db.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`).get(name),
  );

// --- counts ---
console.log("=== D1 Integrity Report ===\n");
const totalMetrics = db.prepare(`SELECT COUNT(*) AS c FROM metrics`).get().c;
const totalPref = db.prepare(`SELECT COUNT(*) AS c FROM stats_prefecture`).get().c;
const totalCity = db.prepare(`SELECT COUNT(*) AS c FROM stats_city`).get().c;
const totalPort = db.prepare(`SELECT COUNT(*) AS c FROM stats_port`).get().c;
console.log(`metrics:           ${totalMetrics.toLocaleString()}`);
console.log(`stats_prefecture:  ${totalPref.toLocaleString()}`);
console.log(`stats_city:        ${totalCity.toLocaleString()}`);
console.log(`stats_port:        ${totalPort.toLocaleString()}`);

// --- FK integrity (distinct metric_key 経由で軽量に検証) ---
console.log("\n[FK integrity (via distinct metric_key)]");
const checkFk = (table) => {
  const distinct = db
    .prepare(
      `SELECT DISTINCT metric_key FROM ${table}
       WHERE metric_key NOT IN (SELECT key FROM metrics)
       LIMIT 10`,
    )
    .all();
  if (distinct.length === 0) ok(`${table} → metrics: all distinct metric_keys exist in metrics`);
  else err(`${table} → metrics: ${distinct.length}+ orphan metric_keys (e.g. ${distinct[0].metric_key})`);
};
checkFk("stats_prefecture");
checkFk("stats_city");
checkFk("stats_port");

if (tableExists("stats_migration_flow")) {
  checkFk("stats_migration_flow");
} else {
  warn("stats_migration_flow table not present (Phase 3 で追加予定)");
}

// metrics → sources
const orphanSrc = db
  .prepare(
    `SELECT COUNT(*) AS c FROM metrics
     WHERE source_id IS NOT NULL
       AND source_id NOT IN (SELECT id FROM sources)`,
  )
  .get().c;
if (orphanSrc === 0) ok("metrics → sources: all references resolve");
else err(`metrics → sources: ${orphanSrc} metrics reference missing source_id`);

// --- master ---
console.log("\n[master data]");
const prefCount = db.prepare(`SELECT COUNT(*) AS c FROM prefectures`).get().c;
if (prefCount >= 47 && prefCount <= 49) ok(`prefectures: ${prefCount} rows`);
else warn(`prefectures has ${prefCount} rows (expected 47-49)`);

const cityCount = db.prepare(`SELECT COUNT(*) AS c FROM cities`).get().c;
ok(`cities: ${cityCount} rows`);

// --- coverage (limited scope, indexed query) ---
console.log("\n[coverage] (top 10 metrics or filtered)");
const metricsToCheck = METRIC_FILTER
  ? db.prepare(`SELECT key FROM metrics WHERE key = ?`).all(METRIC_FILTER)
  : db
      .prepare(
        `SELECT m.key FROM metrics m
         WHERE EXISTS (SELECT 1 FROM stats_prefecture sp WHERE sp.metric_key = m.key)
         ORDER BY m.key
         LIMIT 10`,
      )
      .all();

let lowCoverage = 0;
const covStmt = db.prepare(
  `SELECT COUNT(DISTINCT area_code) AS prefs,
          MIN(CAST(year_code AS INTEGER)) AS minY,
          MAX(CAST(year_code AS INTEGER)) AS maxY,
          COUNT(DISTINCT year_code) AS years
   FROM stats_prefecture WHERE metric_key = ?`,
);
for (const { key } of metricsToCheck) {
  const cov = covStmt.get(key);
  if (!cov || cov.prefs === 0) {
    warn(`${key}: no stats_prefecture rows`);
    continue;
  }
  const line = `${key}: ${cov.prefs} prefs × ${cov.years} years (${cov.minY}-${cov.maxY})`;
  if (cov.prefs < 47) {
    lowCoverage++;
    warn(line);
  } else if (METRIC_FILTER) {
    ok(line);
  }
}
if (!METRIC_FILTER && lowCoverage === 0)
  ok(`top 10 pref metrics all have full 47-pref coverage`);
else if (!METRIC_FILTER)
  warn(`${lowCoverage} of top 10 metrics have < 47 pref coverage`);

// --- migration_flow net consistency (if exists) ---
if (tableExists("stats_migration_flow")) {
  const total = db.prepare(`SELECT COUNT(*) AS c FROM stats_migration_flow`).get().c;
  console.log("\n[stats_migration_flow]");
  console.log(`  rows: ${total.toLocaleString()}`);
  if (total > 0) {
    const inconsistent = db
      .prepare(
        `SELECT COUNT(*) AS c FROM stats_migration_flow
         WHERE inflow IS NOT NULL AND outflow IS NOT NULL AND net IS NOT NULL
           AND (inflow - outflow) != net`,
      )
      .get().c;
    if (inconsistent === 0) ok("net = inflow - outflow (consistent)");
    else err(`${inconsistent} rows where net != inflow - outflow`);
  }
}

// --- estat_metainfo summary ---
if (tableExists("estat_metainfo")) {
  console.log("\n[estat_metainfo]");
  const status = db
    .prepare(`SELECT status, COUNT(*) AS c FROM estat_metainfo GROUP BY status`)
    .all();
  for (const row of status) {
    console.log(`  ${row.status}: ${row.c.toLocaleString()}`);
  }
}

// --- optional full FK scan ---
if (FULL_FK) {
  console.log("\n[--full-fk: LEFT JOIN scan on millions of rows]");
  for (const t of ["stats_prefecture", "stats_city", "stats_port"]) {
    const orphan = db
      .prepare(
        `SELECT COUNT(*) AS c FROM ${t} s
         LEFT JOIN metrics m ON m.key = s.metric_key
         WHERE m.key IS NULL`,
      )
      .get().c;
    if (orphan === 0) ok(`${t}: no orphan rows (full scan)`);
    else err(`${t}: ${orphan} orphan rows`);
  }
}

db.close();

console.log(`\n=== Result: ${errors} error(s), ${warnings} warning(s) ===`);

const exitCode = errors > 0 ? 2 : warnings > 0 && STRICT ? 1 : 0;
process.exit(exitCode);
