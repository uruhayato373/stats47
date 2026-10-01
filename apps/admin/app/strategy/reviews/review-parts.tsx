import Link from "next/link";

import { Cell, DataTable, PanelCard, Row, StatCard, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { Button } from "@/components/ui/button";
import { reviewRunView, type Cadence, type ReviewRunView, type RunVerdict, type StepState } from "@/lib/server/reviews";
import { hasError } from "@/lib/server/state-io";

/**
 * 戦略 ＞ レビュー ＞ 週次・月次 の共通部品 (doboku-note の metrics/business/review-parts を移植)。
 * 回を選ぶと、その回の実施状況・手順 (計測 → 記録 → 振り返り → 起票 → 計画) ・判断 (サマリーと申し送り) が出る。
 * 判定は `.claude/scripts/management/lib/review-cadence.mjs` (CI・docs:check DG084 と同じ実体)、正本は review-wiring.json。
 */

const SOURCE = ".claude/config/review-wiring.json";

const VERDICT: Record<RunVerdict, { label: string; tone: Tone }> = {
  ok: { label: "実施できた", tone: "good" },
  partial: { label: "不足あり", tone: "warn" },
  missing: { label: "未実施", tone: "bad" },
  upcoming: { label: "期限前", tone: "info" },
};
const STEP: Record<StepState, { label: string; tone: Tone }> = {
  done: { label: "済", tone: "good" },
  partial: { label: "一部", tone: "warn" },
  missing: { label: "未", tone: "bad" },
  unknown: { label: "判定不可", tone: "neutral" },
  skipped: { label: "契約前", tone: "neutral" },
};
const md = (d: string) => d.slice(5).replace("-", "/");

/** 回の切り替え。未作成の回も選べる (未実施の手順を見るため) */
function RunPicker({ base, view }: { base: string; view: ReviewRunView }) {
  return (
    <div className="flex flex-wrap gap-2">
      {view.options.map((o) => (
        <Button key={o.key} asChild size="sm" variant={o.key === view.period ? "default" : "outline"}>
          <Link href={`${base}?run=${o.key}`}>
            {o.key}
            {o.missing ? " (未作成)" : ""}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function Current({ view }: { view: ReviewRunView }) {
  const v = VERDICT[view.verdict];
  return (
    <Grid min="sm">
      <StatCard label="振り返り期間" value={`${md(view.range.start)}〜${md(view.range.end)}`} sub={view.period} />
      <StatCard label="記録" value={view.verdict === "missing" || view.verdict === "upcoming" ? "なし" : "あり"} sub={view.path} />
      <StatCard label="判定" value={<StatusBadge tone={v.tone}>{v.label}</StatusBadge>} sub={view.nextDue ? `期限 ${view.nextDue}` : `${view.command} ${view.period}`} />
    </Grid>
  );
}

function Checklist({ view }: { view: ReviewRunView }) {
  return (
    <Section title="手順">
      <DataTable columns={["#", "やること", "実施", "根拠"]}>
        {view.steps.map((s, i) => (
          <Row key={s.label}>
            <Cell nowrap muted>
              {i + 1}
            </Cell>
            <Cell>
              <div className="font-semibold">{s.label}</div>
              <div className="text-[11px] text-console-muted">{s.does}</div>
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={STEP[s.state].tone} title={s.note}>
                {STEP[s.state].label}
              </StatusBadge>
            </Cell>
            <Cell muted>
              <span className="text-[11px]">{s.note}</span>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

function routeBadge(problem: string | null, inContract: boolean) {
  if (!inContract) return <span className="text-console-muted">契約前</span>;
  if (!problem) return <StatusBadge tone="good">結ばれている</StatusBadge>;
  const label = problem.startsWith("unrouted") ? "行き先なし" : problem.startsWith("unknown-id") ? "ID が無い" : "形が不正";
  return (
    <StatusBadge tone="bad" title={problem}>
      {label}
    </StatusBadge>
  );
}

function Outcome({ view }: { view: ReviewRunView }) {
  return (
    <Section title="判断">
      <Stack>
        <PanelCard title="サマリー" description={view.path}>
          {view.summary ? (
            <p className="m-0 whitespace-pre-line text-sm leading-relaxed">{view.summary.replace(/\*\*/g, "").replace(/`/g, "")}</p>
          ) : (
            <p className="m-0 text-sm text-console-muted">まだ記録が無い。{view.command} {view.period} を実行する。</p>
          )}
        </PanelCard>
        <PanelCard title={view.handoffSection} description={`各項目の末尾に「${view.marker} <カード ID / EXP-NNN / #Issue / 定常 / 見送り>」。次の計画はこの行き先を拾う`}>
          {view.handoff.length === 0 ? (
            <p className="m-0 text-sm text-console-muted">申し送りが無い。</p>
          ) : (
            <DataTable columns={["項目", "行き先", "判定"]}>
              {view.handoff.map((h, i) => (
                <Row key={i}>
                  <Cell>{h.text.length > 140 ? `${h.text.slice(0, 140)}…` : h.text}</Cell>
                  <Cell nowrap>
                    {h.routes?.length ? (
                      h.routes.map((r) => (
                        <code key={r} className="mr-1 text-[11px]">
                          {r}
                        </code>
                      ))
                    ) : (
                      <span className="text-console-muted">—</span>
                    )}
                  </Cell>
                  <Cell nowrap>{routeBadge(h.problem, view.inContract)}</Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </PanelCard>
      </Stack>
    </Section>
  );
}

function Deadlines({ view }: { view: ReviewRunView }) {
  return (
    <Section title="期限">
      <DataTable columns={["対象", "期待", "最新", "状態", "実行するコマンド"]}>
        {view.status.map((s) => (
          <Row key={s.kind}>
            <Cell nowrap>{s.label}</Cell>
            <Cell nowrap muted>
              {s.expected ?? "—"}
            </Cell>
            <Cell nowrap>{s.latest ?? "なし"}</Cell>
            <Cell nowrap>
              {!s.ok ? (
                <StatusBadge tone="bad">欠落 {s.missing.join(", ")}</StatusBadge>
              ) : s.nextDue ? (
                <StatusBadge tone="info">次の期限 {s.nextDue}</StatusBadge>
              ) : (
                <StatusBadge tone="good">済</StatusBadge>
              )}
            </Cell>
            <Cell nowrap>
              <code className="text-[12px]">{s.command}</code>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

function Findings({ view }: { view: ReviewRunView }) {
  if (view.findings.length === 0) return null;
  return (
    <PanelCard title="要対応" description="check-review-cadence.mjs と同じ判定。error は毎朝の review-cadence-guard.yml の Issue と docs:check (DG084) でも出る">
      <DataTable columns={["区分", "内容", "直し方"]}>
        {view.findings.map((f, i) => (
          <Row key={`${f.code}-${i}`}>
            <Cell nowrap>
              <StatusBadge tone={f.severity === "error" ? "bad" : "warn"}>{f.severity === "error" ? "要対応" : "過去分"}</StatusBadge>
            </Cell>
            <Cell>{f.message}</Cell>
            <Cell muted>{f.fix}</Cell>
          </Row>
        ))}
      </DataTable>
    </PanelCard>
  );
}

function Wiring({ view }: { view: ReviewRunView }) {
  return (
    <Section title="使う入力 (配線)">
      <DataTable columns={["入力", "コマンド / パス", "状態"]}>
        {view.wiring.map((w, i) => (
          <Row key={i}>
            <Cell nowrap>{w.label}</Cell>
            <Cell muted>
              <code className="text-[11px]">{w.target}</code>
            </Cell>
            <Cell nowrap>{w.problem ? <StatusBadge tone="bad">{w.problem}</StatusBadge> : <StatusBadge tone="good">ok</StatusBadge>}</Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

const CYCLE: Record<Cadence, string> = {
  weekly: "計測 (日曜 fetch-metrics-weekly) → 記録 (月曜 06:00 無人 improvement-triage) → 週次メトリクス Issue (月曜 09:00) → 週次レビュー → 週次計画。週が終わった翌日 (月曜) から必須。",
  monthly: "前月の週次レビューと効果判定を集約 → 月次レビュー (毎月 3 日から必須) → 月次計画が読んで今月の重点を決める。",
};

/** 週次・月次ページの本体。page.tsx はこれを cadence 違いで呼ぶだけ */
export async function ReviewPage({ cadence, searchParams }: { cadence: Cadence; searchParams: Promise<{ run?: string }> }) {
  const { run } = await searchParams;
  const title = cadence === "weekly" ? "週次レビュー" : "月次レビュー";
  const v = reviewRunView(cadence, run);
  if (hasError(v)) {
    return (
      <div className="space-y-8">
        <PageHeading title={title} source={SOURCE} />
        <ErrorNote error={v.error} />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <PageHeading title={title} source={SOURCE} />
      <Stack>
        <p className="text-[12px] text-console-muted">{CYCLE[cadence]}</p>
        <RunPicker base={`/strategy/reviews/${cadence}`} view={v} />
        <Section title="実施状況">
          <Current view={v} />
        </Section>
        <Checklist view={v} />
        <Outcome view={v} />
        <Findings view={v} />
        <Deadlines view={v} />
        <Wiring view={v} />
      </Stack>
    </div>
  );
}
