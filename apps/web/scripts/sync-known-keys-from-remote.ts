/**
 * known-{ranking,tag}-keys.ts を remote D1 から直接生成する CI 用スクリプト。
 *
 * 既存の generate-known-*-keys.ts はローカル D1 (better-sqlite3) を読むため、
 * CI 環境では `.local/d1/...` ディレクトリが存在せず動かない。本スクリプトは
 * `wrangler d1 execute --remote --json` で直接 remote D1 を叩くため、CI でも動作する。
 *
 * 使い方:
 *   cd apps/web && npx tsx scripts/sync-known-keys-from-remote.ts
 *
 * 環境変数:
 *   CLOUDFLARE_API_TOKEN  — D1 Read 権限の token
 *   CLOUDFLARE_ACCOUNT_ID — stats47 アカウント
 *
 * 出力:
 *   apps/web/src/config/known-ranking-keys.ts
 *   apps/web/src/config/known-tag-keys.ts
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RANKING_QUERY =
  "SELECT DISTINCT ranking_key FROM ranking_items WHERE is_active = 1 AND area_type = 'prefecture' ORDER BY ranking_key";
const TAG_QUERY = "SELECT tag_key FROM tags ORDER BY tag_key";

const RANKING_OUT = path.resolve(
  __dirname,
  "../src/config/known-ranking-keys.ts",
);
const TAG_OUT = path.resolve(__dirname, "../src/config/known-tag-keys.ts");

function queryRemote<T>(sql: string): T[] {
  const out = execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "stats47_static",
      "--remote",
      "--env",
      "production",
      "--json",
      "--command",
      sql,
    ],
    { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
  );

  // wrangler --json 出力形式: [{ results: [...], success: true, ... }]
  const parsed = JSON.parse(out);
  const result = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!result?.results) {
    throw new Error(`Unexpected wrangler output: ${out.slice(0, 500)}`);
  }
  return result.results as T[];
}

function writeKnownKeys(
  outPath: string,
  exportName: string,
  description: string,
  keys: string[],
): void {
  const today = new Date().toISOString().slice(0, 10);
  const header = `/**
 * ${description}
 *
 * **このファイルは自動生成されます。手動編集しないこと。**
 *
 * 更新方法:
 *   - 手動: \`cd apps/web && npx tsx scripts/sync-known-keys-from-remote.ts\`
 *   - 自動: GitHub Actions \`.github/workflows/sync-known-keys.yml\` (毎日 JST 07:00)
 *
 * 最終生成日: ${today}
 * 件数: ${keys.length}
 */
export const ${exportName}: ReadonlySet<string> = new Set([
`;
  const body = keys.map((k) => `  ${JSON.stringify(k)},`).join("\n");
  const footer = `\n]);\n`;
  fs.writeFileSync(outPath, header + body + footer, "utf-8");
  console.log(`[sync-known-keys] wrote ${keys.length} keys to ${outPath}`);
}

function main(): void {
  console.log("[sync-known-keys] querying remote D1 (ranking)...");
  const rankingRows = queryRemote<{ ranking_key: string }>(RANKING_QUERY);
  writeKnownKeys(
    RANKING_OUT,
    "KNOWN_RANKING_KEYS",
    "有効な ranking キー一覧（prefecture, is_active = 1）",
    rankingRows.map((r) => r.ranking_key),
  );

  console.log("[sync-known-keys] querying remote D1 (tag)...");
  const tagRows = queryRemote<{ tag_key: string }>(TAG_QUERY);
  writeKnownKeys(
    TAG_OUT,
    "KNOWN_TAG_KEYS",
    "有効な tag キー一覧（tags テーブル全件）",
    tagRows.map((r) => r.tag_key),
  );
}

main();
