import { ActivityIcon, CircleAlertIcon, ClockIcon, PowerOffIcon, WorkflowIcon } from "lucide-react";
import Link from "next/link";

import { DataGrid, StatCard, StatusBadge, TrendChart, type Tone } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { buttonVariants } from "@/components/ui/button";
import { hasError } from "@/lib/server/state-io";
import { cadenceOf, scheduleSortKey, workflowCatalog, WORKFLOW_CATALOG, type WorkflowEntry } from "@/lib/server/workflows";

export const dynamic = "force-dynamic";
export const metadata = { title: "CI ワークフロー — stats47 admin" };

/**
 * /ops/workflows — 全 GitHub Actions workflow の起動条件・状態・直近の結果を目視する画面 (型 B: 一覧)。
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
  if (!w.last) return <span className="text-muted-foreground">実行なし</span>;
  const c =
    w.last.status !== "completed"
      ? { label: "実行中", tone: "info" as Tone }
      : (CONCLUSION[w.last.conclusion ?? ""] ?? { label: w.last.conclusion ?? "?", tone: "neutral" as Tone });
  return (
    <div className="flex flex-col gap-0.5">
      <a href={w.last.url} target="_blank" rel="noreferrer">
        <StatusBadge tone={c.tone}>{c.label}</StatusBadge>
      </a>
      <span className="text-xs text-muted-foreground">
        {jst(w.last.createdAt)} · {w.last.event}
      </span>
    </div>
  );
}

/** 直近の結果を左から新しい順に 1 文字で並べる */
function history(w: WorkflowEntry) {
  const mark = (c: string | null, s: string) => (s !== "completed" ? "…" : c === "success" ? "○" : c === "failure" ? "×" : "-");
  return (
    <span className="font-mono text-xs tracking-wider" title="新しい順。○ 成功 / × 失敗 / - 取消・スキップ / … 実行中">
      {w.runs.map((r) => mark(r.conclusion, r.status)).join("") || "—"}
    </span>
  );
}

function stateBadge(state: string) {
  if (state === "active") return <StatusBadge tone="good">有効</StatusBadge>;
  if (state === "unregistered")
    return (
      <StatusBadge tone="info" title="main にまだ無い (定期実行は main の定義で動く)">
        未登録
      </StatusBadge>
    );
  return <StatusBadge tone="warn">{state === "disabled_manually" ? "手動で無効" : state}</StatusBadge>;
}

/** 直近の結果の絞り込み値 (DataGrid の facets と照合) */
function lastFacet(w: WorkflowEntry) {
  if (!w.last) return "none";
  if (w.last.status !== "completed") return "running";
  return w.last.conclusion ?? "unknown";
}

export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter: FilterKey = f && f in FILTERS ? (f as FilterKey) : "all";
  const v = workflowCatalog();
  if (hasError(v)) {
    return (
      <>
        <PageHeading title="CI ワークフロー" source={WORKFLOW_CATALOG} />
        <ErrorNote error={v.error} />
      </>
    );
  }
  if (!v) {
    return (
      <>
        <PageHeading title="CI ワークフロー" source={WORKFLOW_CATALOG} />
        <p className="text-sm text-muted-foreground">
          まだ集計されていない。<code className="font-mono text-xs">npm run ci:workflows</code> を実行してから再読み込みする。
        </p>
      </>
    );
  }
  const all = v.workflows;
  // 毎日・毎週・毎月は動く順 (日本時間)、それ以外は連続失敗の多い順
  const byTime = filter === "daily" || filter === "weekly" || filter === "monthly";
  const rows = all
    .filter(FILTERS[filter].test)
    .sort((a, b) => (byTime ? scheduleSortKey(a) - scheduleSortKey(b) : b.failureStreak - a.failureStreak) || a.file.localeCompare(b.file));
  const failing = all.filter(FILTERS.failing.test).length;

  // 全 workflow の実行を日本時間の日ごとに数える (古い順)。runs は各 workflow の直近 perWorkflow 回だけ
  const byDay = new Map<string, { success: number; failure: number; other: number }>();
  for (const w of all) {
    for (const r of w.runs) {
      const day = new Date(r.createdAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
      const cur = byDay.get(day) ?? { success: 0, failure: 0, other: 0 };
      if (r.status === "completed" && r.conclusion === "success") cur.success += 1;
      else if (r.status === "completed" && r.conclusion === "failure") cur.failure += 1;
      else cur.other += 1;
      byDay.set(day, cur);
    }
  }
  const runTrend = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, c]) => ({ day, ...c }));

  return (
    <>
      <PageHeading title="CI ワークフロー" source=".github/workflows/*.yml + gh" />

      <Grid min="sm">
        <StatCard
          label="ワークフロー"
          icon={<WorkflowIcon />}
          value={all.length}
          sub={`毎日 ${all.filter(FILTERS.daily.test).length}・毎週 ${all.filter(FILTERS.weekly.test).length}・毎月 ${all.filter(FILTERS.monthly.test).length}・定期実行なし ${all.filter(FILTERS.none.test).length}`}
        />
        <StatCard
          label="直近が失敗"
          icon={<CircleAlertIcon />}
          value={failing}
          tone={failing ? "bad" : "good"}
          sub={`連続 3 回以上 ${all.filter((w) => w.failureStreak >= 3).length}`}
        />
        <StatCard label="無効・未登録" icon={<PowerOffIcon />} value={all.filter(FILTERS.disabled.test).length} tone="warn" />
        <StatCard
          label="集計した時刻"
          icon={<ClockIcon />}
          value={<Freshness iso={v.generatedAt} />}
          sub={`直近 ${v.perWorkflow} 回を確認・取得エラー ${v.errors.length}`}
        />
      </Grid>

      {runTrend.length >= 3 ? (
        <TrendChart
          title="実行の推移"
          icon={<ActivityIcon />}
          description={`日次・各 workflow の直近 ${v.perWorkflow} 回を日本時間の日で数えた件数 (古い日ほど欠ける)`}
          data={runTrend}
          xKey="day"
          series={[
            { key: "success", label: "成功" },
            { key: "failure", label: "失敗" },
            { key: "other", label: "取消・スキップ・実行中" },
          ]}
          kind="bar"
          stacked
          ranges={[
            { label: "直近 30 日", last: Math.min(30, runTrend.length) },
            { label: "直近 14 日", last: 14 },
            { label: "全期間", last: runTrend.length },
          ]}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
          <Link key={k} href={k === "all" ? "/ops/workflows" : `/ops/workflows?f=${k}`} className={buttonVariants({ variant: k === filter ? "default" : "outline", size: "sm" })}>
            {FILTERS[k].label} ({all.filter(FILTERS[k].test).length})
          </Link>
        ))}
      </div>

      <Section
        title={FILTERS[filter].label}
        count={rows.length}
        note={
          <>
            定期実行は main にある定義で動く。Mac の launchd で動く土曜ランナーなどは{" "}
            <Link href="/ops/mac-schedule" className="font-medium underline-offset-4 hover:underline">
              Mac の定期実行
            </Link>{" "}
            を見る。最新にするには <code className="font-mono text-xs">npm run ci:workflows</code> を実行して再読み込みする (
            <code className="font-mono text-xs">npm run admin</code> の起動時にも走る)。
          </>
        }
      >
        <DataGrid
          columns={[
            { id: "name", header: "ワークフロー", sortable: true },
            { id: "trigger", header: "起動" },
            { id: "state", header: "状態", nowrap: true },
            { id: "last", header: "直近", nowrap: true, sortable: true },
            { id: "history", header: "履歴", nowrap: true },
            { id: "streak", header: "連続失敗", nowrap: true, numeric: true, sortable: true },
            { id: "success", header: "最後の成功", nowrap: true, sortable: true },
          ]}
          rows={rows.map((w) => ({
            id: w.file,
            cells: [
              <div key="n">
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-muted-foreground">
                  <code className="font-mono">{w.file}</code>
                  {w.purpose ? ` — ${w.purpose}` : ""}
                </div>
              </div>,
              <div key="t">
                <div className="text-xs">{w.schedules.map((s) => s.jst).join(" / ") || "—"}</div>
                <div className="text-xs text-muted-foreground">{w.triggers.filter((t) => t !== "schedule").join("・")}</div>
              </div>,
              stateBadge(w.state),
              lastCell(w),
              history(w),
              w.failureStreak ? (
                <StatusBadge tone={w.failureStreak >= 3 ? "bad" : "warn"}>{w.failureStreak} 回</StatusBadge>
              ) : (
                <span className="text-muted-foreground">0</span>
              ),
              <span key="s" className="text-muted-foreground">
                {w.lastSuccessAt ? jst(w.lastSuccessAt) : "—"}
              </span>,
            ],
            sort: [w.name, null, null, w.last?.createdAt ?? null, null, w.failureStreak, w.lastSuccessAt],
            search: `${w.name} ${w.file} ${w.purpose ?? ""}`,
            facet: lastFacet(w),
            tone: w.last?.conclusion === "failure" ? (w.failureStreak >= 3 ? "bad" : "warn") : undefined,
          }))}
          facets={[
            { value: "success", label: "直近 成功" },
            { value: "failure", label: "直近 失敗" },
            { value: "cancelled", label: "直近 取消" },
            { value: "skipped", label: "直近 スキップ" },
            { value: "running", label: "実行中" },
            { value: "none", label: "実行なし" },
          ]}
          pageSize={100}
          searchPlaceholder="名前・ファイル・目的で絞り込み"
        />
      </Section>
    </>
  );
}
