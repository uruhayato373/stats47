#!/usr/bin/env node
/**
 * database/scripts/sync-local-to-staging.js
 * ローカルD1データベースからステージング環境への同期（Node.js版）
 * Windows/Linux/Macで動作
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 色の定義（ANSIエスケープシーケンス）
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// プロジェクトルートに移動
const projectRoot = path.resolve(__dirname, '../..');
process.chdir(projectRoot);

// バックアップディレクトリの作成
const now = new Date();
const dateDir = now.toISOString().split('T')[0].replace(/-/g, '-');
const dateFile = now.toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
const backupDir = path.join('database', 'backups', dateDir);
const backupFile = path.join(backupDir, `staging_backup_${dateFile}.sql`);
const localDumpFile = path.join(backupDir, `local_dump_${dateFile}.sql`);

// バックアップディレクトリの作成
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

log.info('ローカルD1からステージング環境への同期を開始します...');

// 1. ステージング環境のバックアップ（念のため）
log.info('ステージング環境のバックアップを取得中...');
try {
  execSync(
    `npx wrangler d1 export stats47_staging --env staging --remote --output="${backupFile}"`,
    { stdio: 'inherit' }
  );
  log.info(`バックアップファイル: ${backupFile}`);
} catch (error) {
  log.warn('ステージング環境のバックアップ取得に失敗しましたが、続行します');
}

// 2. ローカルD1のエクスポート
log.info('ローカルD1のエクスポート中...');
const localDbFile = path.join(
  '.wrangler',
  'state',
  'v3',
  'd1',
  'miniflare-D1DatabaseObject',
  'b3c084603f7be30f18c6a887d294217e3e6b2010e83e9d09910eae3515a26884.sqlite'
);

if (!fs.existsSync(localDbFile)) {
  log.error(`ローカルD1データベースファイルが見つかりません: ${localDbFile}`);
  log.info('まず、ローカルD1を初期化してください: npm run db:init:local');
  process.exit(1);
}

try {
  execSync(`npx wrangler d1 export stats47 --local --output="${localDumpFile}"`, {
    stdio: 'inherit',
  });
  log.info(`エクスポートファイル: ${localDumpFile}`);
} catch (error) {
  log.error('ローカルD1のエクスポートに失敗しました');
  process.exit(1);
}

// 3. ステージング環境へのマイグレーション適用（念のため）
log.info('ステージング環境のマイグレーションを確認中...');
try {
  execSync(
    'npx wrangler d1 migrations apply stats47_staging --env staging --remote',
    { stdio: 'inherit' }
  );
  log.info('マイグレーションの適用が完了しました');
} catch (error) {
  log.warn('マイグレーションの適用に問題がありましたが、続行します');
}

// 4. ステージング環境へのインポート
log.info('ステージング環境にローカルD1のデータをインポート中...');
try {
  execSync(
    `npx wrangler d1 execute stats47_staging --env staging --remote --file="${localDumpFile}"`,
    { stdio: 'inherit' }
  );
  log.info('データのインポートが完了しました');
} catch (error) {
  log.error('ステージング環境へのインポートに失敗しました');
  log.info(`バックアップからリストアする場合: npx wrangler d1 execute stats47_staging --env staging --remote --file=${backupFile}`);
  process.exit(1);
}

// 5. 同期結果の確認
log.info('同期結果を確認中...');
try {
  execSync(
    `npx wrangler d1 execute stats47_staging --env staging --remote --command "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'categories', COUNT(*) FROM categories UNION ALL SELECT 'ranking_groups', COUNT(*) FROM ranking_groups UNION ALL SELECT 'estat_metainfo', COUNT(*) FROM estat_metainfo UNION ALL SELECT 'articles', COUNT(*) FROM articles"`,
    { stdio: 'inherit' }
  );
  log.info('データ確認が完了しました');
} catch (error) {
  log.warn('データ確認に失敗しましたが、同期は完了しています');
}

log.info('同期が完了しました！');
log.info(`バックアップファイル: ${backupFile}`);
log.info(`エクスポートファイル: ${localDumpFile}`);
console.log('');
log.info('次のステップ:');
log.warn('  1. ステージング環境で動作確認: https://staging.stats47.pages.dev');
log.warn('  2. 問題がある場合はバックアップからリストア可能');

