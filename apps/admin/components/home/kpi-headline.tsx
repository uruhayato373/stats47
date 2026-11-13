import { Cell, DataTable, Row, StatCard, StatusBadge, type StatTrend } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, Unmeasured } from "@/components/ops/primitives";
import { hasError } from "@/lib/server/state-io";
import { readKpiSummary, readWeeklyRevenue, type KpiNode } from "@/lib/server/kpi";

/**
 * ホーム最上段: KGI (週次収益 = NSM) とチャネル別の内訳、重点 KPI のタイル。
 * 値は KPI ツリーと同じ週・同じ計算 (weekly-revenue.mjs / measurement-cycle) を読むだけ。欠測は 0 にせず「判定不能」と出す。
 */

const yen = (v: number) => `¥${v.toLocaleString("ja-JP")}`;

/** "16701" → "16,701"。% や文章の値はそのまま */
function formatValue(v: string): string {
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v).toLocaleString("ja-JP") : v;
}

function trendOf(n: KpiNode): StatTrend | undefined {
  const now = Number.parseFloat(n.value ?? "");
  const prev = Number.parseFloat(n.previous ?? "");
  if (!Number.isFinite(now) || !Number.isFinite(prev) || prev === 0) return undefined;
  const pct = ((now - prev) / Math.abs(prev)) * 100;
  return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% (4 週前比)`, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

function targetText(n: KpiNode): string | null {
  if (!n.target) return null;
  const now = Number.parseFloat(n.value ?? "");
  const rate = Number.isFinite(now) && n.target.value > 0 ? ` (達成 ${Math.round((now / n.target.value) * 100)}%)` : "";
  return `目標 ${n.target.value.toLocaleString("ja-JP")} / ${n.target.dueWeek}${rate}`;
}

export function KpiHeadline() {
  const summary = readKpiSummary();
  if (hasError(summary)) return <ErrorNote error={summary.error} />;
  const revenue = readWeeklyRevenue(summary.week);
  const focus = summary.nodes.filter((n) => n.focus);

  return (
    <>
      <Section id="kgi" title={`KGI: 週次収益 ${summary.week}`} note="合計は週の円が分かる AdSense と note だけを足す。A8・楽天は月累計、Kindle はロイヤリティ見積りなので別に並べる。">
        {hasError(revenue) ? (
          <ErrorNote error={revenue.error} />
        ) : (
          <>
            <Grid min="sm">
              <StatCard
                label={`週次収益 (${revenue.weekStart}〜${revenue.weekEnd})`}
                value={revenue.status === "ok" ? yen(revenue.totalYen ?? 0) : "判定不能"}
                tone={revenue.status === "ok" ? "neutral" : "warn"}
                sub={revenue.status === "ok" ? "AdSense + note" : `判定できた分 ${yen(revenue.measuredYen)}`}
              />
              {revenue.channels
                .filter((c) => c.inTotal)
                .map((c) => (
                  <StatCard
                    key={c.id}
                    label={c.label}
                    value={c.status === "ok" ? yen(c.yen ?? 0) : "判定不能"}
                    tone={c.status === "ok" ? "neutral" : "warn"}
                    sub={c.detail}
                  />
                ))}
            </Grid>
            <DataTable columns={["チャネル", "期間", "金額", "状態", "根拠・判定不能の理由"]}>
              {revenue.channels.map((c) => (
                <Row key={c.id}>
                  <Cell nowrap>{c.label}</Cell>
                  <Cell nowrap muted>
                    {c.period === "week" ? "週" : "月累計"}
                    {c.inTotal ? "" : " (合計外)"}
                  </Cell>
                  <Cell nowrap>{c.status === "ok" && c.yen != null ? yen(c.yen) : <Unmeasured />}</Cell>
                  <Cell nowrap>
                    <StatusBadge tone={c.status === "ok" ? "good" : "warn"}>{c.status === "ok" ? "計測済み" : "判定不能"}</StatusBadge>
                  </Cell>
                  <Cell muted>{c.detail}</Cell>
                </Row>
              ))}
            </DataTable>
          </>
        )}
      </Section>

      <Section id="focus-kpi" title="重点 KPI" note={`★ = 今月の重点レーン。増減は ${summary.compareWeek} (4 週前) との比較。`}>
        <Grid min="sm">
          {focus.map((n) => (
            <StatCard
              key={n.id}
              label={n.label}
              value={n.value ? formatValue(n.value) : "判定不能"}
              tone={n.value ? "neutral" : "warn"}
              trend={trendOf(n)}
              sub={targetText(n) ?? (n.value ? undefined : n.note)}
            />
          ))}
        </Grid>
      </Section>
    </>
  );
}
