import { z } from "zod";

/**
 * e-STAT統計データフォームのZodスキーマ
 *
 * バリデーションルール:
 * - statsDataId: 必須フィールド（統計表ID）
 * - その他のフィールド: オプショナル
 */
export const statsDataFormSchema = z.object({
  // 必須フィールド
  statsDataId: z.string().min(1, "統計表IDは必須です"),
  cdCat01: z.string().optional(),

  // 動的フィールド（すべてオプショナル）
  cdTime: z.string().optional(),
  cdArea: z.string().optional(),
  cdCat02: z.string().optional(),
  cdCat03: z.string().optional(),
  cdCat04: z.string().optional(),
  cdCat05: z.string().optional(),
  cdCat06: z.string().optional(),
  cdCat07: z.string().optional(),
  cdCat08: z.string().optional(),
  cdCat09: z.string().optional(),
  cdCat10: z.string().optional(),
  cdCat11: z.string().optional(),
  cdCat12: z.string().optional(),
  cdCat13: z.string().optional(),
  cdCat14: z.string().optional(),
  cdCat15: z.string().optional(),
});

export type StatsDataFormValues = z.infer<typeof statsDataFormSchema>;
