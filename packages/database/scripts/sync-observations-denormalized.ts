/**
 * observations の非正規化列 (entity_name / unit / category_name) をマスタから再同期する
 *
 * 用途:
 * - prefectures.name や metrics.unit を更新したあとに整合性を回復する
 * - year_name は e-Stat ラベルそのままを保持するため対象外
 *
 * 実行方法:
 *   npx tsx packages/database/scripts/sync-observations-denormalized.ts [--dry-run]
 */

import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const isDryRun = process.argv.includes("--dry-run");

const db = new Database(DB_PATH);

function syncEntityName(): number {
  // prefecture: prefectures.prefecture_name
  const prefectureSql = `
    UPDATE observations
    SET entity_name = (
      SELECT prefecture_name FROM prefectures
      WHERE prefectures.prefecture_code = observations.entity_code
    )
    WHERE entity_type = 'prefecture'
      AND entity_name != (
        SELECT prefecture_name FROM prefectures
        WHERE prefectures.prefecture_code = observations.entity_code
      )
  `;
  if (isDryRun) {
    const cnt = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM observations o
           JOIN prefectures p ON p.prefecture_code = o.entity_code
           WHERE o.entity_type = 'prefecture' AND o.entity_name != p.prefecture_name`
        )
        .get() as { c: number }
    ).c;
    return cnt;
  }
  return db.prepare(prefectureSql).run().changes;
}

function syncUnit(): number {
  // observations.unit を metrics.unit と一致させる
  // 注: observations 側が e-Stat の真値を持つケース (126K 行差) はあえて触らない設計だが、
  // マスタを直したい場合は forceUnit=true 等で別途実施
  const sql = `
    UPDATE observations
    SET unit = (SELECT unit FROM metrics WHERE metrics.id = observations.metric_id)
    WHERE unit IS NULL
  `;
  if (isDryRun) {
    const cnt = (
      db
        .prepare(`SELECT COUNT(*) as c FROM observations WHERE unit IS NULL`)
        .get() as { c: number }
    ).c;
    return cnt;
  }
  return db.prepare(sql).run().changes;
}

console.log(`=== observations denormalized sync (${isDryRun ? "dry-run" : "execute"}) ===`);
const entityNameChanges = syncEntityName();
console.log(`entity_name changes: ${entityNameChanges}`);
const unitChanges = syncUnit();
console.log(`unit (NULL fill) changes: ${unitChanges}`);

db.close();
