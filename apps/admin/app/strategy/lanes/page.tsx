import Link from "next/link";
import { ChevronDownIcon, CrosshairIcon, ListChecksIcon, TagIcon, WorkflowIcon } from "lucide-react";

import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { strategyLaneBoard, type Stance } from "@/lib/server/strategy-lanes";

export const dynamic = "force-dynamic";
export const metadata = { title: "領域と構え — stats47 admin" };

/**
 * 領域と構え: 収益化戦略 §5 の優先順位表と、月次 focus_domains → 週次 Must → backlog [領域:] の配線。
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
  unresolved: "領域不明",
  frozen: "凍結",
} as const;
const tierLabel = { high: "高", mid: "中", low: "低", hold: "判断待ち" } as const;

/** 収益化戦略の表セルは Markdown。`ID` だけを code として描き、他は素のテキストにする */
function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded bg-muted px-1 font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** 領域と構え (型 B: 一覧・キュー)。件数 → 領域の表 → 警告 → 今週の計画 → 領域別のバックログ */
export default function StrategyLanesPage() {
  const board = strategyLaneBoard();
  const errors = board.issues.filter((i) => i.level === "error");
  const warnings = board.issues.filter((i) => i.level === "warning");
  const must = board.weekly.filter((w) => w.section === "Must");
  const mustAligned = must.filter((w) => w.status === "aligned").length;
  const laned = board.totalCards - board.unlanedCards.length;

  return (
    <>
      <PageHeading title="領域と構え" source={`${board.strategyDoc} §5「領域と優先順位」`}>
        <p className="max-w-4xl text-sm text-muted-foreground">
          施策を収益までの流れの上の領域に分け、どこに投資を増やすか（攻める）・現状維持か・止めるかを示す。
          月次の重点は「攻める」領域から選び、週次の Must は重点領域のタスクか不具合から選ぶ。
          構えを変えるときは収益化戦略の表を編集する。判定は <code className="rounded bg-muted px-1 font-mono text-xs">npm run docs:check</code>（DG073〜080）と同じ。KPI 列は領域の構えを変える判断に使う KPI ツリーの id。
        </p>
      </PageHeading>

      {board.error ? <ErrorNote error={board.error} /> : null}

      <Grid min="sm">
        <StatCard
          label="今月の重点領域"
          icon={<CrosshairIcon />}
          value={board.focusLanes?.length ? board.focusLanes.join(" / ") : "未設定"}
          sub="monthly.md の focus_domains"
          tone={board.focusLanes?.length ? "good" : "warn"}
        />
        <StatCard
          label="今週の Must が重点内"
          icon={<ListChecksIcon />}
          value={`${mustAligned}/${must.length}`}
          sub="不具合カードは重点外でも可"
          tone={must.length > 0 && mustAligned === must.length ? "good" : "warn"}
        />
        <StatCard
          label="領域付きカード"
          icon={<TagIcon />}
          value={`${laned}/${board.totalCards}`}
          sub="backlog の [領域:] タグ"
          tone={laned === board.totalCards ? "good" : "warn"}
        />
        <StatCard
          label="配線の検査"
          icon={<WorkflowIcon />}
          value={`error ${errors.length} / warning ${warnings.length}`}
          sub="DG073〜080"
          tone={errors.length ? "bad" : warnings.length ? "warn" : "good"}
        />
      </Grid>

      <Section title="領域と構え" count={board.lanes.length}>
        <DataTable columns={["順", "領域", "構え", "今の狙い", "構えを変える条件", "KPI", "backlog", "改善", "今週"]}>
          {board.lanes.map((lane) => (
            <Row key={lane.name}>
              <Cell nowrap muted>{lane.order}</Cell>
              <Cell nowrap>
                <span className="font-semibold">{lane.name}</span>
                {lane.isFocus ? (
                  <span className="ml-1.5">
                    <StatusBadge tone="info">今月の重点</StatusBadge>
                  </span>
                ) : null}
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={stanceTone[lane.stance]}>{lane.stance}</StatusBadge>
              </Cell>
              <Cell>
                <div className="min-w-64">
                  <InlineText text={lane.aim} />
                </div>
              </Cell>
              <Cell muted>
                <div className="min-w-56">
                  <InlineText text={lane.gate} />
                </div>
              </Cell>
              <Cell nowrap muted>
                {lane.kpis.length ? lane.kpis.map((id) => <code key={id} className="mr-1 font-mono text-xs">{id}</code>) : "—"}
              </Cell>
              <Cell nowrap>
                {lane.cards.length}
                <span className="ml-1 text-xs text-muted-foreground">
                  (高{lane.tierCounts.high}・中{lane.tierCounts.mid}・低{lane.tierCounts.low}・判断待ち
                  {lane.tierCounts.hold})
                </span>
              </Cell>
              <Cell nowrap>{lane.improvementIds.length}</Cell>
              <Cell nowrap>{lane.weeklyCount}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      {board.issues.length > 0 ? (
        <Section title="配線の警告" count={board.issues.length}>
          <ul className="flex flex-col gap-1 text-sm">
            {board.issues.map((issue, i) => (
              <li key={`${issue.code}-${i}`} className="flex gap-2">
                <StatusBadge tone={issue.level === "error" ? "bad" : "warn"}>{issue.code}</StatusBadge>
                <span className="text-muted-foreground">{issue.file}</span>
                <span className="text-foreground">{issue.message}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="今週の計画と領域" count={board.weekly.length}>
        <DataTable columns={["節", "タスク", "参照 ID", "領域", "判定"]}>
          {board.weekly.map((item) => (
            <Row key={item.line}>
              <Cell nowrap muted>{item.section}</Cell>
              <Cell>
                {item.done ? <span className="mr-1 text-console-good">✓</span> : null}
                {item.text}
              </Cell>
              <Cell nowrap muted>
                {item.refs.length ? item.refs.map((r) => r.id).join(", ") : "—"}
              </Cell>
              <Cell nowrap>{item.lanes.length ? item.lanes.join(", ") : "—"}</Cell>
              <Cell nowrap>
                <StatusBadge tone={weeklyTone[item.status]}>{weeklyLabel[item.status]}</StatusBadge>
              </Cell>
            </Row>
          ))}
        </DataTable>
        <p className="text-xs text-muted-foreground">
          詳細は <Link className="font-medium underline-offset-4 hover:underline" href="/todo?f=weekly">今週の計画</Link>。
        </p>
      </Section>

      <Section title="領域別のバックログ">
        <Stack gap="sm">
          {board.lanes.map((lane) => (
            <Collapsible key={lane.name} className="rounded-md border p-3">
              <CollapsibleTrigger className="group/trigger flex w-full cursor-pointer items-center gap-2 text-left text-sm">
                <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[panel-open]/trigger:rotate-180" aria-hidden="true" />
                <span className="font-semibold">{lane.name}</span>
                <StatusBadge tone={stanceTone[lane.stance]}>{lane.stance}</StatusBadge>
                <span className="text-xs text-muted-foreground">
                  backlog {lane.cards.length} 件 / 改善 {lane.improvementIds.length} 件
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {lane.cards.map((card) => (
                  <li key={card.id ?? card.title} className="flex flex-wrap gap-2">
                    <StatusBadge>{tierLabel[card.tier]}</StatusBadge>
                    {card.kind ? <StatusBadge tone={card.kind === "不具合" ? "bad" : "neutral"}>{card.kind}</StatusBadge> : null}
                    <code className="font-mono text-xs text-muted-foreground">{card.id}</code>
                    <span>{card.title}</span>
                  </li>
                ))}
                {lane.improvementIds.map((id) => (
                  <li key={id} className="flex gap-2">
                    <StatusBadge tone="info">改善</StatusBadge>
                    <code className="font-mono text-xs text-muted-foreground">{id}</code>
                  </li>
                ))}
              </ul>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </Stack>
      </Section>
    </>
  );
}
