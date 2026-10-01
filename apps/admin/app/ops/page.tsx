import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { authCredentialRows } from "@/lib/server/auth-credentials";
import { opsSummary } from "@/lib/server/ops-ledger";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "CI・台帳 — stats47 admin" };

export default function OpsPage() {
  const d = opsSummary();
  const auth = authCredentialRows();

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
              <StatCard label="対象 workflow" value={d.ci.checked} />
              <StatCard
                label="不健全"
                value={d.ci.unhealthyCount}
                tone={d.ci.unhealthyCount > 0 ? "bad" : "good"}
              />
              <StatCard label="スナップショット" value={<Freshness iso={d.ci.generatedAt} />} />
            </div>
            <DataTable columns={["workflow", "状態", "連続失敗", "最終成功", "経過"]}>
              {d.ci.workflows.map((w) => (
                <Row key={w.workflow}>
                  <Cell nowrap>{w.workflow}</Cell>
                  <Cell nowrap>
                    {!w.everSucceeded ? (
                      <StatusBadge tone="bad">成功歴なし</StatusBadge>
                    ) : w.unhealthy ? (
                      <StatusBadge tone="bad">不健全</StatusBadge>
                    ) : (
                      <StatusBadge tone="good">健全</StatusBadge>
                    )}
                  </Cell>
                  <Cell nowrap muted>{w.failureStreak}</Cell>
                  <Cell nowrap muted>{w.lastSuccessAt?.slice(0, 10) ?? "—"}</Cell>
                  <Cell nowrap muted>
                    {w.daysSinceSuccess !== null ? `${w.daysSinceSuccess}日` : "—"}
                  </Cell>
                </Row>
              ))}
            </DataTable>
          </>
        )}
      </Section>

      {/* R2 鮮度 */}
      <Section title="R2 配信データの鮮度">
        {hasError(d.r2Freshness) ? (
          <ErrorNote error={d.r2Freshness.error} />
        ) : (
          <DataTable columns={["key", "状態", "経過", "上限"]}>
            {d.r2Freshness.map((r) => (
              <Row key={r.key}>
                <Cell>{r.key}</Cell>
                <Cell nowrap>
                  <StatusBadge tone={r.status === "fresh" ? "good" : r.status === "stale" ? "warn" : "neutral"}>
                    {r.status}
                  </StatusBadge>
                </Cell>
                <Cell nowrap muted>{r.ageDays !== null ? `${r.ageDays}日` : "—"}</Cell>
                <Cell nowrap muted>{r.maxAgeDays !== null ? `${r.maxAgeDays}日` : "—"}</Cell>
              </Row>
            ))}
          </DataTable>
        )}
      </Section>

      {/* Claude 利用量 */}
      <Section title="Claude 生成ループの実績">
        {hasError(d.usage) ? (
          <ErrorNote error={d.usage.error} />
        ) : (
          <>
            <DataTable columns={["date", "workflow", "limit", "items", "cost_usd", "duration_ms", "is_error"]}>
              {d.usage.rows.slice(0, 20).map((r, i) => (
                <Row key={i}>
                  <Cell nowrap>{String(r.date)}</Cell>
                  <Cell nowrap muted>{String(r.workflow)}</Cell>
                  <Cell nowrap muted>{String(r.limit)}</Cell>
                  <Cell nowrap muted>{String(r.items)}</Cell>
                  <Cell nowrap muted>{String(r.cost_usd)}</Cell>
                  <Cell nowrap muted>{String(r.duration_ms)}</Cell>
                  <Cell nowrap>
                    {String(r.is_error) === "1" ? <StatusBadge tone="bad">error</StatusBadge> : ""}
                  </Cell>
                </Row>
              ))}
            </DataTable>
            <p className="mt-1 text-[11px] text-console-muted">
              件数を上げる判断はこの実測に基づく。行数が少ないうちは粒度が粗い。
            </p>
          </>
        )}
      </Section>

      {/* ログインと資格情報 */}
      <Section title="ログインと資格情報">
        {hasError(auth) ? (
          <ErrorNote error={auth.error} />
        ) : (
          <>
            <DataTable columns={["サービス", "ログイン ID", "この PC", "CI の Secrets", "自動ログイン", "要対応"]}>
              {auth.rows.map((a) => (
                <Row key={a.id}>
                  <Cell nowrap>{a.label}</Cell>
                  <Cell nowrap muted>{a.user ?? "—"}</Cell>
                  <Cell nowrap>
                    {a.stored === null ? (
                      <StatusBadge>未確認</StatusBadge>
                    ) : a.stored ? (
                      <StatusBadge tone="good">登録済み</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">未登録</StatusBadge>
                    )}
                  </Cell>
                  <Cell nowrap>
                    {!a.ciCredential ? (
                      <span className="text-console-muted">使わない</span>
                    ) : a.ciSecrets === null ? (
                      <StatusBadge>確認不可</StatusBadge>
                    ) : a.ciSecrets ? (
                      <StatusBadge tone="good">登録済み</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">未登録</StatusBadge>
                    )}
                  </Cell>
                  <Cell nowrap>
                    <span title={a.policyNote}>{a.autoLogin ? "する" : "しない"}</span>
                  </Cell>
                  <Cell muted>{a.stored === false ? <code className="text-[11px]">{a.registerCommand}</code> : "—"}</Cell>
                </Row>
              ))}
            </DataTable>
            <p className="mt-1 text-[11px] text-console-muted">
              正本は .claude/config/auth-credentials.json。パスワードは表示も読み出しもしない。CI の Secrets は STATS47_AUTH_&lt;SERVICE&gt;_USER / _PASSWORD。登録状況は npm run admin の起動時に調べる ({auth.generatedAt ? <Freshness iso={auth.generatedAt} /> : "未確認: node .claude/scripts/measurement/credential-status.mjs"})。
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
      <div className="max-h-96 overflow-x-hidden overflow-y-auto rounded-md border">
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
