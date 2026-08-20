"use client";

import { useMemo, useState } from "react";

import { dueKey, isOverdue, statusBadgeClass } from "./format";

export interface BacklogRow {
  tier: string;
  id: string;
  title: string;
  status: string;
  due: string;
  owner: string;
  metric: string;
}

type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

// 判定確定済み status は末尾に沈める (次にやる順 = 未完了が上)。
const DONEISH = new Set(["effect/full", "effect/partial", "effect/none", "effect/n-a", "effect/adverse", "done"]);

function backlogSort(a: BacklogRow, b: BacklogRow): number {
  const d = (DONEISH.has(a.status) ? 1 : 0) - (DONEISH.has(b.status) ? 1 : 0);
  if (d) return d;
  const t = (parseInt(a.tier.replace(/\D/g, ""), 10) || 9) - (parseInt(b.tier.replace(/\D/g, ""), 10) || 9);
  if (t) return t;
  const k = dueKey(a.due).localeCompare(dueKey(b.due));
  if (k) return k;
  return a.id.localeCompare(b.id);
}

function OwnerBadge({ owner }: { owner: string }) {
  const s = String(owner ?? "").trim();
  if (!s) return null;
  if (s.startsWith("claude")) {
    return (
      <span className="rounded-full border border-console-border px-2 py-0.5 text-[10px] text-console-muted">
        {s}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-amber-400 px-2 py-0.5 text-[10px] text-console-warn">👤 {s}</span>
  );
}

export function BacklogTable({ backlog }: { backlog: Wrapped<{ rows?: BacklogRow[] }> }) {
  const rows = useMemo<BacklogRow[]>(() => (hasError(backlog) ? [] : (backlog.rows ?? [])), [backlog]);
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [metric, setMetric] = useState("");

  const tiers = useMemo(() => [...new Set(rows.map((r) => r.tier))].sort(), [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))].sort(), [rows]);
  const metrics = useMemo(() => [...new Set(rows.map((r) => r.metric).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => (!tier || r.tier === tier) && (!status || r.status === status) && (!metric || r.metric === metric))
        .slice()
        .sort(backlogSort),
    [rows, tier, status, metric],
  );

  if (hasError(backlog)) {
    return <p className="text-sm text-console-bad">取得失敗: {backlog.error}</p>;
  }

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-md border border-console-border bg-console-bg px-2 py-1 text-xs text-console-fg"
        >
          <option value="">Tier: 全て</option>
          {tiers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-console-border bg-console-bg px-2 py-1 text-xs text-console-fg"
        >
          <option value="">Status: 全て</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="rounded-md border border-console-border bg-console-bg px-2 py-1 text-xs text-console-fg"
        >
          <option value="">Metric: 全て</option>
          {metrics.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-xs text-console-muted">
          {filtered.length} / {rows.length} 件 (未完了→Tier→期日 順)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-console-muted">
              <th className="whitespace-nowrap border-b border-console-border px-1.5 py-1 text-left font-medium">
                Tier
              </th>
              <th className="whitespace-nowrap border-b border-console-border px-1.5 py-1 text-left font-medium">
                ID
              </th>
              <th className="border-b border-console-border px-1.5 py-1 text-left font-medium">タイトル</th>
              <th className="border-b border-console-border px-1.5 py-1 text-left font-medium">Status</th>
              <th className="whitespace-nowrap border-b border-console-border px-1.5 py-1 text-left font-medium">
                Due
              </th>
              <th className="whitespace-nowrap border-b border-console-border px-1.5 py-1 text-left font-medium">
                Owner
              </th>
              <th className="border-b border-console-border px-1.5 py-1 text-left font-medium">Metric</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const overdue = isOverdue(r.due) && !r.status.startsWith("effect/f");
              return (
                <tr key={r.id} className="border-b border-console-border/40">
                  <td className="whitespace-nowrap px-1.5 py-1">{r.tier.replace("Tier ", "T")}</td>
                  <td className="whitespace-nowrap px-1.5 py-1 font-semibold text-console-fg">{r.id}</td>
                  <td className="max-w-[320px] truncate px-1.5 py-1" title={r.title}>
                    {r.title}
                  </td>
                  <td className="px-1.5 py-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-1.5 py-1 ${overdue ? "text-console-bad" : ""}`}>
                    {r.due}
                    {overdue ? " ⚠" : ""}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1">
                    <OwnerBadge owner={r.owner} />
                  </td>
                  <td className="px-1.5 py-1">{r.metric}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
