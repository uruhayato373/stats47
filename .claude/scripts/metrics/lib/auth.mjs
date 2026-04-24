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
 * ISO 週番号 (YYYY-Www) を算出する。
 * @param {Date} date
 */
export function toIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
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
 * YYYY-MM-DD へフォーマット
 */
export function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}
