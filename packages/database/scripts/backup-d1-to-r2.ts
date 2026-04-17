/**
 * D1 バックアップスクリプト（災害復旧用・単発利用）
 *
 * リモート D1 データベースを SQL ダンプとしてエクスポートし、R2 にアップロードする。
 *
 * ⚠️ 現状の制約:
 *   - `r2-utils.ts` の `uploadToR2` は単一 PutObject で R2 の 2 GiB 上限に当たる
 *   - 本番 static DB はすでに ~6 GB に達しており、本スクリプトはそのまま動かない
 *   - 動かすには `@aws-sdk/lib-storage` の Upload を使った multipart 化が必要
 *
 * ルーチンのロールバックは Cloudflare D1 Time Travel（30 日 PITR）で賄っているため、
 * 本スクリプトは CF アカウント障害等の災害復旧で一時退避が必要になった場合の叩き台。
 * 利用時は multipart upload への改修と、`correlation_analysis` 等の Tier B テーブル除外
 * を検討すること。
 *
 * Usage:
 *   npx tsx scripts/backup-d1-to-r2.ts --env production
 *   npx tsx scripts/backup-d1-to-r2.ts --env production --db static
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { uploadToR2 } from "./r2-utils";

const WEB_APP_DIR = path.resolve(__dirname, "../../../apps/web");

interface DbConfig {
  label: string;
  /** wrangler.toml の database_name */
  name: string;
}

const DB_CONFIGS: Record<string, Record<string, DbConfig>> = {
  production: {
    static: { label: "Static (production)", name: "stats47_static" },
  },
};

function parseArgs(): { env: string; db: string } {
  const args = process.argv.slice(2);
  let env = "";
  let db = "all";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--env" && args[i + 1]) {
      env = args[i + 1];
      i++;
    } else if (args[i] === "--db" && args[i + 1]) {
      db = args[i + 1];
      i++;
    }
  }

  if (!env || !["production"].includes(env)) {
    console.error("Usage: npx tsx scripts/backup-d1-to-r2.ts --env production [--db <static|all>]");
    process.exit(1);
  }

  if (!["static", "all"].includes(db)) {
    console.error("--db must be one of: static, all");
    process.exit(1);
  }

  return { env, db };
}

async function exportAndUpload(env: string, dbType: string, config: DbConfig): Promise<boolean> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `d1_${dbType}_${timestamp}.sql`;
  const tmpPath = path.join("/tmp", filename);
  const r2Key = `backups/${env}/${filename}`;

  console.log(`\n📦 Exporting ${config.label} (${config.name})...`);

  try {
    // wrangler d1 export でリモート D1 を SQL ダンプ
    execSync(
      `npx wrangler d1 export ${config.name} --remote --env ${env} --output ${tmpPath}`,
      { cwd: WEB_APP_DIR, stdio: "pipe" }
    );

    const stats = fs.statSync(tmpPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ Exported: ${sizeMB} MB`);

    // R2 にアップロード
    console.log(`  ☁️  Uploading to R2: ${r2Key}`);
    const sqlContent = fs.readFileSync(tmpPath);
    await uploadToR2(r2Key, sqlContent, "application/sql");
    console.log(`  ✅ Uploaded to R2`);

    // 一時ファイル削除
    fs.unlinkSync(tmpPath);

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Failed: ${message}`);

    // 一時ファイルがあれば削除
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }

    return false;
  }
}

async function main() {
  const { env, db } = parseArgs();
  const configs = DB_CONFIGS[env];

  console.log(`🔄 D1 Backup → R2`);
  console.log(`   Environment: ${env}`);
  console.log(`   Target DB:   ${db}`);

  const targets: [string, DbConfig][] =
    db === "all"
      ? Object.entries(configs)
      : [[db, configs[db]]];

  let success = 0;
  let failed = 0;

  for (const [dbType, config] of targets) {
    const ok = await exportAndUpload(env, dbType, config);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n📊 Summary: ${success} succeeded, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
