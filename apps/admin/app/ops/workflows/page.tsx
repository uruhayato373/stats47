import Link from "next/link";

import { Cell, DataTable, Row, StatCard, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { buttonVariants } from "@/components/ui/button";
import { hasError } from "@/lib/server/state-io";
import { cadenceOf, scheduleSortKey, workflowCatalog, WORKFLOW_CATALOG, type WorkflowEntry } from "@/lib/server/workflows";

export const dynamic = "force-dynamic";
export const metadata = { title: "CI ワークフロー — stats47 admin" };

/**
 * /ops/workflows — 全 GitHub Actions workflow の起動条件・状態・直近の結果を目視する画面。
 * 読み取り専用。データは `npm run ci:workflows` (preadmin でも実行) が書く .local/ci/workflow-catalog.json。
 * 失敗の数え方は週次レビューの CI の健全性 (weekly-audits/ci-health.sh) と同じ (cancelled / skipped は失敗に数えない)。
 */

const FILTERS = {
  all: { label: "すべて", test: () => true },
  failing: { label: "直近が失敗", test: (w: WorkflowEntry) => w.last?.conclusion === "failure" },
  daily: { label: "毎日", test: (w: WorkflowEntry) => cadenceOf(w) === "daily" },
  weekly: { label: "毎週", test: (w: WorkflowEntry) => cadenceOf(w) === "weekly" },
  monthly: { label: "毎月", test: (w: WorkflowEntry) => cadenceOf(w) === "monthly" },
  none: { label: "定期実行なし", test: (w: WorkflowEntry) => cadenceOf(w) === "none" },
  manual: { label: "手動のみ", test: (w: WorkflowEntry) => w.triggers.length === 1 && w.triggers[0] === "workflow_dispatch" },
  disabled: { label: "無効・未登録", test: (w: WorkflowEntry) => w.state !== "active" },
} as const;
type FilterKey = keyof typeof FILTERS;

const CONCLUSION: Record<string, { label: string; tone: Tone }> = {
  success: { label: "成功", tone: "good" },
  failure: { label: "失敗", tone: "bad" },
  cancelled: { label: "取消", tone: "neutral" },
  skipped: { label: "スキップ", tone: "neutral" },
};

const jst = (iso: string) =>
  new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

function lastCell(w: WorkflowEntry) {
  if (!w.last) return <span className="text-console-muted">実行なし</span>;
  const c = w.last.status !== "completed" ? { label: "実行中", tone: "info" as Tone } : CONCLUSION[w.last.conclusion ?? ""] ?? { label: w.last.conclusion ?? "?", tone: "neutral" as Tone };
  return (
    <div className="flex flex-col gap-0.5">
      <a href={w.last.url} target="_blank" rel="noreferrer">
        <StatusBadge tone={c.tone}>{c.label}</StatusBadge>
      </a>
      <span className="text-[11px] text-console-muted">
        {jst(w.last.createdAt)} · {w.last.event}
      </span>
    </div>
  );
}

/** 直近の結果を左から新しい順に 1 文字で並べる */
function history(w: WorkflowEntry) {
  const mark = (c: string | null, s: string) => (s !== "completed" ? "…" : c === "success" ? "○" : c === "failure" ? "×" : "-");
  return (
    <span className="font-mono text-[12px] tracking-wider" title="新しい順。○ 成功 / × 失敗 / - 取消・スキップ / … 実行中">
      {w.runs.map((r) => mark(r.conclusion, r.status)).join("") || "—"}
    </span>
  );
}

function stateBadge(state: string) {
  if (state === "active") return <StatusBadge tone="good">有効</StatusBadge>;
  if (state === "unregistered") return <StatusBadge tone="info" title="main にまだ無い (定期実行は main の定義で動く)">未登録</StatusBadge>;
  return <StatusBadge tone="warn">{state === "disabled_manually" ? "手動で無効" : state}</StatusBadge>;
}

export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter: FilterKey = f && f in FILTERS ? (f as FilterKey) : "all";
  const v = workflowCatalog();
  if (hasError(v)) {
    return (
      <div className="space-y-8">
        <PageHeading title="CI ワークフロー" source={WORKFLOW_CATALOG} />
        <ErrorNote error={v.error} />
      </div>
    );
  }
  if (!v) {
    return (
      <div className="space-y-8">
        <PageHeading title="CI ワークフロー" source={WORKFLOW_CATALOG} />
        <p className="text-sm text-console-muted">
          まだ集計されていない。<code>npm run ci:workflows</code> を実行してから再読み込みする。
        </p>
      </div>
    );
  }
  const all = v.workflows;
  // 毎日・毎週・毎月は動く順 (日本時間)、それ以外は連続失敗の多い順
  const byTime = filter === "daily" || filter === "weekly" || filter === "monthly";
  const rows = all
    .filter(FILTERS[filter].test)
    .sort((a, b) => (byTime ? scheduleSortKey(a) - scheduleSortKey(b) : b.failureStreak - a.failureStreak) || a.file.localeCompare(b.file));
  const failing = all.filter(FILTERS.failing.test).length;

  return (
    <div className="space-y-8">
      <PageHeading title="CI ワークフロー" source=".github/workflows/*.yml + gh" />
      <Stack>
        <Grid min="sm">
          <StatCard label="ワークフロー" value={all.length} sub={`毎日 ${all.filter(FILTERS.daily.test).length}・毎週 ${all.filter(FILTERS.weekly.test).length}・毎月 ${all.filter(FILTERS.monthly.test).length}・定期実行なし ${all.filter(FILTERS.none.test).length}`} />
          <StatCard label="直近が失敗" value={failing} tone={failing ? "bad" : "good"} sub={`連続 3 回以上 ${all.filter((w) => w.failureStreak >= 3).length}`} />
          <StatCard label="無効・未登録" value={all.filter(FILTERS.disabled.test).length} tone="warn" />
          <StatCard label="集計した時刻" value={<Freshness iso={v.generatedAt} />} sub={`直近 ${v.perWorkflow} 回を確認・取得エラー ${v.errors.length}`} />
        </Grid>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
            <Link href={k === "all" ? "/ops/workflows" : `/ops/workflows?f=${k}`} key={k} data-slot="button" className={buttonVariants({ variant: k === filter ? "default" : "outline", size: "sm" })}>
                {FILTERS[k].label} ({all.filter(FILTERS[k].test).length})
              </Link>
          ))}
        </div>

        <Section title={`${FILTERS[filter].label} (${rows.length})`}>
          <DataTable columns={["ワークフロー", "起動", "状態", "直近", "履歴", "連続失敗", "最後の成功"]}>
            {rows.map((w) => (
              <Row key={w.file}>
                <Cell>
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-[11px] text-console-muted">
                    <code>{w.file}</code>
                    {w.purpose ? ` — ${w.purpose}` : ""}
                  </div>
                </Cell>
                <Cell>
                  <div className="text-[12px]">{w.schedules.map((s) => s.jst).join(" / ") || "—"}</div>
                  <div className="text-[11px] text-console-muted">{w.triggers.filter((t) => t !== "schedule").join("・")}</div>
                </Cell>
                <Cell nowrap>{stateBadge(w.state)}</Cell>
                <Cell nowrap>{lastCell(w)}</Cell>
                <Cell nowrap>{history(w)}</Cell>
                <Cell nowrap>
                  {w.failureStreak ? <StatusBadge tone={w.failureStreak >= 3 ? "bad" : "warn"}>{w.failureStreak} 回</StatusBadge> : <span className="text-console-muted">0</span>}
                </Cell>
                <Cell nowrap muted>
                  {w.lastSuccessAt ? jst(w.lastSuccessAt) : "—"}
                </Cell>
              </Row>
            ))}
          </DataTable>
          <p className="mt-1 text-[11px] text-console-muted">
            定期実行は main にある定義で動く。Mac の launchd で動く土曜ランナーなどは <Link href="/ops/mac-schedule">Mac の定期実行</Link> を見る。最新にするには <code>npm run ci:workflows</code> を実行して再読み込みする (<code>npm run admin</code> の起動時にも走る)。
          </p>
        </Section>
      </Stack>
    </div>
  );
}
