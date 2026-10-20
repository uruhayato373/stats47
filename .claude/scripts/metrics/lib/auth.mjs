/**
 * Google API 認証ヘルパー
 *
 * CI: GOOGLE_SERVICE_ACCOUNT_KEY_JSON 環境変数に鍵 JSON を丸ごと格納
 * Local: リポジトリルートに stats47-*.json を配置（既存の skill 運用）
 *
 * どちらでも KeyFile として機能する keyFile path を返す。
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { isoWeekOf, isoWeekRange, jstDateOf } from "./periods.mjs";

export const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

const LOCAL_KEY_CANDIDATES = [
  "stats47-f6b5dae19196.json",
  "stats47-31b18ee67144.json",
];

/**
 * サービスアカウント鍵ファイルのパスを解決。
 * - 環境変数 GOOGLE_SERVICE_ACCOUNT_KEY_JSON があれば tmp に書き出してパスを返す
 * - なければローカルの候補を探す
 */
export function resolveServiceAccountKeyFile() {
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  if (jsonEnv) {
    const dir = join(tmpdir(), "stats47-sa");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const path = join(dir, "service-account.json");
    writeFileSync(path, jsonEnv, { mode: 0o600 });
    return path;
  }
  for (const name of LOCAL_KEY_CANDIDATES) {
    const path = join(PROJECT_ROOT, name);
    if (existsSync(path)) return path;
  }
  throw new Error(
    `Service account key not found. Set GOOGLE_SERVICE_ACCOUNT_KEY_JSON env or place one of ${LOCAL_KEY_CANDIDATES.join(", ")} at ${PROJECT_ROOT}`
  );
}

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
