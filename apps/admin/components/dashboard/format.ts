/**
 * dashboard 表示用の純粋フォーマッタ群 (旧 dashboard.html の esc/num/wow/overdue/dueKey を移植)。
 * DOM に依存しないので JSX から直接呼べる。
 */
import type { Tone } from "@/components/admin-ui";

import { isoWeekRange } from "../../../../.claude/scripts/metrics/lib/periods.mjs";

export function num(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("ja-JP");
}

export interface WowResult {
  pct: number;
  up: boolean;
}

/** week-over-week 変化率。行が2件未満・数値でない・前週0は null。 */
export function wow<T extends Record<string, unknown>>(rows: T[] | undefined, key: string): WowResult | null {
  if (!rows || rows.length < 2) return null;
  const a = rows[rows.length - 2][key];
  const b = rows[rows.length - 1][key];
  if (typeof a !== "number" || typeof b !== "number" || a === 0) return null;
  const pct = ((b - a) / a) * 100;
  return { pct, up: pct >= 0 };
}

/** 施策・実験の状態を StatusBadge の tone に写す (色は StatusBadge が持つ) */
const STATUS_TONE: Record<string, Tone> = {
  "effect/full": "good",
  "effect/partial": "info",
  "effect/none": "bad",
  "effect/adverse": "bad",
  "effect/pending": "info",
  "effect/n-a": "neutral",
  pending: "warn",
  done: "good",
  "in-progress": "info",
  proposed: "warn",
};

export function statusTone(status: string): Tone {
  return STATUS_TONE[status] ?? "neutral";
}

/** "2026-07-15" / "2026-W28" (ISO週の月曜) を比較可能な日付文字列に正規化。 */
export function dueKey(due: string | null | undefined): string {
  const s = String(due ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-W\d{2}$/.test(s)) {
    try { return isoWeekRange(s).monday; } catch { return "9999-12-31"; } // 正本は .claude/scripts/metrics/lib/periods.mjs (JST の暦日で数える。SCRIPT-ISO-WEEK-UNIFY-01)
  }
  return "9999-12-31";
}

export function isOverdue(due: string | null | undefined): boolean {
  const s = String(due ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return new Date(s) < new Date(new Date().toISOString().slice(0, 10));
}
