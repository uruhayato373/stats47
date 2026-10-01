import Link from "next/link";

import { Cell, DataTable, Row, StatCard, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { Button } from "@/components/ui/button";
import { AGENT_MODEL_SOURCES, agentModelCatalog } from "@/lib/server/agent-models";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "エージェントとモデル — stats47 admin" };

/**
 * /ops/agents — agent / skill / CI 無人実行 / backlog-loop がどのモデルで動くかを一覧する画面。
 * 読み取り専用。表示のたびに正本 (frontmatter・workflow・routing policy) を読む。
 * モデルや effort を変えるときは `.claude/rules/model-prompting.md` の canary 比較を通してから。
 */

const MODEL_ORDER = ["haiku", "sonnet", "opus", "fable", "inherit"] as const;
const MODEL_TONE: Record<string, Tone> = { haiku: "good", sonnet: "info", opus: "warn", fable: "bad" };

function modelBadge(model: string | null) {
  if (!model) return <span className="text-console-muted">未指定</span>;
  const family = MODEL_ORDER.find((m) => model.includes(m)) ?? model;
  return <StatusBadge tone={MODEL_TONE[family] ?? "neutral"}>{model}</StatusBadge>;
}

const usd = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `$${v.toFixed(v >= 100 ? 0 : 2)}`);

/** {effort: 件数} を件数の多い順に「xhigh 80%」のように 2 つまで */
function shareText(counts: Record<string, number>) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return "—";
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, n]) => `${k} ${Math.round((n / total) * 100)}%`)
    .join("・");
}

const PROPOSAL_LABEL: Record<string, string> = {
  "set-effort": "effort を書く",
  "downgrade-model": "モデルを下げる",
  "stale-alias": "古い版で動いている",
  "model-drift": "指定と違うモデル",
};
const VERDICT: Record<string, { label: string; tone: Tone }> = {
  pass: { label: "合格", tone: "good" },
  "fail-quality": { label: "品質低下", tone: "bad" },
  "fail-cost": { label: "費用増", tone: "warn" },
  error: { label: "実行エラー", tone: "bad" },
  "not-run": { label: "canary 未実施", tone: "neutral" },
};

const firstSentence = (s: string) => {
  const cut = s.split("。")[0];
  return cut.length > 90 ? `${cut.slice(0, 90)}…` : cut;
};

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  const { model: modelFilter } = await searchParams;
  const v = agentModelCatalog();
  if (hasError(v)) {
    return (
      <div className="space-y-8">
        <PageHeading title="エージェントとモデル" source={AGENT_MODEL_SOURCES} />
        <ErrorNote error={v.error} />
      </div>
    );
  }

  const countBy = (m: string) => v.agents.filter((a) => (a.model ?? "未指定") === m).length;
  const models = [...new Set(v.agents.map((a) => a.model ?? "未指定"))].sort(
    (a, b) => MODEL_ORDER.indexOf(a as never) - MODEL_ORDER.indexOf(b as never),
  );
  const agents = v.agents
    .filter((a) => !modelFilter || (a.model ?? "未指定") === modelFilter)
    .sort((a, b) => b.primarySkills - a.primarySkills || a.name.localeCompare(b.name));
  const skills = v.skills
    .filter((s) => !modelFilter || (s.primaryAgentModel ?? "未指定") === modelFilter)
    .sort((a, b) => (a.primaryAgent ?? "").localeCompare(b.primaryAgent ?? "") || a.name.localeCompare(b.name));
  const unowned = v.skills.filter((s) => !s.primaryAgent || !s.primaryAgentModel).length;
  const usage = v.usage;
  const usageBy = new Map((usage?.agents ?? []).map((a) => [a.agentType, a]));
  const subCost = (usage?.agents ?? []).reduce((n, a) => n + a.costUsd, 0);
  const mainCost = (usage?.main ?? []).reduce((n, m) => n + m.costUsd, 0);
  const ciCost = (usage?.ci ?? []).reduce((n, c) => n + c.costUsd, 0);

  return (
    <div className="space-y-8">
      <PageHeading title="エージェントとモデル" source={AGENT_MODEL_SOURCES} />
      <Stack>
        <Grid min="sm">
          <StatCard label="エージェント" value={v.agents.length} sub={models.map((m) => `${m} ${countBy(m)}`).join("・")} />
          <StatCard label="スキル" value={v.skills.length} sub={`担当 agent のモデルが引けない ${unowned}`} tone={unowned ? "warn" : "good"} />
          <StatCard label="CI の無人実行" value={v.ciRuns.length} sub={[...new Set(v.ciRuns.map((r) => r.model))].join("・") || "—"} />
          <StatCard label="読み取りエラー" value={v.errors.length} tone={v.errors.length ? "bad" : "good"} />
        </Grid>

        {usage ? (
          <>
            <Grid min="sm">
              <StatCard label={`メインセッション (直近 ${usage.window.weeks} 週)`} value={usd(mainCost)} sub={`最多 ${usage.main[0] ? `${usage.main[0].model} ${usage.main[0].effort}` : "—"}`} />
              <StatCard label="エージェント" value={usd(subCost)} sub={`呼び出し ${(usage.agents ?? []).reduce((n, a) => n + a.runs, 0)} 回`} />
              <StatCard label="CI の無人実行" value={usd(ciCost)} sub={`${(usage.ci ?? []).reduce((n, c) => n + c.runs, 0)} 回`} />
              <StatCard label="改善提案" value={usage.proposals.length} tone={usage.proposals.length ? "warn" : "good"} sub={`集計 ${usage.generatedAt.slice(0, 10)}・単価 ${usage.sources.pricing.observedAt}`} />
            </Grid>

            <Section id="proposals" title="改善提案 (試す価値があるもの。採否は canary と人が決める)" count={usage.proposals.length}>
              <DataTable columns={["対象", "提案", "現状 → 提案", "換算費用", "canary", "根拠と次の一手"]}>
                {usage.proposals.map((p) => {
                  const verdict = VERDICT[p.canary ?? ""] ?? null;
                  return (
                    <Row key={p.id}>
                      <Cell nowrap className="font-semibold">
                        {p.agent}
                      </Cell>
                      <Cell nowrap>
                        <StatusBadge tone="info">{PROPOSAL_LABEL[p.kind] ?? p.kind}</StatusBadge>
                      </Cell>
                      <Cell className="text-[12px]">
                        {p.current}
                        <div className="font-semibold">→ {p.suggested}</div>
                      </Cell>
                      <Cell nowrap>
                        {usd(p.costUsd)}
                        {p.savingUsd ? <div className="text-[11px] text-console-good">節約見込み {usd(p.savingUsd)}</div> : null}
                      </Cell>
                      <Cell nowrap>{verdict ? <StatusBadge tone={verdict.tone}>{verdict.label}</StatusBadge> : <span className="text-console-muted">—</span>}</Cell>
                      <Cell className="text-[12px]">
                        <div className="text-console-muted">{p.evidence}</div>
                        <code className="break-all text-[11px]">{p.next}</code>
                      </Cell>
                    </Row>
                  );
                })}
              </DataTable>
              <p className="mt-1 text-[11px] text-console-muted">
                費用は API 単価での換算で、Max プランの枠消費の実額ではない。閾値は <code>.claude/config/model-optimization-policy.json</code>。
                更新は <code>npm run model-usage:collect &amp;&amp; npm run model-usage:report</code> (<code>npm run admin</code> の起動時にも走る)。
              </p>
            </Section>
          </>
        ) : (
          <p className="text-sm text-console-muted">
            使用量の集計がまだ無い。<code>npm run model-usage:collect &amp;&amp; npm run model-usage:report</code> を実行してから再読み込みする。
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant={!modelFilter ? "default" : "outline"}>
            <Link href="/ops/agents">すべて ({v.agents.length})</Link>
          </Button>
          {models.map((m) => (
            <Button key={m} asChild size="sm" variant={m === modelFilter ? "default" : "outline"}>
              <Link href={`/ops/agents?model=${encodeURIComponent(m)}`}>
                {m} ({countBy(m)})
              </Link>
            </Button>
          ))}
        </div>

        <Section id="agents" title="エージェント" count={agents.length}>
          <DataTable columns={["エージェント", "モデル", "effort", "直近の実測", "担当スキル", "役割"]}>
            {agents.map((a) => (
              <Row key={a.file}>
                <Cell nowrap>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-[11px] text-console-muted">{a.domain ?? "—"}</div>
                </Cell>
                <Cell nowrap>{modelBadge(a.model)}</Cell>
                <Cell nowrap muted>
                  {a.effort ?? "継承"}
                </Cell>
                <Cell nowrap>
                  {usageBy.get(a.name) ? (
                    <>
                      {usageBy.get(a.name)!.runs} 回・{usd(usageBy.get(a.name)!.costUsd)}
                      <div className="text-[11px] text-console-muted">{shareText(usageBy.get(a.name)!.byEffort)}</div>
                    </>
                  ) : (
                    <span className="text-console-muted">—</span>
                  )}
                </Cell>
                <Cell nowrap>
                  {a.primarySkills}
                  <span className="text-[11px] text-console-muted"> (協力 {a.coSkills})</span>
                </Cell>
                <Cell className="text-[12px]">{firstSentence(a.description)}</Cell>
              </Row>
            ))}
          </DataTable>
        </Section>

        <Section id="skills" title="スキル" count={skills.length}>
          <DataTable columns={["スキル", "担当 agent", "担当のモデル", "呼び出し", "説明"]}>
            {skills.map((s) => (
              <Row key={s.file}>
                <Cell nowrap>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[11px] text-console-muted">{s.domain ?? "—"}</div>
                </Cell>
                <Cell nowrap>
                  {s.primaryAgent ?? <span className="text-console-muted">—</span>}
                  {s.coAgents.length ? <div className="text-[11px] text-console-muted">協力 {s.coAgents.join("・")}</div> : null}
                </Cell>
                <Cell nowrap>{modelBadge(s.primaryAgentModel)}</Cell>
                <Cell nowrap muted>
                  {s.modelInvocable ? "自動+手動" : "手動のみ"}
                </Cell>
                <Cell className="text-[12px]">{firstSentence(s.description)}</Cell>
              </Row>
            ))}
          </DataTable>
          <p className="mt-1 text-[11px] text-console-muted">
            スキル自体は呼び出したセッションのモデルで動く。「担当のモデル」は primary_agent に委譲したときのモデル (参考値)。
          </p>
        </Section>

        <Section id="ci" title="CI の無人実行 (claude --model)" count={v.ciRuns.length}>
          <DataTable columns={["ワークフロー", "モデル", "effort", "直近の実測"]}>
            {v.ciRuns.map((r, i) => {
              const m = usage?.ci.find((c) => r.workflow.startsWith(c.workflow) || c.workflow.startsWith(r.workflow.replace(/-(daily|weekly)\.ya?ml$/, "")));
              return (
                <Row key={`${r.workflow}-${i}`}>
                  <Cell nowrap>
                    <code>{r.workflow}</code>
                  </Cell>
                  <Cell nowrap>{modelBadge(r.model)}</Cell>
                  <Cell nowrap muted>
                    {r.effort ?? "既定"}
                  </Cell>
                  <Cell nowrap>
                    {m ? (
                      <>
                        {m.runs} 回・1 回 {usd(m.costPerRun)}
                        <div className="text-[11px] text-console-muted">実際のモデル {shareText(m.models)}</div>
                      </>
                    ) : (
                      <span className="text-console-muted">記録なし</span>
                    )}
                  </Cell>
                </Row>
              );
            })}
          </DataTable>
        </Section>

        {usage && usage.canary.length ? (
          <Section id="canary" title="canary (答えの分かっている課題での品質比較)" count={usage.canary.length}>
            <DataTable columns={["agent", "現行", "候補", "判定", "正解率", "1 回の費用"]}>
              {usage.canary.map((c) => (
                <Row key={c.file}>
                  <Cell nowrap className="font-semibold">
                    {c.agent}
                  </Cell>
                  <Cell nowrap muted>
                    {c.baseline.model} {c.baseline.effort ?? ""}
                  </Cell>
                  <Cell nowrap>
                    {c.candidate.model} {c.candidate.effort ?? ""}
                  </Cell>
                  <Cell nowrap>
                    <StatusBadge tone={VERDICT[c.verdict]?.tone ?? "neutral"}>{VERDICT[c.verdict]?.label ?? c.verdict}</StatusBadge>
                  </Cell>
                  <Cell nowrap>
                    {c.scores.baseline.recall} → {c.scores.candidate.recall}
                  </Cell>
                  <Cell nowrap>
                    {usd(c.scores.baseline.cost)} → {usd(c.scores.candidate.cost)}
                  </Cell>
                </Row>
              ))}
            </DataTable>
          </Section>
        ) : null}

        {v.routing ? (
          <Section id="routing" title={`backlog-loop の振り分け (更新 ${v.routing.updatedAt ?? "不明"})`} count={v.routing.classes.length}>
            <DataTable columns={["クラス", "モデル", "effort", "試行上限"]}>
              {v.routing.classes.map((c) => (
                <Row key={c.className}>
                  <Cell nowrap>
                    <code>{c.className}</code>
                  </Cell>
                  <Cell nowrap>{modelBadge(c.model)}</Cell>
                  <Cell nowrap muted>
                    {c.effort ?? "既定"}
                  </Cell>
                  <Cell nowrap muted>
                    {c.maxAttempts ?? "—"}
                  </Cell>
                </Row>
              ))}
            </DataTable>
            <p className="mt-1 text-[11px] text-console-muted">
              週次の <code>update-routing-policy.mjs</code> が成功率の実測で書き換える (<code>.claude/config/backlog-routing-policy.json</code>)。
            </p>
          </Section>
        ) : null}

        {v.errors.length ? (
          <Section id="errors" title="読み取りエラー" count={v.errors.length}>
            <DataTable columns={["ファイル", "内容"]}>
              {v.errors.map((e) => (
                <Row key={e.file}>
                  <Cell nowrap>
                    <code>{e.file}</code>
                  </Cell>
                  <Cell>{e.error}</Cell>
                </Row>
              ))}
            </DataTable>
          </Section>
        ) : null}
      </Stack>
    </div>
  );
}
