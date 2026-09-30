import Link from "next/link";

import { Cell, DataTable, Row, StatusBadge, type Tone } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, Unmeasured } from "@/components/ops/primitives";
import { hasError } from "@/lib/server/state-io";
import { readKpiSummary } from "@/lib/server/kpi";

/**
 * トップの KPI ツリー (NSM → 駆動 KPI → ガードレール)。値は週次 CI の measurement-cycle が正典で、
 * 画面は読むだけ。値の無い KPI は 0 にせず「—」と状態の理由を出す。施策は /todo の改善台帳へ飛ぶ。
 */

const TIER_LABEL = { nsm: "NSM", driver: "駆動", guardrail: "守り" } as const;

const STATUS: Record<string, { tone: Tone; label: string }> = {
  ok: { tone: "good", label: "正常" },
  partial: { tone: "info", label: "一部" },
  "see-nsm": { tone: "info", label: "内訳あり" },
  degraded: { tone: "warn", label: "劣化" },
  stale: { tone: "warn", label: "古い" },
  missing: { tone: "bad", label: "欠測" },
  unmeasurable: { tone: "neutral", label: "判定不能" },
  "not-connected": { tone: "neutral", label: "未接続" },
};

export function KpiTree() {
  const summary = readKpiSummary();
  if (hasError(summary)) return <ErrorNote error={summary.error} />;
  const { improvements: imp } = summary;
  return (
    <Section
      id="kpi"
      title={
        <>
          KPI ツリー {summary.week} <Freshness iso={summary.generatedAt} />
        </>
      }
      note={`比較は ${summary.compareWeek} (4 週前・窓が重ならない値)。★ = 今月の重点レーン。目標は期日と根拠の計算式がある KPI だけに置く。`}
    >
      <DataTable columns={["階層", "KPI", "今週", "比較", "目標", "状態", "施策"]}>
        {summary.nodes.map((n) => {
          const status = STATUS[n.status] ?? { tone: "neutral" as Tone, label: n.status };
          return (
            <Row key={n.id}>
              <Cell nowrap muted>
                {TIER_LABEL[n.tier]}
              </Cell>
              <Cell>
                {n.focus ? "★ " : ""}
                {n.label}
              </Cell>
              <Cell nowrap>{n.value ?? <Unmeasured />}</Cell>
              <Cell nowrap muted>
                {n.previous ?? <Unmeasured />}
              </Cell>
              <Cell nowrap title={n.target?.basis}>
                {n.target ? `${n.target.value.toLocaleString("ja-JP")} (${n.target.dueWeek})` : <Unmeasured />}
              </Cell>
              <Cell>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                {n.note ? <p className="mt-1 text-xs text-muted-foreground">{n.note}</p> : null}
              </Cell>
              <Cell nowrap>
                {n.improvements.length ? (
                  <Link href="/todo?f=improvements" className="text-console-accent" title={n.improvements.join("\n")}>
                    {n.improvements.length} 件
                  </Link>
                ) : (
                  <Unmeasured />
                )}
              </Cell>
            </Row>
          );
        })}
      </DataTable>
      <p className="m-0 text-xs text-muted-foreground">
        施策 active {imp.active} 件 (上限 {imp.maxActive} 件)
        {imp.active > imp.maxActive ? " — 超過中。新しい施策を足さず月次で削る" : ""}・想定効果 [target:] なし {imp.noTarget.length} 件
        {summary.focusWithoutImprovements.length ? `・重点 KPI なのに施策 0 件: ${summary.focusWithoutImprovements.join(", ")}` : ""}
      </p>
    </Section>
  );
}
