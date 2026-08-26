/**
 * チャート色の semantic role と resolver (CROSS-PAGE-DATA-SSOT-01 WP5)
 *
 * ThemeCatalog は色コード (#3b82f6 等) ではなく **意味 role** だけを持ち (2026-08-13 に 179 箇所を
 * 全移行)、実際の色は static/SVG resolver が決定的な固定 hex へ解決する。
 * 生成器 `transform.chartToPageComponent` が role→hex を解決し、生成物 page-components は
 * 解決済み hex を持つ。app 側 renderer は現状どおり hex を読む (無改修・目視回帰ゼロ)。
 *
 * choropleth (連続・発散) は別系統で `color-scheme-policy.ts` が正典。ここは categorical /
 * semantic チャート (line/mixed/composition/donut) の色 role。
 */

/** 全 categorical/semantic 色 role (runtime 配列 = 型と parity テストの単一ソース)。 */
export const CHART_COLOR_ROLES = [
  "population", // 人口・総数
  "male", // 男
  "female", // 女
  "danger", // 危険・死者
  "count", // 件数
  "improve", // 改善率・良化
  "neutral", // 中立
  "special", // 特殊
  "series-1",
  "series-2",
  "series-3",
  "series-4",
  "series-5",
  "series-6",
  // series-7..12: 多系列 (composition/donut/line) の追加パレット色。
  // 予約色 8 種の外にある 6 色を role 化して catalog の生色を 0 にするため (WP5)。
  "series-7",
  "series-8",
  "series-9",
  "series-10",
  "series-11",
  "series-12",
] as const;

export type ChartColorRole = (typeof CHART_COLOR_ROLES)[number];

/**
 * static/SVG resolver の正典 hex。theme-catalog-standards.md の予約色に対応。
 * `Record<ChartColorRole, string>` なので role を足すと**コンパイル時に**全 role の hex を要求する
 * (parity をコンパイルレベルでも保証)。
 */
export const CHART_COLOR_ROLE_HEX: Record<ChartColorRole, string> = {
  population: "#3b82f6",
  male: "#3b82f6",
  female: "#ec4899",
  danger: "#ef4444",
  count: "#f59e0b",
  improve: "#22c55e",
  neutral: "#6b7280",
  special: "#8b5cf6",
  "series-1": "#3b82f6",
  "series-2": "#f59e0b",
  "series-3": "#22c55e",
  "series-4": "#ec4899",
  "series-5": "#8b5cf6",
  "series-6": "#06b6d4",
  "series-7": "#0ea5e9",
  "series-8": "#14b8a6",
  "series-9": "#84cc16",
  "series-10": "#a855f7",
  "series-11": "#eab308",
  "series-12": "#f97316",
};

/** static/SVG 用: role → 決定的な固定 hex。 */
export function resolveChartColorHex(role: ChartColorRole): string {
  return CHART_COLOR_ROLE_HEX[role];
}

/** role として妥当か (catalog 検証・移行で使う)。 */
export function isChartColorRole(value: unknown): value is ChartColorRole {
  return typeof value === "string" && (CHART_COLOR_ROLES as readonly string[]).includes(value);
}

/**
 * 色を意味するオブジェクトキー (色 SSOT・baseline collector / resolver / validator が共有)。
 * ★色の判定は key 文脈で行う。単純な deep-walk だと e-Stat コード (`cdCat01: "#F01201"` 等) が
 *   hex 構文に一致して誤検出される (baseline-collector の注記参照)。真の色は下記キー配下のみ。
 */
export const COLOR_SCALAR_KEYS: ReadonlySet<string> = new Set([
  "color",
  "fill",
  "stroke",
  "backgroundColor",
]);
export const COLOR_ARRAY_KEYS: ReadonlySet<string> = new Set([
  "seriesColors",
  "lineColors",
  "columnColors",
  "colors",
  "palette",
]);

/** 生の色値と判定する文字列 (hex / hsl() / rgb())。CSS 変数・role 名は色値ではない。 */
export const COLOR_VALUE_RE = /^#[0-9a-fA-F]{3,8}$|^(?:hsl|hsla|rgb|rgba)\(/i;

/** 構文上、生の色値か (色キー文脈での enforcement 用。role 名は false)。 */
export function isRawColorValue(value: unknown): boolean {
  return typeof value === "string" && COLOR_VALUE_RE.test(value);
}

/**
 * catalog の hex → 正典 role (移行の逆写像・zero-regression の起点)。
 * 予約 8 色は semantic role、追加 6 色は series-7..12。key は小文字 hex。
 * ★この写像の値 role を `resolveChartColorHex` に通すと元の hex に戻る (テストで固定)。
 */
export const HEX_TO_ROLE: Record<string, ChartColorRole> = {
  "#3b82f6": "population", // 予約: 人口/男。多系列の第1色も兼ねる
  "#ec4899": "female", // 予約: 女
  "#ef4444": "danger", // 予約: 危険/死者
  "#f59e0b": "count", // 予約: 件数
  "#22c55e": "improve", // 予約: 改善
  "#6b7280": "neutral", // 予約: 中立
  "#8b5cf6": "special", // 予約: 特殊
  "#06b6d4": "series-6",
  "#0ea5e9": "series-7",
  "#14b8a6": "series-8",
  "#84cc16": "series-9",
  "#a855f7": "series-10",
  "#eab308": "series-11",
  "#f97316": "series-12",
};

/** hex → role (未知色は null)。大文字小文字を無視する。 */
export function roleForHex(hex: string): ChartColorRole | null {
  return HEX_TO_ROLE[hex.toLowerCase()] ?? null;
}

/** 単一の色値を解決する: role → hex、それ以外 (既に hex 等) は素通し。 */
function resolveColorValue(value: unknown): unknown {
  if (isChartColorRole(value)) return resolveChartColorHex(value);
  return value;
}

/** 色キー文脈にある不正な色値 (role でない文字列)。validator の enforcement 用。 */
export interface ColorFieldViolation {
  /** 問題の値 */
  value: string;
  /** 生色 (hex/hsl/rgb) か、未知の role 名 (typo 等) か */
  kind: "raw-color" | "unknown-role";
}

function pushViolation(value: unknown, acc: ColorFieldViolation[]): void {
  if (typeof value !== "string") return;
  if (isChartColorRole(value)) return; // 正しい role
  acc.push({ value, kind: isRawColorValue(value) ? "raw-color" : "unknown-role" });
}

/**
 * componentProps を deep-walk し、**色キー文脈**にある role でない値を集める (pure)。
 * 生 hex (raw-color) も未知 role 名 (unknown-role・typo) も両方拾う。
 * ★resolveComponentPropsColors は未知値を素通しするため、これで validator が弾かないと
 *   壊れた色文字列がそのまま生成物に焼き込まれる (concurrent review 2026-08-13 指摘)。
 */
export function collectColorFieldViolations(value: unknown): ColorFieldViolation[] {
  const acc: ColorFieldViolation[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) {
        if (COLOR_SCALAR_KEYS.has(k)) {
          pushViolation(val, acc);
        } else if (COLOR_ARRAY_KEYS.has(k) && Array.isArray(val)) {
          for (const item of val) pushViolation(item, acc);
        } else {
          walk(val);
        }
      }
    }
  };
  walk(value);
  return acc;
}

/**
 * componentProps を deep-walk し、**色キー文脈**の role を hex へ解決する (pure・非破壊)。
 *
 * catalog (SSOT) は色 role を持ち、生成物 page-components は解決済み hex を持つ。生成器
 * (transform.chartToPageComponent) がこれを通すことで、app 側 renderer は現状どおり hex を読む
 * (renderer 無改修・golden diff ゼロ)。色キー外 (statsDataId / cdCat01 の #-code 等) は触らない。
 */
export function resolveComponentPropsColors(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveComponentPropsColors(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (COLOR_SCALAR_KEYS.has(k)) {
        out[k] = resolveColorValue(v);
      } else if (COLOR_ARRAY_KEYS.has(k) && Array.isArray(v)) {
        out[k] = v.map((item) => resolveColorValue(item));
      } else {
        out[k] = resolveComponentPropsColors(v);
      }
    }
    return out;
  }
  return value;
}
