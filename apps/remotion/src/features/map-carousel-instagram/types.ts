import { z } from "zod";

/**
 * Instagram「地図」カルーセル (日枠、正典 .claude/rules/sns-content-standards.md §2-3c) の props 型。
 * データは `.claude/scripts/sns/build-ig-map-props.ts` が R2 から解決し、塗り分け (等分位) まで
 * 済ませた「完全に解決済みの JSON」を書き出す。Remotion 側はこの JSON を zod で検証して
 * 描画するだけで、塗り分けロジックを二重実装しない。
 */

export const MAP_CAROUSEL_SLIDES = ["cover", "choropleth", "topbottom", "outro"] as const;
export type MapCarouselSlide = (typeof MAP_CAROUSEL_SLIDES)[number];

export const MapTileItemSchema = z.object({
  prefCode2: z.string().length(2),
  areaName: z.string(),
  value: z.number(),
  rank: z.number().int().min(1).max(47),
  bin: z.number().int().min(0),
  fill: z.string(),
  textColor: z.string(),
});
export type MapTileItem = z.infer<typeof MapTileItemSchema>;

export const MapLegendEntrySchema = z.object({
  bin: z.number().int().min(0),
  rangeLabel: z.string(),
  fill: z.string(),
  textColor: z.string(),
  count: z.number().int().min(0),
});
export type MapLegendEntry = z.infer<typeof MapLegendEntrySchema>;

export const MapTopBottomEntrySchema = z.object({
  prefCode2: z.string(),
  areaName: z.string(),
  value: z.number(),
  rank: z.number().int().min(1).max(47),
});
export type MapTopBottomEntry = z.infer<typeof MapTopBottomEntrySchema>;

/** done_when: 47都道府県そろっている・上位5/下位5がそれぞれ5件であることを型レベルでも要求する */
export const MapCarouselDataSchema = z.object({
  rankingKey: z.string(),
  label: z.string(),
  subtitle: z.string().optional(),
  unit: z.string(),
  year: z.number().int(),
  source: z.string(),
  scopeNote: z.string().optional(),
  coverQuestion: z.string(),
  precision: z.number().int().min(0),
  tiles: z.array(MapTileItemSchema).length(47),
  legend: z.array(MapLegendEntrySchema),
  top5: z.array(MapTopBottomEntrySchema).length(5),
  bottom5: z.array(MapTopBottomEntrySchema).length(5),
  canonicalUrl: z.string(),
  generatedAt: z.string(),
  sourceKeys: z.array(z.string()),
});
export type MapCarouselData = z.infer<typeof MapCarouselDataSchema>;
