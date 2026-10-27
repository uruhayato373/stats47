import { LinkCard } from "@/components/admin-ui";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Grid, Section } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { pilotBoard } from "@/lib/server/pilot-board";
import { strategyLaneBoard } from "@/lib/server/strategy-lanes";
import { todoBoard } from "@/lib/server/todo";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "現況レビュー — stats47 admin" };

/**
 * /dashboard — 現況レビュー。今週の判断に要る要約とリンクだけを置き、明細は各画面に任せる
 * (config/domains.json の navRules「1 画面は 1 つの問いに答える」)。
 * 旧ページの進捗キューは /site/queues、効果測定と機能バックログは /todo、STP はマーケティング戦略の文書へ移した。
 */
export default function DashboardPage() {
  const pilots = pilotBoard();
  const lanes = strategyLaneBoard();
  const todo = todoBoard();
  const pilotCount = (s: string) => pilots.rows.filter((r) => r.state === s).length;
  const active = todo.improvements.length;
  const limit = lanes.maxActiveImprovements;
  const warnings = lanes.issues.filter((i) => i.level === "warning").length;
  const errors = lanes.issues.filter((i) => i.level === "error").length;

  const cards = [
    {
      href: "/strategy/pilots",
      title: "pilot 判定",
      value: `判定待ち ${pilotCount("due")}・判定不能 ${pilotCount("no-data")}`,
      sub: `計測中 ${pilotCount("measuring")} / 全 ${pilots.rows.length} 件`,
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
    <div className="space-y-8">
      <PageHeading title="現況レビュー" source="pilot-board.json + improvements.md + 収益化戦略 §5 + data/ の週次記録" />
      <Section title="今週の判断">
        <Grid min="sm">
          {cards.map((c) => (
            <LinkCard key={c.href} href={c.href}>
              <div className="text-[11px] text-console-muted">{c.title}</div>
              <div className="mt-1 text-base font-bold text-console-fg">{c.value}</div>
              <div className="mt-1 text-[11px] text-console-muted">{c.sub}</div>
            </LinkCard>
          ))}
        </Grid>
      </Section>
      <DashboardView />
    </div>
  );
}
