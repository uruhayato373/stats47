/**
 * iso-week — ISO-8601 週 (YYYY-Www, 月曜始まり) の純粋ユーティリティ。
 *
 * `measure-gsc-impact.mjs` と `measure-adsense-impact.mjs` / `triage-matrix.mjs` に
 * 同じ計算が別実装で 3 つあったのを 1 箇所に集約する。snapshot ディレクトリ名・
 * history.csv の `week` 列がこの形式なので、比較と差分はここだけで行う。
 */
import { isoWeekOf as periodsIsoWeekOf, isoWeekRange, jstDateOf } from "../../metrics/lib/periods.mjs";

const WEEK_RE = /^(\d{4})-W(\d{2})$/;

/**
 * Date または "YYYY-MM-DD" を ISO 週文字列にする。
 * @param {Date|string} input
 * @returns {string} 例 "2026-W31"
 */
export function isoWeekOf(input) {
  // 正本は .claude/scripts/metrics/lib/periods.mjs (JST の暦日で数える。SCRIPT-ISO-WEEK-UNIFY-01)。Date は JST の暦日に直してから数える
  const label = input instanceof Date ? (Number.isNaN(input.getTime()) ? "" : jstDateOf(input)) : String(input).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(label) || Number.isNaN(Date.parse(`${label}T00:00:00Z`))) {
    throw new Error(`isoWeekOf: 日付として解釈できない: ${input}`);
  }
  return periodsIsoWeekOf(label);
}

/** ISO 週文字列か。 */
export function isIsoWeek(w) {
  return typeof w === "string" && WEEK_RE.test(w);
}

/**
 * 週の順序比較用インデックス (year*100 + week)。**差分計算には使わない**
 * (年境界で 100 飛ぶため)。差分は `weekDiff` を使う。
 */
export function weekIndex(w) {
  const m = WEEK_RE.exec(w ?? "");
  if (!m) throw new Error(`weekIndex: ISO 週ではない: ${w}`);
  return Number(m[1]) * 100 + Number(m[2]);
}

/** a が b より前の週か。固定幅 YYYY-Www なので辞書順 = 時系列順。 */
export function weekLt(a, b) {
  return String(a) < String(b);
}

/**
 * 2 つの ISO 週の週数差 (after - before)。年境界は 1 年 = 52 週の近似
 * (53 週年で ±1 週ずれる。判定窓の「N 週経過したか」用途には十分)。
 */
export function weekDiff(before, after) {
  const b = WEEK_RE.exec(before ?? "");
  const a = WEEK_RE.exec(after ?? "");
  if (!b || !a) throw new Error(`weekDiff: ISO 週ではない: ${before} / ${after}`);
  return (Number(a[1]) - Number(b[1])) * 52 + (Number(a[2]) - Number(b[2]));
}

/**
 * ISO 週の最終日 (日曜) を YYYY-MM-DD で返す。
 * 週次 snapshot の「観測がどこまでを覆っているか」= observedAt の代理として使う
 * (鮮度ガードの入力。snapshot ファイルの mtime は git checkout で変わるため使わない)。
 */
export function isoWeekEnd(week) {
  if (!WEEK_RE.test(week ?? "")) throw new Error(`isoWeekEnd: ISO 週ではない: ${week}`);
  return isoWeekRange(week).sunday;
}
