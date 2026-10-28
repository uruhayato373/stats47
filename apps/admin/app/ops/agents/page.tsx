import { AlertTriangleIcon, BotIcon, CircleDollarSignIcon, CpuIcon, LightbulbIcon, PuzzleIcon, TerminalIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { Cell, DataGrid, DataTable, Row, StatCard, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { buttonVariants } from "@stats47/components";
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
  if (!model) return <span className="text-muted-foreground">未指定</span>;
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
      <>
        <PageHeading title="エージェントとモデル" source={AGENT_MODEL_SOURCES} />
        <ErrorNote error={v.error} />
      </>
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
    <>
      <PageHeading title="エージェントとモデル" source={AGENT_MODEL_SOURCES} />
        <Grid min="sm">
          <StatCard label="エージェント" icon={<BotIcon />} value={v.agents.length} sub={models.map((m) => `${m} ${countBy(m)}`).join("・")} />
          <StatCard label="スキル" icon={<PuzzleIcon />} value={v.skills.length} sub={`担当 agent のモデルが引けない ${unowned}`} tone={unowned ? "warn" : "good"} />
          <StatCard label="CI の無人実行" icon={<TerminalIcon />} value={v.ciRuns.length} sub={[...new Set(v.ciRuns.map((r) => r.model))].join("・") || "—"} />
          <StatCard label="読み取りエラー" icon={<AlertTriangleIcon />} value={v.errors.length} tone={v.errors.length ? "bad" : "good"} />
        </Grid>

        {usage ? (
          <>
            <Grid min="sm">
              <StatCard label={`メインセッション (直近 ${usage.window.weeks} 週)`} icon={<CpuIcon />} value={usd(mainCost)} sub={`最多 ${usage.main[0] ? `${usage.main[0].model} ${usage.main[0].effort}` : "—"}`} />
              <StatCard label="エージェント" icon={<UsersIcon />} value={usd(subCost)} sub={`呼び出し ${(usage.agents ?? []).reduce((n, a) => n + a.runs, 0)} 回`} />
              <StatCard label="CI の無人実行" icon={<CircleDollarSignIcon />} value={usd(ciCost)} sub={`${(usage.ci ?? []).reduce((n, c) => n + c.runs, 0)} 回`} />
              <StatCard label="改善提案" icon={<LightbulbIcon />} value={usage.proposals.length} tone={usage.proposals.length ? "warn" : "good"} sub={`集計 ${usage.generatedAt.slice(0, 10)}・単価 ${usage.sources.pricing.observedAt}`} />
            </Grid>

            <Section
              id="proposals"
              title="改善提案 (試す価値があるもの。採否は canary と人が決める)"
              count={usage.proposals.length}
              note={
                <>
                  費用は API 単価での換算で、Max プランの枠消費の実額ではない。閾値は{" "}
                  <code className="font-mono text-xs">.claude/config/model-optimization-policy.json</code>。 更新は{" "}
                  <code className="font-mono text-xs">npm run model-usage:collect &amp;&amp; npm run model-usage:report</code> (
                  <code className="font-mono text-xs">npm run admin</code> の起動時にも走る)。
                </>
              }
            >
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
                      <Cell className="text-xs">
                        {p.current}
                        <div className="font-semibold">→ {p.suggested}</div>
                      </Cell>
                      <Cell nowrap>
                        {usd(p.costUsd)}
                        {p.savingUsd ? <div className="text-xs text-positive">節約見込み {usd(p.savingUsd)}</div> : null}
                      </Cell>
                      <Cell nowrap>{verdict ? <StatusBadge tone={verdict.tone}>{verdict.label}</StatusBadge> : <span className="text-muted-foreground">—</span>}</Cell>
                      <Cell className="text-xs">
                        <div className="text-muted-foreground">{p.evidence}</div>
                        <code className="break-all font-mono text-xs">{p.next}</code>
                      </Cell>
                    </Row>
                  );
                })}
              </DataTable>
            </Section>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            使用量の集計がまだ無い。<code className="font-mono text-xs">npm run model-usage:collect &amp;&amp; npm run model-usage:report</code> を実行してから再読み込みする。
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href="/ops/agents" className={buttonVariants({ variant: !modelFilter ? "default" : "outline", size: "sm" })}>
            すべて ({v.agents.length})
          </Link>
          {models.map((m) => (
            <Link key={m} href={`/ops/agents?model=${encodeURIComponent(m)}`} className={buttonVariants({ variant: m === modelFilter ? "default" : "outline", size: "sm" })}>
                {m} ({countBy(m)})
              </Link>
          ))}
        </div>

        <Section id="agents" title="エージェント" count={agents.length}>
          <DataGrid
            columns={[
              { id: "name", header: "エージェント", sortable: true, nowrap: true },
              { id: "model", header: "モデル", sortable: true, nowrap: true },
              { id: "effort", header: "effort", sortable: true, nowrap: true },
              { id: "usage", header: "直近の実測", sortable: true, nowrap: true },
              { id: "skills", header: "担当スキル", numeric: true, sortable: true, nowrap: true },
              { id: "role", header: "役割" },
            ]}
            rows={agents.map((a) => {
              const u = usageBy.get(a.name);
              return {
                id: a.file,
                cells: [
                  <div key="n">
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.domain ?? "—"}</div>
                  </div>,
                  modelBadge(a.model),
                  <span key="e" className="text-muted-foreground">
                    {a.effort ?? "継承"}
                  </span>,
                  u ? (
                    <div key="u">
                      {u.runs} 回・{usd(u.costUsd)}
                      <div className="text-xs text-muted-foreground">{shareText(u.byEffort)}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  ),
                  <span key="s">
                    {a.primarySkills}
                    <span className="text-xs text-muted-foreground"> (協力 {a.coSkills})</span>
                  </span>,
                  <span key="r" className="text-xs">
                    {firstSentence(a.description)}
                  </span>,
                ],
                sort: [a.name, a.model, a.effort, u?.costUsd ?? null, a.primarySkills, null],
                search: `${a.name} ${a.domain ?? ""} ${a.description}`,
                facet: u ? "used" : "unused",
              };
            })}
            facets={[
              { value: "used", label: "直近に実測あり" },
              { value: "unused", label: "実測なし" },
            ]}
            pageSize={50}
            searchPlaceholder="名前・領域・役割で絞り込み"
          />
        </Section>

        <Section
          id="skills"
          title="スキル"
          count={skills.length}
          note="スキル自体は呼び出したセッションのモデルで動く。「担当のモデル」は primary_agent に委譲したときのモデル (参考値)。"
        >
          <DataGrid
            columns={[
              { id: "name", header: "スキル", sortable: true, nowrap: true },
              { id: "agent", header: "担当 agent", sortable: true, nowrap: true },
              { id: "model", header: "担当のモデル", sortable: true, nowrap: true },
              { id: "invoke", header: "呼び出し", nowrap: true },
              { id: "description", header: "説明" },
            ]}
            rows={skills.map((sk) => ({
              id: sk.file,
              cells: [
                <div key="n">
                  <div className="font-semibold">{sk.name}</div>
                  <div className="text-xs text-muted-foreground">{sk.domain ?? "—"}</div>
                </div>,
                <div key="a">
                  {sk.primaryAgent ?? <span className="text-muted-foreground">—</span>}
                  {sk.coAgents.length ? <div className="text-xs text-muted-foreground">協力 {sk.coAgents.join("・")}</div> : null}
                </div>,
                modelBadge(sk.primaryAgentModel),
                <span key="i" className="text-muted-foreground">
                  {sk.modelInvocable ? "自動+手動" : "手動のみ"}
                </span>,
                <span key="d" className="text-xs">
                  {firstSentence(sk.description)}
                </span>,
              ],
              sort: [sk.name, sk.primaryAgent, sk.primaryAgentModel, null, null],
              search: `${sk.name} ${sk.domain ?? ""} ${sk.primaryAgent ?? ""} ${sk.description}`,
              facet: sk.modelInvocable ? "auto" : "manual",
              tone: !sk.primaryAgent || !sk.primaryAgentModel ? "warn" : undefined,
            }))}
            facets={[
              { value: "auto", label: "自動+手動" },
              { value: "manual", label: "手動のみ" },
            ]}
            pageSize={50}
            searchPlaceholder="名前・担当・説明で絞り込み"
          />
        </Section>

        <Section id="ci" title="CI の無人実行 (claude --model)" count={v.ciRuns.length}>
          <DataTable columns={["ワークフロー", "モデル", "effort", "直近の実測"]}>
            {v.ciRuns.map((r, i) => {
              const m = usage?.ci.find((c) => r.workflow.startsWith(c.workflow) || c.workflow.startsWith(r.workflow.replace(/-(daily|weekly)\.ya?ml$/, "")));
              return (
                <Row key={`${r.workflow}-${i}`}>
                  <Cell nowrap>
                    <code className="font-mono text-xs">{r.workflow}</code>
                  </Cell>
                  <Cell nowrap>{modelBadge(r.model)}</Cell>
                  <Cell nowrap muted>
                    {r.effort ?? "既定"}
                  </Cell>
                  <Cell nowrap>
                    {m ? (
                      <>
                        {m.runs} 回・1 回 {usd(m.costPerRun)}
                        <div className="text-xs text-muted-foreground">実際のモデル {shareText(m.models)}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">記録なし</span>
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
          <Section
            id="routing"
            title={`backlog-loop の振り分け (更新 ${v.routing.updatedAt ?? "不明"})`}
            count={v.routing.classes.length}
            note={
              <>
                週次の <code className="font-mono text-xs">update-routing-policy.mjs</code> が成功率の実測で書き換える (
                <code className="font-mono text-xs">.claude/config/backlog-routing-policy.json</code>)。
              </>
            }
          >
            <DataTable columns={["クラス", "モデル", "effort", "試行上限"]}>
              {v.routing.classes.map((c) => (
                <Row key={c.className}>
                  <Cell nowrap>
                    <code className="font-mono text-xs">{c.className}</code>
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
          </Section>
        ) : null}

        {v.errors.length ? (
          <Section id="errors" title="読み取りエラー" count={v.errors.length}>
            <DataTable columns={["ファイル", "内容"]}>
              {v.errors.map((e) => (
                <Row key={e.file}>
                  <Cell nowrap>
                    <code className="font-mono text-xs">{e.file}</code>
                  </Cell>
                  <Cell>{e.error}</Cell>
                </Row>
              ))}
            </DataTable>
          </Section>
        ) : null}
    </>
  );
}
