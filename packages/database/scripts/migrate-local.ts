#!/usr/bin/env tsx
/**
 * migrate-local: ローカルビルド DB (SQLite) に drizzle migration を適用する。
 *
 * miniflare / wrangler に依存せず、drizzle-orm の better-sqlite3 migrator で
 * packages/database/drizzle/*.sql を直接適用する。新規 clone / CI コンテナで
 * 空の schema を作るために使う (実データは `db:pull` で R2 から取得)。
 *
 * Usage:
 *   npm run db:migrate:local --workspace=packages/database
 *   LOCAL_DB_PATH=/abs/path.sqlite npm run db:migrate:local --workspace=packages/database
 */

import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";

const dbPath = process.env.LOCAL_DB_PATH ?? LOCAL_DB_PATHS.STATIC.getPath();
const migrationsFolder = path.resolve(__dirname, "../drizzle");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

console.log(`📦 migrating local build DB (SQLite): ${dbPath}`);
migrate(db, { migrationsFolder });
console.log(`✅ migrations applied (folder: ${migrationsFolder})`);

sqlite.close();
