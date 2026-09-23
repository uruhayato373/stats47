import { z } from 'zod';

/**
 * Instagram「相関」カルーセル（水枠。正典 .claude/rules/sns-content-standards.md §2-3c）の
 * 入力型・検証・派生ロジック。
 *
 * props.json は `.claude/scripts/sns/build-ig-correlation-props.ts` が生成する（このファイルからは
 * 変更しない・読むだけ）。生成物は既に Pearson r・人口を制御した偏相関・47点の散布図データ・
 * ハイライト・注意書きを計算済みなので、ここでは選定/計算ロジックを再実装せず、型として妥当か・
 * フィールド間で矛盾していないかだけを検証する。
 *
 * 注意: 生成物は `points`（47点。フィールド名 `prefCode`）と `highlights.trendAnchors` /
 * `highlights.outliers`（フィールド名 `areaCode`）でキー名が異なる
 * (`.claude/scripts/sns/lib/correlation-carousel-core.ts` の `JoinRow` 型由来)。
 * ここではそのまま踏襲し、resolveCorrelationCarousel でハイライトが points に実在するかを検証する。
 *
 * 因果を示唆しない規約は .claude/rules/evidence-based-judgment.md の通り、props にある
 * `hook` / `caution` の文言をそのまま使う（このファイルで新しい因果表現を作らない）。
 */

export const CORRELATION_CAROUSEL_SLIDES = ['cover', 'scatter', 'highlights', 'caution', 'outro'] as const;
export type CorrelationCarouselSlide = (typeof CORRELATION_CAROUSEL_SLIDES)[number];

export const CorrelationAxisSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  unit: z.string(),
  /** yearCode (例: "2024") */
  year: z.string().min(1),
  source: z.string().min(1),
  category: z.string().min(1),
  scopeNote: z.string().optional(),
});
export type CorrelationAxis = z.infer<typeof CorrelationAxisSchema>;

export const CorrelationPointSchema = z.object({
  prefCode: z.string().min(1),
  name: z.string().min(1),
  x: z.number(),
  y: z.number(),
});
export type CorrelationPoint = z.infer<typeof CorrelationPointSchema>;

/** ハイライト点。points と違い areaCode というフィールド名 (生成物側の JoinRow 型のまま) */
export const CorrelationHighlightPointSchema = z.object({
  areaCode: z.string().min(1),
  name: z.string().min(1),
  x: z.number(),
  y: z.number(),
});
export type CorrelationHighlightPoint = z.infer<typeof CorrelationHighlightPointSchema>;

const HighlightPairSchema = z.union([
  z.tuple([CorrelationHighlightPointSchema, CorrelationHighlightPointSchema]),
  z.tuple([]),
]);

export const CorrelationHighlightsSchema = z.object({
  trendAnchors: HighlightPairSchema,
  outliers: HighlightPairSchema,
});
export type CorrelationHighlights = z.infer<typeof CorrelationHighlightsSchema>;

export const REQUIRED_PREFECTURE_COUNT = 47;

export const CorrelationCarouselSpecSchema = z.object({
  generatedAt: z.string(),
  x: CorrelationAxisSchema,
  y: CorrelationAxisSchema,
  points: z.array(CorrelationPointSchema).length(REQUIRED_PREFECTURE_COUNT),
  r: z.number().min(-1).max(1),
  rPopulationAdjusted: z.number().min(-1).max(1),
  n: z.number().int().positive(),
  highlights: CorrelationHighlightsSchema,
  hook: z.string().min(1),
  caution: z.string().min(1),
  blogUrl: z.string().url().optional(),
  canonicalUrl: z.object({ x: z.string().url(), y: z.string().url() }),
  provenance: z.array(z.string()).optional(),
});
export type CorrelationCarouselSpec = z.infer<typeof CorrelationCarouselSpecSchema>;

export interface ResolvedCorrelationCarousel {
  spec: CorrelationCarouselSpec;
}

/** r を符号付き小数2桁の文字列にする (evidence-based-judgment.md: 断定的な因果表現を避ける表示にのみ使う) */
export function formatR(r: number): string {
  return r.toFixed(2);
}

/**
 * フッター (IgSeriesFooter) は1行想定のため、2指標分の出典を並べると折り返して
 * スワイプ誘導と重なる (2026-09-23 実測)。同じ出典なら1つだけ、違えば「他」で短くする。
 */
export function combinedSourceLabel(spec: Pick<CorrelationCarouselSpec, 'x' | 'y'>): string {
  return spec.x.source === spec.y.source ? spec.x.source : `${spec.x.source} 他`;
}

/**
 * 型検証 (CorrelationCarouselSpecSchema) に加えて、フィールド間の矛盾を検出する。
 * どれか一つでも欠けている・矛盾していればレンダーを失敗させる (fail-closed)。
 */
export function resolveCorrelationCarousel(raw: unknown): ResolvedCorrelationCarousel {
  const spec = CorrelationCarouselSpecSchema.parse(raw);

  if (spec.x.key === spec.y.key) {
    throw new Error(`x.key と y.key が同じです (${spec.x.key})`);
  }
  if (spec.n !== spec.points.length) {
    throw new Error(`n (${spec.n}) が points の件数 (${spec.points.length}) と一致しません`);
  }
  if (spec.points.length !== REQUIRED_PREFECTURE_COUNT) {
    throw new Error(`points が47件ではありません (${spec.points.length}件)`);
  }
  if (!spec.canonicalUrl.x.includes(spec.x.key)) {
    throw new Error(`canonicalUrl.x (${spec.canonicalUrl.x}) に x.key (${spec.x.key}) が含まれていません`);
  }
  if (!spec.canonicalUrl.y.includes(spec.y.key)) {
    throw new Error(`canonicalUrl.y (${spec.canonicalUrl.y}) に y.key (${spec.y.key}) が含まれていません`);
  }

  const prefCodes = new Set(spec.points.map((p) => p.prefCode));
  const allHighlightPoints = [...spec.highlights.trendAnchors, ...spec.highlights.outliers];
  for (const hp of allHighlightPoints) {
    if (!prefCodes.has(hp.areaCode)) {
      throw new Error(`highlights の ${hp.name} (${hp.areaCode}) が points に含まれていません`);
    }
  }
  if (allHighlightPoints.length > 0) {
    const uniqueCodes = new Set(allHighlightPoints.map((p) => p.areaCode));
    if (uniqueCodes.size !== allHighlightPoints.length) {
      throw new Error('highlights の都道府県が重複しています');
    }
  }

  return { spec };
}
