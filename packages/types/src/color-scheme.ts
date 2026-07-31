/**
 * コロプレス配色の語彙 SSOT (2026-07-31)。
 *
 * ## なぜ要るか
 *
 * 配色の語彙が 3 本に分裂し、**表記が非対称なせいで黙って既定色に落ちる**欠陥が
 * 2 つあった。どちらも例外も警告も出さないので、誰も気づかないまま配信されていた:
 *
 *   - `packages/svg-builder` は短縮名 (`Blues`) しか受けない。正式名 `interpolateBlues` を
 *     渡すと `interpolate` + `interpolateBlues` を引いて null になり、**全部赤**になる
 *   - `generate-mini-prefecture-svg.ts` の手書き `INTERPOLATORS` は 9 種しかなく、
 *     カタログ 46 種のうち **35 種が黙って青に落ちる** (OGP / サムネ)
 *
 * 語彙を 1 本にし、**両方向の変換**を提供することで表記の非対称を根絶する。
 *
 * ## 設計: ここに d3 を持ち込まない
 *
 * このモジュールが持つのは「文字列 → 文字列 + メタ」だけ。interpolator の解決
 * (d3-scale-chromatic への依存) は各描画側に残す。`@stats47/types` は葉パッケージで
 * data-configs / visualization / svg-builder のすべてが依存できるが、
 * ここに d3 を足すと Workers バンドルにまで波及するため。
 *
 * ## 生成時 throw / 実行時 warn の分離
 *
 * `assertKnownColorScheme` (throw) と `isKnownColorScheme` (bool) を**別関数**にしてある。
 * 生成側 (builder / 生成スクリプト) だけが assert を呼び、間違いをその場で止める。
 * 描画側は bool + warn に留める — 配色の不整合でページを白画面にはしない。
 */

export type ColorSchemeType = "sequential" | "diverging" | "categorical";

export interface ColorSchemeEntry {
  /** svg-builder が食う形。`interpolate` 接頭辞なし */
  short: string;
  /** metric config / R2 item.json に載る正典形 */
  canonical: string;
  /**
   * d3-scale-chromatic が実際に export している名前。
   *
   * ★ほとんどは canonical と同じだが、`interpolateCubehelix` だけは d3 に存在せず
   * `interpolateCubehelixDefault` が正しい。この不一致を消費者ごとの override マップで
   * 吸収していた (visualization の D3_NAME_OVERRIDES)。カタログが持てば特例は不要になる。
   */
  d3Key: string;
  type: ColorSchemeType;
  /** UI セレクタ用の日本語ラベル */
  label: string;
}

/** `interpolate<Name>` から `<Name>` を作る (categorical は `scheme<Name>`)。 */
function seq(short: string, label: string, d3Key?: string): ColorSchemeEntry {
  const canonical = `interpolate${short}`;
  return { short, canonical, d3Key: d3Key ?? canonical, type: "sequential", label };
}
function div(short: string, label: string): ColorSchemeEntry {
  const canonical = `interpolate${short}`;
  return { short, canonical, d3Key: canonical, type: "diverging", label };
}
function cat(short: string, label: string): ColorSchemeEntry {
  const canonical = `scheme${short}`;
  return { short, canonical, d3Key: canonical, type: "categorical", label };
}

/**
 * 配色カタログ (46 件)。
 *
 * 移行元は `packages/visualization/src/d3/constants/color-schemes.ts` の
 * SEQUENTIAL / DIVERGING / CATEGORICAL 3 配列。値・ラベル・type をそのまま持ち込み、
 * 短縮名を機械的に導出して**双方向**にした。
 */
export const COLOR_SCHEME_CATALOG: readonly ColorSchemeEntry[] = [
  // 単色グラデーション
  seq("Blues", "青"),
  seq("Greens", "緑"),
  seq("Greys", "グレー"),
  seq("Oranges", "オレンジ"),
  seq("Purples", "紫"),
  seq("Reds", "赤"),
  // マルチカラー系
  seq("BuGn", "青→緑"),
  seq("BuPu", "青→紫"),
  seq("GnBu", "緑→青"),
  seq("OrRd", "オレンジ→赤"),
  seq("PuBuGn", "紫→青→緑"),
  seq("PuBu", "紫→青"),
  seq("PuRd", "紫→赤"),
  seq("RdPu", "赤→紫"),
  seq("YlGnBu", "黄→緑→青"),
  seq("YlGn", "黄→緑"),
  seq("YlOrBr", "黄→橙→茶"),
  seq("YlOrRd", "黄→橙→赤"),
  // 知覚的に均一 (色覚異常対応)
  seq("Viridis", "Viridis"),
  seq("Plasma", "Plasma"),
  seq("Inferno", "Inferno"),
  seq("Magma", "Magma"),
  seq("Turbo", "Turbo"),
  seq("Cool", "Cool"),
  seq("Warm", "Warm"),
  seq("Cividis", "Cividis"),
  // d3 の実名は interpolateCubehelixDefault (canonical は既存 config 互換のため据え置き)
  seq("Cubehelix", "Cubehelix", "interpolateCubehelixDefault"),
  // 発散 (中央値を基準に両方向)
  div("BrBG", "茶→青緑"),
  div("PRGn", "紫→緑"),
  div("PiYG", "ピンク→黄緑"),
  div("PuOr", "紫→オレンジ"),
  div("RdBu", "赤→青"),
  div("RdGy", "赤→グレー"),
  div("RdYlBu", "赤→黄→青"),
  div("RdYlGn", "赤→黄→緑"),
  div("Spectral", "スペクトラル"),
  // カテゴリ (ランキング可視化では未使用。将来拡張用)
  cat("Category10", "Category 10色"),
  cat("Accent", "Accent"),
  cat("Dark2", "Dark2"),
  cat("Paired", "Paired"),
  cat("Pastel1", "Pastel1"),
  cat("Pastel2", "Pastel2"),
  cat("Set1", "Set1"),
  cat("Set2", "Set2"),
  cat("Set3", "Set3"),
  cat("Tableau10", "Tableau 10色"),
];

/** 既定値の単一定義。以前は 4 箇所に散在していた。 */
export const DEFAULT_SEQUENTIAL_SCHEME = "interpolateBlues";
export const DEFAULT_DIVERGING_SCHEME = "interpolateRdBu";

const BY_CANONICAL = new Map(COLOR_SCHEME_CATALOG.map((e) => [e.canonical, e]));
const BY_SHORT_LOWER = new Map(COLOR_SCHEME_CATALOG.map((e) => [e.short.toLowerCase(), e]));

/** 任意の表記 (短縮名・正式名・大小違い) からカタログ項目を引く。未知なら null。 */
export function findColorScheme(value: string | null | undefined): ColorSchemeEntry | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  return BY_CANONICAL.get(v) ?? BY_SHORT_LOWER.get(v.toLowerCase()) ?? null;
}

/** 任意の表記 → 正典形 (`interpolateBlues`)。未知なら null。 */
export function normalizeColorScheme(value: string | null | undefined): string | null {
  return findColorScheme(value)?.canonical ?? null;
}

/**
 * 任意の表記 → 短縮形 (`Blues`)。未知なら null。
 *
 * ★この方向の変換が存在しなかったことが、svg-builder に正式名を渡すと
 * 全部赤になる欠陥の原因だった。
 */
export function toShortColorScheme(value: string | null | undefined): string | null {
  return findColorScheme(value)?.short ?? null;
}

/** カタログに存在するか (描画側の warn 判定用)。 */
export function isKnownColorScheme(value: string | null | undefined): boolean {
  return findColorScheme(value) !== null;
}

/** d3-scale-chromatic の実キーを引く (消費者が override マップを持たなくて済む)。 */
export function d3KeyOfColorScheme(value: string | null | undefined): string | null {
  return findColorScheme(value)?.d3Key ?? null;
}

/** カタログの type を引く。未知なら null。 */
export function colorSchemeTypeOf(value: string | null | undefined): ColorSchemeType | null {
  return findColorScheme(value)?.type ?? null;
}

/**
 * 生成側のガード。未知なら**例外**にして、間違った色が焼き込まれる前に止める。
 *
 * @param context どこで起きたかを例外文に含める (例: `build-ranking-item(taxable-income)`)
 */
export function assertKnownColorScheme(value: string, context: string): string {
  const canonical = normalizeColorScheme(value);
  if (!canonical) {
    throw new Error(
      `未知のカラースキーム "${value}" (${context})。` +
        `COLOR_SCHEME_CATALOG (@stats47/types) の ${COLOR_SCHEME_CATALOG.length} 件から選ぶ。` +
        `正典: .claude/rules/blog-svg-chart-standards.md §3`,
    );
  }
  return canonical;
}
