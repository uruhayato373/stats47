import Link from "next/link";

import { isOverdue } from "./format";

export interface ImprovementRow {
  tier: string;
  id: string;
  title: string;
  status: string;
  due: string;
  owner: string;
  metric: string;
}

type Wrapped<T> = T | { error: string };

const DONEISH = new Set([
  "effect/full",
  "effect/partial",
  "effect/none",
  "effect/n-a",
  "effect/adverse",
  "done",
]);

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

function Stat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-md border border-console-border bg-console-card px-3 py-2.5">
      <div className="text-[11px] text-console-muted">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${alert ? "text-console-bad" : "text-console-fg"}`}>
        {value}
      </div>
    </div>
  );
}

export function ImprovementSummary({
  improvements,
}: {
  improvements: Wrapped<{ rows?: ImprovementRow[] }>;
}) {
  if (hasError(improvements)) {
    return <p className="text-sm text-console-bad">取得失敗: {improvements.error}</p>;
  }

  const rows = improvements.rows ?? [];
  const inProgress = rows.filter((row) => row.status === "in-progress").length;
  const effectPending = rows.filter((row) => row.status === "effect/pending").length;
  const overdue = rows.filter((row) => !DONEISH.has(row.status) && isOverdue(row.due)).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="全施策" value={rows.length} />
        <Stat label="実行中" value={inProgress} />
        <Stat label="効果判定待ち" value={effectPending} />
        <Stat label="期限超過" value={overdue} alert={overdue > 0} />
      </div>
      <div className="flex justify-end">
        <Link
          href="/todo?f=improvements"
          className="text-xs font-medium text-console-accent hover:underline"
        >
          詳細をTODOで見る →
        </Link>
      </div>
    </div>
  );
}
