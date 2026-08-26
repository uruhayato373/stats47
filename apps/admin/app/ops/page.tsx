import {
  Badge,
  ErrorNote,
  Freshness,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
} from "@/components/ops/primitives";
import { opsSummary } from "@/lib/server/ops-ledger";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "CI・台帳 — stats47 admin" };

export default function OpsPage() {
  const d = opsSummary();

  return (
    <div className="space-y-8">
      <PageHeading title="CI・台帳" source=".claude/state/ci/ ・ .claude/{agents,skills,memory}/" />

      {/* CI 健全性 */}
      <Section title="workflow の健全性">
        {hasError(d.ci) ? (
          <ErrorNote error={d.ci.error} />
        ) : (
          <>
            <div className="mb-2 grid gap-2 sm:grid-cols-3">
              <Stat label="対象 workflow" value={d.ci.checked} />
              <Stat
                label="不健全"
                value={d.ci.unhealthyCount}
                tone={d.ci.unhealthyCount > 0 ? "bad" : "good"}
              />
              <Stat label="スナップショット" value={<Freshness iso={d.ci.generatedAt} />} />
            </div>
            <Table columns={["workflow", "状態", "連続失敗", "最終成功", "経過"]}>
              {d.ci.workflows.map((w) => (
                <Tr key={w.workflow}>
                  <Td nowrap>{w.workflow}</Td>
                  <Td nowrap>
                    {!w.everSucceeded ? (
                      <Badge tone="bad">成功歴なし</Badge>
                    ) : w.unhealthy ? (
                      <Badge tone="bad">不健全</Badge>
                    ) : (
                      <Badge tone="good">健全</Badge>
                    )}
                  </Td>
                  <Td nowrap muted>{w.failureStreak}</Td>
                  <Td nowrap muted>{w.lastSuccessAt?.slice(0, 10) ?? "—"}</Td>
                  <Td nowrap muted>
                    {w.daysSinceSuccess !== null ? `${w.daysSinceSuccess}日` : "—"}
                  </Td>
                </Tr>
              ))}
            </Table>
          </>
        )}
      </Section>

      {/* R2 鮮度 */}
      <Section title="R2 配信データの鮮度">
        {hasError(d.r2Freshness) ? (
          <ErrorNote error={d.r2Freshness.error} />
        ) : (
          <Table columns={["key", "状態", "経過", "上限"]}>
            {d.r2Freshness.map((r) => (
              <Tr key={r.key}>
                <Td>{r.key}</Td>
                <Td nowrap>
                  <Badge tone={r.status === "fresh" ? "good" : r.status === "stale" ? "warn" : "neutral"}>
                    {r.status}
                  </Badge>
                </Td>
                <Td nowrap muted>{r.ageDays !== null ? `${r.ageDays}日` : "—"}</Td>
                <Td nowrap muted>{r.maxAgeDays !== null ? `${r.maxAgeDays}日` : "—"}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Section>

      {/* Claude 利用量 */}
      <Section title="Claude 生成ループの実績">
        {hasError(d.usage) ? (
          <ErrorNote error={d.usage.error} />
        ) : (
          <>
            <Table columns={["date", "workflow", "limit", "items", "cost_usd", "duration_ms", "is_error"]}>
              {d.usage.rows.slice(0, 20).map((r, i) => (
                <Tr key={i}>
                  <Td nowrap>{String(r.date)}</Td>
                  <Td nowrap muted>{String(r.workflow)}</Td>
                  <Td nowrap muted>{String(r.limit)}</Td>
                  <Td nowrap muted>{String(r.items)}</Td>
                  <Td nowrap muted>{String(r.cost_usd)}</Td>
                  <Td nowrap muted>{String(r.duration_ms)}</Td>
                  <Td nowrap>
                    {String(r.is_error) === "1" ? <Badge tone="bad">error</Badge> : ""}
                  </Td>
                </Tr>
              ))}
            </Table>
            <p className="mt-1 text-[11px] text-console-muted">
              件数を上げる判断はこの実測に基づく。行数が少ないうちは粒度が粗い。
            </p>
          </>
        )}
      </Section>

      {/* 台帳 */}
      <Section title="能力の台帳">
        <div className="grid gap-4 lg:grid-cols-3">
          <Ledger title="agents" data={d.agents} extra="model" />
          <Ledger title="skills" data={d.skills} extra="primaryAgent" />
          <Ledger title="memory" data={d.memories} extra="type" />
        </div>
      </Section>
    </div>
  );
}

function Ledger({
  title,
  data,
  extra,
}: {
  title: string;
  data: ReturnType<typeof opsSummary>["agents"];
  extra: "model" | "primaryAgent" | "type";
}) {
  if (hasError(data)) {
    return (
      <div className="min-w-0 space-y-1">
        <h3 className="text-[13px] font-medium text-console-muted">{title}</h3>
        <ErrorNote error={data.error} />
      </div>
    );
  }
  return (
    <div className="min-w-0 space-y-1">
      <h3 className="text-[13px] font-medium text-console-muted">
        {title} <span className="text-console-muted/70">({data.length})</span>
      </h3>
      <div className="max-h-96 overflow-x-hidden overflow-y-auto rounded-md border border-console-border bg-console-card">
        <ul className="divide-y divide-console-border/50">
          {data.map((e) => (
            <li key={e.relPath} className="px-2 py-1.5">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 break-all text-[13px] font-medium text-console-fg">{e.name}</span>
                {e[extra] ? (
                  <span className="text-[11px] text-console-muted">{String(e[extra])}</span>
                ) : null}
              </div>
              <div className="line-clamp-2 text-[11px] text-console-muted">{e.description}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
