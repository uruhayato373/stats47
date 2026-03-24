import { z } from "zod";

/**
 * 共通のプレビュー Props スキーマ
 */
export const CommonPreviewSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  meta: z.any().optional(),
  allEntries: z.any().optional(),
  showGuides: z.boolean().optional(),
  showSafeAreas: z.boolean().optional(),
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle: z.string().optional(),
  /** AI 生成フックテキスト（サムネイル用赤帯テロップ） */
  hookText: z.string().optional(),
  /** D3 カラースキーム名 (例: "interpolateBlues", "interpolateRdBu") */
  colorScheme: z.string().optional(),
  /** カラースキームの種類 */
  colorSchemeType: z.enum(["sequential", "diverging"]).optional(),
  /** diverging スケールの中間値 */
  divergingMidpointValue: z.number().optional(),
});

/**
 * 地図サムネイル用スキーマ（回転調整付き）
 */
export const MapThumbnailPreviewSchema = CommonPreviewSchema.extend({
  rotation: z.number().min(-180).max(180).optional(),
});

/**
 * ランク選択が必要なプレビュー用スキーマ
 */
export const RankCardPreviewSchema = CommonPreviewSchema.extend({
  rank: z.number().min(1).max(47).optional(),
});

/**
 * カルーセルスライド用スキーマ
 */
export const CarouselPreviewSchema = CommonPreviewSchema.extend({
  slide: z.enum(["cover", "cta"]).optional(),
  displayTitle: z.string().optional(),
  hookText: z.string().optional(),
});

/**
 * サムネイル用スキーマ
 */
export const ThumbnailPreviewSchema = CommonPreviewSchema.extend({
  variant: z.enum(["hero", "vs"]).optional(),
});

/**
 * テーブルスタイル選択可能用スキーマ
 */
export const RankingTablePreviewSchema = CommonPreviewSchema.extend({
  tableStyle: z.enum(["standard", "neon"]).optional(),
});


/**
 * RankingHeroOgp 用スキーマ（リアルデータ対応）
 */
export const RankingHeroOgpSchema = CommonPreviewSchema.extend({
  meta: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    unit: z.string(),
    yearName: z.string().optional(),
    demographicAttr: z.string().optional(),
    normalizationBasis: z.string().optional(),
  }).optional(),
  entries: z.array(z.object({
    rank: z.number(),
    areaCode: z.string(),
    areaName: z.string(),
    value: z.number(),
  })).optional(),
  colorScheme: z.string().optional(),
});

/**
 * AreaProfileOgp 用スキーマ
 */
export const AreaProfileOgpSchema = CommonPreviewSchema.extend({
  areaName: z.string().optional(),
  strengths: z.array(z.object({
    label: z.string(),
    rank: z.number(),
    value: z.number(),
    unit: z.string(),
  })).optional(),
  weaknesses: z.array(z.object({
    label: z.string(),
    rank: z.number(),
    value: z.number(),
    unit: z.string(),
  })).optional(),
});

/**
 * ComparisonOgp 用スキーマ
 */
export const ComparisonOgpSchema = CommonPreviewSchema.extend({
  areaNameA: z.string().optional(),
  areaNameB: z.string().optional(),
  indicators: z.array(z.object({
    label: z.string(),
    unit: z.string(),
    valueA: z.number(),
    valueB: z.number(),
    rankA: z.number(),
    rankB: z.number(),
  })).optional(),
});

/**
 * CorrelationScatterOgp 用スキーマ
 */
export const CorrelationScatterOgpSchema = CommonPreviewSchema.extend({
  titleX: z.string().optional(),
  titleY: z.string().optional(),
  unitX: z.string().optional(),
  unitY: z.string().optional(),
  points: z.array(z.object({
    areaName: z.string(),
    x: z.number(),
    y: z.number(),
  })).optional(),
  pearsonR: z.number().optional(),
});

/**
 * AreaProfileCarousel 用スキーマ
 */
export const AreaProfileCarouselSchema = CommonPreviewSchema.extend({
  slide: z.enum(["cover", "strengths", "weaknesses", "cta"]).optional(),
  areaName: z.string().optional(),
  strengths: z.array(z.object({
    label: z.string(),
    rank: z.number(),
    value: z.number(),
    unit: z.string(),
  })).optional(),
  weaknesses: z.array(z.object({
    label: z.string(),
    rank: z.number(),
    value: z.number(),
    unit: z.string(),
  })).optional(),
});

/**
 * ComparisonCarousel 用スキーマ
 */
export const ComparisonCarouselSchema = CommonPreviewSchema.extend({
  slide: z.enum(["cover", "detail", "cta"]).optional(),
  areaNameA: z.string().optional(),
  areaNameB: z.string().optional(),
  indicators: z.array(z.object({
    label: z.string(),
    unit: z.string(),
    valueA: z.number(),
    valueB: z.number(),
    rankA: z.number(),
    rankB: z.number(),
  })).optional(),
});

/**
 * TileGridMapScene プレビュー用スキーマ
 */
export const TileGridMapScenePreviewSchema = CommonPreviewSchema.extend({
  mode: z.enum(["static", "progressive"]).optional(),
  hookText: z.string().optional(),
});

/**
 * レイアウトプレビュー用スキーマ
 */
export const LayoutPreviewSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  showGuides: z.boolean().optional(),
});

/**
 * BarChartRaceShort 用スキーマ
 */
export const BarChartRaceShortSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  frames: z.any().optional(),
  title: z.string().optional(),
  unit: z.string().optional(),
  topN: z.number().optional(),
  framesPerYear: z.number().optional(),
  variant: z.enum(["youtube", "youtube-short", "youtube-short-full", "instagram", "tiktok"]).optional(),
  showSafeAreas: z.boolean().optional(),
  hookText: z.string().max(20).optional(),
  eventLabels: z.any().optional(),
  enableSpoilerHook: z.boolean().optional(),
  musicPath: z.string().optional(),
  endHoldFrames: z.number().optional(),
});

/**
 * RankingShort 用スキーマ
 */
export const RankingShortSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  meta: z.any().optional(),
  allEntries: z.any().optional(),
  variant: z.enum(["youtube", "youtube-short", "youtube-short-full", "instagram", "tiktok"]).optional(),
  showSafeAreas: z.boolean().optional(),
  /** AI 生成フックテキスト（15文字以内）。--props で渡して冒頭シーンに反映 */
  hookText: z.string().max(20).optional(),
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle: z.string().optional(),
  /** D3 カラースキーム名 */
  colorScheme: z.string().optional(),
  /** カラースキームの種類 */
  colorSchemeType: z.enum(["sequential", "diverging"]).optional(),
  /** diverging スケールの中間値 */
  divergingMidpointValue: z.number().optional(),
});

/**
 * KazuNoteCover 用スキーマ
 */
export const KazuNoteCoverSchema = z.object({
  series: z.enum(["ソバーキュリアス", "断酒", "Re：断酒"]).optional(),
  day: z.number().optional(),
  subtitle: z.string().optional(),
});

/**
 * ComparisonShort 用スキーマ
 */
export const ComparisonShortSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  areaNameA: z.string().optional(),
  areaNameB: z.string().optional(),
  areaCodeA: z.string().optional(),
  areaCodeB: z.string().optional(),
  indicators: z.array(z.object({
    label: z.string(),
    unit: z.string(),
    valueA: z.number(),
    valueB: z.number(),
    rankA: z.number(),
    rankB: z.number(),
  })).optional(),
  hookText: z.string().optional(),
  showSafeAreas: z.boolean().optional(),
});

/**
 * PopulationChoropleth 用スキーマ
 */
export const PopulationChoroplethSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  showGuides: z.boolean().optional(),
});
