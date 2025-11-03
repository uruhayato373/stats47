/**
 * Frontmatterパーサー
 *
 * MDXファイルのFrontmatterをパースしてバリデーションする
 */

import { z } from "zod";

import type { ArticleFrontmatter } from "../types/article.types";

/**
 * Frontmatterのスキーマ
 */
const FrontmatterSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().min(1).optional(),
  tags: z.array(z.string()).default([]),
});

/**
 * 生のFrontmatterデータをパースしてバリデーション
 *
 * @param data - パース対象のデータ
 * @returns バリデーション済みのFrontmatter
 * @throws {Error} バリデーションエラー時
 */
export function parseFrontmatter(data: unknown): ArticleFrontmatter {
  try {
    return FrontmatterSchema.parse(data) as ArticleFrontmatter;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // issuesプロパティを使用（ZodErrorの正しいプロパティ名）
      const errorMessages =
        error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ") || "不明なバリデーションエラー";
      throw new Error(`Frontmatterバリデーションエラー: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * オプショナルなFrontmatterデータをパース（エラー時はnullを返す）
 *
 * @param data - パース対象のデータ
 * @returns バリデーション済みのFrontmatterまたはnull
 */
export function parseFrontmatterSafe(data: unknown): ArticleFrontmatter | null {
  try {
    return parseFrontmatter(data);
  } catch {
    return null;
  }
}
