/**
 * buzz-map デザイントークン（★機械正本）
 *
 * まちの計量舎系「バズ地図カード」シリーズの固定ルック。
 * 運用規約・変更手順・カタログは `.claude/rules/buzz-map-standards.md`（人間正本）を参照。
 * 値を変えるときは本ファイルを編集し、standards の決定ログに日付付きで追記する。
 *
 * 配色は dataviz 検証器で確認済み（accent social×infra: CVD ΔE 13.4、
 * 海色上の social は 2.98:1 のため凡例に件数ラベル必須）。
 */

export const BUZZ_MAP_COLORS = {
  /** 海＝カード地色。シリーズの「顔」。変更しない */
  sea: "#cde2fb",
  /** 陸ベース／二値の「非該当」 */
  land: "#fcfcfb",
  /** 境界線 */
  landLine: "rgba(13,54,107,.22)",
  /** 二値強調（人口・社会系テーマ） */
  accentSocial: "#d55181",
  /** 二値強調（インフラ・経済系テーマ） */
  accentInfra: "#2a78d6",
  /** カード内文字（主） */
  ink: "#14283c",
  /** カード内文字（従） */
  ink2: "#4c6076",
  /** 凡例カード地 */
  legendBg: "rgba(252,252,251,.92)",
  legendBorder: "rgba(13,54,107,.14)",
} as const;

/** 連続量ランプ（ブルー単色・明→暗の7段。虹色禁止） */
export const BUZZ_MAP_RAMP = [
  "#cde2fb",
  "#9ec5f4",
  "#6da7ec",
  "#3987e5",
  "#256abf",
  "#184f95",
  "#0d366b",
] as const;

export const BUZZ_MAP_FONT = {
  /** 本文（タイトル・凡例・出典）。public/buzz-map/fonts/ の同梱 woff2 を @font-face で読む */
  family: "'BuzzMapSans', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
  /** 数字（年カウンター・凡例件数）。Archivo Bold の数字+「年」サブセット */
  familyNum: "'BuzzMapNum', 'BuzzMapSans', 'Helvetica Neue', Arial, sans-serif",
} as const;

/** アスペクト比プリセット（書き出しキャンバス実寸） */
export const BUZZ_MAP_RATIOS = {
  /** X・IG フィード標準（静止画の既定） */
  "45": { width: 1080, height: 1350 },
  /** X 動画・IG 正方形 */
  "11": { width: 1080, height: 1080 },
  /** IG リール・TikTok */
  "916": { width: 1080, height: 1920 },
  /** YouTube・OGP（本土トリム・沖縄インセット非表示） */
  "169": { width: 1920, height: 1080 },
} as const;

export type BuzzMapRatio = keyof typeof BUZZ_MAP_RATIOS;

/** 型B（時系列アニメ）の既定値 */
export const BUZZ_MAP_REEL_DEFAULTS = {
  fps: 30,
  /** ラスト静止（サマリー表示）秒数 */
  holdSeconds: 2,
} as const;

/** 本土の投影に使う固定フレーム（経度・緯度）。小笠原・大東諸島等の外れ島は v1 では描画対象外 */
export const MAINLAND_BBOX = {
  west: 128.3,
  east: 146.3,
  south: 30.6,
  north: 45.9,
} as const;
