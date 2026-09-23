import { z } from "zod";

/**
 * Instagram「県どうしの比較」カルーセル (金枠、正典 .claude/rules/sns-content-standards.md §2-3c) の
 * props 型。データは `.claude/scripts/sns/build-ig-compare-props.ts` が R2 から解決し、
 * 選定・勝敗判定まで済ませた「完全に解決済みの JSON」を書き出す。Remotion 側はこの JSON を
 * zod で検証して描画するだけで、選定ロジックを二重実装しない。
 */

export const COMPARE_CAROUSEL_SLIDES = ["cover", "duel", "summary", "outro"] as const;
export type CompareCarouselSlide = (typeof COMPARE_CAROUSEL_SLIDES)[number];

export const CompareDuelSideSchema = z.object({
  value: z.number(),
  rank: z.number().int().min(1).max(47),
});

export const CompareDuelItemSchema = z.object({
  rankingKey: z.string(),
  label: z.string(),
  subtitle: z.string().optional(),
  unit: z.string(),
  year: z.number().int(),
  source: z.string(),
  scopeNote: z.string().optional(),
  precision: z.number().int().min(0),
  a: CompareDuelSideSchema,
  b: CompareDuelSideSchema,
  winner: z.enum(["a", "b", "tie"]),
});
export type CompareDuelItem = z.infer<typeof CompareDuelItemSchema>;

export const CompareCarouselSummarySchema = z.object({
  aWins: z.number().int().min(0),
  bWins: z.number().int().min(0),
  ties: z.number().int().min(0),
});
export type CompareCarouselSummary = z.infer<typeof CompareCarouselSummarySchema>;

/** done_when: 5〜7個の rankingKey (対決) が揃っていることを型レベルでも要求する */
export const CompareCarouselDataSchema = z.object({
  areaACode: z.string(),
  areaBCode: z.string(),
  areaAName: z.string(),
  areaBName: z.string(),
  coverQuestion: z.string(),
  items: z.array(CompareDuelItemSchema).min(5).max(7),
  summary: CompareCarouselSummarySchema,
  canonicalUrl: z.string(),
  generatedAt: z.string(),
  sourceKeys: z.array(z.string()),
});
export type CompareCarouselData = z.infer<typeof CompareCarouselDataSchema>;
