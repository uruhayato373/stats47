/**
 * ポータル注目ランキングカードの AI 背景画像 (portal-ranking-thumbnail) の
 * プロンプトカタログ + prompt builder + asset metadata 型 (SSOT)。
 *
 * 正典: docs/02_実装計画/38_ポータル型ホーム・ヘッダー再設計仕様.md §12.7-12.11
 * 参照: .claude/skills/image-prompt/reference/formats.md (use_case = portal-ranking-thumbnail)
 *
 * 責務分離 (§12.7):
 * - AI 画像レイヤー = 背景 / 質感 / 象徴モチーフ **のみ**。
 * - 決定的データレイヤー (title / 順位 / 値 / 県名 / 年度 / 出典 / 地図) は既存 renderer が合成する。
 * - AI に文字・数値・年度・県名・ロゴ・UI・正確な日本地図を描かせない (§12.7 禁止)。
 *
 * 生成は事前処理のみ (runtime / production build 中に呼ばない・§12.10)。MCP/API 不可・失敗・
 * 未承認時は決定的 visual (tileMapSvg → top3 → number) へ fallback する。
 *
 * ※ このカタログは「生成基盤」であり、live の home-featured-v1 実験カードへは wire しない
 *   (実験判定前にカード visual を変えない・§11.2)。実験判定 + deploy 解禁後に activation する。
 */

export const PORTAL_THUMBNAIL_USE_CASE = "portal-ranking-thumbnail" as const;
export const PORTAL_THUMBNAIL_PROMPT_VERSION = "v1" as const;
export const PORTAL_THUMBNAIL_MODEL = "gemini-2.5-flash-image" as const;
/** portal は 16:9 前後 (§12.11)。SNS 4:5/9:16 からの crop を既定にしない。 */
export const PORTAL_THUMBNAIL_ASPECT = "16:9" as const;
export const PORTAL_THUMBNAIL_PIXELS = { width: 1280, height: 720 } as const;

/** 固定スタイル (ブランド調和・文字/地図/UI/人物を描かせない禁止句を必ず含む)。 */
export const PORTAL_THUMBNAIL_STYLE_PREFIX =
  "Editorial, light, minimal abstract background for a Japanese statistics portal card. " +
  "Calm, trustworthy, low-noise. Soft flat shapes and subtle texture. " +
  "Leave the central and lower area visually quiet as a safe area for overlaid title and numbers. " +
  "no text, no numbers, no labels, no logos, no UI, no charts. " +
  "no accurate map; do not draw prefecture borders or a recognizable map of Japan; leave the map/data area visually quiet. " +
  "no real people, no faces, no politicians, no public institutions.";

export interface PortalThumbnailEntry {
  /** METRICS_REGISTRY / HOME_FEATURED_RANKINGS 実在の rankingKey (= content ID)。 */
  rankingKey: string;
  /** 象徴モチーフ (安全側: 季節/自然/観光/交通/住環境/産業。所得/災害/疾病等は抽象)。 */
  motif: string;
  /** ムード。 */
  mood: string;
  /** ブランド調和パレット。 */
  palette: string;
}

/**
 * curated 候補 (home-featured 8 件)。所得/財政系 (fiscal / retirement / consumption) は
 * §12.8 に従い人物・地域の優劣を煽らない抽象モチーフにする。
 */
export const PORTAL_THUMBNAIL_CATALOG: readonly PortalThumbnailEntry[] = [
  {
    rankingKey: "annual-sunshine-duration",
    motif: "warm soft sunlight and gentle abstract rays over a calm horizon",
    mood: "bright and optimistic",
    palette: "warm amber and soft sky blue on off-white",
  },
  {
    rankingKey: "total-population",
    motif: "abstract soft dot cluster with varying density, no map",
    mood: "quiet and analytical",
    palette: "muted indigo and slate on off-white",
  },
  {
    rankingKey: "future-population-change-rate-2050",
    motif: "abstract flowing lines suggesting time and gradual change",
    mood: "forward-looking and calm",
    palette: "cool teal and soft violet on off-white",
  },
  {
    rankingKey: "agricultural-output",
    motif: "stylized flat fields and gentle crop rows, greenery, harvest tones",
    mood: "fresh and grounded",
    palette: "sage green and warm ochre on off-white",
  },
  {
    rankingKey: "fiscal-strength-index-prefecture",
    motif: "abstract geometric balance shapes, subtle grid, no coins or money symbols",
    mood: "steady and neutral",
    palette: "muted blue-grey and soft gold on off-white",
  },
  {
    rankingKey: "annual-clear-days",
    motif: "clear soft sky with light abstract clouds",
    mood: "airy and calm",
    palette: "clear sky blue and white on off-white",
  },
  {
    rankingKey: "retirement-allowance-admin-prefecture",
    motif: "abstract layered soft arcs suggesting accumulation, neutral",
    mood: "calm and neutral",
    palette: "soft teal and warm grey on off-white",
  },
  {
    rankingKey: "consumption-expenditure-multi-person-households-per-month",
    motif: "abstract soft rounded household shapes, neutral, no shopping or price symbols",
    mood: "gentle and everyday",
    palette: "warm terracotta and soft grey on off-white",
  },
];

/**
 * §12.9 の prompt contract を満たす 1 枚分のプロンプトを組み立てる純関数。
 * page/component へ自由プロンプトを直書きしない (この関数が唯一の管理箇所)。
 */
export function buildPortalThumbnailPrompt(entry: PortalThumbnailEntry): string {
  return [
    `Use case: ${PORTAL_THUMBNAIL_USE_CASE} (${PORTAL_THUMBNAIL_ASPECT}, ${PORTAL_THUMBNAIL_PIXELS.width}x${PORTAL_THUMBNAIL_PIXELS.height}).`,
    `Content ID: ${entry.rankingKey}.`,
    `Subject / symbolic motif: ${entry.motif}.`,
    `Mood: ${entry.mood}. Palette: ${entry.palette}.`,
    PORTAL_THUMBNAIL_STYLE_PREFIX,
  ].join(" ");
}

/** 採用画像に付与する機械可読 metadata (§12.10)。秘密情報・一時 URL は含めない。 */
export interface PortalThumbnailAssetMeta {
  assetId: string;
  rankingKey: string;
  promptTemplateId: string;
  promptVersion: string;
  prompt: string;
  generator: string;
  model: string;
  generatedAt: string;
  aspectRatio: string;
  pixelWidth: number;
  pixelHeight: number;
  reviewStatus: "pending" | "approved" | "rejected";
  rights: string;
  sourceAssetKey: string;
  compositeRendererVersion: string;
}
