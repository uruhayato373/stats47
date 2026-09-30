import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { Freshness, PageHeading } from "@/components/ops/primitives";
import { qualitySummary } from "@/lib/server/quality";

export const dynamic = "force-dynamic";
export const metadata = { title: "品質 — stats47 admin" };

export default function QualityPage() {
  const { queues, queuesWithDefects } = qualitySummary();
  const missing = queues.filter((q) => !q.exists);

  return (
    <div className="space-y-8">
      <PageHeading title="品質" source=".claude/state/ (各監査キュー)" />

      <Section title="概況">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatCard label="監査キュー" value={queues.length} sub={`未生成 ${missing.length}`} />
          <StatCard
            label="欠陥が残るキュー"
            value={queuesWithDefects}
            tone={queuesWithDefects > 0 ? "warn" : "good"}
          />
          <StatCard
            label="欠陥の合計"
            value={queues.reduce((s, q) => s + (q.defects ?? 0), 0)}
            tone={queues.some((q) => (q.defects ?? 0) > 0) ? "warn" : "good"}
          />
        </div>
      </Section>

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
                  <span className="text-console-muted">—</span>
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
                <code className="text-[11px]">{q.file}</code>
              </Cell>
            </Row>
          ))}
        </DataTable>
        <p className="mt-2 text-[11px] text-console-muted">
          鮮度が古いキューの数字は「現在の欠陥数」ではありません (生成が止まっている可能性)。
          ブログ品質の詳細は{" "}
          <a href="/dashboard" className="text-console-accent hover:underline">
            プロジェクト現況
          </a>{" "}
          の must-fix 一覧を参照。
        </p>
      </Section>
    </div>
  );
}
