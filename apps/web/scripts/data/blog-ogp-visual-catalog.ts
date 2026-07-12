/**
 * ブログ OGP AI 背景の「ビジュアルカタログ」(SSOT)。
 *
 * 記事ごとの自由入力プロンプトは持たせず、ここに登録した 6 系統 × motif から決定的に選ぶ。
 * 画風は全系統で「ライト・編集的・フラット・落ち着いた藍色・十分な余白・文字なし」に統一する。
 *
 * 正典: docs/02_実装計画/23_ブログOGP生成AIパイプライン仕様.md
 * 関連: apps/web/scripts/lib/blog-ogp-visual.ts (解決 + hash) / generate-blog-thumbnails-cloud.ts (統合)
 */

import type { OgpVisualType } from "@stats47/types";

export const OGP_VISUAL_TYPES: readonly OgpVisualType[] = [
  "map",
  "people",
  "economy",
  "industry",
  "timeline",
  "comparison",
] as const;

/** モデル・価格・プロンプト版は定数化 (価格改定時はここだけ差し替え)。 */
export const OGP_MODEL = "gemini-2.5-flash-image";
export const OGP_PROMPT_VERSION = "blog-ogp-v1";
/** 2026-07-12 時点 Gemini 2.5 Flash Image 標準単価 (USD/枚)。公式価格表で都度確認。 */
export const OGP_PRICE_PER_IMAGE_USD = 0.039;

/** 全系統共通の固定スタイル (文字・数値・ロゴ・地図境界を禁止)。 */
export const OGP_STYLE_PREFIX =
  "Light, editorial, flat vector background illustration for a Japanese statistics blog. " +
  "Calm muted indigo and slate palette with warm neutral accents on a very light off-white background. " +
  "Soft geometric shapes, gentle gradients, generous negative space especially on the LEFT THIRD (reserved for title text overlaid later). " +
  "Absolutely no text, no letters, no numbers, no logos, no watermarks, no real human faces, no precise administrative map borders. " +
  "Subject: ";

/** 全系統共通の禁止事項 (負のプロンプト的にも効かせる)。 */
export const OGP_FORBIDDEN =
  "text, letters, numbers, kanji, words, logo, watermark, real human face, celebrity, " +
  "precise map borders, prefecture names, ranking numbers, charts with real values";

interface MotifDef {
  /** motif 識別子 (frontmatter で許可する値) */
  id: string;
  /** STYLE_PREFIX に続く主題フラグメント */
  fragment: string;
}

interface VisualTypeDef {
  /** この系統の既定 motif (先頭) */
  motifs: MotifDef[];
}

/** 6 系統 × 許可 motif。frontmatter の ogpMotif はここに登録した id のみ許可。 */
export const OGP_VISUAL_CATALOG: Record<OgpVisualType, VisualTypeDef> = {
  map: {
    motifs: [
      { id: "prefecture-comparison", fragment: "an abstract stylized Japanese archipelago suggested by soft rounded regional blocks" },
      { id: "dots-47", fragment: "forty-seven small dots loosely arranged in the shape of Japan, evoking prefectural data points" },
      { id: "region-blocks", fragment: "abstract regional area blocks in gently varied indigo tones, evoking regional comparison" },
    ],
  },
  people: {
    motifs: [
      { id: "households", fragment: "simple people silhouettes grouped with a few soft house shapes, evoking households" },
      { id: "generations", fragment: "silhouettes of people of different heights standing together, evoking generations and demographics" },
      { id: "education-health", fragment: "a graduation cap and a gentle heart motif near people silhouettes, evoking education and health" },
    ],
  },
  economy: {
    motifs: [
      { id: "coins-budget", fragment: "stacked coins beside a household budget notebook, evoking household finances" },
      { id: "shopping-basket", fragment: "a shopping basket with a few abstract goods, evoking consumption and prices" },
      { id: "abstract-chart", fragment: "a soft abstract pie and rising bars, evoking economy without real values" },
    ],
  },
  industry: {
    motifs: [
      { id: "office-work", fragment: "a simple office desk with a briefcase, evoking occupations and wages" },
      { id: "factory", fragment: "a tidy factory silhouette with interlocking gears, evoking manufacturing" },
      { id: "farming-fishery", fragment: "terraced fields and a small fishing boat, evoking agriculture, forestry and fishery" },
    ],
  },
  timeline: {
    motifs: [
      { id: "rising-line", fragment: "an abstract time axis with a smooth rising and dipping line, evoking change over time" },
      { id: "long-term-change", fragment: "layered soft waves suggesting long-term demographic change over decades" },
      { id: "tree-rings", fragment: "concentric tree-ring shapes suggesting the passage of years" },
    ],
  },
  comparison: {
    motifs: [
      { id: "left-right-panels", fragment: "two contrasting abstract panels side by side, evoking a two-group comparison" },
      { id: "big-small-bars", fragment: "a few abstract bars of clearly different heights, evoking top-versus-bottom ranking" },
      { id: "top-bottom", fragment: "an upward form and a downward form contrasted, evoking high and low ranks" },
    ],
  },
};

/**
 * category (e-Stat 17 軸) → visualType の決定的対応表。
 * 曖昧なものは既定寄り (map) に倒す。分類はコードで固定しモデルに委ねない。
 */
export const CATEGORY_TO_VISUAL: Record<string, OgpVisualType> = {
  landweather: "map",
  population: "people",
  laborwage: "industry",
  agriculture: "industry",
  miningindustry: "industry",
  commercial: "economy",
  economy: "economy",
  construction: "people",
  energy: "map",
  tourism: "map",
  educationsports: "people",
  administrativefinancial: "economy",
  safetyenvironment: "comparison",
  socialsecurity: "people",
  international: "map",
  infrastructure: "industry",
  ict: "industry",
};

/** blog archetype (A-G) → visualType。正典: .claude/rules/blog-quality-standards.md */
export const ARCHETYPE_TO_VISUAL: Record<string, OgpVisualType> = {
  A: "map",
  B: "comparison",
  C: "timeline",
  D: "people",
  D2: "economy",
  E: "map",
  F: "map",
  G: "map",
};

/** tagKey (英/日の一部) → visualType。先に一致したものを採る (Object 挿入順で決定的)。 */
export const TAG_TO_VISUAL: Record<string, OgpVisualType> = {
  population: "people",
  aging: "people",
  household: "people",
  marriage: "people",
  education: "people",
  health: "people",
  housing: "people",
  income: "economy",
  price: "economy",
  consumption: "economy",
  finance: "economy",
  food: "economy",
  labor: "industry",
  wage: "industry",
  occupation: "industry",
  agriculture: "industry",
  manufacturing: "industry",
  timeseries: "timeline",
  future: "timeline",
  trend: "timeline",
  migration: "map",
  region: "map",
  ranking: "comparison",
  comparison: "comparison",
};

/** 既定値 (どの tier にも一致しないとき)。 */
export const DEFAULT_VISUAL_TYPE: OgpVisualType = "map";
export const DEFAULT_MOTIF = "prefecture-comparison";

/** visualType の既定 motif (先頭)。 */
export function defaultMotifFor(visualType: OgpVisualType): string {
  return OGP_VISUAL_CATALOG[visualType].motifs[0]?.id ?? DEFAULT_MOTIF;
}

/** motif が visualType に登録済みか。未登録は既定 motif に落とす判定に使う。 */
export function isValidMotif(visualType: OgpVisualType, motif: string): boolean {
  return OGP_VISUAL_CATALOG[visualType].motifs.some((m) => m.id === motif);
}

/** (visualType, motif) の主題フラグメント。未登録 motif は既定 motif のフラグメントを返す。 */
export function motifFragment(visualType: OgpVisualType, motif: string): string {
  const defs = OGP_VISUAL_CATALOG[visualType].motifs;
  return (defs.find((m) => m.id === motif) ?? defs[0]).fragment;
}

export function isValidVisualType(v: string): v is OgpVisualType {
  return (OGP_VISUAL_TYPES as readonly string[]).includes(v);
}
