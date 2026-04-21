/**
 * known-tag-keys.ts の生成スクリプト
 *
 * ローカル D1 から `SELECT tag_key FROM tags` を実行し、
 * apps/web/src/config/known-tag-keys.ts に静的 Set として書き出す。
 *
 * middleware.ts の Fix 9 が参照する（/tag/{未知key} → 410 Gone）。
 * CI ビルド環境は D1 binding が無いため、ファイルとして git commit する設計。
 *
 * page.tsx は触らない（SSG は従来どおり try/catch + 空配列で CI ビルドを通す）。
 *
 * 使い方: `cd apps/web && npx tsx scripts/generate-known-tag-keys.ts`
 * 更新タイミング: tags テーブルに新規 tag を追加した後、または記事に新 tag を付けた後。
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const D1_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const OUT_PATH = path.resolve(__dirname, "../src/config/known-tag-keys.ts");

if (!fs.existsSync(D1_PATH)) {
  console.error(`[generate-known-tag-keys] D1 not found at ${D1_PATH}`);
  console.error("ローカル D1 を作成するには `/pull-remote-d1` を実行してください。");
  process.exit(1);
}

const db = new Database(D1_PATH, { readonly: true });
const rows = db
  .prepare("SELECT tag_key FROM tags ORDER BY tag_key")
  .all() as { tag_key: string }[];
db.close();

const keys = rows.map((r) => r.tag_key);

const today = new Date().toISOString().slice(0, 10);

const header = `/**
 * 有効な tag キー一覧（tags テーブル全件）
 *
 * **このファイルは自動生成されます。手動編集しないこと。**
 *
 * middleware.ts の Fix 9 が参照する。CI ビルド環境では D1 binding が使えないため、
 * 静的ファイルとして git commit する。page.tsx は触らない（SSG は従来どおり）。
 *
 * 更新方法: \`cd apps/web && npx tsx scripts/generate-known-tag-keys.ts\`
 * 更新タイミング: tags テーブルに新規 tag を追加した後。必ず git commit してからデプロイ。
 *
 * 最終生成日: ${today}
 * 件数: ${keys.length}
 */
export const KNOWN_TAG_KEYS: ReadonlySet<string> = new Set([
`;

const body = keys.map((k) => `  ${JSON.stringify(k)},`).join("\n");
const footer = `\n]);\n`;

fs.writeFileSync(OUT_PATH, header + body + footer, "utf-8");

console.log(`[generate-known-tag-keys] wrote ${keys.length} keys to ${OUT_PATH}`);
