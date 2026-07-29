/**
 * タイルグリッドコロプレスマップ SVG 生成
 *
 * 47 都道府県を固定レイアウトのタイルに配置し、値に応じてセルを着色する。
 *
 * ## レイアウト（2026-07-29 改訂）
 *
 * キャンバスは **780×560**（旧 600×700）。記事本文では `md:max-w-2xl` = 672px 幅の
 * `<img>` として描画されるため、画面上の高さは `672 × H / W` で決まる。
 * 旧 600×700 は画面上 784px になり記事を占有していた。780×560 なら 482px に収まる。
 *
 * タイルを小さくせず縦を詰めることはできない（47 タイルは 14×16 の格子で、
 * 格子自体が縦長のため）。そこでキャンバスを横長にし、空く左カラムへ
 * タイトルと上位/下位 3 県、地図右下の空白へ凡例を置いて面積を使い切る。
 *
 * ```
 * ┌──────────────┬───────────────────────────┐
 * │ タイトル      │            ■ 北海道        │
 * │ 上位3県       │        ■■■■■■             │
 * │ 下位3県       │    ■■■■■■■■               │
 * │              │  ■■■■        [凡例]        │
 * └──────────────┴───────────────────────────┘
 * ```
 *
 * ## 配色とテーマ
 *
 * **背景を敷かない（透過）。テーマ依存の色も使わない。** サイトのテーマは
 * `next-themes` の class 方式 (`enableSystem={false}` / `defaultTheme="light"`) で、
 * OS の `prefers-color-scheme` を意図的に無視する。一方 `<img>` 内の SVG は
 * 親ページの `.dark` class を参照できない。したがって SVG 側で
 * `@media (prefers-color-scheme:dark)` を使うと **OS とサイトが食い違ったとき
 * SVG だけ色が反転する**（OS ダーク + サイトライトで、明るい記事の中に濃紺の箱が出る）。
 *
 * 解決は「テーマに依存しない配色にする」こと:
 * - 背景 rect を描かない → ページの地色がそのまま透ける（ライト/ダーク両対応）
 * - タイル内文字は白 + 濃い縁取り + 影 → 淡色タイルでも濃色タイルでも読める
 * - タイトル・凡例等の文字は {@link CHROME_COLOR} → 白地 4.18:1 / 濃紺地 4.27:1
 *
 * 単色でライト・ダーク両方 4.5:1 を満たす色は存在しない（最良でも 4.22:1）。
 * ここは構造的な上限なので、`@media` を足して「改善」しようとしないこと。
 *
 * ## 使い方
 * ```ts
 * import { toChoroplethItems } from "../shared/stats-schema";
 * const items = toChoroplethItems(statsSchemaData);
 * const svg = generateChoroplethSvg(items, {
 *   title: "交通事故死者数（人口10万人あたり）",
 *   subtitle: "2023年度",
 *   unit: "人",
 * });
 * ```
 */

import { FONT_FAMILY } from "../shared/color";
import { formatValueLabel } from "../shared/axis";
// D3 カラースキーム (d3-scale-chromatic) を「生成時」に評価し、結果の rgb() を静的 SVG へ焼き込む。
// （SVG 実行時に D3 は不要。）依存はモノレポ root に hoist 済（migration-flow / remotion が宣言）。
import * as d3chromatic from "d3-scale-chromatic";

export interface ChoroplethItem {
  /** 都道府県コード "01"〜"47"（"01000" 形式も可） */
  code: string;
  /** 都道府県名 */
  name: string;
  /** 数値 */
  value: number;
}

export interface ChoroplethOptions {
  /** チャートタイトル */
  title: string;
  /** サブタイトル（年次・指標の説明など） */
  subtitle?: string;
  /** 凡例の単位テキスト（例: "人", "%"） */
  unit: string;
  /** aria-label（省略時: title） */
  ariaLabel?: string;
  /** カラースケール最小値（省略時: データ最小値） */
  colorMin?: number;
  /** カラースケール最大値（省略時: データ最大値） */
  colorMax?: number;
  /** 値フォーマット関数（省略時: formatTick） */
  formatValue?: (v: number) => string;
  /** カラーストップ（省略時: Reds）。`scheme` 指定時は無視される。 */
  colorStops?: Array<{ t: number; r: number; g: number; b: number }>;
  /**
   * D3 カラースキーム名（d3-scale-chromatic の `interpolate<Name>`）。
   * 例: "Reds" / "Blues" / "Greens" / "Oranges" / "Purples" / "Greys" /
   *     "Viridis" / "Magma" / "YlOrRd" / "BuPu" / "YlGnBu"（連続単/多色相）、
   *     "RdYlGn" / "RdBu" / "Spectral" / "BrBG" / "PuOr"（発散）など。
   * 指定時は `colorStops` より優先。未指定時は `colorStops`（既定 Reds）。
   */
  scheme?: string;
  /** カラースケールを反転する（高い値を淡色側にする等）。 */
  reverse?: boolean;
  /** 各タイルに県名の下へ値も表示する（省略時: false = 県名のみ）。 */
  showValue?: boolean;
  /**
   * 凡例の端ラベル（省略時: ["低い", "高い"]）。
   *
   * `["低い","高い"]` の配列形と `{ low, high }` のオブジェクト形の両方を受ける。
   * 実データに両方あるため（`yato-yatsu-place-name-boundary` はオブジェクト形）。
   * 旧実装は配列決め打ちで、オブジェクト形が来ると **本番 SVG に "undefined" と
   * 描画されていた**（2026-07-29 に実測で発見）。不正な形は既定値へフォールバックする。
   *
   * 意味的ラベル（"安全"/"危険" 等）は指標の意味が確実な場合のみ呼び元で明示指定する
   * （旧デフォルトの 安全/危険 は消費支出額マップ等で不適切だった）。
   */
  legendLabels?: [string, string] | { low: string; high: string };
  /**
   * 左カラムの上位・下位リストを出すか（省略時: true）。
   * 値の大小だけを機械的に並べるので、指標の良し悪しとは無関係に「高い順 / 低い順」と表記する。
   */
  showRankList?: boolean;
}

/** D3 スキーム名 → interpolator 関数を解決（無ければ null）。 */
function resolveInterp(scheme?: string): ((t: number) => string) | null {
  if (!scheme) return null;
  const fn = (d3chromatic as Record<string, unknown>)[`interpolate${scheme}`];
  return typeof fn === "function" ? (fn as (t: number) => string) : null;
}

// ─── タイル格子 ──────────────────────────────────────────────────

/**
 * 47 都道府県のタイル位置を **格子座標** で持つ: `[列, 行, 列スパン, 行スパン]`。
 *
 * 旧実装は 47 行の px 座標をベタ書きしていたためタイルサイズを変えられなかった。
 * 実測で完全な均等格子（ピッチ 38.167 / 原点 33,45・丸め誤差 0.0175px）と確認できたので
 * 格子表現に置き換えた。サイズ変更は {@link TILE} と {@link GAP} だけで済む。
 */
const TILE_GRID: Record<string, readonly [number, number, number, number]> = {
  "01": [12, 0, 2, 2], // 北海道
  "02": [12, 3, 2, 1], // 青森
  "03": [13, 4, 1, 1], // 岩手
  "04": [13, 5, 1, 1], // 宮城
  "05": [12, 4, 1, 1], // 秋田
  "06": [12, 5, 1, 1], // 山形
  "07": [12, 6, 2, 1], // 福島
  "08": [13, 7, 1, 1], // 茨城
  "09": [12, 7, 1, 1], // 栃木
  "10": [11, 7, 1, 1], // 群馬
  "11": [12, 8, 1, 1], // 埼玉
  "12": [13, 8, 1, 2], // 千葉
  "13": [12, 9, 1, 1], // 東京
  "14": [12, 10, 1, 1], // 神奈川
  "15": [10, 6, 2, 1], // 新潟
  "16": [9, 6, 1, 1], // 富山
  "17": [8, 6, 1, 1], // 石川
  "18": [8, 7, 1, 1], // 福井
  "19": [11, 8, 1, 1], // 山梨
  "20": [10, 7, 1, 2], // 長野
  "21": [9, 7, 1, 2], // 岐阜
  "22": [10, 9, 2, 1], // 静岡
  "23": [9, 9, 1, 1], // 愛知
  "24": [8, 9, 1, 2], // 三重
  "25": [8, 8, 1, 1], // 滋賀
  "26": [6, 8, 2, 1], // 京都
  "27": [6, 9, 1, 1], // 大阪
  "28": [5, 8, 1, 2], // 兵庫
  "29": [7, 9, 1, 1], // 奈良
  "30": [6, 10, 2, 1], // 和歌山
  "31": [4, 8, 1, 1], // 鳥取
  "32": [3, 8, 1, 1], // 島根
  "33": [4, 9, 1, 1], // 岡山
  "34": [3, 9, 1, 1], // 広島
  "35": [2, 8, 1, 2], // 山口
  "36": [4, 12, 1, 1], // 徳島
  "37": [4, 11, 1, 1], // 香川
  "38": [3, 11, 1, 1], // 愛媛
  "39": [3, 12, 1, 1], // 高知
  "40": [1, 10, 1, 1], // 福岡
  "41": [0, 10, 1, 1], // 佐賀
  "42": [0, 11, 1, 1], // 長崎
  "43": [0, 12, 1, 1], // 熊本
  "44": [1, 11, 1, 1], // 大分
  "45": [1, 12, 1, 1], // 宮崎
  "46": [0, 13, 2, 1], // 鹿児島
  "47": [0, 15, 1, 1], // 沖縄
};

const GRID_COLS = 14;
const GRID_ROWS = 16;

// ─── キャンバス寸法 ──────────────────────────────────────────────

/** タイル 1 マスの辺長（px）。 */
const TILE = 30;
/** タイル間の隙間（px）。 */
const GAP = 2;
/** 格子ピッチ。 */
const PITCH = TILE + GAP;

/** 地図ブロックの実寸。 */
const MAP_W = GRID_COLS * PITCH - GAP; // 446
const MAP_H = GRID_ROWS * PITCH - GAP; // 510

/** キャンバス。§5 タイルマップ標準 780×560。 */
const W = 780;
const TOTAL_H = 560;

/** 地図ブロックの左上（右寄せ。左カラムをテキストに使う）。 */
const MAP_X = W - MAP_W - 20; // 314
const MAP_Y = 24;

/** 左カラム（タイトル・上位/下位リスト）。 */
const COL_X = 22;
const COL_W = MAP_X - COL_X - 24; // 268

/**
 * 凡例は地図ブロック右下の空白に置く。
 * 格子の行 11 以降・列 5 以降にタイルが無いことを利用している
 * （四国は列 3-4、九州は列 0-1、沖縄は列 0）。
 */
const LEGEND_BAR_W = 150;
const LEGEND_BAR_H = 9;
const LEGEND_X = MAP_X + 5 * PITCH + 28; // 502
const LEGEND_Y = MAP_Y + 13 * PITCH + 8; // 448

// ─── 配色 ────────────────────────────────────────────────────────

const COLOR_STOPS = [
  { t: 0.0, r: 254, g: 229, b: 217 }, // #fee5d9
  { t: 0.5, r: 251, g: 106, b: 74 }, // #fb6a4a
  { t: 1.0, r: 165, g: 15, b: 21 }, // #a50f15
];

/**
 * タイトル・凡例など「地図以外の文字」の色。
 *
 * 白地 (#ffffff) に対し 4.18:1、ダーク地 (#0f172a) に対し 4.27:1。
 * ライト・ダーク双方で 4.5:1 を満たす単色は存在しない（最良 4.22:1）ため、
 * 両者の最小値を最大化する近傍から選んでいる。テーマ非依存にすることが目的で、
 * `@media (prefers-color-scheme)` で「改善」しようとすると冒頭の不具合が再発する。
 */
const CHROME_COLOR = "#6e7d94";

function interpolateColor(
  t: number,
  stops: Array<{ t: number; r: number; g: number; b: number }> = COLOR_STOPS,
): string {
  t = Math.max(0, Math.min(1, t));
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].t) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const s = (t - lo.t) / (hi.t - lo.t);
  const r = Math.round(lo.r + s * (hi.r - lo.r));
  const g = Math.round(lo.g + s * (hi.g - lo.g));
  const b = Math.round(lo.b + s * (hi.b - lo.b));
  return `rgb(${r},${g},${b})`;
}

/**
 * 都道府県名のフォントサイズ。
 *
 * 画面上では 672/780 = 0.86 倍で描画されるため、ここでの px は約 0.86 倍で見える。
 * タイル 30px に対し文字を大きめに取り、縮小後も読めるようにしている。
 */
function nameFontSize(name: string, w: number): number {
  if (w > TILE) return 14; // 北海道（2x2）
  if (name.length >= 3) return 8.5; // 神奈川・和歌山・鹿児島
  return 11;
}

/** 文字列の概算幅を em 単位で返す（CJK≈1em / ASCII・半角≈0.55em）。 */
function textUnits(text: string): number {
  return [...text].reduce((w, ch) => w + (/[ -~｡-ﾟ]/.test(ch) ? 0.55 : 1.0), 0);
}

/** 行頭に来ると不自然な文字（禁則の簡易版）。 */
const NO_LINE_START = /[）)】」』、。・％%ー]/;

/**
 * `showValue` のときタイル内に出す値ラベルを、タイル幅に収まる形に決める。
 *
 * 単位が長い指標（"ポイント差" 等）だと `0ポイント差` が 30px のタイルからはみ出して
 * 隣のタイルに重なる（2026-07-29 に `yato-yatsu-place-name-boundary` で実測）。
 * 優先順は「単位つきのまま」→「単位を落とす」→「縮める」。単位は凡例と上位/下位リストに
 * 出ているので、タイル内で落としても情報は失われない。
 */
function fitValueLabel(
  valStr: string,
  unit: string,
  tileW: number,
  startFont: number,
): { text: string; font: number } {
  const MIN = 5;
  const avail = tileW - 3;
  const withUnit = `${valStr}${unit}`;
  if (textUnits(withUnit) * startFont <= avail) return { text: withUnit, font: startFont };
  if (textUnits(valStr) * startFont <= avail) return { text: valStr, font: startFont };
  let f = startFont;
  while (f > MIN && textUnits(valStr) * f > avail) f -= 0.5;
  return { text: valStr, font: Math.max(MIN, Math.round(f * 10) / 10) };
}

/**
 * タイトルを左カラム幅に収める。1 行で入らなければ 2 行に折り返す。
 *
 * フォントを縮めるだけだと長いタイトルが 13px まで落ちて読めなくなる。
 * 2 行にすれば 1 行あたりの文字数が半減し、大きいフォントを保てる。
 * 折返し位置は「2 行の長い方を最小化する」位置を選び、行頭禁則だけ避ける。
 */
function fitTitleLines(
  text: string,
  availW: number,
  maxF: number,
  minF: number,
): { lines: string[]; font: number } {
  const chars = [...text];
  const total = textUnits(text);
  if (total <= 0) return { lines: [text], font: maxF };

  const oneLineFont = Math.min(maxF, availW / total);
  if (oneLineFont >= minF) {
    return { lines: [text], font: Math.floor(oneLineFont * 10) / 10 };
  }

  // 2 行: 長い方の行が最短になる分割点を探す（行頭禁則に当たる位置は避ける）
  let best: { at: number; widest: number } | null = null;
  for (let i = 1; i < chars.length; i++) {
    if (NO_LINE_START.test(chars[i])) continue;
    const a = textUnits(chars.slice(0, i).join(""));
    const b = textUnits(chars.slice(i).join(""));
    const widest = Math.max(a, b);
    if (!best || widest < best.widest) best = { at: i, widest };
  }
  if (!best) return { lines: [text], font: minF };

  const font = Math.max(minF, Math.min(maxF, Math.floor((availW / best.widest) * 10) / 10));
  return {
    lines: [chars.slice(0, best.at).join(""), chars.slice(best.at).join("")],
    font,
  };
}

/**
 * 凡例の端ラベルを正規化する。配列形 / `{low,high}` オブジェクト形 / 不正値を受け、
 * 常に `[string, string]` を返す。文字列でない要素は既定値へ落とす
 * （不正値をそのまま埋めると SVG に "undefined" と描画される）。
 */
function normalizeLegendLabels(
  input: [string, string] | { low: string; high: string } | undefined,
): [string, string] {
  const fallback: [string, string] = ["低い", "高い"];
  const pick = (v: unknown, i: 0 | 1): string =>
    typeof v === "string" && v.length > 0 ? v : fallback[i];
  if (Array.isArray(input)) return [pick(input[0], 0), pick(input[1], 1)];
  if (input && typeof input === "object") {
    return [pick((input as { low?: unknown }).low, 0), pick((input as { high?: unknown }).high, 1)];
  }
  return fallback;
}

/** XML 特殊文字のエスケープ（タイトル等に & や < が来ても壊さない）。null 安全。 */
function esc(s: string | undefined | null): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── 公開関数 ────────────────────────────────────────────────────

/**
 * タイルグリッドコロプレスマップ SVG を生成する
 */
export function generateChoroplethSvg(
  items: ChoroplethItem[],
  options: ChoroplethOptions,
): string {
  const {
    title,
    subtitle,
    unit,
    ariaLabel = title,
    colorMin,
    colorMax,
    formatValue = (v) => formatValueLabel(v, 1),
    colorStops = COLOR_STOPS,
    scheme,
    reverse = false,
    showValue = false,
    legendLabels: rawLegendLabels,
    showRankList = true,
  } = options;
  const legendLabels = normalizeLegendLabels(rawLegendLabels);
  const safeUnit = typeof unit === "string" ? unit : "";

  // 色の解決: scheme（D3）指定時は interpolator、無ければ colorStops。reverse で反転。
  const interp = resolveInterp(scheme);
  const colorOf = (t: number): string => {
    const tt = reverse ? 1 - t : t;
    return interp ? interp(tt) : interpolateColor(tt, colorStops);
  };

  // コードを 2 桁に正規化（"01000" → "01"）
  const byCode = new Map(
    items.map((d) => [d.code.slice(0, 2).padStart(2, "0"), d]),
  );

  const values = items.map((d) => d.value);
  const lo = colorMin ?? Math.min(...values);
  const hi = colorMax ?? Math.max(...values);
  const toT = (v: number) => (hi === lo ? 0.5 : (v - lo) / (hi - lo));

  // ── タイル ──
  const tiles = Object.entries(TILE_GRID).map(([code, [col, row, cs, rs]]) => {
    const item = byCode.get(code);
    if (!item) return "";

    const x = MAP_X + col * PITCH;
    const y = MAP_Y + row * PITCH;
    const w = cs * PITCH - GAP;
    const h = rs * PITCH - GAP;

    const t = toT(item.value);
    const fill = colorOf(t);
    const nfs = nameFontSize(item.name, w);

    const cx = x + w / 2;
    const valStr = formatValue(item.value);
    // テキストは全て白。濃い縁取り(paint-order stroke)+ ソフトシャドウで
    // 淡色タイルでも背景に依らず読めるようにする（白/黒の切替はしない）。
    const strokeW = Math.max(1.1, nfs * 0.18).toFixed(1);

    const valueLabel = showValue
      ? fitValueLabel(valStr, safeUnit, w, Math.max(6, nfs - 2))
      : null;
    const tspans = showValue && valueLabel
      ? [
          `      <tspan x="${cx.toFixed(1)}" y="${(y + h / 2 - 0.5).toFixed(1)}" font-size="${nfs}" font-weight="700">${esc(item.name)}</tspan>`,
          `      <tspan x="${cx.toFixed(1)}" y="${(y + h / 2 + valueLabel.font + 1).toFixed(1)}" font-size="${valueLabel.font}" font-weight="600">${esc(valueLabel.text)}</tspan>`,
        ]
      : [
          // 名前を縦中央に配置（baseline = タイル中心 + cap-height 補正）
          `      <tspan x="${cx.toFixed(1)}" y="${(y + h / 2 + nfs * 0.38).toFixed(1)}" font-size="${nfs}" font-weight="700">${esc(item.name)}</tspan>`,
        ];

    return [
      `  <g aria-label="${esc(item.name)} ${valStr}${esc(unit)}">`,
      `    <title>${esc(item.name)}：${valStr}${esc(unit)}</title>`,
      `    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#ffffff" stroke-width="1"/>`,
      `    <text font-family="${FONT_FAMILY}" fill="#ffffff" text-anchor="middle" paint-order="stroke" stroke="#1f2937" stroke-width="${strokeW}" stroke-linejoin="round" filter="url(#txt-halo-dark)">`,
      ...tspans,
      `    </text>`,
      `  </g>`,
    ].join("\n");
  });

  // ── 左カラム: タイトル ──
  const { lines: titleLines, font: titleFont } = fitTitleLines(title, COL_W, 19, 13);
  let cursorY = 46;
  const head: string[] = [];
  for (const line of titleLines) {
    head.push(
      `  <text x="${COL_X}" y="${cursorY}" font-family="${FONT_FAMILY}" font-size="${titleFont}" font-weight="bold" fill="${CHROME_COLOR}">${esc(line)}</text>`,
    );
    cursorY += titleFont + 5;
  }
  cursorY -= titleFont + 5; // 最終行の baseline に戻す
  if (subtitle) {
    // サブタイトルもタイトルと同じ扱いで折り返す。実データに
    // `居住地名1000件あたりの差 (谷戸share − 谷津share)` のような長いものがあり、
    // 固定 12px のままだと左カラムをはみ出して地図に重なる。
    const { lines: subLines, font: subFont } = fitTitleLines(subtitle, COL_W, 12, 9);
    for (const line of subLines) {
      cursorY += subFont + 8;
      head.push(
        `  <text x="${COL_X}" y="${cursorY}" font-family="${FONT_FAMILY}" font-size="${subFont}" fill="${CHROME_COLOR}">${esc(line)}</text>`,
      );
    }
  }

  // ── 左カラム: 高い順 / 低い順 3 県 ──
  // 値の大小を機械的に並べるだけ。指標の良し悪し（高い方が良いか）は判断しない。
  const rankLists: string[] = [];
  if (showRankList && items.length >= 3) {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const groups: Array<{ label: string; rows: ChoroplethItem[] }> = [
      { label: "高い順", rows: sorted.slice(0, 3) },
      { label: "低い順", rows: sorted.slice(-3).reverse() },
    ];

    let y = cursorY + 34;
    for (const g of groups) {
      rankLists.push(
        `  <text x="${COL_X}" y="${y}" font-family="${FONT_FAMILY}" font-size="11" font-weight="600" fill="${CHROME_COLOR}" letter-spacing="0.06em">${g.label}</text>`,
      );
      y += 8;
      for (const it of g.rows) {
        y += 22;
        const sw = colorOf(toT(it.value));
        rankLists.push(
          `  <rect x="${COL_X}" y="${y - 10}" width="12" height="12" rx="2" fill="${sw}" stroke="#ffffff" stroke-width="1"/>`,
          `  <text x="${COL_X + 19}" y="${y}" font-family="${FONT_FAMILY}" font-size="13" font-weight="600" fill="${CHROME_COLOR}">${esc(it.name)}</text>`,
          `  <text x="${COL_X + COL_W}" y="${y}" font-family="${FONT_FAMILY}" font-size="12" fill="${CHROME_COLOR}" text-anchor="end">${formatValue(it.value)}${esc(unit)}</text>`,
        );
      }
      y += 30;
    }
  }

  // ── 凡例（地図右下） ──
  const loStr = formatValue(lo);
  const midStr = formatValue((lo + hi) / 2);
  const hiStr = formatValue(hi);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const gradientStops = interp
    ? [0, 0.25, 0.5, 0.75, 1]
        .map((t) => `      <stop offset="${t * 100}%" stop-color="${colorOf(t)}"/>`)
        .join("\n")
    : colorStops
        .map(
          (s) =>
            `      <stop offset="${Math.round(s.t * 100)}%" stop-color="#${toHex(s.r)}${toHex(s.g)}${toHex(s.b)}"/>`,
        )
        .join("\n");
  const barRight = LEGEND_X + LEGEND_BAR_W;

  // 目盛りラベルの衝突回避。単位が長い指標（"百万円" 等）で最小・中間・最大が
  // 重なって読めなくなる（実測: 5,802,432百万円 の 3 ラベルが完全に重なった）。
  // 決定的に: ①フォントを 10→8 まで縮めて収まるか試す ②それでも無理なら中間を落とす。
  const tickLabels = [`${loStr}${safeUnit}`, `${midStr}${safeUnit}`, `${hiStr}${safeUnit}`];
  let tickFont = 10;
  let showMid = true;
  const fitsWithMid = (f: number) =>
    textUnits(tickLabels[0]) * f + (textUnits(tickLabels[1]) * f) / 2 <= LEGEND_BAR_W / 2 - 4 &&
    textUnits(tickLabels[2]) * f + (textUnits(tickLabels[1]) * f) / 2 <= LEGEND_BAR_W / 2 - 4;
  const fitsWithoutMid = (f: number) =>
    (textUnits(tickLabels[0]) + textUnits(tickLabels[2])) * f <= LEGEND_BAR_W - 6;
  while (tickFont > 8 && !fitsWithMid(tickFont)) tickFont -= 0.5;
  if (!fitsWithMid(tickFont)) {
    showMid = false;
    while (tickFont > 7 && !fitsWithoutMid(tickFont)) tickFont -= 0.5;
  }

  const legend = [
    `  <defs>`,
    `    <linearGradient id="choropleth-lg" x1="0" x2="1">`,
    gradientStops,
    `    </linearGradient>`,
    `    <filter id="txt-halo-dark" x="-40%" y="-40%" width="180%" height="180%">`,
    `      <feDropShadow dx="0" dy="0" stdDeviation="1.3" flood-color="#000000" flood-opacity="0.7"/>`,
    `    </filter>`,
    `  </defs>`,
    `  <text x="${LEGEND_X - 6}" y="${LEGEND_Y + 8}" font-family="${FONT_FAMILY}" font-size="11" fill="${CHROME_COLOR}" text-anchor="end">${esc(legendLabels[0])}</text>`,
    `  <rect x="${LEGEND_X}" y="${LEGEND_Y}" width="${LEGEND_BAR_W}" height="${LEGEND_BAR_H}" rx="2" fill="url(#choropleth-lg)"/>`,
    `  <text x="${barRight + 6}" y="${LEGEND_Y + 8}" font-family="${FONT_FAMILY}" font-size="11" fill="${CHROME_COLOR}">${esc(legendLabels[1])}</text>`,
    `  <text x="${LEGEND_X}" y="${LEGEND_Y + 24}" font-family="${FONT_FAMILY}" font-size="${tickFont}" fill="${CHROME_COLOR}">${loStr}${esc(unit)}</text>`,
    showMid
      ? `  <text x="${LEGEND_X + LEGEND_BAR_W / 2}" y="${LEGEND_Y + 24}" font-family="${FONT_FAMILY}" font-size="${tickFont}" fill="${CHROME_COLOR}" text-anchor="middle">${midStr}${esc(unit)}</text>`
      : "",
    `  <text x="${barRight}" y="${LEGEND_Y + 24}" font-family="${FONT_FAMILY}" font-size="${tickFont}" fill="${CHROME_COLOR}" text-anchor="end">${hiStr}${esc(unit)}</text>`,
  ].filter(Boolean);

  // 背景 rect は敷かない（透過 = ページの地色に追従）。冒頭の「配色とテーマ」参照。
  return `<svg width="${W}" height="${TOTAL_H}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${TOTAL_H}" role="img" aria-label="${esc(ariaLabel)}">
  <title>${esc(title)}</title>${subtitle ? `\n  <desc>${esc(subtitle)}</desc>` : ""}
${head.join("\n")}
${rankLists.join("\n")}
${tiles.filter(Boolean).join("\n")}
${legend.join("\n")}
</svg>`;
}
