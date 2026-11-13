import Link from "next/link";

import { Cell, DataTable, LinkCard, Row, StatusBadge, type Tone } from "@/components/admin-ui";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { pilotBoard } from "@/lib/server/pilot-board";
import { ADMIN_STAT_INTERVIEWS_PATH, strategyGateBoard } from "@/lib/server/strategy-gates";
import { strategyLaneBoard } from "@/lib/server/strategy-lanes";
import type { GateState } from "@/lib/strategy-gates";
import { todoBoard } from "@/lib/server/todo";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "現況レビュー — stats47 admin" };

const gateLabel: Record<GateState, string> = { pass: "通過", fail: "未達", "no-source": "判定元なし" };
const gateTone: Record<GateState, Tone> = { pass: "good", fail: "bad", "no-source": "neutral" };

/**
 * /dashboard — 現況レビュー。今週の判断に要る要約とリンクだけを置き、明細は各画面に任せる
 * (data/business/domains.json の navRules「1 画面は 1 つの問いに答える」)。
 * 旧ページの進捗キューは /site/queues、効果測定と機能バックログは /todo、STP はマーケティング戦略の文書へ移した。
 */
export default function DashboardPage() {
  const pilots = pilotBoard();
  const lanes = strategyLaneBoard();
  const todo = todoBoard();
  const gates = strategyGateBoard();
  const pilotCount = (s: string) => pilots.rows.filter((r) => r.state === s).length;
  const overdueNoData = pilots.rows.filter((r) => r.state === "no-data" && r.judgeOverdue).length;
  const active = todo.improvements.length;
  const limit = lanes.maxActiveImprovements;
  const warnings = lanes.issues.filter((i) => i.level === "warning").length;
  const errors = lanes.issues.filter((i) => i.level === "error").length;

  const cards = [
    {
      href: "/strategy/pilots",
      title: "pilot 判定",
      value: `判定待ち ${pilotCount("due")}・判定不能 ${pilotCount("no-data")}`,
      sub: `${overdueNoData ? `判定不能のうち ${overdueNoData} 件は判定日を過ぎた・` : ""}計測中 ${pilotCount("measuring")} / 全 ${pilots.rows.length} 件`,
    },
    {
      href: "/todo?f=improvements",
      title: "施策の同時進行",
      value: limit === null ? `active ${active} 件` : `active ${active} / 上限 ${limit}`,
      sub: limit !== null && active > limit ? "上限超過。新しい施策を足さず判定・降格で削る" : "効果測定中の施策",
    },
    {
      href: "/strategy/lanes",
      title: "領域と構え",
      value: `error ${errors}・warning ${warnings}`,
      sub: `今月の重点 ${lanes.focusLanes?.join(" / ") ?? "未設定"}`,
    },
    { href: "/strategy/reviews/weekly", title: "週次レビュー", value: "今週の振り返り", sub: "計測 → 判断 → 計画の記録" },
    { href: "/revenue", title: "売上", value: "週次収益 (NSM)", sub: "AdSense・KDP・note の実測と判定不能" },
  ];

  return (
    <>
      <PageHeading title="現況レビュー" source="pilot-board.json + improvements.md + 収益化戦略 §5 + data/ の週次記録" />
      <Section
        title="今週の判断"
        note={`判断ゲートの表は ${gates.source} の §5。状態は既存の判定 (アフィリエイト運用の measurementGate・pilot の readiness・売上の計測範囲) を写したもので、判定する関数や記録が無い行は「判定元なし」と出す。B2B基盤 の行には、行政向け商品の検証 (§5 の 4 段階) の進み具合を聞き取り台帳 ${ADMIN_STAT_INTERVIEWS_PATH} から導いて並べ、台帳から導けない値は「未記録」と出す。`}
      >
        <Grid min="sm">
          {cards.map((c) => (
            <LinkCard key={c.href} href={c.href} title={c.title} value={<span className="text-base">{c.value}</span>} sub={c.sub} />
          ))}
        </Grid>
        <h3 className="m-0 mt-2 text-sm font-semibold">
          判断ゲート (収益化戦略 §5)
          <span className="ml-2 font-normal text-muted-foreground">({gates.rows.length})</span>
        </h3>
        {gates.error ? <ErrorNote error={gates.error} /> : null}
        {gates.issues.map((issue) => (
          <ErrorNote key={issue} error={issue} />
        ))}
        <DataTable columns={["ゲート", "状態", "判定元", "通過条件", "未達時"]}>
          {gates.rows.map((gate) => (
            <Row key={gate.name}>
              <Cell>
                <span className="font-semibold whitespace-nowrap">{gate.name}</span>
              </Cell>
              <Cell>
                <StatusBadge tone={gateTone[gate.state]}>{gateLabel[gate.state]}</StatusBadge>
              </Cell>
              <Cell>
                <div className="min-w-56">
                  <div>
                    {gate.href ? (
                      <Link href={gate.href} className="underline underline-offset-2">
                        {gate.source}
                      </Link>
                    ) : (
                      gate.source
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{gate.note}</div>
                  {gate.details.map((detail) => (
                    <div key={detail} className="text-xs">
                      {detail}
                    </div>
                  ))}
                </div>
              </Cell>
              <Cell>
                <div className="min-w-56">{gate.passCondition}</div>
              </Cell>
              <Cell muted>
                <div className="min-w-56">{gate.onFail}</div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>
      <DashboardView />
    </>
  );
}
