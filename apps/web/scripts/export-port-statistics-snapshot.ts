/**
 * ports + port_statistics を R2 snapshot 化する (Phase 6)。
 *
 * Outputs:
 *   - snapshots/ports/all.json (全 port メタ)
 *   - snapshots/port-statistics/years.json (年一覧)
 *   - snapshots/port-statistics/by-year/<year>.json (各年の統計)
 *   - snapshots/port-statistics/by-port/<portCode>.json (各港の時系列)
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-port-statistics-snapshot.ts
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import BetterSqlite3 from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  PORTS_SNAPSHOT_KEY,
  PORT_STATS_YEARS_KEY,
  portStatsByPortKey,
  portStatsByYearKey,
  type PortMetaRow,
  type PortStatRow,
  type PortStatsByPortSnapshot,
  type PortStatsByYearSnapshot,
  type PortStatsYearsSnapshot,
  type PortsSnapshot,
} from "../src/features/port-statistics/lib/snapshot-types";

dotenv.config({ path: ".env.local" });

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (fs.existsSync(standardPath)) return standardPath;
  throw new Error(`ローカル D1 SQLite が見つかりません: ${standardPath}`);
}

const PARALLELISM = 1;

async function writeWithRetry(
  fn: () => Promise<unknown>,
  retries = 5,
  baseDelayMs = 500,
): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.includes("rate");
      if (!isRateLimit) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

async function writeInBatches<T>(
  items: T[],
  fn: (item: T) => Promise<unknown>,
  parallelism = PARALLELISM,
): Promise<void> {
  for (let i = 0; i < items.length; i += parallelism) {
    const batch = items.slice(i, i + parallelism);
    await Promise.all(batch.map((item) => writeWithRetry(() => fn(item))));
    // R2 REST API rate limit 配慮: 並列 export と競合する場合は重要
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath, { readonly: true });
  const db = drizzle(sqlite, { schema });

  const generatedAt = new Date().toISOString();

  // 1. ports/all.json
  const portRows = await db.select().from(schema.ports);
  const portsMeta: PortMetaRow[] = portRows.map((p) => ({
    portCode: p.portCode,
    portName: p.portName,
    prefectureCode: p.prefectureCode,
    prefectureName: p.prefectureName,
    latitude: p.latitude,
    longitude: p.longitude,
    portGrade: p.portGrade ?? null,
    administrator: p.administrator ?? null,
  }));
  const portsSnapshot: PortsSnapshot = { generatedAt, ports: portsMeta };
  await saveToR2(PORTS_SNAPSHOT_KEY, JSON.stringify(portsSnapshot), {
    contentType: "application/json; charset=utf-8",
  });
  console.log(`✅ ports: ${portsMeta.length} 件`);

  // 2. port_statistics 全件読み込み + group by year / portCode
  const allStats = await db.select().from(schema.portStatistics);

  const byYear = new Map<string, PortStatRow[]>();
  const byPort = new Map<string, Array<{ year: string; metricKey: string; value: number; unit: string }>>();
  const yearSet = new Set<string>();

  for (const s of allStats) {
    yearSet.add(s.year);
    const yearArr = byYear.get(s.year) ?? [];
    yearArr.push({
      portCode: s.portCode,
      metricKey: s.metricKey,
      value: s.value,
      unit: s.unit,
    });
    byYear.set(s.year, yearArr);

    const portArr = byPort.get(s.portCode) ?? [];
    portArr.push({
      year: s.year,
      metricKey: s.metricKey,
      value: s.value,
      unit: s.unit,
    });
    byPort.set(s.portCode, portArr);
  }

  const years = [...yearSet].sort((a, b) => (a < b ? 1 : -1)); // 降順
  const yearsSnapshot: PortStatsYearsSnapshot = { generatedAt, years };
  await saveToR2(PORT_STATS_YEARS_KEY, JSON.stringify(yearsSnapshot), {
    contentType: "application/json; charset=utf-8",
  });
  console.log(`✅ years.json: ${years.length} 件`);

  // 3. by-year
  const yearEntries = [...byYear.entries()];
  await writeInBatches(yearEntries, async ([year, rows]) => {
    const snapshot: PortStatsByYearSnapshot = { generatedAt, year, rows };
    await saveToR2(portStatsByYearKey(year), JSON.stringify(snapshot), {
      contentType: "application/json; charset=utf-8",
    });
  });
  console.log(`✅ by-year: ${yearEntries.length} files`);

  // 4. by-port
  const portEntries = [...byPort.entries()];
  await writeInBatches(portEntries, async ([portCode, rows]) => {
    const snapshot: PortStatsByPortSnapshot = { generatedAt, portCode, rows };
    await saveToR2(portStatsByPortKey(portCode), JSON.stringify(snapshot), {
      contentType: "application/json; charset=utf-8",
    });
  });
  console.log(`✅ by-port: ${portEntries.length} files`);

  console.log(
    `📊 合計: ports=${portsMeta.length} stats=${allStats.length} year-files=${yearEntries.length} port-files=${portEntries.length}`,
  );
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
