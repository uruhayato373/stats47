/**
 * 文字幅の概算 (グリフ実測ではなくヒューリスティック)。
 *
 * 半角 (ASCII・半角カナ) ≈ 0.55em / 全角 ≈ 1.0em。公開ゲートの文字配置 lint
 * (`.claude/scripts/lib/svg-lint.mjs` の `findChartTextIssues`) と**同じ式**なので、
 * 生成側でこの幅に収めれば lint も通る。式を変えるときは両方を同時に変える。
 */

/** 文字列の概算幅 (em 単位)。 */
export function textUnits(text: string): number {
  return [...text].reduce((w, ch) => w + (/[ -~｡-ﾟ]/.test(ch) ? 0.55 : 1.0), 0);
}

/** 文字列の概算幅 (px)。 */
export function textWidth(text: string, fontSize: number): number {
  return textUnits(text) * fontSize;
}

/** availW に収まる最大フォントサイズ (0.5px 刻み、minF 未満にはしない)。 */
export function fitFontSize(text: string, availW: number, maxF: number, minF: number): number {
  const units = textUnits(text);
  if (units <= 0) return maxF;
  const f = Math.floor((availW / units) * 2) / 2;
  return Math.max(minF, Math.min(maxF, f));
}

/** availW に収まるよう末尾を「…」で切り詰める (収まればそのまま返す)。 */
export function truncateToWidth(text: string, availW: number, fontSize: number): string {
  if (textWidth(text, fontSize) <= availW) return text;
  const chars = [...text];
  while (chars.length > 1 && textWidth(`${chars.join("")}…`, fontSize) > availW) chars.pop();
  return `${chars.join("")}…`;
}

/**
 * 回転したラベルの占有高さ (ベースラインより下へ伸びる量を含む概算)。
 * text-anchor="end" で角度 -deg に回した文字は、幅 w のぶん sin(deg)·w だけ下に伸びる。
 */
export function rotatedLabelDrop(width: number, fontSize: number, deg: number): number {
  const r = (Math.abs(deg) * Math.PI) / 180;
  return width * Math.sin(r) + fontSize * Math.cos(r);
}

/**
 * カテゴリ軸 (年・月・都道府県など等間隔のラベル) の描き方を決める。
 *
 * 1. 横書きで収まる (最大ラベル幅 + 余白 ≤ ラベル間隔) なら回転しない
 * 2. 収まらなければ angle 度に回転する (平行な斜めラベル同士の垂直距離 ≥ 文字高なら重ならない)
 * 3. それでも重なるならラベルを間引く (step おき)
 *
 * 短い 12 か月ラベルを「7 個超だから」一律に回転させていた不具合 (2026-09-25) の是正。
 */
export function planCategoryTicks(
  labels: string[],
  spacing: number,
  fontSize: number,
  opts: { angle: number; maxLabels?: number; gap?: number },
): { rotate: boolean; step: number; indices: number[] } {
  const n = labels.length;
  const gap = opts.gap ?? 6;
  const maxW = Math.max(0, ...labels.map((l) => textWidth(l, fontSize)));
  const sin = Math.sin((Math.abs(opts.angle) * Math.PI) / 180);
  let step = Math.max(1, opts.maxLabels ? Math.ceil(n / opts.maxLabels) : 1);
  let rotate = false;
  for (; step <= Math.max(1, n); step++) {
    const pitch = spacing * step;
    if (maxW + gap <= pitch) break;
    if (pitch * sin >= fontSize * 1.15) {
      rotate = true;
      break;
    }
  }
  return { rotate, step, indices: thinIndices(n, step) };
}

/** 0, step, 2·step … と最後の要素。最後が直前の目盛りと近すぎる場合は直前を落とす。 */
export function thinIndices(n: number, step: number): number[] {
  if (n <= 0) return [];
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  const last = n - 1;
  if (out[out.length - 1] !== last) {
    if (out.length > 1 && last - out[out.length - 1] < step) out.pop();
    out.push(last);
  }
  return out;
}

export interface LegendEntry {
  label: string;
  color: string;
}

export interface LegendRowLayout {
  /** 各項目の左上 x とその行番号 */
  items: Array<LegendEntry & { x: number; row: number; label: string }>;
  rows: number;
}

/**
 * 凡例を横方向に流し込み、収まらなければ次の行へ折り返す。
 * 各行は availW の中で中央寄せ (align="center") または左寄せ。
 * 1 項目だけで availW を超えるラベルは末尾を切り詰める。
 */
export function layoutLegendRows(
  entries: LegendEntry[],
  opts: {
    left: number;
    availW: number;
    fontSize: number;
    swatchW: number;
    gap: number;
    align?: "center" | "left";
  },
): LegendRowLayout {
  const { left, availW, fontSize, swatchW, gap, align = "center" } = opts;
  const pad = swatchW + 4;
  const sized = entries.map((e) => {
    const label = truncateToWidth(e.label, availW - pad, fontSize);
    return { ...e, label, w: pad + textWidth(label, fontSize) };
  });
  const rows: Array<typeof sized> = [];
  let cur: typeof sized = [];
  let curW = 0;
  for (const it of sized) {
    const add = (cur.length ? gap : 0) + it.w;
    if (cur.length && curW + add > availW) {
      rows.push(cur);
      cur = [];
      curW = 0;
    }
    curW += (cur.length ? gap : 0) + it.w;
    cur.push(it);
  }
  if (cur.length) rows.push(cur);
  const items: LegendRowLayout["items"] = [];
  rows.forEach((row, ri) => {
    const rowW = row.reduce((s, it, i) => s + it.w + (i ? gap : 0), 0);
    let x = align === "center" ? left + (availW - rowW) / 2 : left;
    for (const it of row) {
      items.push({ label: it.label, color: it.color, x, row: ri });
      x += it.w + gap;
    }
  });
  return { items, rows: rows.length };
}
