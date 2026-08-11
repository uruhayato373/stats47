/**
 * タイルグリッドコロプレスマップ SVG 生成
 *
 * 47 都道府県を固定レイアウトのタイルに配置し、値に応じてセルを着色する。
 *
 * ## レイアウト（2026-07-31 改訂・正方形 720×720）
 *
 * 記事本文では `md:max-w-2xl` = 672px 幅の `<img>` として描画されるため、
 * 画面上の高さは `672 × H / W` で決まる。
 *
 * **旧 780×560 では左に 268px のテキストカラムを固定で確保していたが、それは地図を
 * 狭めていなかった。** タイル格子は 14列×16行の縦長なので、キャンバスが正方形以上に
 * 横長である限り**地図の大きさはキャンバスの高さだけで決まる**（実測: 左カラムを外して
 * 780×560 のままだとタイルは 30px で変わらない）。左カラムは余った幅を埋めていただけ。
 *
 * したがって「地図を大きくする」にはキャンバスを正方形に近づけるしかない。そのうえで、
 * タイル格子が**構造的に空ける 2 か所**へテキストを重ねて面積を使い切る。
 *
 * ```
 * ┌───────────────────────────────────┐
 * │ タイトル                ■ 北海道   │  左上 (列0-11 × 行0-5) は完全に空く
 * │ 1. 宮崎県  60.4 人   ■■■■■■        │  → タイトル + 上位3
 * │ 2. 大分県  54.9 人 ■■■■■■■■        │
 * │ 3. 群馬県  53.2 人■■■■■■           │
 * │                ■■■■                │
 * │            ■■■■      [凡例]        │  右下 (列5-13 × 行11-15) も空く
 * │        ■                           │  → 凡例
 * └───────────────────────────────────┘
 * ```
 *
 * 結果: タイル 30px → 39px（面積 +69%）。記事内の高さは 482px → 672px。
 * 「地図を大きくする ⟺ 記事内で縦に長くなる」の交換を、地図優先で決めた（2026-07-31 オーナー判断）。
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
 * - タイル内文字は**タイルの明度で白⇄濃紺を切り替える**（{@link tileInkFor}）
 * - タイトル・凡例等の文字は {@link CHROME_COLOR} → 白地 4.18:1 / 濃紺地 4.27:1
 *
 * 単色でライト・ダーク両方 4.5:1 を満たす色は存在しない（最良でも 4.22:1）。
 * ここは構造的な上限なので、`@media` を足して「改善」しようとしないこと。
 *
 * **タイル内文字を「全て白 + 黒縁」で固定していた旧仕様は 2026-07-31 に撤回した。**
 * カラーランプの淡い側は `rgb(239,246,255)` でほぼ白なので、白文字のコントラスト比は
 * 1.05:1 しかなく、可読性を縁取りだけが担っていて小さい字では縁が glyph を潰していた。
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
import { formatValueLabel, resolveValuePrecision } from "../shared/axis";
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
  /**
   * 各タイルに県名の下へ値も表示する（**省略時: true**）。
   *
   * 2026-07-31 に既定を反転した。地図を最大化した目的が「県名と値を読めるようにする」
   * ことなので、既定で値を出さないと目的を果たさない（実データの再生成で値が
   * 1 枚も入っていなかった）。値が読めないほどタイルが狭い場合は
   * `fitValueLabel` が単位を落とし、それでも入らなければ縮める。
   */
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
   * 左上に上位 3 県を出すか（省略時: true）。
   * 値の大小だけを機械的に並べる。指標の良し悪し（高い方が良いか）は判断しないので
   * 「良い/悪い」とは表記せず、順位の数字だけを出す。下位は出さない。
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

/**
 * 都道府県コード → 正式名称。
 *
 * タイル内は幅が無いので短縮名 (`item.name`) を使うが、**上位リストは正式名称で出す**
 * (「宮崎」ではなく「宮崎県」)。呼び元がどちらの形で name を渡してくるかに依存させたくないので、
 * コードから決定的に引く。
 */
const PREF_FULL_NAME: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
  "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
  "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
  "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
  "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
  "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
  "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
  "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
  "46": "鹿児島県", "47": "沖縄県",
};

/** 正式名称を引く (未知コードは呼び元の name にフォールバック)。 */
function fullNameOf(item: ChoroplethItem): string {
  return PREF_FULL_NAME[item.code.slice(0, 2).padStart(2, "0")] ?? item.name;
}

/**
 * タイル内に出す短縮名。**呼び元の `name` に依存させず、コードから決定的に作る。**
 *
 * 呼び元のデータは末尾の「県/府/都/道」を一律に落としていることがあり、
 * **北海道が「北海」になっていた** (2026-07-31 実データで確認)。「北海」は地名として
 * 存在しないので、道だけは落とさない。都・府・県は落として構わない (東京・大阪・京都)。
 */
function shortNameOf(item: ChoroplethItem): string {
  const full = PREF_FULL_NAME[item.code.slice(0, 2).padStart(2, "0")];
  if (!full) return item.name;
  return full === "北海道" ? full : full.replace(/[都府県]$/, "");
}

const GRID_COLS = 14;
const GRID_ROWS = 16;

// ─── キャンバス寸法 ──────────────────────────────────────────────
//
// ## 正方形キャンバス + 空きタイル領域へのオーバーレイ (2026-07-31 改訂)
//
// 旧版は左に 268px のテキストカラムを固定で確保していたが、**それは地図を狭めて
// いなかった**。タイル格子は 14列×16行の縦長なので、キャンバスが正方形以上に
// 横長である限り**地図の大きさはキャンバスの高さだけで決まる**。左カラムは
// 余った幅を埋めていただけだった (実測: 左カラムを外して 780×560 のままだと
// タイルは 30px で変わらない)。
//
// つまり「地図を大きくする」には**キャンバスを正方形に近づける**しかない。
// そのうえで、タイル格子が構造的に空ける 2 か所へテキストを重ねる:
//
//   左上 (列 0-11 × 行 0-5)  … 東北以外は行 6 から始まるので完全に空く → タイトル + 上位3
//   右下 (列 5-13 × 行 11-15) … 四国は列 3-4、九州は列 0-1 なので空く   → 凡例
//
// 結果: タイル 30px → 39px (面積 +69%)。記事内 (672px 幅) の高さは 482px → 672px。
// 「地図を大きくする ⟺ 記事内で縦に長くなる」の交換を、地図優先で決めた。

/** キャンバス。§5 タイルマップ標準 720×720 (正方形)。 */
const W = 720;
const TOTAL_H = 720;

/** キャンバス内側の余白。 */
const PAD = 18;

/**
 * 格子ピッチ。**幅と高さの両方に収まる最大値**を取る (縦長格子なので実際は高さが効く)。
 * ここを固定値にすると、キャンバスを変えたときに地図が追従しなくなる。
 */
const PITCH = Math.floor(Math.min((W - PAD * 2) / GRID_COLS, (TOTAL_H - PAD * 2) / GRID_ROWS));
/** タイル間の隙間（px）。ピッチに比例させて見た目の密度を保つ。 */
const GAP = Math.max(2, Math.round(PITCH * 0.07));
/** タイル 1 マスの辺長（px）。 */
const TILE = PITCH - GAP;

/** 地図ブロックの実寸。 */
const MAP_W = GRID_COLS * PITCH - GAP;
const MAP_H = GRID_ROWS * PITCH - GAP;

/** 地図ブロックの左上。余った幅は左に寄せてテキスト領域を広く取る。 */
const MAP_X = W - PAD - MAP_W;
const MAP_Y = TOTAL_H - PAD - MAP_H;

/** 左上テキスト（タイトル・上位3）。地図の空き領域に重なる。 */
const COL_X = PAD + 4;
/** 上位3 の値を右揃えする位置（左上の空き = 列 11 までに収める）。 */
const COL_W = MAP_X + 11 * PITCH - COL_X;

/** 凡例は右下の空きに置く。 */
const LEGEND_BAR_W = Math.min(200, Math.round(MAP_W * 0.44));
const LEGEND_BAR_H = 11;
const LEGEND_X = W - PAD - LEGEND_BAR_W - 4;
const LEGEND_Y = TOTAL_H - PAD - 32;

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
 * タイル内テキストのインク（文字色とハロー）。
 *
 * ## 明度で切り替える理由 (2026-07-31 改訂・実測)
 *
 * 旧版は「タイル内テキストは全て白 + 黒縁取り」で固定していた。しかしカラーランプの
 * 淡い側は `rgb(239,246,255)` でほぼ白なので、**白文字のコントラスト比は 1.05:1**
 * しかない。可読性を縁取りだけが担っていて、小さい字では縁が glyph を潰していた。
 *
 * ランプの下限を上げる案は、白文字が 4.5:1 を満たすには全タイルをかなり暗くする
 * 必要があり、淡→濃のランプ自体が壊れるため採らない。
 *
 * ## 色の選定 (ランプ全域で最悪ケースを実測)
 *
 * | インク | 文字 vs タイル 最小 |
 * |---|---|
 * | `#000000` / `#ffffff` | 4.59:1 (基準は満たすが硬い) |
 * | **`#16243a` / `#f5f8fc`** | **3.85:1** ← 採用 |
 * | `#233b5c` / `#eaf1fa` | 3.18:1 (ハローでも足りない) |
 *
 * 純黒/純白は基準を満たすが硬い。採用した組は文字とタイルの直接コントラストが
 * 3.85:1 で WCAG の文字対背景単体では基準未満だが、**ハローが glyph を完全に囲む**
 * ため実効の可読性は「文字 vs ハロー」(13:1 以上) と「ハロー vs タイル」(3:1 以上) で
 * 決まる。これ以上薄くすると、その橋渡しでも成立しない。
 */
const TILE_INK_DARK = "#16243a";
const TILE_INK_LIGHT = "#f5f8fc";

/** WCAG 相対輝度。 */
function relativeLuminance(r: number, g: number, b: number): number {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** `rgb(r,g,b)` 文字列から輝度を出す（interpolateColor の戻り値をそのまま渡す）。 */
function luminanceOfRgbString(rgb: string): number {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return 1;
  return relativeLuminance(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** タイル色に対して読みやすい方のインクを選ぶ。 */
export function tileInkFor(fill: string): { fill: string; halo: string } {
  const L = luminanceOfRgbString(fill);
  const contrast = (a: number, b: number) =>
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const Ldark = relativeLuminance(0x16, 0x24, 0x3a);
  const Llight = relativeLuminance(0xf5, 0xf8, 0xfc);
  return contrast(L, Ldark) >= contrast(L, Llight)
    ? { fill: TILE_INK_DARK, halo: TILE_INK_LIGHT }
    : { fill: TILE_INK_LIGHT, halo: "rgba(16,28,46,.92)" };
}

/**
 * 都道府県名のフォントサイズ。
 *
 * ## 全タイルで同じ大きさにする (2026-07-31 改訂)
 *
 * 旧版はタイルの実寸から個別に決めていたため、2 マス幅・2 マス高のタイル
 * (北海道・兵庫・岐阜・長野・千葉…) だけ字が 2 倍以上大きくなり、地図が騒がしく見えた
 * (実データで北海道 23px vs 1 マス 11px)。タイルグリッドは**どの県も同じ重みで**
 * 並べる図なので、字の大きさが県によって変わるのは意味が生じてしまう。
 *
 * そこで**基準は 1 マスタイル**で決め、全タイルに同じ値を使う。広いタイルは
 * 余白が広がるだけにする。1 マスに収まらない長い名前 (神奈川・和歌山・鹿児島) だけ
 * そのタイルで縮める。
 *
 * **高さの取り分は行数で変える**。値を出すときは県名 + 値の 2 行が入るので、
 * 県名に高さの 40% を割くと 2 行が収まらない。名前だけなら 40%、値も出すなら 32%。
 */
const TILE_TEXT_SCALE = 0.92;

/** 1 マスタイルを基準にした共通フォントサイズ。 */
function baseNameFontSize(tile: number, withValue: boolean): number {
  const byWidth = (tile - 6) / 2; // 2 文字 (最頻) が収まる幅
  const byHeight = tile * (withValue ? 0.32 : 0.4);
  return Math.round(Math.min(byWidth, byHeight) * TILE_TEXT_SCALE);
}

/** 共通サイズを基準に、そのタイルで名前がはみ出す場合だけ縮める。 */
function nameFontSize(name: string, w: number, base: number): number {
  const byWidth = (w - 6) / Math.max(textUnits(name), 1);
  return Math.max(6, Math.round(Math.min(base, byWidth)));
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
    formatValue,
    colorStops = COLOR_STOPS,
    scheme,
    reverse = false,
    showValue = true,
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
  // 桁数は 47 県全体で 1 度だけ決める。値ごとに決めると 60.4 と 44 が混ざって読み比べにくい
  // (2026-07-31。既定 formatValue は呼び元が渡さなければこれを使う)
  const fmtValue = formatValue ?? ((v: number) => formatValueLabel(v, resolveValuePrecision(values)));
  const lo = colorMin ?? Math.min(...values);
  const hi = colorMax ?? Math.max(...values);
  const toT = (v: number) => (hi === lo ? 0.5 : (v - lo) / (hi - lo));

  // ── タイル ──
  // 字の大きさは 1 マスタイルで 1 度だけ決め、全タイルで共有する (県ごとに変えない)
  const baseFont = baseNameFontSize(TILE, showValue);
  const tiles = Object.entries(TILE_GRID).map(([code, [col, row, cs, rs]]) => {
    const item = byCode.get(code);
    if (!item) return "";

    const x = MAP_X + col * PITCH;
    const y = MAP_Y + row * PITCH;
    const w = cs * PITCH - GAP;
    const h = rs * PITCH - GAP;

    const t = toT(item.value);
    const fill = colorOf(t);
    // タイル内の表示名はコードから決定的に作る (呼び元データの「北海」を持ち込まない)
    const tileName = shortNameOf(item);
    const nfs = nameFontSize(tileName, w, baseFont);

    const cx = x + w / 2;
    const valStr = fmtValue(item.value);
    // タイルの明度で文字色を切り替える (淡いタイルに白文字は 1.05:1 しかなく読めない)。
    // ハローは反対色にして glyph を囲む。縁は細くする — 太いと小さい字が潰れる。
    const ink = tileInkFor(fill);
    const strokeW = Math.max(1.1, nfs * 0.13).toFixed(1);

    const valueLabel = showValue
      ? fitValueLabel(valStr, safeUnit, w, Math.max(6, nfs - 2))
      : null;
    const tspans = showValue && valueLabel
      ? [
          `      <tspan x="${cx.toFixed(1)}" y="${(y + h / 2 - 0.5).toFixed(1)}" font-size="${nfs}" font-weight="700">${esc(tileName)}</tspan>`,
          `      <tspan x="${cx.toFixed(1)}" y="${(y + h / 2 + valueLabel.font + 1).toFixed(1)}" font-size="${valueLabel.font}" font-weight="600">${esc(valueLabel.text)}</tspan>`,
        ]
      : [
          // 名前を縦中央に配置（baseline = タイル中心 + cap-height 補正）
          `      <tspan x="${cx.toFixed(1)}" y="${(y + h / 2 + nfs * 0.38).toFixed(1)}" font-size="${nfs}" font-weight="700">${esc(tileName)}</tspan>`,
        ];

    return [
      `  <g aria-label="${esc(fullNameOf(item))} ${valStr}${esc(unit)}">`,
      `    <title>${esc(fullNameOf(item))}：${valStr}${esc(unit)}</title>`,
      `    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#ffffff" stroke-width="1"/>`,
      `    <text font-family="${FONT_FAMILY}" fill="${ink.fill}" text-anchor="middle" paint-order="stroke" stroke="${ink.halo}" stroke-width="${strokeW}" stroke-linejoin="round">`,
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

  // ── 左上: 上位 3 県 ──
  //
  // 下位は出さない (2026-07-31 オーナー判断)。左上の空きは有限で、6 行入れると
  // タイトルと合わせて地図の東北ブロックに掛かる。上位 3 件だけなら余裕に収まる。
  // 見出し (「多い順」等) も出さない — 1. 2. 3. の並びで自明なので行を使う価値がない。
  const rankLists: string[] = [];
  if (showRankList && items.length >= 3) {
    const top3 = [...items].sort((a, b) => b.value - a.value).slice(0, 3);
    const NAME_F = 17;
    const VAL_F = 17;
    const UNIT_F = 13;
    // 値カラムは**左カラムの右端ではなく、県名の実幅**で決める (2026-07-31)。
    // 右端に右揃えすると「東京都 …………… 9,320」と離れて 1 行として読めなくなる。
    // 3 行で最も長い県名 (神奈川県) に合わせて揃えるので、行同士の縦の揃いは保たれる。
    const nameEnd =
      COL_X +
      24 +
      Math.max(...top3.map((it) => textUnits(`1. ${fullNameOf(it)}`))) * NAME_F +
      14;
    const valW = Math.max(...top3.map((it) => textUnits(fmtValue(it.value)))) * VAL_F;
    let y = cursorY + 30;
    for (const [i, it] of top3.entries()) {
      y += 30;
      const sw = colorOf(toT(it.value));
      const valStr = fmtValue(it.value);
      // 値は右揃え (桁が揃う)、単位はその右に小さく置く
      const valX = nameEnd + valW;
      rankLists.push(
        `  <rect x="${COL_X}" y="${y - 13}" width="15" height="15" rx="2" fill="${sw}" stroke="#ffffff" stroke-width="1"/>`,
        `  <text x="${COL_X + 24}" y="${y}" font-family="${FONT_FAMILY}" font-size="${NAME_F}" font-weight="600" fill="${CHROME_COLOR}">${i + 1}. ${esc(fullNameOf(it))}</text>`,
        `  <text x="${valX.toFixed(1)}" y="${y}" font-family="${FONT_FAMILY}" font-size="${VAL_F}" font-weight="700" fill="${CHROME_COLOR}" text-anchor="end">${valStr}</text>`,
        `  <text x="${(valX + 5).toFixed(1)}" y="${y}" font-family="${FONT_FAMILY}" font-size="${UNIT_F}" fill="${CHROME_COLOR}">${esc(unit)}</text>`,
      );
    }
  }

  // ── 凡例（地図右下） ──
  const loStr = fmtValue(lo);
  const midStr = fmtValue((lo + hi) / 2);
  const hiStr = fmtValue(hi);
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
  // 右端ラベル ("高い" 等) はバーの右に左揃えで置くので、その幅だけ凡例全体を左へ寄せる。
  // 寄せないと CJK 2 文字 (font-size 11 で約 22px) がキャンバス W=720 の外へ出る
  // (2026-08-11 実測: x=704 開始で 6px はみ出し、右端が切れて読めなかった)。
  // ラベルは legendLabels でカスタムでき長さが変わるため、固定マージンではなく実測幅で寄せる。
  const legendX = LEGEND_X - Math.ceil(textUnits(legendLabels[1]) * 11) - 2;
  const barRight = legendX + LEGEND_BAR_W;

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
    `  <text x="${legendX - 6}" y="${LEGEND_Y + 8}" font-family="${FONT_FAMILY}" font-size="11" fill="${CHROME_COLOR}" text-anchor="end">${esc(legendLabels[0])}</text>`,
    `  <rect x="${legendX}" y="${LEGEND_Y}" width="${LEGEND_BAR_W}" height="${LEGEND_BAR_H}" rx="2" fill="url(#choropleth-lg)"/>`,
    `  <text x="${barRight + 6}" y="${LEGEND_Y + 8}" font-family="${FONT_FAMILY}" font-size="11" fill="${CHROME_COLOR}">${esc(legendLabels[1])}</text>`,
    `  <text x="${legendX}" y="${LEGEND_Y + 24}" font-family="${FONT_FAMILY}" font-size="${tickFont}" fill="${CHROME_COLOR}">${loStr}${esc(unit)}</text>`,
    showMid
      ? `  <text x="${legendX + LEGEND_BAR_W / 2}" y="${LEGEND_Y + 24}" font-family="${FONT_FAMILY}" font-size="${tickFont}" fill="${CHROME_COLOR}" text-anchor="middle">${midStr}${esc(unit)}</text>`
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
