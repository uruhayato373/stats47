import { ListChecksIcon, SigmaIcon, TriangleAlertIcon } from "lucide-react";

import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { Freshness, PageHeading } from "@/components/ops/primitives";
import { qualitySummary } from "@/lib/server/quality";

export const dynamic = "force-dynamic";
export const metadata = { title: "品質 — stats47 admin" };

/** 品質 (型 A: 概況)。数値タイル → キュー別の表 */
export default function QualityPage() {
  const { queues, queuesWithDefects } = qualitySummary();
  const missing = queues.filter((q) => !q.exists);

  return (
    <>
      <PageHeading title="品質" source="data/ (各監査キュー)" />

      <Grid min="sm">
          <StatCard label="監査キュー" icon={<ListChecksIcon />} value={queues.length} sub={`未生成 ${missing.length}`} />
          <StatCard
            label="欠陥が残るキュー"
            icon={<TriangleAlertIcon />}
            value={queuesWithDefects}
            tone={queuesWithDefects > 0 ? "warn" : "good"}
          />
          <StatCard
            label="欠陥の合計"
            icon={<SigmaIcon />}
            value={queues.reduce((s, q) => s + (q.defects ?? 0), 0)}
            tone={queues.some((q) => (q.defects ?? 0) > 0) ? "warn" : "good"}
          />
      </Grid>

      <Section title="キュー別" count={queues.length}>
        <DataTable columns={["キュー", "対象", "欠陥", "内訳", "鮮度", "真実源"]}>
          {queues.map((q) => (
            <Row key={q.key}>
              <Cell nowrap>{q.label}</Cell>
              <Cell nowrap muted>{q.total ?? "—"}</Cell>
              <Cell nowrap>
                {q.error ? (
                  <StatusBadge tone="bad">読取失敗</StatusBadge>
                ) : !q.exists ? (
                  <StatusBadge>未生成</StatusBadge>
                ) : q.defects === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <StatusBadge tone={q.defects > 0 ? "warn" : "good"}>
                    {q.defects} {q.defectLabel}
                  </StatusBadge>
                )}
              </Cell>
              <Cell muted>{q.error ?? q.detail ?? ""}</Cell>
              <Cell nowrap>
                <Freshness iso={q.generatedAt} />
              </Cell>
              <Cell muted>
                <code className="font-mono text-xs">{q.file}</code>
              </Cell>
            </Row>
          ))}
        </DataTable>
        <p className="text-xs text-muted-foreground">
          鮮度が古いキューの数字は「現在の欠陥数」ではありません (生成が止まっている可能性)。
          ブログ品質の詳細は{" "}
          <a href="/dashboard" className="font-medium underline-offset-4 hover:underline">
            プロジェクト現況
          </a>{" "}
          の must-fix 一覧を参照。
        </p>
      </Section>
    </>
  );
}
