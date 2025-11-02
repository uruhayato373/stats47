#!/usr/bin/env node
/**
 * データベースバックアップスクリプト
 * 
 * ローカルD1データベース（SQLiteファイル）をバックアップします。
 * 同じ日付のバックアップがあれば上書きします。
 * 
 * 使用方法:
 *   npx tsx scripts/backup-database.ts
 */

import * as fs from "fs";
import * as path from "path";

/**
 * ローカルD1データベースファイルを検索
 */
function findLocalDatabaseFile(): string | null {
  const possiblePaths = [
    process.env.LOCAL_D1_PATH,
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
    ".wrangler/state/v3/d1",
  ].filter(Boolean) as string[];

  // 再帰的にファイルを検索する関数
  const findSqliteFile = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null;

    // ディレクトリ自体が.sqliteファイルの場合
    if (dir.endsWith(".sqlite") && fs.statSync(dir).isFile()) {
      return dir;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && entry.name.endsWith(".sqlite")) {
          return fullPath;
        }

        if (entry.isDirectory()) {
          const found = findSqliteFile(fullPath);
          if (found) return found;
        }
      }
    } catch (error) {
      // 読み取りエラーは無視
    }

    return null;
  };

  for (const basePath of possiblePaths) {
    const found = findSqliteFile(basePath);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * メイン処理
 */
function main() {
  console.log("📦 データベースバックアップを開始します...\n");

  // ローカルデータベースファイルを検索
  const dbPath = findLocalDatabaseFile();

  if (!dbPath || !fs.existsSync(dbPath)) {
    console.error("❌ ローカルデータベースファイルが見つかりません");
    console.error("   .wrangler/state/v3/d1/ 配下に.sqliteファイルが存在するか確認してください");
    console.error("   または npx wrangler dev を実行してデータベースを作成してください");
    process.exit(1);
  }

  console.log(`✅ データベースファイルを発見: ${dbPath}`);

  // ファイル情報を取得
  const stats = fs.statSync(dbPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   サイズ: ${fileSizeMB} MB\n`);

  // バックアップディレクトリの作成
  const backupDir = path.join(process.cwd(), "database", "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 バックアップディレクトリを作成: ${backupDir}`);
  }

  // 日付のみを含むファイル名（同じ日付があれば上書き）
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const backupFileName = `stats47_backup_${today}.sqlite`;
  const backupPath = path.join(backupDir, backupFileName);

  // 既存のバックアップがある場合は上書きする
  if (fs.existsSync(backupPath)) {
    console.log(`⚠️  既存のバックアップを上書きします: ${backupFileName}`);
    const oldStats = fs.statSync(backupPath);
    const oldSizeMB = (oldStats.size / (1024 * 1024)).toFixed(2);
    console.log(`   既存バックアップサイズ: ${oldSizeMB} MB`);
  }

  // バックアップを実行
  try {
    console.log(`\n📋 バックアップを実行中...`);
    fs.copyFileSync(dbPath, backupPath);
    const backupStats = fs.statSync(backupPath);
    const backupSizeMB = (backupStats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅ バックアップが完了しました！`);
    console.log(`   保存先: ${backupPath}`);
    console.log(`   サイズ: ${backupSizeMB} MB`);
    console.log(`   ファイル名: ${backupFileName}`);
  } catch (error) {
    console.error("\n❌ バックアップに失敗しました:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

// スクリプト実行
main();

