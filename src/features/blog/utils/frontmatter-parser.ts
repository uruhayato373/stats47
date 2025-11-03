/**
 * Frontmatterパーサー
 * 
 * MDXファイルのFrontmatterをパースしてバリデーションする
 */

import { z } from "zod";

import type { ArticleFrontmatter } from "../types/article.types";

/**
 * ChartSettingsのスキーマ
 */
const ChartSettingsSchema = z.object({
  colorScheme: z.string().optional(),
  type: z.enum(["sequential", "diverging", "categorical"]).optional(),
  useMinValueForScale: z.boolean().optional(),
  centerType: z.enum(["zero", "mean", "median", "value"]).optional(),
  centerValue: z.number().optional(),
  regionValues: z.enum(["sum", "average", "mean"]).optional(),
});

/**
 * Frontmatterのスキーマ
 */
const FrontmatterSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().min(1).optional(),
  category: z.string().min(1, "カテゴリは必須です"),
  tags: z.array(z.string()).default([]),
  date: z
    .union([
      z.string(),
      z.date().transform((date) => {
        // DateオブジェクトをYYYY-MM-DD形式の文字列に変換
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }),
    ])
    .transform((val) => {
      // 文字列の場合、YYYY-MM-DD形式に変換
      // シングルクォートやダブルクォートを除去
      const cleaned = String(val).replace(/['"]/g, "").trim();
      
      // YYYY-MM-DD形式ならそのまま返す
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return cleaned;
      }
      
      // YYYY形式の場合、YYYY-01-01に変換
      if (/^\d{4}$/.test(cleaned)) {
        return `${cleaned}-01-01`;
      }
      
      // その他の場合はエラーを投げる
      throw new Error(`日付形式が不正です: ${val}. YYYY-MM-DD形式である必要があります`);
    })
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式はYYYY-MM-DDである必要があります")),
  statsDataId: z.string().optional(),
  chartSettings: ChartSettingsSchema.optional(),
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
      // errorsプロパティが存在し、配列であることを確認
      const errorMessages =
        error.errors && Array.isArray(error.errors)
          ? error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
          : error.message || "不明なバリデーションエラー";
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

