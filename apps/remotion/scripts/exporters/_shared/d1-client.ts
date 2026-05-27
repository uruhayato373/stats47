import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");

export const D1_PATH = resolve(
  REPO_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

export const REMOTION_PUBLIC = resolve(REPO_ROOT, "apps/remotion/public");

export function openD1(): Database.Database {
  if (!existsSync(D1_PATH)) {
    throw new Error(
      `Local D1 not found at ${D1_PATH}. Run /pull-d1 or initialize the local DB first.`,
    );
  }
  const db = new Database(D1_PATH, { readonly: true });
  db.pragma("foreign_keys = ON");
  return db;
}

export function tableExists(db: Database.Database, name: string): boolean {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(name);
  return Boolean(row);
}

export function metricExists(db: Database.Database, key: string): boolean {
  const row = db.prepare(`SELECT 1 FROM metrics WHERE key = ?`).get(key);
  return Boolean(row);
}
