import Link from "next/link";

import {
  Badge,
  ErrorNote,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
} from "@/components/ops/primitives";
import { strategyLaneBoard, type Stance } from "@/lib/server/strategy-lanes";

export const dynamic = "force-dynamic";
export const metadata = { title: "戦略レーン — stats47 admin" };

/**
 * 戦略レーン: 収益化戦略 §5 の優先順位表と、月次 focus_lanes → 週次 Must → backlog [レーン:] の配線。
 * 読み取り専用。構えの変更は収益化戦略の表を編集し、計画は /monthly-plan・/weekly-plan が書く。
 */

const stanceTone: Record<Stance, "good" | "neutral" | "bad"> = {
  攻める: "good",
  維持: "neutral",
  凍結: "bad",
};
const weeklyTone = {
  aligned: "good",
  "off-focus": "warn",
  unresolved: "warn",
  frozen: "bad",
} as const;
const weeklyLabel = {
  aligned: "重点内",
  "off-focus": "重点外",
  unresolved: "レーン不明",
  frozen: "凍結",
} as const;
const tierLabel = { high: "高", mid: "中", low: "低", hold: "判断待ち" } as const;

/** 収益化戦略の表セルは Markdown。`ID` だけを code として描き、他は素のテキストにする */
function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded bg-console-bg px-1 text-[12px]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function StrategyLanesPage() {
  const board = strategyLaneBoard();
  const errors = board.issues.filter((i) => i.level === "error");
  const warnings = board.issues.filter((i) => i.level === "warning");
  const must = board.weekly.filter((w) => w.section === "Must");
  const mustAligned = must.filter((w) => w.status === "aligned").length;
  const laned = board.totalCards - board.unlanedCards.length;

  return (
    <div className="space-y-8">
      <PageHeading title="戦略レーン" source={`${board.strategyDoc} §5「戦略レーンと優先順位」`}>
        <p className="max-w-4xl text-sm text-console-muted">
          施策を収益までの流れの上のレーンに分け、どこに投資を増やすか（攻める）・現状維持か・止めるかを示す。
          月次の重点は「攻める」レーンから選び、週次の Must は重点レーンのタスクか不具合から選ぶ。
          構えを変えるときは収益化戦略の表を編集する。判定は <code>npm run docs:check</code>（DG073〜078）と同じ。
        </p>
      </PageHeading>

      {board.error ? <ErrorNote error={board.error} /> : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="今月の重点レーン"
          value={board.focusLanes?.length ? board.focusLanes.join(" / ") : "未設定"}
          sub="monthly.md の focus_lanes"
          tone={board.focusLanes?.length ? "good" : "warn"}
        />
        <Stat
          label="今週の Must が重点内"
          value={`${mustAligned}/${must.length}`}
          sub="不具合カードは重点外でも可"
          tone={must.length > 0 && mustAligned === must.length ? "good" : "warn"}
        />
        <Stat
          label="レーン付きカード"
          value={`${laned}/${board.totalCards}`}
          sub="backlog の [レーン:] タグ"
          tone={laned === board.totalCards ? "good" : "warn"}
        />
        <Stat
          label="配線の検査"
          value={`error ${errors.length} / warning ${warnings.length}`}
          sub="DG073〜078"
          tone={errors.length ? "bad" : warnings.length ? "warn" : "good"}
        />
      </div>

      <Section title="レーンと構え" count={board.lanes.length}>
        <Table columns={["順", "レーン", "構え", "今の狙い", "構えを変える条件", "backlog", "改善", "今週"]}>
          {board.lanes.map((lane) => (
            <Tr key={lane.name}>
              <Td nowrap muted>{lane.order}</Td>
              <Td nowrap>
                <span className="font-semibold">{lane.name}</span>
                {lane.isFocus ? (
                  <span className="ml-1.5">
                    <Badge tone="info">今月の重点</Badge>
                  </span>
                ) : null}
              </Td>
              <Td nowrap>
                <Badge tone={stanceTone[lane.stance]}>{lane.stance}</Badge>
              </Td>
              <Td>
                <div className="min-w-64">
                  <InlineText text={lane.aim} />
                </div>
              </Td>
              <Td muted>
                <div className="min-w-56">
                  <InlineText text={lane.gate} />
                </div>
              </Td>
              <Td nowrap>
                {lane.cards.length}
                <span className="ml-1 text-[11px] text-console-muted">
                  (高{lane.tierCounts.high}・中{lane.tierCounts.mid}・低{lane.tierCounts.low}・判断待ち
                  {lane.tierCounts.hold})
                </span>
              </Td>
              <Td nowrap>{lane.improvementIds.length}</Td>
              <Td nowrap>{lane.weeklyCount}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      {board.issues.length > 0 ? (
        <Section title="配線の警告" count={board.issues.length}>
          <ul className="space-y-1 text-[13px]">
            {board.issues.map((issue, i) => (
              <li key={`${issue.code}-${i}`} className="flex gap-2">
                <Badge tone={issue.level === "error" ? "bad" : "warn"}>{issue.code}</Badge>
                <span className="text-console-muted">{issue.file}</span>
                <span className="text-console-fg">{issue.message}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="今週の計画とレーン" count={board.weekly.length}>
        <Table columns={["節", "タスク", "参照 ID", "レーン", "判定"]}>
          {board.weekly.map((item) => (
            <Tr key={item.line}>
              <Td nowrap muted>{item.section}</Td>
              <Td>
                {item.done ? <span className="mr-1 text-console-good">✓</span> : null}
                {item.text}
              </Td>
              <Td nowrap muted>
                {item.refs.length ? item.refs.map((r) => r.id).join(", ") : "—"}
              </Td>
              <Td nowrap>{item.lanes.length ? item.lanes.join(", ") : "—"}</Td>
              <Td nowrap>
                <Badge tone={weeklyTone[item.status]}>{weeklyLabel[item.status]}</Badge>
              </Td>
            </Tr>
          ))}
        </Table>
        <p className="text-[12px] text-console-muted">
          詳細は <Link className="text-console-info underline" href="/todo?f=weekly">今週の計画</Link>。
        </p>
      </Section>

      <Section title="レーン別のバックログ">
        <div className="space-y-2">
          {board.lanes.map((lane) => (
            <details key={lane.name} className="rounded-md border border-console-border bg-console-card p-3">
              <summary className="cursor-pointer text-sm">
                <span className="font-semibold">{lane.name}</span>
                <span className="ml-2">
                  <Badge tone={stanceTone[lane.stance]}>{lane.stance}</Badge>
                </span>
                <span className="ml-2 text-[12px] text-console-muted">
                  backlog {lane.cards.length} 件 / 改善 {lane.improvementIds.length} 件
                </span>
              </summary>
              <ul className="mt-2 space-y-1 text-[13px]">
                {lane.cards.map((card) => (
                  <li key={card.id ?? card.title} className="flex flex-wrap gap-2">
                    <Badge>{tierLabel[card.tier]}</Badge>
                    {card.kind ? <Badge tone={card.kind === "不具合" ? "bad" : "neutral"}>{card.kind}</Badge> : null}
                    <code className="text-[11px] text-console-muted">{card.id}</code>
                    <span>{card.title}</span>
                  </li>
                ))}
                {lane.improvementIds.map((id) => (
                  <li key={id} className="flex gap-2">
                    <Badge tone="info">改善</Badge>
                    <code className="text-[11px] text-console-muted">{id}</code>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}
