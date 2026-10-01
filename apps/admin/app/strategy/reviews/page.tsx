import { Cell, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { reviewCadenceView, type CadenceStatus, type ReviewCheck } from "@/lib/server/reviews";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "週次・月次レビュー — stats47 admin" };

/**
 * /strategy/reviews — 計測→記録→改善サイクルの「振り返り」の段。週次・月次レビューと計画の期限、
 * 本文の契約 (必須見出し)、申し送りがカード ID に結ばれているか、レビューのスキルが使う入力の配線を出す。
 * 読み取り専用。正本は .claude/config/review-wiring.json、判定は review-cadence.mjs (CI・docs:check と同じ実体)。
 */

const SOURCE = ".claude/config/review-wiring.json";

function statusCell(s: CadenceStatus) {
  if (!s.ok) return <StatusBadge tone="bad">欠落 {s.missing.join(", ")}</StatusBadge>;
  return s.nextDue ? <StatusBadge tone="info">次の期限 {s.nextDue}</StatusBadge> : <StatusBadge tone="good">済</StatusBadge>;
}

function contractCell(r: ReviewCheck) {
  if (!r.inContract) return <span className="text-console-muted">契約前</span>;
  return r.missingSections.length ? (
    <StatusBadge tone="warn" title={r.missingSections.join(" / ")}>
      見出し不足 {r.missingSections.length}
    </StatusBadge>
  ) : (
    <StatusBadge tone="good">揃っている</StatusBadge>
  );
}

function handoffCell(r: ReviewCheck) {
  if (!r.inContract) return <span className="text-console-muted">{r.handoff.length} 件 (未検査)</span>;
  const tone = r.routed === r.handoff.length ? "good" : "warn";
  return (
    <StatusBadge tone={tone}>
      {r.routed} / {r.handoff.length}
    </StatusBadge>
  );
}

function HistoryTable({ rows }: { rows: ReviewCheck[] }) {
  if (rows.length === 0) return <p className="text-[12px] text-console-muted">まだ 1 本も無い。</p>;
  return (
    <DataTable columns={["期間", "必須見出し", "申し送りの振り分け", "ファイル"]}>
      {rows.map((r) => (
        <Row key={r.period}>
          <Cell nowrap>{r.period}</Cell>
          <Cell nowrap>{contractCell(r)}</Cell>
          <Cell nowrap>{handoffCell(r)}</Cell>
          <Cell muted>
            <code className="text-[11px]">{r.path}</code>
          </Cell>
        </Row>
      ))}
    </DataTable>
  );
}

export default function ReviewsPage() {
  const v = reviewCadenceView();
  if (hasError(v)) {
    return (
      <div className="space-y-8">
        <PageHeading title="週次・月次レビュー" source={SOURCE} />
        <ErrorNote error={v.error} />
      </div>
    );
  }
  const errors = v.findings.filter((f) => f.severity === "error");
  const warns = v.findings.filter((f) => f.severity === "warn");
  const weekly = v.status.find((s) => s.kind === "weekly-review");
  const monthly = v.status.find((s) => s.kind === "monthly-review");
  const latestWeekly = v.reviews.weekly[0];
  const brokenWiring = v.wiring.filter((w) => w.problem).length;

  return (
    <div className="space-y-8">
      <PageHeading title="週次・月次レビュー" source={SOURCE} />
      <Stack>
        <p className="text-[12px] text-console-muted">
          計測 (日曜 fetch-metrics-weekly) → 記録 (月曜 06:00 無人 improvement-triage) → 週次メトリクス Issue (月曜 09:00) →
          <strong> 週次レビュー</strong> → 週次計画。月初は 3 日までに<strong>月次レビュー</strong> → 月次計画。
          このページは振り返りの段が止まっていないかを見る。欠落・契約違反は毎朝 review-cadence-guard.yml が Issue にし、直れば閉じる。
        </p>

        <div className="grid gap-2 sm:grid-cols-4">
          <StatCard label="週次レビュー (最新)" value={weekly?.latest ?? "なし"} sub={`完了済みの最新週 ${v.lastCompletedWeek}`} tone={weekly?.ok ? "good" : "bad"} />
          <StatCard
            label="月次レビュー (最新)"
            value={monthly?.latest ?? "なし"}
            sub={monthly?.nextDue ? `次の期限 ${monthly.nextDue}` : `今月 ${v.currentMonth}`}
            tone={monthly?.ok ? "good" : "bad"}
          />
          <StatCard
            label="最新の申し送りの振り分け"
            value={latestWeekly ? `${latestWeekly.routed} / ${latestWeekly.handoff.length}` : "—"}
            sub={latestWeekly?.inContract ? latestWeekly.period : `${latestWeekly?.period ?? ""} は契約前`}
            tone={!latestWeekly?.inContract ? "neutral" : latestWeekly.routed === latestWeekly.handoff.length ? "good" : "warn"}
          />
          <StatCard label="要対応" value={errors.length} sub={`配線の切れ ${brokenWiring}`} tone={errors.length ? "bad" : "good"} />
        </div>

        <Section title="期限">
          <DataTable columns={["対象", "期待", "最新", "状態", "実行するコマンド"]}>
            {v.status.map((s) => (
              <Row key={s.kind}>
                <Cell nowrap>{s.label}</Cell>
                <Cell nowrap muted>{s.expected ?? "—"}</Cell>
                <Cell nowrap>{s.latest ?? "なし"}</Cell>
                <Cell nowrap>{statusCell(s)}</Cell>
                <Cell nowrap>
                  <code className="text-[12px]">{s.command}</code>
                </Cell>
              </Row>
            ))}
          </DataTable>
          <p className="mt-1 text-[11px] text-console-muted">
            週次レビューは週が終わった翌日 (月曜) から、月次レビューと月次計画は毎月 3 日から必須。週次計画は今週分 (日曜は来週分も可)。
          </p>
        </Section>

        {(errors.length > 0 || warns.length > 0) && (
          <PanelCard title="要対応" description="check-review-cadence.mjs と同じ判定。error は CI の Issue と docs:check (DG084) でも出る">
            <DataTable columns={["区分", "内容", "直し方"]}>
              {[...errors, ...warns].map((f, i) => (
                <Row key={`${f.code}-${i}`}>
                  <Cell nowrap>
                    <StatusBadge tone={f.severity === "error" ? "bad" : "warn"}>{f.severity === "error" ? "要対応" : "過去分"}</StatusBadge>
                  </Cell>
                  <Cell>
                    {f.message}
                    {f.items?.length ? (
                      <ul className="mt-1 list-disc pl-4 text-[11px] text-console-muted">
                        {f.items.slice(0, 8).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </Cell>
                  <Cell muted>{f.fix}</Cell>
                </Row>
              ))}
            </DataTable>
          </PanelCard>
        )}

        {latestWeekly && (
          <Section title={`最新の週次レビューの申し送り (${latestWeekly.period})`}>
            <DataTable columns={["項目", "行き先", "判定"]}>
              {latestWeekly.handoff.map((h, i) => (
                <Row key={i}>
                  <Cell>{h.text.length > 120 ? `${h.text.slice(0, 120)}…` : h.text}</Cell>
                  <Cell nowrap>{h.routes?.length ? h.routes.map((r) => <code key={r} className="mr-1 text-[11px]">{r}</code>) : <span className="text-console-muted">—</span>}</Cell>
                  <Cell nowrap>
                    {!latestWeekly.inContract ? (
                      <span className="text-console-muted">契約前</span>
                    ) : h.problem ? (
                      <StatusBadge tone="bad" title={h.problem}>
                        {h.problem.startsWith("unrouted") ? "行き先なし" : h.problem.startsWith("unknown-id") ? "ID が無い" : "形が不正"}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="good">結ばれている</StatusBadge>
                    )}
                  </Cell>
                </Row>
              ))}
            </DataTable>
            <p className="mt-1 text-[11px] text-console-muted">
              各項目の末尾に「{v.marker} &lt;カード ID / EXP-NNN / #Issue / 定常 / 見送り&gt;」を書く。次の週次計画はこの行き先を候補に載せる。
            </p>
          </Section>
        )}

        <Section title="週次レビューの履歴">
          <HistoryTable rows={v.reviews.weekly} />
        </Section>

        <Section title="月次レビューの履歴">
          <HistoryTable rows={v.reviews.monthly} />
        </Section>

        <Section title="配線 (レビューのスキルが使う入力)">
          <DataTable columns={["レビュー", "入力", "コマンド / パス", "状態"]}>
            {v.wiring.map((w, i) => (
              <Row key={`${w.cadence}-${i}`}>
                <Cell nowrap>{w.cadence === "weekly" ? "週次" : "月次"}</Cell>
                <Cell nowrap>{w.label}</Cell>
                <Cell muted>
                  <code className="text-[11px]">{w.target}</code>
                </Cell>
                <Cell nowrap>{w.problem ? <StatusBadge tone="bad">{w.problem}</StatusBadge> : <StatusBadge tone="good">ok</StatusBadge>}</Cell>
              </Row>
            ))}
          </DataTable>
        </Section>
      </Stack>
    </div>
  );
}
