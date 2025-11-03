/**
 * 記事リポジトリ
 * 
 * MDXファイルの読み込みとパースを担当するRepository層
 * Server-onlyの純粋関数として実装
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

import type { Article, ArticleFilePath } from "../types/article.types";
import { parseFrontmatter } from "../utils/frontmatter-parser";

/**
 * contentsディレクトリのパス（プロジェクトルート基準）
 */
const CONTENTS_DIR = path.join(process.cwd(), "contents");

/**
 * MDXファイルの拡張子
 */
const MDX_EXTENSION = ".mdx";

/**
 * スラッグをサニタイズ（パストラバーサル対策）
 * 
 * @param slug - サニタイズ対象のスラッグ
 * @returns サニタイズ済みのスラッグ
 */
function sanitizeSlug(slug: string): string {
  // アルファベット（小文字）、数字、ハイフンのみ許可
  return slug.replace(/[^a-z0-9-]/g, "");
}

/**
 * カテゴリをサニタイズ（パストラバーサル対策）
 * 
 * @param category - サニタイズ対象のカテゴリ
 * @returns サニタイズ済みのカテゴリ
 */
function sanitizeCategory(category: string): string {
  // アルファベット（小文字）、数字、ハイフンのみ許可
  return category.replace(/[^a-z0-9-]/g, "");
}

/**
 * 年度をサニタイズ（パストラバーサル対策）
 * 
 * @param year - サニタイズ対象の年度
 * @returns サニタイズ済みの年度
 */
function sanitizeYear(year: string): string {
  // 数字のみ許可（4桁の年度を想定）
  return year.replace(/\D/g, "");
}

/**
 * MDXファイルを読み込み、パースする
 * 
 * @param category - カテゴリ（ディレクトリ名）
 * @param slug - スラッグ（ディレクトリ名）
 * @param year - 年度（ファイル名から抽出）
 * @returns パース済みの記事データ
 * @throws {Error} ファイルが存在しない場合、パースエラー時
 */
export async function readMDXFile(
  category: string,
  slug: string,
  year: string
): Promise<Article> {
  // パストラバーサル対策：サニタイズ
  const sanitizedCategory = sanitizeCategory(category);
  const sanitizedSlug = sanitizeSlug(slug);
  const sanitizedYear = sanitizeYear(year);

  // ファイルパスを構築
  const filePath = path.join(
    CONTENTS_DIR,
    sanitizedCategory,
    sanitizedSlug,
    `${sanitizedYear}${MDX_EXTENSION}`
  );

  // ファイル存在チェック
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`MDXファイルが見つかりません: ${filePath}`);
  }

  // ファイル読み込み
  let fileContent: string;
  try {
    fileContent = await fs.readFile(filePath, "utf-8");
  } catch (error) {
    throw new Error(`MDXファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Frontmatterとコンテンツを分離
  let frontmatterData: unknown;
  let content: string;
  try {
    const parsed = matter(fileContent);
    frontmatterData = parsed.data;
    content = parsed.content;

  } catch (error) {
    throw new Error(
      `MDXファイルのパースに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Frontmatterをパース・バリデーション
  let frontmatter;
  try {
    frontmatter = parseFrontmatter(frontmatterData);
  } catch (error) {
    throw new Error(
      `Frontmatterのパースに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    slug: sanitizedSlug,
    year: sanitizedYear,
    actualCategory: sanitizedCategory,
    frontmatter,
    content,
  };
}

/**
 * MDXファイルの一覧を取得
 * 
 * @param category - カテゴリでフィルタリング（オプション）
 * @returns ファイルパス情報の配列
 */
export async function listMDXFiles(
  category?: string
): Promise<ArticleFilePath[]> {
  const results: ArticleFilePath[] = [];

  try {
    // カテゴリが指定されている場合はそのカテゴリのみ、そうでなければ全カテゴリをスキャン
    const categories = category
      ? [sanitizeCategory(category)]
      : await fs.readdir(CONTENTS_DIR);

    for (const cat of categories) {
      const categoryPath = path.join(CONTENTS_DIR, cat);

      try {
        // ディレクトリかチェック
        const stat = await fs.stat(categoryPath);
        if (!stat.isDirectory()) {
          continue;
        }

        // スラッグ（ディレクトリ）を取得
        const slugs = await fs.readdir(categoryPath);

        for (const slug of slugs) {
          const slugPath = path.join(categoryPath, slug);

          try {
            const slugStat = await fs.stat(slugPath);
            if (!slugStat.isDirectory()) {
              continue;
            }

            // MDXファイルを取得
            const files = await fs.readdir(slugPath);
            const mdxFiles = files.filter((file) => file.endsWith(MDX_EXTENSION));

            for (const file of mdxFiles) {
              // 年度をファイル名から抽出（例: "2023.mdx" → "2023"）
              const year = file.replace(MDX_EXTENSION, "");

              results.push({
                category: cat,
                slug,
                year,
                fullPath: path.join(slugPath, file),
              });
            }
          } catch {
            // スラッグディレクトリの読み込みエラーは無視
            continue;
          }
        }
      } catch {
        // カテゴリディレクトリの読み込みエラーは無視
        continue;
      }
    }
  } catch (error) {
    throw new Error(`MDXファイル一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }

  return results;
}

