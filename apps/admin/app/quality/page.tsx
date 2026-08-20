import {
  Badge,
  Freshness,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
} from "@/components/ops/primitives";
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
          <Stat label="監査キュー" value={queues.length} sub={`未生成 ${missing.length}`} />
          <Stat
            label="欠陥が残るキュー"
            value={queuesWithDefects}
            tone={queuesWithDefects > 0 ? "warn" : "good"}
          />
          <Stat
            label="欠陥の合計"
            value={queues.reduce((s, q) => s + (q.defects ?? 0), 0)}
            tone={queues.some((q) => (q.defects ?? 0) > 0) ? "warn" : "good"}
          />
        </div>
      </Section>

      <Section title="キュー別" count={queues.length}>
        <Table columns={["キュー", "対象", "欠陥", "内訳", "鮮度", "真実源"]}>
          {queues.map((q) => (
            <Tr key={q.key}>
              <Td nowrap>{q.label}</Td>
              <Td nowrap muted>{q.total ?? "—"}</Td>
              <Td nowrap>
                {q.error ? (
                  <Badge tone="bad">読取失敗</Badge>
                ) : !q.exists ? (
                  <Badge>未生成</Badge>
                ) : q.defects === null ? (
                  <span className="text-console-muted">—</span>
                ) : (
                  <Badge tone={q.defects > 0 ? "warn" : "good"}>
                    {q.defects} {q.defectLabel}
                  </Badge>
                )}
              </Td>
              <Td muted>{q.error ?? q.detail ?? ""}</Td>
              <Td nowrap>
                <Freshness iso={q.generatedAt} />
              </Td>
              <Td muted>
                <code className="text-[11px]">{q.file}</code>
              </Td>
            </Tr>
          ))}
        </Table>
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
