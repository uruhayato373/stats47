/**
 * D1 stats_prefecture / stats_city / stats_port / stats_migration_flow を
 * R2 namespace (app/stats/<metric>/...) へ JSON 化して書き出す。
 *
 * Phase 6.3 の一括移行スクリプト。
 *
 * 使い方:
 *   tsx packages/stats-r2/src/scripts/export-stats-to-r2.ts                # 全 metric
 *   tsx packages/stats-r2/src/scripts/export-stats-to-r2.ts --metric <key> # 単一
 *   tsx packages/stats-r2/src/scripts/export-stats-to-r2.ts --kind city    # entity 限定
 *   tsx packages/stats-r2/src/scripts/export-stats-to-r2.ts --dry-run      # 計画のみ
 *
 * 完了後: diff-push-r2.ts --prefix app/stats で R2 push。
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { D1_PATH, R2_LOCAL_DIR } from "./_lib.js";
import type { EntityKind } from "@stats47/data-configs";
import { statsR2Key } from "../types.js";
import type {
  MigrationFlowPayload,
  MigrationFlowRow,
  SingleEntityRow,
  StatsValuesPayload,
} from "../types.js";

interface Args {
  metric?: string;
  kind?: EntityKind | "all";
  dryRun: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { dryRun: false, kind: "all" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--metric") out.metric = argv[++i];
    else if (a === "--kind") out.kind = argv[++i] as Args["kind"];
    else if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function exportSingleEntity(
  db: Database.Database,
  table: "stats_prefecture" | "stats_city" | "stats_port",
  metricKey: string,
  entityKind: Exclude<EntityKind, "migration-flow">,
  dryRun: boolean,
): { wrote: boolean; rowCount: number; outPath: string } {
  const cols = (() => {
    if (table === "stats_prefecture") {
      return `metric_key, area_code, area_name, year_code, year_name, value, unit, rank, NULL AS prefecture_code, NULL AS rank_pref`;
    }
    if (table === "stats_city") {
      return `metric_key, area_code, area_name, year_code, year_name, value, unit, rank, prefecture_code, rank_pref`;
    }
    return `metric_key, area_code, area_name, year_code, year_name, value, unit, rank, prefecture_code, NULL AS rank_pref`;
  })();

  const rows = db
    .prepare(
      `SELECT ${cols} FROM ${table} WHERE metric_key = ? ORDER BY year_code, area_code`,
    )
    .all(metricKey) as Array<{
    metric_key: string;
    area_code: string;
    area_name: string;
    year_code: string;
    year_name: string;
    value: number | null;
    unit: string | null;
    rank: number | null;
    prefecture_code: string | null;
    rank_pref: number | null;
  }>;

  const outPath = resolve(R2_LOCAL_DIR, statsR2Key(metricKey, entityKind));

  if (rows.length === 0) {
    return { wrote: false, rowCount: 0, outPath };
  }

  const formatted: SingleEntityRow[] = rows.map((r) => ({
    areaCode: r.area_code,
    areaName: r.area_name,
    yearCode: r.year_code,
    yearName: r.year_name,
    value: r.value,
    unit: r.unit ?? undefined,
    rank: r.rank,
    prefectureCode: r.prefecture_code ?? undefined,
    rankPref: r.rank_pref ?? undefined,
  }));

  const years = Array.from(new Set(formatted.map((r) => r.yearCode))).sort();
  const areas = new Set(formatted.map((r) => r.areaCode));

  const payload: StatsValuesPayload = {
    metricKey,
    entityKind,
    rows: formatted,
    meta: {
      rowCount: formatted.length,
      yearRange: years.length > 0 ? [years[0], years[years.length - 1]] : null,
      areaCount: areas.size,
      generatedAt: new Date().toISOString(),
    },
  };

  if (!dryRun) {
    ensureDir(outPath);
    writeFileSync(outPath, JSON.stringify(payload));
  }
  return { wrote: !dryRun, rowCount: formatted.length, outPath };
}

function exportMigrationFlow(
  db: Database.Database,
  metricKey: string,
  dryRun: boolean,
): { wrote: boolean; yearsCount: number; totalRows: number; outPaths: string[] } {
  const yearsRows = db
    .prepare(
      `SELECT DISTINCT year_code FROM stats_migration_flow WHERE metric_key = ? ORDER BY year_code`,
    )
    .all(metricKey) as Array<{ year_code: string }>;
  if (yearsRows.length === 0) return { wrote: false, yearsCount: 0, totalRows: 0, outPaths: [] };

  const outPaths: string[] = [];
  let totalRows = 0;
  for (const { year_code } of yearsRows) {
    const yearNum = Number(year_code);
    if (!Number.isFinite(yearNum)) continue;
    const rows = db
      .prepare(
        `SELECT from_pref_code, to_pref_code, inflow, outflow, net
         FROM stats_migration_flow
         WHERE metric_key = ? AND year_code = ?
         ORDER BY from_pref_code, to_pref_code`,
      )
      .all(metricKey, year_code) as Array<{
      from_pref_code: string;
      to_pref_code: string;
      inflow: number | null;
      outflow: number | null;
      net: number | null;
    }>;

    const formatted: MigrationFlowRow[] = rows.map((r) => ({
      fromPrefCode: r.from_pref_code,
      toPrefCode: r.to_pref_code,
      inflow: r.inflow ?? 0,
      outflow: r.outflow ?? 0,
      net: r.net ?? 0,
    }));

    const payload: MigrationFlowPayload = {
      metricKey,
      entityKind: "migration-flow",
      year: yearNum,
      rows: formatted,
      meta: {
        rowCount: formatted.length,
        generatedAt: new Date().toISOString(),
      },
    };

    const outPath = resolve(
      R2_LOCAL_DIR,
      statsR2Key(metricKey, "migration-flow", yearNum),
    );
    outPaths.push(outPath);
    totalRows += formatted.length;
    if (!dryRun) {
      ensureDir(outPath);
      writeFileSync(outPath, JSON.stringify(payload));
    }
  }
  return {
    wrote: !dryRun,
    yearsCount: yearsRows.length,
    totalRows,
    outPaths,
  };
}

function main() {
  const args = parseArgs();
  if (!existsSync(D1_PATH)) {
    throw new Error(`D1 not found: ${D1_PATH}`);
  }

  const db = new Database(D1_PATH, { readonly: true });

  // Find distinct metric_keys per table
  const collectKeys = (table: string): Set<string> => {
    const rows = db
      .prepare(`SELECT DISTINCT metric_key FROM ${table}`)
      .all() as Array<{ metric_key: string }>;
    return new Set(rows.map((r) => r.metric_key));
  };

  let prefKeys = collectKeys("stats_prefecture");
  let cityKeys = collectKeys("stats_city");
  let portKeys = collectKeys("stats_port");
  let migrationKeys: Set<string> = new Set();
  try {
    migrationKeys = collectKeys("stats_migration_flow");
  } catch {
    // table may not exist
  }

  if (args.metric) {
    const f = (s: Set<string>): Set<string> =>
      s.has(args.metric!) ? new Set([args.metric!]) : new Set();
    prefKeys = f(prefKeys);
    cityKeys = f(cityKeys);
    portKeys = f(portKeys);
    migrationKeys = f(migrationKeys);
  }

  if (args.kind && args.kind !== "all") {
    if (args.kind !== "prefecture") prefKeys = new Set();
    if (args.kind !== "city") cityKeys = new Set();
    if (args.kind !== "port") portKeys = new Set();
    if (args.kind !== "migration-flow") migrationKeys = new Set();
  }

  console.log(
    `[plan] prefecture: ${prefKeys.size}, city: ${cityKeys.size}, port: ${portKeys.size}, migration-flow: ${migrationKeys.size}`,
  );
  if (args.dryRun) {
    console.log("[dry-run] no files written");
    db.close();
    return;
  }

  let wrote = 0;
  let failed = 0;
  const writeOne = <T>(fn: () => T, label: string): void => {
    try {
      fn();
      wrote++;
      if (wrote % 100 === 0) console.log(`  progress: ${wrote}`);
    } catch (e) {
      failed++;
      console.error(`[fail] ${label}: ${(e as Error).message}`);
    }
  };

  for (const k of prefKeys)
    writeOne(
      () => exportSingleEntity(db, "stats_prefecture", k, "prefecture", false),
      `prefecture:${k}`,
    );
  for (const k of cityKeys)
    writeOne(
      () => exportSingleEntity(db, "stats_city", k, "city", false),
      `city:${k}`,
    );
  for (const k of portKeys)
    writeOne(
      () => exportSingleEntity(db, "stats_port", k, "port", false),
      `port:${k}`,
    );
  for (const k of migrationKeys)
    writeOne(() => exportMigrationFlow(db, k, false), `migration:${k}`);

  db.close();
  console.log(`\n[done] wrote: ${wrote}, failed: ${failed}`);
  console.log(
    `Next: npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats`,
  );
}

main();
