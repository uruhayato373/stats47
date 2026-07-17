/**
 * 都道府県シルエットカードのデザイントークン SSOT (git TS)。
 *
 * 「県シルエット地図カード」(海ドット地 + 周辺県ハーフトーン + 対象県ソリッド + 県名ピル) の
 * 色・比率・レイアウトパラメータはこのファイルだけを編集する (正典:
 * .claude/rules/ogp-image-standards.md §5)。値を変えたら generate-ogp-images.ts
 * --type areas / --type pref-silhouette --force で全量再生成 → R2 反映。
 *
 * 色 = シリーズの顔 (buzz-map-standards.md と同思想)。既定 push は blue + dark に固定し、
 * warm 等の追加テーマは生成能力として保持する (R2 には焼かない)。
 */

export interface PrefCardTheme {
  /** 海 (背景) */
  sea: string;
  /** 海のドットテクスチャ */
  seaDot: string;
  /** 周辺県の地色 */
  land: string;
  /** 周辺県のハーフトーンドット */
  landDot: string;
  /** 周辺県の県境線 */
  landStroke: string;
  /** 対象県 (ソリッド) */
  target: string;
  /** 対象県のフチ */
  targetStroke: string;
  /** 県名ピルの地色 */
  label: string;
  /** 県名ピルの文字色 */
  labelText: string;
  /** ブランド行の文字色 */
  brand: string;
  /** ブランド行ピルの地色 (半透明可) */
  brandBg: string;
  /** ドロップシャドウ (rgba) */
  shadow: string;
}

/** blue は OGP brand.ts パレット (#1D4ED8 系) 準拠。 */
export const PREF_CARD_THEMES = {
  blue: {
    sea: "#EAF2FE",
    seaDot: "#CFE0F8",
    land: "#DBEAFE",
    landDot: "#93C5FD",
    landStroke: "#FFFFFF",
    target: "#1D4ED8",
    targetStroke: "#FFFFFF",
    label: "#1E3A8A",
    labelText: "#FFFFFF",
    brand: "#1D4ED8",
    brandBg: "rgba(255,255,255,0.85)",
    shadow: "rgba(30,58,138,0.28)",
  },
  dark: {
    sea: "#0F1B33",
    seaDot: "#1B2C4F",
    land: "#1E3358",
    landDot: "#33518A",
    landStroke: "#0F1B33",
    target: "#4C8DFF",
    targetStroke: "#0F1B33",
    label: "#EAF2FE",
    labelText: "#12264A",
    brand: "#9DC0FF",
    brandBg: "rgba(15,27,51,0.75)",
    shadow: "rgba(0,0,0,0.45)",
  },
  warm: {
    sea: "#FDF6EC",
    seaDot: "#F5E3C8",
    land: "#FBEACC",
    landDot: "#F0B860",
    landStroke: "#FFFFFF",
    target: "#D9480F",
    targetStroke: "#FFFFFF",
    label: "#7C2D12",
    labelText: "#FFFFFF",
    brand: "#C2410C",
    brandBg: "rgba(255,255,255,0.85)",
    shadow: "rgba(124,45,18,0.28)",
  },
} as const satisfies Record<string, PrefCardTheme>;

export type PrefCardThemeKey = keyof typeof PREF_CARD_THEMES;

export interface PrefCardRatioSpec {
  width: number;
  height: number;
  /** 対象県 bbox をこの倍率に拡げて contain フィット (周辺県の見え方を決める) */
  margin: number;
  /** 県名ピルのフォントサイズ */
  labelFs: number;
  /** ブランド行のフォントサイズ */
  brandFs: number;
}

/**
 * 比率キーは buzz-map (BUZZ_MAP_RATIOS) の命名に合わせる + OGP 専用 `ogp`。
 * - ogp: OGP / Twitter カード (1.91:1)
 * - 45 : IG フィード縦 (4:5)
 * - 11 : IG 正方形
 * - 916: IG リール / ストーリーズ (9:16)
 * - 169: YouTube / 横長 (16:9)
 */
export const PREF_CARD_RATIOS = {
  ogp: { width: 1200, height: 630, margin: 1.45, labelFs: 54, brandFs: 26 },
  "45": { width: 1080, height: 1350, margin: 1.6, labelFs: 62, brandFs: 30 },
  "11": { width: 1080, height: 1080, margin: 1.5, labelFs: 58, brandFs: 28 },
  "916": { width: 1080, height: 1920, margin: 1.7, labelFs: 64, brandFs: 30 },
  "169": { width: 1920, height: 1080, margin: 1.5, labelFs: 58, brandFs: 30 },
} as const satisfies Record<string, PrefCardRatioSpec>;

export type PrefCardRatioKey = keyof typeof PREF_CARD_RATIOS;

export const PREF_CARD_RATIO_KEYS = Object.keys(PREF_CARD_RATIOS) as PrefCardRatioKey[];

/** R2 (sns/pref-silhouette) へ push する既定テーマ。 */
export const PREF_CARD_PUSH_THEMES: readonly PrefCardThemeKey[] = ["blue", "dark"];

/** areas OGP (app/areas/<code>/ogp/ogp.png) に使うテーマ (単一固定)。 */
export const PREF_CARD_OGP_THEME: PrefCardThemeKey = "blue";

export const PREF_CARD_BRAND_TEXT = "stats47.jp 統計で見る都道府県";
