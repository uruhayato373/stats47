/**
 * MDXファイルのfrontmatterをD1データベースに同期するスクリプト
 * 
 * contents内の全MDXファイルを読み込み、frontmatterを抽出してデータベースに保存します。
 * 
 * 使用方法:
 *   npx tsx scripts/sync-mdx-frontmatter-to-db.ts
 * 
 * 処理内容:
 *   1. contentsディレクトリ内の全MDXファイルを取得
 *   2. 各ファイルのfrontmatterをパース
 *   3. ファイルハッシュ（SHA-256）を計算して変更検知
 *   4. データベースにUPSERT（既存は更新、新規は挿入）
 */

import { createHash } from "crypto";
import { readFileSync } from "fs";
import { listMDXFiles, readMDXFile } from "../src/features/blog/repositories/article-repository";

/**
 * ローカルD1データベースにアクセスする関数（スクリプト用）
 * server-onlyの依存を回避するため、直接ローカルD1にアクセス
 */
function getLocalD1(): any {
  const fs = require("fs");
  const path = require("path");
  const Database = require("better-sqlite3");

  // ローカルD1データベースのパスを検索
  const possiblePaths = [
    process.env.LOCAL_D1_PATH,
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
    ".wrangler/state/v3/d1",
  ].filter(Boolean);

  let dbPath: string | null = null;

  for (const basePath of possiblePaths) {
    if (!basePath || !fs.existsSync(basePath)) continue;

    // ディレクトリ内の.sqliteファイルを検索
    const files = fs.readdirSync(basePath, { recursive: true });
    const sqliteFile = files.find(
      (file: string | Buffer): file is string =>
        typeof file === "string" && file.endsWith(".sqlite")
    );

    if (sqliteFile) {
      dbPath = path.join(basePath, sqliteFile);
      break;
    }

    // ディレクトリ自体が.sqliteファイルの場合
    if (basePath.endsWith(".sqlite")) {
      dbPath = basePath;
      break;
    }
  }

  if (!dbPath || !fs.existsSync(dbPath)) {
    throw new Error(
      `ローカルD1データベースが見つかりません。パス: ${possiblePaths.join(", ")}`
    );
  }

  const db = new Database(dbPath, { readonly: false });

  // D1互換のインターフェースを実装
  return {
    prepare: (sql: string) => {
      const createStmt = (...boundArgs: any[]) => {
        const stmt = db.prepare(sql);
        return {
          all: async () => {
            try {
              const results =
                boundArgs.length > 0 ? stmt.all(...boundArgs) : stmt.all();
              return { results, success: true };
            } catch (error) {
              return { results: [], success: false, error };
            }
          },
          first: async () => {
            try {
              const result =
                boundArgs.length > 0 ? stmt.get(...boundArgs) : stmt.get();
              return result || null;
            } catch (error) {
              return null;
            }
          },
          run: async () => {
            try {
              const result =
                boundArgs.length > 0 ? stmt.run(...boundArgs) : stmt.run();
              return {
                success: true,
                meta: {
                  changes: result.changes,
                  last_insert_rowid: result.lastInsertRowid,
                },
              };
            } catch (error) {
              return { success: false, error };
            }
          },
          bind: (...args: any[]) => {
            return createStmt(...args);
          },
        };
      };
      return createStmt();
    },
    exec: (sql: string) => {
      db.exec(sql);
    },
  };
}

/**
 * 抜粋を生成（最初の160文字）
 */
function generateExcerpt(content: string): string {
  const plainText = content
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  if (plainText.length <= 160) {
    return plainText;
  }

  const truncated = plainText.slice(0, 160);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0 ? truncated.slice(0, lastSpace) + "..." : truncated + "...";
}


/**
 * ファイルのSHA-256ハッシュを計算
 */
function calculateFileHash(filePath: string): string {
  const fileContent = readFileSync(filePath, "utf-8");
  return createHash("sha256").update(fileContent).digest("hex");
}

/**
 * MDXファイルのfrontmatterをデータベースに同期
 */
async function syncMDXFilesToDatabase(): Promise<void> {
  console.log("🚀 MDXファイルのfrontmatterをデータベースに同期開始...\n");

  try {
    const db = getLocalD1();
    const files = await listMDXFiles();

    console.log(`📁 検出されたMDXファイル数: ${files.length}件\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = `[${i + 1}/${files.length}]`;

      try {
        // ファイルを読み込み
        const article = await readMDXFile(file.category, file.slug, file.year);

        // ファイルハッシュを計算
        const fileHash = calculateFileHash(file.fullPath);

        // データベースに既存レコードがあるか確認
        const existing = await db
          .prepare("SELECT file_hash FROM articles WHERE category = ? AND slug = ? AND time = ?")
          .bind(
            article.actualCategory,
            article.slug,
            article.year || ""
          )
          .first();

        // ハッシュが同じ場合はスキップ
        if (existing && (existing.file_hash as string) === fileHash) {
          console.log(`${progress} ⏭️  スキップ: ${file.fullPath}`);
          skippedCount++;
          continue;
        }

        // descriptionを決定：frontmatter.descriptionがあればそれを使い、なければ抜粋を生成
        const description =
          article.frontmatter.description || generateExcerpt(article.content);

        // データベースにUPSERT
        await db
          .prepare(
            `
            INSERT INTO articles (
              category, slug, time, title, description,
              tags, file_path, file_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug, time) DO UPDATE SET
              title = excluded.title,
              description = excluded.description,
              tags = excluded.tags,
              file_hash = excluded.file_hash,
              updated_at = CURRENT_TIMESTAMP
            `
          )
          .bind(
            article.actualCategory,
            article.slug,
            article.year || "",
            article.frontmatter.title,
            description || null,
            JSON.stringify(article.frontmatter.tags),
            file.fullPath,
            fileHash
          )
          .run();

        console.log(`${progress} ✅ 同期完了: ${file.fullPath}`);
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : JSON.stringify(error);
        console.error(`${progress} ❌ エラー: ${file.fullPath}`);
        console.error(`    ${errorMessage}\n`);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 同期結果サマリー");
    console.log("=".repeat(50));
    console.log(`✅ 成功: ${successCount}件`);
    console.log(`⏭️  スキップ: ${skippedCount}件`);
    console.log(`❌ エラー: ${errorCount}件`);
    console.log(`📁 合計: ${files.length}件`);
    console.log("=".repeat(50));

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 同期処理で致命的なエラーが発生しました:");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

// メイン処理を実行
syncMDXFilesToDatabase().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});

