import { ActivityIcon, BotIcon, BrainIcon, CircleDollarSignIcon, DatabaseIcon, HeartPulseIcon, ServerIcon, WorkflowIcon } from "lucide-react";

import { DataGrid, LinkCard, PanelCard, StatCard, StatusBadge, TrendChart } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { opsSummary } from "@/lib/server/ops-ledger";
import { hasError } from "@/lib/server/state-io";
import { datasetDir } from "../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "CI・台帳 — stats47 admin" };

const num = (v: unknown) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/** CI・台帳 (型 A: 概況)。数値タイル → Claude 利用量の推移 → 一覧の順。 */
export default function OpsPage() {
  const d = opsSummary();
  const usage = hasError(d.usage) ? null : d.usage;
  const r2 = hasError(d.r2Freshness) ? null : d.r2Freshness;

  // 日ごとの費用・件数 (古い順)。usage.rows は新しい順
  const byDate = new Map<string, { cost: number; items: number; runs: number }>();
  for (const r of [...(usage?.rows ?? [])].reverse()) {
    const key = String(r.date);
    const cur = byDate.get(key) ?? { cost: 0, items: 0, runs: 0 };
    cur.cost += num(r.cost_usd) ?? 0;
    cur.items += num(r.items) ?? 0;
    cur.runs += 1;
    byDate.set(key, cur);
  }
  const usageTrend = [...byDate.entries()].map(([date, v]) => ({ date, cost: Math.round(v.cost * 100) / 100, items: v.items, runs: v.runs }));
  const ranges = [
    { label: "全期間", last: usageTrend.length },
    { label: "直近 30 日", last: 30 },
  ];

  return (
    <>
      <PageHeading title="CI・台帳" source={`${datasetDir("ci.health")}/ ・ .claude/memory/`} />

      <Grid min="sm">
        <StatCard label="対象 workflow" icon={<WorkflowIcon />} value={hasError(d.ci) ? "—" : d.ci.checked} />
        <StatCard
          label="不健全"
          icon={<HeartPulseIcon />}
          value={hasError(d.ci) ? "—" : d.ci.unhealthyCount}
          tone={hasError(d.ci) ? "neutral" : d.ci.unhealthyCount > 0 ? "bad" : "good"}
        />
        <StatCard label="CI スナップショット" icon={<ActivityIcon />} value={hasError(d.ci) ? "—" : <Freshness iso={d.ci.generatedAt} />} />
        <StatCard
          label="R2 の鮮度切れ"
          icon={<DatabaseIcon />}
          value={r2 ? r2.filter((r) => r.status === "stale").length : "—"}
          tone={r2 && r2.some((r) => r.status === "stale") ? "warn" : "neutral"}
          sub={r2 ? `対象 ${r2.length} key` : undefined}
        />
      </Grid>

      {usage && usageTrend.length >= 3 ? (
        <Grid min="lg">
          <TrendChart
            title="Claude 生成ループの費用"
            icon={<CircleDollarSignIcon />}
            description={`日次 (${usageTrend.length} 日・USD)`}
            data={usageTrend}
            xKey="date"
            series={[{ key: "cost", label: "費用 (USD)" }]}
            valueFormat="decimal"
            kind="bar"
            ranges={ranges}
          />
          <TrendChart
            title="生成した件数"
            icon={<BotIcon />}
            description="日次・items の合計"
            data={usageTrend}
            xKey="date"
            series={[{ key: "items", label: "件数" }]}
            kind="bar"
            ranges={ranges}
          />
        </Grid>
      ) : null}

      <Section title="workflow の健全性">
        {hasError(d.ci) ? (
          <ErrorNote error={d.ci.error} />
        ) : (
          <DataGrid
            columns={[
              { id: "workflow", header: "workflow", sortable: true, nowrap: true },
              { id: "state", header: "状態", nowrap: true },
              { id: "streak", header: "連続失敗", numeric: true, sortable: true },
              { id: "last", header: "最終成功", sortable: true, nowrap: true },
              { id: "days", header: "経過", numeric: true, sortable: true },
            ]}
            rows={d.ci.workflows.map((w) => ({
              id: w.workflow,
              cells: [
                w.workflow,
                !w.everSucceeded ? (
                  <StatusBadge tone="bad">成功歴なし</StatusBadge>
                ) : w.unhealthy ? (
                  <StatusBadge tone="bad">不健全</StatusBadge>
                ) : (
                  <StatusBadge tone="good">健全</StatusBadge>
                ),
                w.failureStreak,
                w.lastSuccessAt?.slice(0, 10) ?? "—",
                w.daysSinceSuccess !== null ? `${w.daysSinceSuccess}日` : "—",
              ],
              sort: [w.workflow, null, w.failureStreak, w.lastSuccessAt, w.daysSinceSuccess],
              search: w.workflow,
              facet: !w.everSucceeded ? "never" : w.unhealthy ? "unhealthy" : "healthy",
              tone: !w.everSucceeded || w.unhealthy ? "bad" : undefined,
            }))}
            facets={[
              { value: "unhealthy", label: "不健全" },
              { value: "never", label: "成功歴なし" },
              { value: "healthy", label: "健全" },
            ]}
            searchPlaceholder="workflow で絞り込み"
          />
        )}
      </Section>

      <Section title="R2 配信データの鮮度">
        {hasError(d.r2Freshness) ? (
          <ErrorNote error={d.r2Freshness.error} />
        ) : (
          <DataGrid
            columns={[
              { id: "key", header: "key", sortable: true },
              { id: "status", header: "状態", nowrap: true },
              { id: "age", header: "経過", numeric: true, sortable: true },
              { id: "max", header: "上限", numeric: true, sortable: true },
            ]}
            rows={d.r2Freshness.map((r) => ({
              id: r.key,
              cells: [
                r.key,
                <StatusBadge key="s" tone={r.status === "fresh" ? "good" : r.status === "stale" ? "warn" : "neutral"}>
                  {r.status}
                </StatusBadge>,
                r.ageDays !== null ? `${r.ageDays}日` : "—",
                r.maxAgeDays !== null ? `${r.maxAgeDays}日` : "—",
              ],
              sort: [r.key, null, r.ageDays, r.maxAgeDays],
              search: r.key,
              facet: r.status,
              tone: r.status === "stale" ? "warn" : undefined,
            }))}
            facets={[...new Set(d.r2Freshness.map((r) => r.status))].map((s) => ({ value: s, label: s }))}
            searchPlaceholder="key で絞り込み"
          />
        )}
      </Section>

      <Section title="Claude 生成ループの実績" note="件数を上げる判断はこの実測に基づく。行数が少ないうちは粒度が粗い。">
        {hasError(d.usage) ? (
          <ErrorNote error={d.usage.error} />
        ) : (
          <DataGrid
            columns={[
              { id: "date", header: "date", sortable: true, nowrap: true },
              { id: "workflow", header: "workflow", sortable: true, nowrap: true },
              { id: "limit", header: "limit", numeric: true, sortable: true },
              { id: "items", header: "items", numeric: true, sortable: true },
              { id: "cost", header: "cost_usd", numeric: true, sortable: true },
              { id: "duration", header: "duration_ms", numeric: true, sortable: true },
              { id: "error", header: "is_error", nowrap: true },
            ]}
            rows={d.usage.rows.map((r, i) => {
              const isError = String(r.is_error) === "1";
              return {
                id: `${r.date}-${r.workflow}-${i}`,
                cells: [
                  String(r.date),
                  String(r.workflow),
                  String(r.limit),
                  String(r.items),
                  String(r.cost_usd),
                  String(r.duration_ms),
                  isError ? <StatusBadge tone="bad">error</StatusBadge> : "",
                ],
                sort: [String(r.date), String(r.workflow), num(r.limit), num(r.items), num(r.cost_usd), num(r.duration_ms), isError ? 1 : 0],
                search: `${r.date} ${r.workflow}`,
                facet: isError ? "error" : "ok",
                tone: isError ? "bad" : undefined,
              };
            })}
            facets={[
              { value: "error", label: "error" },
              { value: "ok", label: "正常" },
            ]}
            searchPlaceholder="日付・workflow で絞り込み"
          />
        )}
      </Section>

      {/* 台帳。agents / skills はモデル・effort・実測費用と一緒に /ops/agents が持つ (同じ一覧を 2 画面に置かない) */}
      <Section title="能力の台帳">
        <Grid min="lg">
          <LinkCard
            href="/ops/agents"
            title={
              <span className="flex items-center gap-2">
                <ServerIcon className="size-4 text-muted-foreground" />
                エージェントとスキル
              </span>
            }
            sub="モデル・effort・直近の使用量・改善提案は「エージェントとモデル」で見る"
          />
        </Grid>
        <PanelCard title="memory" icon={<BrainIcon />} description={hasError(d.memories) ? undefined : `${d.memories.length} 件`}>
            {hasError(d.memories) ? (
              <ErrorNote error={d.memories.error} />
            ) : (
              <DataGrid
                columns={[
                  { id: "name", header: "name", sortable: true },
                  { id: "type", header: "type", sortable: true, nowrap: true },
                  { id: "description", header: "description" },
                ]}
                rows={d.memories.map((e) => ({
                  id: e.relPath,
                  cells: [
                    <span key="n" className="break-all font-medium">
                      {e.name}
                    </span>,
                    e.type ? <span className="text-muted-foreground">{String(e.type)}</span> : "",
                    <span key="d" className="line-clamp-2 text-muted-foreground">
                      {e.description}
                    </span>,
                  ],
                  sort: [e.name, e.type ?? null, null],
                  search: `${e.name} ${e.description}`,
                  facet: e.type ?? "",
                }))}
                facets={[...new Set(d.memories.map((e) => e.type).filter((t): t is string => Boolean(t)))].map((t) => ({ value: t, label: t }))}
                pageSize={20}
                searchPlaceholder="名前・説明で絞り込み"
              />
            )}
        </PanelCard>
      </Section>
    </>
  );
}
