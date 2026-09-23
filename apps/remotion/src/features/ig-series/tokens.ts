/**
 * IG シリーズ共通デザイントークン（direction A: ビビッド・カラーブロック）
 *
 * 承認済みモック `mock.html` の `.A` 系クラスを Remotion トークン化したもの。
 * カルーセル/リールはシリーズ（quiz/area/correlation/compare/map）ごとに
 * 塗りつぶし背景色（`bg`）だけが変わり、カード・ピル・フッターの構造は共通。
 *
 * 配色は __tests__/contrast.test.ts で機械検証する:
 * - `ink`（地色に直接載る 32px 以上の見出し等）は地色との contrast >= 3:1
 * - `inkSmall`（地色に直接載る 32px 未満のフッター等）は地色との contrast >= 4.5:1
 * - `accent`（白カード上で使う強調色）は白背景との contrast >= 4.5:1
 * トークン値を変える場合はテストを通してから変更すること（変えて良い箇所は #6 決定ログ相当として
 * このコメントを更新する）。
 */

export const IG_SERIES_IDS = ["quiz", "area", "correlation", "compare", "map"] as const;
export type IgSeriesId = (typeof IG_SERIES_IDS)[number];

export interface IgSeriesPalette {
  /** シリーズの地色（濃彩の塗りつぶし背景） */
  bg: string;
  /** 地色に直接載る大きい文字用インク（見出し・強調数値など、32px 以上） */
  ink: string;
  /** 地色に直接載る小さい文字用インク（フッター・出典など、32px 未満） */
  inkSmall: string;
  /** 白カード上で使う強調色（数値・倍率・アウトラインピルの文字色） */
  accent: string;
}

/** シリーズ別パレット（背景色は owner 承認の direction A 指定値） */
export const IG_SERIES: Record<IgSeriesId, IgSeriesPalette> = {
  /** 都道府県クイズ（予想クイズ型カルーセル・リール） */
  quiz: { bg: "#FFD21F", ink: "#111111", inkSmall: "#111111", accent: "#B45309" },
  /** 地元ランキング（県の全国1位/47位） */
  area: { bg: "#FF5B45", ink: "#FFFFFF", inkSmall: "#111111", accent: "#CC4937" },
  /** データの相関（散布図） */
  correlation: { bg: "#2F5BFF", ink: "#FFFFFF", inkSmall: "#FFFFFF", accent: "#2F5BFF" },
  /** 県どうしの比較 */
  compare: { bg: "#00B37E", ink: "#111111", inkSmall: "#111111", accent: "#007A56" },
  /** 地図カード / テーマ */
  map: { bg: "#7C3AED", ink: "#FFFFFF", inkSmall: "#FFFFFF", accent: "#7C3AED" },
};

/** 白カードの固定色・形状（シリーズによらず共通） */
export const IG_CARD = {
  background: "#FFFFFF",
  ink: "#111111",
  borderColor: "#111111",
  borderWidth: 6,
  radius: 28,
  /** 12px の硬いオフセット影（ぼかし無し） */
  shadow: "12px 12px 0 #111111",
} as const;

/** ソリッドピル（黒地・白文字）。全シリーズ共通の「都道府県クイズ」等の既定タグ */
export const IG_PILL_SOLID = { background: "#111111", ink: "#FFFFFF" } as const;

export const IG_FONT = {
  /** 見出し（和文）。Archivo Black は和文グリフを持たないため数字専用 */
  headline: "'Dela Gothic One', sans-serif",
  /** 強調数値（半角数字専用） */
  number: "'Archivo Black', sans-serif",
  /** 本文・注記 */
  body: "'Noto Sans JP', sans-serif",
  weight: { bold: 700, black: 900 },
} as const;

/**
 * Dela Gothic One / Archivo Black は Google Fonts 上で単一ウェイト（400）のみ配布されている。
 * 親要素の `fontWeight: 700/900` を継承させると Chromium が疑似ボールドを合成し、
 * 画数の多い漢字で線が潰れて読めなくなる（2026-09-23 実測: 見出し・県名が smear した）。
 * 見出し・数値を描画する要素は必ずこの style オブジェクトを展開し、太字を継承させないこと。
 * Noto Sans JP は実ウェイト 700/900 を配布しているのでこの制約を受けない
 * （`IG_FONT.weight.bold` / `.black` をそのまま使ってよい）。
 */
export const IG_HEADLINE_STYLE = {
  fontFamily: IG_FONT.headline,
  fontWeight: 400,
  fontSynthesis: "none",
} as const;

export const IG_NUMBER_STYLE = {
  fontFamily: IG_FONT.number,
  fontWeight: 400,
  fontSynthesis: "none",
} as const;
