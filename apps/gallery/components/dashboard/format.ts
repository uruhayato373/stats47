/**
 * dashboard 表示用の純粋フォーマッタ群 (旧 dashboard.html の esc/num/spark/wow/overdue/dueKey を移植)。
 * DOM に依存しないので JSX から直接呼べる。
 */

export function num(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("ja-JP");
}

export interface SparkOptions {
  w?: number;
  h?: number;
  color?: string;
}

/** inline SVG polyline のミニ推移グラフ。外部チャートライブラリは使わない。 */
export function sparkPoints(
  values: Array<number | null | undefined>,
  { w = 140, h = 30 }: SparkOptions = {},
): string | null {
  const v = values.filter((x): x is number => typeof x === "number");
  if (v.length < 2) return null;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const span = max - min || 1;
  return v
    .map((y, i) => `${(i / (v.length - 1)) * w},${h - 2 - ((y - min) / span) * (h - 4)}`)
    .join(" ");
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

// ★色はテーマ追従トークンで持つ (Tailwind の *-400 は暗地専用の淡さで、
//   ライト地では白に溶ける)。ダーク時の実値は従来の *-400 と同じ hex。
const STATUS_BADGE_CLASS: Record<string, string> = {
  "effect/full": "text-console-good border-console-good",
  "effect/partial": "text-console-info border-console-info",
  "effect/none": "text-console-bad border-console-bad",
  "effect/adverse": "text-console-bad border-console-bad",
  "effect/pending": "text-console-info border-console-info",
  "effect/n-a": "text-console-muted border-console-border",
  pending: "text-console-warn border-console-warn",
  done: "text-console-good border-console-good",
  "in-progress": "text-console-info border-console-info",
  proposed: "text-console-warn border-console-warn",
};

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASS[status] ?? "text-console-muted border-console-border";
}

/** "2026-07-15" / "2026-W28" (ISO週の月曜) を比較可能な日付文字列に正規化。 */
export function dueKey(due: string | null | undefined): string {
  const s = String(due ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const w = s.match(/^(\d{4})-W(\d{2})$/);
  if (w) {
    const year = Number(w[1]);
    const week = Number(w[2]);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const mon = new Date(jan4);
    mon.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (week - 1) * 7);
    return mon.toISOString().slice(0, 10);
  }
  return "9999-12-31";
}

export function isOverdue(due: string | null | undefined): boolean {
  const s = String(due ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return new Date(s) < new Date(new Date().toISOString().slice(0, 10));
}
