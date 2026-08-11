/**
 * 地図 SVG の表示値と SSOT 観測値の照合 (純粋関数)。
 *
 * `regenerate-tile-maps.ts` が「既存の地図 SVG がどの metric / 年のものか」を確定するために使う。
 * SVG から値を復元するのではなく、**SSOT が正・SVG は照合材料**という向きを守るための道具
 * (正典: `.claude/rules/blog-data-schema.md` §1.6)。
 */

import {
  isScalePrefixPartOfUnit,
  scalePrefixMultiplier,
} from './unit-semantics.mjs';

/**
 * 日本語の短縮スケール接頭辞。
 * @deprecated 単位の解釈は `unit-semantics.mjs` が正典。互換のため残すだけで参照しない
 *   (自前のスケール表を各所に置いたことが 44 箇所の独立実装を生んだ原因)。
 */
export const JP_UNIT_MULT = { 千: 1e3, 万: 1e4, 億: 1e8, 兆: 1e12, 京: 1e16 };

/**
 * 地図 SVG の `<title>県名：値</title>` を {県名 → 表示値} に取り出す。
 *
 * @param {string} svg
 * @returns {Map<string, string>}
 */
export function parseMapDisplay(svg) {
  const m = new Map();
  for (const t of [...String(svg).matchAll(/<title>([^<]*)<\/title>/g)].map(
    (x) => x[1]
  )) {
    const mt = t.match(/^(.+?)\s*[:：]\s*(.+)$/);
    if (!mt) continue;
    m.set(mt[1].trim(), mt[2].trim());
  }
  return m;
}

/**
 * 表示文字列を数値に解釈する。
 *
 * ★「千 / 万」がスケール接頭辞なのか単位そのものなのかは、表示文字列だけでは判別できない。
 *   SSOT 側の unit と突き合わせて初めて決まる:
 *     unit="人"   表示="468万人"     → 万はスケール短縮   → 4,680,000
 *     unit="千円" 表示="13,326千円"  → 千は単位の一部     → 13,326
 *   後者を ×1000 すると全県が外れて一致率 0% になり、値は正しいのに「SSOT照合 失敗」になる
 *   (2026-08-11 に savings-map で実測。単位が千円/万円系の指標がすべて再生成不能だった)。
 *
 * @param {string} display - 地図の表示値 (例 "13,326千円")
 * @param {string} ssotUnit - SSOT 側の単位 (例 "千円")
 * @returns {number|null} 解釈できなければ null
 */
export function parseDisplayValue(display, ssotUnit = '') {
  const m = String(display)
    .replace(/,/g, '')
    .match(/(-?[\d.]+)\s*(京|兆|億|万|千)?/);
  if (!m) return null;
  const suffix = m[2] ?? '';
  // 接頭辞の解釈は単位セマンティクスの正典に委ねる (自前の表を持たない)
  const mult = isScalePrefixPartOfUnit(suffix, ssotUnit)
    ? 1
    : (scalePrefixMultiplier(suffix) ?? 1);
  const value = parseFloat(m[1]) * mult;
  return Number.isFinite(value) ? value : null;
}

/**
 * SSOT 値が既存地図の表示値と一致する割合 (0..1)。
 * 短縮表記の丸め誤差を許容し、絶対 0.15 か相対 2% を一致とみなす。
 * 突き合わせ対象が 5 県未満なら判定不能として 0 を返す。
 *
 * @param {Array<{areaName: string, value: number}>} ssotVals
 * @param {Map<string, string>} display
 * @param {string} ssotUnit
 * @returns {number}
 */
export function matchRate(ssotVals, display, ssotUnit = '') {
  let ok = 0;
  let n = 0;
  for (const v of ssotVals) {
    const disp =
      display.get(v.areaName) ??
      display.get(v.areaName.replace(/[都道府県]$/, ''));
    if (!disp) continue;
    n++;
    const dval = parseDisplayValue(disp, ssotUnit);
    if (dval === null) continue;
    if (Math.abs(v.value - dval) <= Math.max(0.15, Math.abs(v.value) * 0.02)) {
      ok++;
    }
  }
  return n >= 5 ? ok / n : 0;
}
