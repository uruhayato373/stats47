import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import type { MetricStatus, PilotState } from "@/lib/pilot-board";
import { PILOT_BOARD_PATH, pilotBoard } from "@/lib/server/pilot-board";

export const dynamic = "force-dynamic";
export const metadata = { title: "pilot 判定 — stats47 admin" };

/**
 * pilot 判定ボード: 収益化戦略 §3.5 の回収経路3つ・§3.6 の商品の展開順序・§6 の YouTube pilot を、
 * 開始日・判定日・指標の現在値で 1 か所に並べる。読み取り専用。入力は data/business/pilot-board.json。
 */

const stateLabel: Record<PilotState, string> = {
  "not-started": "未開始",
  paused: "保留",
  "no-data": "判定不能",
  measuring: "計測中",
  due: "判定待ち",
};
const stateTone = {
  "not-started": "neutral",
  paused: "neutral",
  "no-data": "bad",
  measuring: "info",
  due: "warn",
} as const;
const metricTone: Record<MetricStatus, "good" | "warn" | "bad" | "info"> = {
  ok: "good",
  waiting: "info",
  missing: "bad",
  stale: "warn",
};
const metricLabel: Record<MetricStatus, string> = { ok: "記録あり", waiting: "窓待ち", missing: "記録なし", stale: "記録が古い" };

export default function PilotBoardPage() {
  const board = pilotBoard();
  const count = (s: PilotState) => board.rows.filter((r) => r.state === s).length;

  return (
    <div className="space-y-8">
      <PageHeading title="pilot 判定" source={`${PILOT_BOARD_PATH} + data/ の週次記録`}>
        <p className="max-w-4xl text-sm text-console-muted">
          収益化の pilot を、開始日・判定日・判定に使う指標の現在値で並べる。記録が無い指標や古い記録は 0 と読まずに「判定不能」と出す。
          GA4 の導線クリックは直近 28 日の累計なので、開始日より前の日を含む窓は使わない。開始日や指標を変えるときは台帳を編集する。
        </p>
      </PageHeading>

      {board.error ? <ErrorNote error={board.error} /> : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="計測中" value={String(count("measuring"))} sub={`今日 ${board.today}`} tone="good" />
        <StatCard label="判定待ち" value={String(count("due"))} sub="判定日を過ぎた" tone={count("due") ? "warn" : "good"} />
        <StatCard label="判定不能" value={String(count("no-data"))} sub="記録なし・古い記録" tone={count("no-data") ? "bad" : "good"} />
        <StatCard label="未開始・保留" value={String(count("not-started") + count("paused"))} sub="開始日なし / 実験台帳で保留" tone="neutral" />
      </div>

      <Section title="pilot 一覧" count={board.rows.length}>
        <DataTable columns={["pilot", "状態", "開始日", "判定日", "指標と現在値", "参照"]}>
          {board.rows.map((row) => (
            <Row key={row.id}>
              <Cell>
                <div className="min-w-48">
                  <div className="font-semibold">{row.title}</div>
                  <div className="text-[12px] text-console-muted">{row.route}</div>
                </div>
              </Cell>
              <Cell>
                <div className="min-w-40 space-y-1">
                  <StatusBadge tone={stateTone[row.state]}>{stateLabel[row.state]}</StatusBadge>
                  <div className="text-[12px] text-console-muted">{row.stateNote}</div>
                </div>
              </Cell>
              <Cell>
                <div className="min-w-28">
                  <div>{row.start ?? "—"}</div>
                  <div className="text-[11px] text-console-muted">{row.startEvidence}</div>
                </div>
              </Cell>
              <Cell>
                <div className="min-w-28">
                  <div>
                    {row.judgeDate ?? "—"}
                    {row.daysLeft !== null && row.daysLeft > 0 ? (
                      <span className="ml-1 text-[12px] text-console-muted">(残り {row.daysLeft} 日)</span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-console-muted">{row.judgeSource}</div>
                </div>
              </Cell>
              <Cell>
                <ul className="min-w-72 space-y-1.5">
                  {row.metrics.map((m) => (
                    <li key={m.label}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge tone={metricTone[m.status]}>{metricLabel[m.status]}</StatusBadge>
                        <span className="font-medium">{m.label}</span>
                        {m.value ? <span>{m.value}</span> : null}
                      </div>
                      <div className="text-[11px] text-console-muted">
                        {m.note}
                        {m.observedAt ? ` (記録日 ${m.observedAt})` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </Cell>
              <Cell nowrap muted>
                <code className="text-[11px]">{row.card}</code>
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>
    </div>
  );
}
