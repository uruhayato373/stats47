/**
 * D3 チャートの viewBox を描画結果に合わせて広げ、目盛ラベル・軸タイトル・凡例の見切れを防ぐ。
 *
 * マージンは `computeMarginsByRatio` で「幅の比率」から決まるため、目盛ラベルの実際の文字幅
 * (例: "1,400.0万") がマージンより長いと、ラベルが viewBox の外 (負の x) にはみ出して切れる。
 * マージン側を文字数から推定しても、フォント・回転・凡例の長さで必ず外れる。そこで描画後に
 * すべての `<text>` の実寸を測り、はみ出した分だけ viewBox を外側へ広げる。
 *
 * - 広げるだけで縮めない。はみ出しが無ければ `0 0 width height` のまま (no-op)。
 * - 測るのは `<text>` だけ。透明なホバー用 rect などは描画領域の外へ出ても表示上の問題が
 *   無いので対象にしない (root の getBBox を使うと、それらで viewBox が不要に広がる)。
 * - `getScreenCTM` / `getBBox` が無い環境 (jsdom・SSR) では何もしない。
 *
 * React との関係: JSX の `viewBox` prop は値が変わったときだけ React が DOM に書き戻す。
 * 同じ width/height で再レンダーしても上書きされず、width/height が変わったときは
 * 描画 effect も再実行されるので、各描画 effect の末尾で本関数を呼べば常に整合する。
 *
 * 使い方: D3 の描画 effect の最後 (text を描き終えた直後) に
 * `fitSvgViewBox(svgRef.current, width, height)` を呼ぶ。
 */

export interface ViewBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 2D アフィン行列 (DOMMatrix / SVGMatrix の a〜f) */
export interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/** はみ出したときに外側へ足す余白 (viewBox 単位) */
export const VIEWBOX_FIT_PADDING = 4;

/** ローカル座標の矩形を行列で変換し、軸平行な外接矩形を返す (回転ラベル対応) */
export function transformBox(box: ViewBoxRect, m: AffineMatrix): ViewBoxRect {
  const corners: Array<[number, number]> = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ];
  const xs = corners.map(([x, y]) => m.a * x + m.c * y + m.e);
  const ys = corners.map(([x, y]) => m.b * x + m.d * y + m.f);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}

/**
 * 基準の viewBox (0 0 width height) と描画済みテキストの外接矩形から、
 * すべてを含む viewBox を求める。はみ出した辺だけを padding 付きで広げる。
 */
export function computeFittedViewBox(
  width: number,
  height: number,
  contentBoxes: readonly ViewBoxRect[],
  padding: number = VIEWBOX_FIT_PADDING,
): ViewBoxRect {
  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;

  for (const box of contentBoxes) {
    const valid =
      Number.isFinite(box.x) &&
      Number.isFinite(box.y) &&
      Number.isFinite(box.width) &&
      Number.isFinite(box.height) &&
      box.width > 0 &&
      box.height > 0;
    if (!valid) continue;

    if (box.x < 0) minX = Math.min(minX, box.x - padding);
    if (box.y < 0) minY = Math.min(minY, box.y - padding);
    if (box.x + box.width > width) maxX = Math.max(maxX, box.x + box.width + padding);
    if (box.y + box.height > height) maxY = Math.max(maxY, box.y + box.height + padding);
  }

  const x = Math.floor(minX);
  const y = Math.floor(minY);
  return {
    x,
    y,
    width: Math.ceil(maxX) - x,
    height: Math.ceil(maxY) - y,
  };
}

export function formatViewBox(box: ViewBoxRect): string {
  return `${box.x} ${box.y} ${box.width} ${box.height}`;
}

/**
 * svg 内の全 `<text>` の外接矩形を svg のユーザー座標 (viewBox 座標) で返す。
 * 測定 API が無い、または svg が描画されていない (display:none) ときは null。
 */
function measureTextBoxes(svg: SVGSVGElement): ViewBoxRect[] | null {
  if (typeof svg.getScreenCTM !== "function") return null;
  const rootCtm = svg.getScreenCTM();
  if (!rootCtm) return null;
  const toUser = rootCtm.inverse();

  const boxes: ViewBoxRect[] = [];
  svg.querySelectorAll("text").forEach((el) => {
    if (typeof el.getBBox !== "function" || typeof el.getScreenCTM !== "function") return;
    const ctm = el.getScreenCTM();
    if (!ctm) return;
    let bbox: DOMRect;
    try {
      bbox = el.getBBox();
    } catch {
      return;
    }
    boxes.push(transformBox(bbox, toUser.multiply(ctm)));
  });
  return boxes;
}

/** 最後に描画したときの基準サイズ。フォント読込後の再測定で使う */
const baseSizes = new WeakMap<SVGSVGElement, { width: number; height: number }>();

function applyFit(svg: SVGSVGElement): void {
  const base = baseSizes.get(svg);
  if (!base) return;
  const boxes = measureTextBoxes(svg);
  if (!boxes) return;
  svg.setAttribute("viewBox", formatViewBox(computeFittedViewBox(base.width, base.height, boxes)));
}

/**
 * 描画済みのテキストがすべて収まるよう svg の viewBox を広げる。
 * D3 の描画 effect の末尾で呼ぶ。Web フォント読込後に文字幅が変わる分も再測定する。
 */
export function fitSvgViewBox(
  svg: SVGSVGElement | null | undefined,
  width: number,
  height: number,
): void {
  if (!svg) return;
  baseSizes.set(svg, { width, height });
  applyFit(svg);

  const fonts = typeof document !== "undefined" ? document.fonts : undefined;
  if (fonts && fonts.status !== "loaded") {
    void fonts.ready.then(() => {
      if (svg.isConnected) applyFit(svg);
    });
  }
}
