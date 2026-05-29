import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");

// ローカルビルド DB (SQLite): packages/database/.data/stats47.sqlite
export const D1_PATH = resolve(REPO_ROOT, "packages/database/.data/stats47.sqlite");

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
