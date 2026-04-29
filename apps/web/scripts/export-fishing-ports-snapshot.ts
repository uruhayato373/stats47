/**
 * fishing_ports を R2 snapshot 化する (Phase 6)。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-fishing-ports-snapshot.ts
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import BetterSqlite3 from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  FISHING_PORTS_SNAPSHOT_KEY,
  type FishingPortData,
  type FishingPortsSnapshot,
} from "../src/features/fishing-ports/lib/load-fishing-port-data";

dotenv.config({ path: ".env.local" });

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (fs.existsSync(standardPath)) return standardPath;
  throw new Error(`ローカル D1 SQLite が見つかりません: ${standardPath}`);
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath, { readonly: true });
  const db = drizzle(sqlite, { schema });

  const rows = await db.select().from(schema.fishingPorts);

  const ports: FishingPortData[] = rows.map((p) => ({
    portCode: p.portCode,
    portName: p.portName,
    prefectureCode: p.prefectureCode,
    prefectureName: p.prefectureName,
    portType: p.portType,
    portTypeName: p.portTypeName,
    administratorName: p.administratorName,
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  const snapshot: FishingPortsSnapshot = {
    generatedAt: new Date().toISOString(),
    ports,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(FISHING_PORTS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  console.log(`✅ fishing-ports: ports=${ports.length} bytes=${result.size}`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
