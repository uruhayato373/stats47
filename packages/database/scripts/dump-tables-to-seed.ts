/**
 * dump-tables-to-seed: ローカルビルド DB (SQLite) の指定テーブルを seed JSON にダンプする。
 *
 * 2 つの役割を兼ねる（却下済みのリモート D1 ハイブリッド検討時の歴史的スクリプト）:
 *   1. Phase 0「凍結バックアップ」: 救出不能な Authored データを git/R2 に確保
 *   2. リモート D1 ハイブリッドの seed 元: Mac でダンプ → クラウドで D1 に投入
 *
 * ⚠️ このスクリプトは実データを持つ環境 (Mac の packages/database/.data/stats47.sqlite) で実行する。
 *    クラウド/新規 clone では DB が無いため動かない (articles は extract-articles-seed-from-r2.ts を使う)。
 *
 * 使い方:
 *   # Authored 系 (D1-only、R2 に無い = 救出が必要な最小セット) をダンプ
 *   npx tsx packages/database/scripts/dump-tables-to-seed.ts
 *
 *   # 全テーブルをダンプ (Phase 0 完全凍結バックアップ)
 *   npx tsx packages/database/scripts/dump-tables-to-seed.ts --all
 *
 *   # テーブル指定
 *   npx tsx packages/database/scripts/dump-tables-to-seed.ts --tables sns_posts,page_components
 *
 * 出力: packages/database/seed/<table>.json
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const SEED_DIR = path.resolve(__dirname, "..", "seed");

/**
 * Authored = 真実源が DB 内だけにあり、R2/git にバックアップが無いテーブル。
 * これらが「持ち回り SQLite が必須」の原因。D1 ハイブリッドではこの集合を D1 に置く。
 * (articles は article.md から再構成可能なので含めない → extract-articles-seed-from-r2.ts)
 */
const AUTHORED_TABLES = [
  "sns_posts",
  "page_components",
  "affiliate_ads",
  "theme_metrics",
  "categories",
  "themes",
];

/** 全テーブル (Phase 0 完全凍結用) */
const ALL_TABLES = [
  "sources",
  "metrics",
  "area_profiles",
  "prefectures",
  "cities",
  "categories",
  "ports",
  "fishing_ports",
  "articles",
  "page_components",
  "themes",
  "theme_metrics",
  "estat_metainfo",
  "estat_catalog",
  "affiliate_ads",
  "sns_posts",
  "gis_datasets",
];

function findSqliteFile(): string | null {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const dir = path.resolve(__dirname, "..", ".data");
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sqlite"))
    .map((f) => ({ file: f, size: fs.statSync(path.join(dir, f)).size }))
    .sort((a, b) => b.size - a.size);
  return files.length ? path.join(dir, files[0].file) : null;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const all = argv.includes("--all");
  const tIdx = argv.indexOf("--tables");
  const explicit =
    tIdx >= 0 && argv[tIdx + 1]
      ? argv[tIdx + 1].split(",").map((s) => s.trim()).filter(Boolean)
      : null;
  return { all, explicit };
}

function tableExists(db: Database.Database, name: string): boolean {
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    )
    .get(name);
  return !!row;
}

function main() {
  const dbPath = findSqliteFile();
  if (!dbPath) {
    console.error(
      "❌ ローカルビルド DB (SQLite) が見つかりません。\n" +
        "   このスクリプトは実データを持つ環境 (Mac) で実行してください。",
    );
    process.exit(1);
  }
  console.log(`DB: ${dbPath}`);

  const { all, explicit } = parseArgs();
  const tables = explicit ?? (all ? ALL_TABLES : AUTHORED_TABLES);
  console.log(`対象テーブル (${tables.length}): ${tables.join(", ")}\n`);

  const db = new Database(dbPath, { readonly: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });

  let total = 0;
  for (const table of tables) {
    if (!tableExists(db, table)) {
      console.warn(`  ⚠️  ${table}: テーブルが存在しません (skip)`);
      continue;
    }
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    const out = path.join(SEED_DIR, `${table}.json`);
    fs.writeFileSync(out, JSON.stringify(rows, null, 2) + "\n");
    console.log(`  ✅ ${table}: ${rows.length} 行 → seed/${table}.json`);
    total += rows.length;
  }
  db.close();
  console.log(`\n完了: ${tables.length} テーブル / ${total} 行をダンプしました。`);
}

main();
