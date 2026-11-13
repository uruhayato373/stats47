/**
 * チャートのレイアウト計算ユーティリティ
 */

export interface ChartMargins {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export interface ChartLayout extends ChartMargins {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
}

/**
 * マージンから描画領域（InnerSize）を算出する
 *
 * @param width - 全体の幅
 * @param height - 全体の高さ
 * @param margins - マージン
 * @returns レイアウト情報
 */
export function computeChartLayout(
  width: number,
  height: number,
  margins: ChartMargins
): ChartLayout {
  return {
    ...margins,
    width,
    height,
    innerWidth: Math.max(0, width - margins.marginLeft - margins.marginRight),
    innerHeight: Math.max(0, height - margins.marginTop - margins.marginBottom),
  };
}

/**
 * 基準サイズに対する比率でマージンを計算する
 *
 * @param width - 現在の幅
 * @param height - 現在の高さ
 * @param baseRatio - 基準となる比率 (例: { left: 100/800, top: 30/500, ... })
 * @returns 計算されたマージン
 */
export function computeMarginsByRatio(
  width: number,
  height: number,
  ratios: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }
): ChartMargins {
  return {
    marginTop: Math.round(height * ratios.top),
    marginRight: Math.round(width * ratios.right),
    marginBottom: Math.round(height * ratios.bottom),
    marginLeft: Math.round(width * ratios.left),
  };
}

/**
 * 基準サイズ (base = min(width, height)) に対する比率でフォントサイズを計算する
 *
 * @param width - 幅
 * @param height - 高さ
 * @param ratio - 比率
 * @param minFontSize - 最小フォントサイズ (デフォルト: 8)
 * @returns 計算されたフォントサイズ
 */
export function computeFontSize(
  width: number,
  height: number,
  ratio: number,
  minFontSize: number = 12
): number {
  const base = Math.min(width, height);
  return Math.max(minFontSize, Math.round(base * ratio));
}

/**
 * 文字列の描画幅をフォントサイズから見積もる。
 * 英数字・記号は 0.6em、それ以外 (万・億・％ などの全角) は 1em とする。
 * SSR では getComputedTextLength が使えないため、実測ではなく見積もりで余白を決める。
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) em += /[\x20-\x7e]/.test(ch) ? 0.6 : 1;
  return em * fontSize;
}

/** d3 の axisLeft がラベルを軸から離す距離 (tickSize 6 + tickPadding 3) に、各チャートの dx -4 と余裕 3 を足した値 */
const LEFT_AXIS_LABEL_OFFSET = 16;

/**
 * 縦軸の目盛りラベルが左端で切れない左余白を返す。比率で決めた余白が足りるならそのまま使う。
 * 幅の狭いグラフで「1,400万」の先頭が切れて「400万」と読めた (2026-09-25) ための下限。
 */
export function leftMarginForTickLabels(
  labels: string[],
  fontSize: number,
  minimum: number,
): number {
  const widest = Math.max(0, ...labels.map((label) => estimateTextWidth(label, fontSize)));
  return Math.max(minimum, Math.ceil(widest + LEFT_AXIS_LABEL_OFFSET));
}

/** 右軸の目盛りラベルが右端で切れない右余白。左軸と同じ距離 (目盛り線 + 余白) で見積もる */
export const rightMarginForTickLabels = leftMarginForTickLabels;

/**
 * 画面上で読める文字の下限 (CSS px)。軸・単位・ラベルの文字はこれを下回らない。
 * 完了条件は 10px 以上。描画後に `fitSvgViewBox` が viewBox を数 % 広げると表示倍率がその分だけ
 * 下がるので、1px の余裕を持たせて 11 にしている。
 */
export const MIN_READABLE_TEXT_PX = 11;

/**
 * viewBox を縮めて表示しても、画面上で `minScreenPx` を下回らない文字サイズ (viewBox 単位) を返す。
 * 幅 800 の viewBox をスマホの幅 (約 293〜340px) に縮めると、12 の文字は約 5px になる
 * (2026-09-25 CHART-AXIS-READABILITY-01)。表示倍率から文字サイズを逆算して下限を守る。
 *
 * @param renderedScale - 表示幅 / viewBox の幅。測れていない (0・非有限) ときは基準のまま返す
 */
export function readableFontSize(
  baseFontSize: number,
  renderedScale: number,
  minScreenPx: number = MIN_READABLE_TEXT_PX,
): number {
  if (!Number.isFinite(renderedScale) || renderedScale <= 0) return baseFontSize;
  return Math.max(baseFontSize, Math.ceil(minScreenPx / renderedScale));
}

/** d3 の axisBottom が目盛りの文字を軸から離す距離 (tickSize 6 + tickPadding 3) */
const BOTTOM_AXIS_LABEL_OFFSET = 9;
/** 横軸の文字の dy の下限。基準の文字 (12) で従来の 8 になる */
const X_TICK_LABEL_MIN_DY = 8;
/** 軸の頭の単位の文字を、プロット領域の上端から離す距離 */
const AXIS_UNIT_GAP = 8;
/** 縦軸の目盛りの間隔の下限 (viewBox 単位)。基準の文字で従来の 40 になる */
const Y_TICK_MIN_SPACING = 40;

/**
 * 横軸の目盛りの文字を下げる量 (dy)。固定の 8 のまま文字だけ大きくすると、文字の上半分がプロット領域に
 * 食い込む。最初の区分が目盛りのとき、そのラベルは縦軸の一番下の目盛り (基線の高さにある「0」など) の
 * 真下まで左へ伸びるので、縦軸の文字の下端 (基線から約 0.57em) と横軸の文字の上端 (ベースラインから
 * 約 0.88em) が触れない距離まで下げる。
 */
export function xTickLabelDy(fontSize: number): number {
  return Math.max(X_TICK_LABEL_MIN_DY, Math.floor(fontSize * 1.45 - BOTTOM_AXIS_LABEL_OFFSET));
}

/** 横軸の目盛りの文字が下端で切れない下余白を返す。比率で決めた余白が足りるならそのまま使う */
export function bottomMarginForTickLabels(fontSize: number, minimum: number): number {
  const baseline = BOTTOM_AXIS_LABEL_OFFSET + xTickLabelDy(fontSize);
  return Math.max(minimum, Math.ceil(baseline + fontSize * 0.3));
}

/** 軸の頭に置く単位の文字のベースライン (プロット領域の上端からの距離を引いた y) */
export function axisUnitBaseline(marginTop: number): number {
  return marginTop - AXIS_UNIT_GAP;
}

/** 軸の頭に置く単位の文字が上端で切れない上余白を返す。比率で決めた余白が足りるならそのまま使う */
export function topMarginForAxisUnit(fontSize: number, minimum: number): number {
  return Math.max(minimum, Math.ceil(AXIS_UNIT_GAP + fontSize * 0.9));
}

/** 縦軸の目盛りの数。文字が大きいときは間隔を広げ、隣の目盛りの文字と重ねない */
export function yTickCount(innerHeight: number, fontSize: number): number {
  return innerHeight / Math.max(Y_TICK_MIN_SPACING, fontSize * 1.8);
}

/** 横軸の目盛りの候補。position は viewBox 上の x (ラベルの中心) */
export interface TickLabelCandidate {
  value: string;
  label: string;
  position: number;
  /** 年のコード (例: "2020" / "2020100000")。あれば value より優先して年の間隔の判定に使う */
  yearCode?: string | number;
}

/** 隣り合うラベルの間に空ける幅 (文字サイズに対する比) */
const TICK_LABEL_GAP_RATIO = 0.5;

/** 隣り合う目盛りのラベルが重ならずに並ぶか */
export function tickLabelsFit(ticks: readonly TickLabelCandidate[], fontSize: number): boolean {
  const gap = fontSize * TICK_LABEL_GAP_RATIO;
  for (let i = 1; i < ticks.length; i += 1) {
    const needed =
      (estimateTextWidth(ticks[i - 1].label, fontSize) + estimateTextWidth(ticks[i].label, fontSize)) / 2 + gap;
    if (ticks[i].position - ticks[i - 1].position < needed) return false;
  }
  return true;
}

/**
 * ラベルが重ならなくなるまで等間隔 (n 個おき) に間引く。最後の目盛り (最新の年) を必ず残す。
 * 不等間隔に残すと、目盛りの間隔から年の幅を読み違える。
 */
export function thinTickLabels<T extends TickLabelCandidate>(ticks: readonly T[], fontSize: number): T[] {
  for (let step = 1; step < ticks.length; step += 1) {
    const kept = ticks.filter((_, index) => (ticks.length - 1 - index) % step === 0);
    if (tickLabelsFit(kept, fontSize)) return kept;
  }
  return ticks.slice(-1);
}

/** 年の目盛りの間隔の候補。5 年ごとで重なるときは切りのよい間隔へ広げる */
const YEAR_TICK_INTERVALS = [5, 10, 20, 50, 100] as const;

export interface CategoryTickOptions {
  /** 呼び出し側が明示した目盛り (月次など)。重なるときだけ等間隔に間引く */
  explicit?: readonly string[];
  /** この件数以下なら全ての区分を目盛りにする (5 年刻みから外れる調査年を落とさない) */
  showAllUpTo?: number;
  /** 年として読める区分が無いときの目盛り。ends = 両端 / all = 全件 / none = 出さない */
  fallback: "ends" | "all" | "none";
}

/**
 * 時系列の横軸に出す目盛りを選ぶ。既定は 5 年ごと。ラベルの幅と目盛りの位置から、重なるときは
 * 10 年・20 年…と広げる。文字を大きくする縮小表示と、等倍表示とで同じ規則を使う。
 */
export function selectCategoryTicks(
  categories: readonly TickLabelCandidate[],
  fontSize: number,
  options: CategoryTickOptions,
): string[] {
  const values = (ticks: readonly TickLabelCandidate[]) => ticks.map((tick) => tick.value);

  if (options.explicit) {
    const explicit = new Set(options.explicit);
    return values(thinTickLabels(categories.filter((category) => explicit.has(category.value)), fontSize));
  }
  if (options.showAllUpTo !== undefined && categories.length <= options.showAllUpTo) {
    return values(thinTickLabels(categories, fontSize));
  }

  const yearOf = (category: TickLabelCandidate) => parseInt(String(category.yearCode ?? category.value), 10);
  let widest: TickLabelCandidate[] = [];
  for (const interval of YEAR_TICK_INTERVALS) {
    const ticks = categories.filter((category) => {
      const year = yearOf(category);
      return !Number.isNaN(year) && year % interval === 0;
    });
    if (ticks.length === 0) break;
    if (tickLabelsFit(ticks, fontSize)) return values(ticks);
    widest = ticks;
  }
  if (widest.length > 0) return values(thinTickLabels(widest, fontSize));

  if (options.fallback === "none") return [];
  const fallback =
    options.fallback === "ends"
      ? categories.filter((_, index) => index === 0 || index === categories.length - 1)
      : [...categories];
  return values(thinTickLabels(fallback, fontSize));
}

/** 端のラベルと viewBox の端の間に残す幅 */
const EDGE_PADDING = 2;
/** 端のラベルを収めるために描画領域を詰め直す回数の上限 */
const FIT_EDGE_ATTEMPTS = 4;

/**
 * 横軸の目盛りを選び、両端の目盛りのラベルが viewBox の外へはみ出すなら描画領域の左右を詰める。
 * 詰めると目盛りの位置が変わるので、位置の計算 (`positionsFor`) を受け取って選び直す。
 * viewBox を左右へ広げて収めると表示倍率が下がり、文字が画面上で小さくなるため、広げずに詰める。
 *
 * @param positionsFor - 描画領域の左端・右端 (viewBox 上の x) から、各区分の位置を返す
 * @returns 描画領域の左端・右端と、目盛りにする区分の value
 */
export function fitCategoryAxis(
  width: number,
  plotLeft: number,
  plotRight: number,
  fontSize: number,
  positionsFor: (plotLeft: number, plotRight: number) => TickLabelCandidate[],
  options: CategoryTickOptions,
): { plotLeft: number; plotRight: number; tickValues: string[] } {
  // 描画領域を元の半分より狭くはしない (ラベルが極端に長いときの歯止め。残りは fitSvgViewBox が広げる)
  const narrowest = (plotRight - plotLeft) / 2;
  let left = plotLeft;
  let right = plotRight;
  let tickValues: string[] = [];
  for (let attempt = 0; attempt < FIT_EDGE_ATTEMPTS; attempt += 1) {
    const categories = positionsFor(left, right);
    tickValues = selectCategoryTicks(categories, fontSize, options);
    const first = categories.find((category) => category.value === tickValues[0]);
    const last = categories.find((category) => category.value === tickValues[tickValues.length - 1]);
    if (!first || !last) break;
    const overflowLeft = Math.max(
      0,
      Math.ceil(EDGE_PADDING - (first.position - estimateTextWidth(first.label, fontSize) / 2)),
    );
    const overflowRight = Math.max(
      0,
      Math.ceil(last.position + estimateTextWidth(last.label, fontSize) / 2 + EDGE_PADDING - width),
    );
    if (overflowLeft === 0 && overflowRight === 0) break;
    const room = right - left - narrowest;
    if (room <= 0) break;
    // 詰められる幅が足りないときは、左右のはみ出しの比で分ける
    const shrink = Math.min(1, room / (overflowLeft + overflowRight));
    left += overflowLeft * shrink;
    right -= overflowRight * shrink;
  }
  return { plotLeft: left, plotRight: right, tickValues };
}
