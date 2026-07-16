/**
 * buzz-map デザイントークン（★機械正本）
 *
 * まちの計量舎系「バズ地図カード」シリーズの固定ルック。
 * 運用規約・変更手順・カタログは `.claude/rules/buzz-map-standards.md`（人間正本）を参照。
 * 値を変えるときは本ファイルを編集し、standards の決定ログに日付付きで追記する。
 *
 * テーマは 3 種（spec.theme で選択・既定 blue）:
 *   - blue : 淡青の海＋白い陸（初期ルック）
 *   - dark : ダークネイビー「夜の日本」（ネオン強調・IG フィードでの停止力・本家と差別化）
 *   - paper: 生成り紙アトラス（朱×深緑・ヴィンテージ地図帳）
 * 各テーマ内の色は固定（テーマ = シリーズの顔）。テーマ追加・変更は決定ログとセット。
 */

export type BuzzMapTheme = "blue" | "dark" | "paper";

export interface BuzzMapPalette {
  /** 海＝カード地色 */
  sea: string;
  /** 陸ベース／二値の「非該当」 */
  land: string;
  /** 境界線 */
  landLine: string;
  /** 二値強調（人口・社会系テーマ） */
  accentSocial: string;
  /** 二値強調（インフラ・経済系テーマ） */
  accentInfra: string;
  /** カード内文字（主） */
  ink: string;
  /** カード内文字（従） */
  ink2: string;
  /** 凡例カード地 */
  legendBg: string;
  legendBorder: string;
}

export const BUZZ_MAP_THEMES: Record<BuzzMapTheme, BuzzMapPalette> = {
  /** 初期ルック。淡青の海＋白い陸（dataviz 検証済: social×infra CVD ΔE 13.4、海上 social 2.98:1 → 凡例件数必須） */
  blue: {
    sea: "#cde2fb",
    land: "#fcfcfb",
    landLine: "rgba(13,54,107,.22)",
    accentSocial: "#d55181",
    accentInfra: "#2a78d6",
    ink: "#14283c",
    ink2: "#4c6076",
    legendBg: "rgba(252,252,251,.92)",
    legendBorder: "rgba(13,54,107,.14)",
  },
  /** 夜の日本。ネオンピンク/シアンの強調が暗い地に浮かぶ */
  dark: {
    sea: "#101d31",
    land: "#223650",
    landLine: "rgba(160,190,225,.28)",
    accentSocial: "#ff6d9d",
    accentInfra: "#43c8ff",
    ink: "#eef4fb",
    ink2: "#9db2ca",
    legendBg: "rgba(18,32,52,.92)",
    legendBorder: "rgba(160,190,225,.25)",
  },
  /** 生成り紙アトラス。朱×深緑のヴィンテージ地図帳 */
  paper: {
    sea: "#f3ecdf",
    land: "#fdfaf3",
    landLine: "rgba(90,74,50,.28)",
    accentSocial: "#d64a2e",
    accentInfra: "#1e6f6b",
    ink: "#332a1e",
    ink2: "#75664f",
    legendBg: "rgba(253,250,243,.94)",
    legendBorder: "rgba(90,74,50,.2)",
  },
} as const;

/** 連続量ランプ（テーマごとの単色 7 段・明→暗。虹色禁止） */
export const BUZZ_MAP_RAMPS: Record<BuzzMapTheme, readonly string[]> = {
  blue: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"],
  // dark は暗→明（暗い地の上では「明るいほど高い」が自然）
  dark: ["#223650", "#28527e", "#2e6ea8", "#3a8bd0", "#43a8ea", "#5ec1f7", "#8fd8ff"],
  paper: ["#f3e4d2", "#eccdb3", "#e3ab87", "#d98a5e", "#cc6a3c", "#b84e26", "#96371a"],
} as const;

export const BUZZ_MAP_DEFAULT_THEME: BuzzMapTheme = "blue";

/** spec.theme → パレット解決（未指定は blue） */
export function buzzMapColors(theme?: BuzzMapTheme): BuzzMapPalette {
  return BUZZ_MAP_THEMES[theme ?? BUZZ_MAP_DEFAULT_THEME];
}

/** spec.theme → 連続量ランプ解決（未指定は blue） */
export function buzzMapRamp(theme?: BuzzMapTheme): readonly string[] {
  return BUZZ_MAP_RAMPS[theme ?? BUZZ_MAP_DEFAULT_THEME];
}

/** @deprecated 後方互換 alias。新規コードは buzzMapColors(spec.theme) を使う */
export const BUZZ_MAP_COLORS = BUZZ_MAP_THEMES.blue;
/** @deprecated 後方互換 alias。新規コードは buzzMapRamp(spec.theme) を使う */
export const BUZZ_MAP_RAMP = BUZZ_MAP_RAMPS.blue;

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
