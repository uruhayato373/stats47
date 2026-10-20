/**
 * 計測スクリプトの共通ヘルパー (リポジトリルート・週の引数・CSV)。
 *
 * Google API の認証とクライアント生成は ../../lib/google-client.cjs が持つ (SCRIPT-GOOGLE-CLIENT-UNIFY-01)。
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isoWeekOf, isoWeekRange, jstDateOf } from "./periods.mjs";

export const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

/**
 * ISO 週番号 (YYYY-Www) を JST の暦日で算出する。正本は .claude/scripts/metrics/lib/periods.mjs (JST の暦日で数える。SCRIPT-ISO-WEEK-UNIFY-01)
 * @param {Date} date
 */
export function toIsoWeek(date) {
  return isoWeekOf(jstDateOf(date));
}

/**
 * 引数から YYYY-Www を取得。未指定なら今日の週を返す。
 */
export function parseWeekArg() {
  const args = process.argv.slice(2);
  for (const a of args) {
    if (/^\d{4}-W\d{2}$/.test(a)) return a;
  }
  return toIsoWeek(new Date());
}

/**
 * CSV エスケープ
 */
export function csvEsc(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * オブジェクトの配列 → CSV 文字列
 */
export function toCsv(rows, headers) {
  return (
    [headers.join(","), ...rows.map((r) => headers.map((h) => csvEsc(r[h])).join(","))].join("\n") +
    "\n"
  );
}

/**
 * ISO 週 (YYYY-Www) をカレンダー週の月曜・日曜に変換する。
 * @param {string} week - e.g. "2026-W23"
 * @returns {{ startDate: string, endDate: string }} YYYY-MM-DD 形式
 */
export function isoWeekToDateRange(week) {
  const { monday, sunday } = isoWeekRange(week);
  return { startDate: monday, endDate: sunday };
}
