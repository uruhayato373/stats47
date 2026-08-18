"use client";

import { useMemo, useState } from "react";

export interface FeatureRow {
  section: string;
  id: string;
  title: string;
  tier: string;
  status: string;
  created: string;
}

type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

const SECTION_ORDER: Record<string, number> = { 今実装: 0, "将来・保留": 1, DROP: 2 };

function featureSort(a: FeatureRow, b: FeatureRow): number {
  const s = (SECTION_ORDER[a.section] ?? 9) - (SECTION_ORDER[b.section] ?? 9);
  if (s) return s;
  const t = (parseInt(a.tier, 10) || 9) - (parseInt(b.tier, 10) || 9);
  if (t) return t;
  return a.id.localeCompare(b.id);
}

export function FeatureTable({ featureBacklog }: { featureBacklog: Wrapped<{ rows?: FeatureRow[] }> }) {
  const rows = useMemo<FeatureRow[]>(
    () => (hasError(featureBacklog) ? [] : (featureBacklog.rows ?? [])),
    [featureBacklog],
  );
  const [section, setSection] = useState("");

  const sections = useMemo(
    () => [...new Set(rows.map((r) => r.section))].sort((a, b) => (SECTION_ORDER[a] ?? 9) - (SECTION_ORDER[b] ?? 9)),
    [rows],
  );

  const filtered = useMemo(
    () => rows.filter((r) => !section || r.section === section).slice().sort(featureSort),
    [rows, section],
  );

  if (hasError(featureBacklog)) {
    return <p className="text-sm text-console-bad">取得失敗: {featureBacklog.error}</p>;
  }

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="rounded-md border border-console-border bg-console-bg px-2 py-1 text-xs text-console-fg"
        >
          <option value="">区分: 全て</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs text-console-muted">
          {filtered.length} / {rows.length} 件
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-console-muted">
              <th className="whitespace-nowrap border-b border-console-border px-1.5 py-1 text-left font-medium">
                区分
              </th>
              <th className="whitespace-nowrap border-b border-console-border px-1.5 py-1 text-left font-medium">
                ID
              </th>
              <th className="border-b border-console-border px-1.5 py-1 text-left font-medium">タイトル</th>
              <th className="border-b border-console-border px-1.5 py-1 text-left font-medium">tier</th>
              <th className="border-b border-console-border px-1.5 py-1 text-left font-medium">status</th>
              <th className="whitespace-nowrap border-b border-console-border px-1.5 py-1 text-left font-medium">
                created
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              // 実データに id="" の行が複数あり空文字キーが重複するため index を合成する
              <tr key={`${r.section}-${r.id}-${i}`} className="border-b border-console-border/40">
                <td className="whitespace-nowrap px-1.5 py-1">{r.section}</td>
                <td className="whitespace-nowrap px-1.5 py-1 font-semibold text-console-fg">{r.id}</td>
                <td className="max-w-[320px] truncate px-1.5 py-1" title={r.title}>
                  {r.title}
                </td>
                <td className="px-1.5 py-1">{r.tier}</td>
                <td className="max-w-[240px] truncate px-1.5 py-1" title={r.status}>
                  {r.status}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1">{r.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
