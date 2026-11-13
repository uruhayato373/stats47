import { Card, CardContent, cn } from "@stats47/components";

import { Cell, DataTable, PanelCard, Row, StatusBadge, TrendChart } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { MONTHLY_AD_REVENUE_TARGET_YEN, type CellView, type ResolvedRef, type RowView, type StateKind } from "@/lib/issue-map";
import { ISSUE_MAP_PATH, issueMap } from "@/lib/server/issue-map";

export const dynamic = "force-dynamic";
export const metadata = { title: "事業イシューマップ — stats47 admin" };

/**
 * 事業イシューマップ: コンテンツの 4 型 × 3 収益源のマスごとに「ここで回収できるか」を置く。読み取り専用で、
 * 入力は data/business/issue-map.json。判定日と進み具合は参照先の台帳から引く。評価の更新は /weekly-review、
 * 主イシューと仮説の見直しは /monthly-plan が行う。社会の問いの台帳 (data/content/issues.json) とは別物。
 * 月 ¥1 万に要る PV のグラフは、週次の KPI ツリーの site-pageviews・ad-yield に値がある週だけ出す (効率はマップに写さない)。
 */

const stateTone: Record<StateKind, "good" | "info" | "bad" | "warn"> = {
  seen: "good",
  open: "warn",
  unknown: "bad",
  undecided: "info",
};

/** 要る PV は今の PV と 1〜2 桁違うので、軸の目盛りが切れないよう万 PV で描く */
const PV_PER_MAN = 10_000;
const manPv = (pv: number) => Math.round((pv / PV_PER_MAN) * 10) / 10;
const count = new Intl.NumberFormat("ja-JP");

function RefLine({ refItem }: { refItem: ResolvedRef }) {
  return (
    <li className="text-xs text-muted-foreground">
      <code className="font-mono">{refItem.id}</code> {!refItem.found ? "参照先なし" : refItem.date ? `判定日 ${refItem.date}` : "判定日は未定"}
    </li>
  );
}

function MatrixCell({ cell }: { cell: CellView }) {
  const refs = [...cell.judgmentRefs, ...cell.otherRefs];
  return (
    <Card className={cn(cell.rating === "◎" && "bg-info-soft!", cell.rating === "✕" && "border-dashed!")}>
      <CardContent className="flex flex-col gap-2">
        <div className="text-xs text-muted-foreground lg:hidden">{cell.label}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold">
            {cell.rating} {cell.ratingLabel}
          </span>
          {cell.states.map((s) => (
            <StatusBadge key={s.label} tone={stateTone[s.kind]}>
              {s.label}
            </StatusBadge>
          ))}
        </div>
        <p className="m-0 text-sm">{cell.evidence}</p>
        {cell.next ? <p className="m-0 text-xs text-muted-foreground">{cell.next}</p> : null}
        {cell.notes.map((n) => (
          <p key={n.id} className="m-0 text-xs text-warning">
            注記 ({n.observedAt}): {n.text}
          </p>
        ))}
        {refs.length ? (
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {refs.map((r) => (
              <RefLine key={`${r.kind}:${r.id}`} refItem={r} />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MatrixRow({ row, relatedPaths }: { row: RowView; relatedPaths: Record<string, string> }) {
  return (
    <>
      <Card className="mt-3 lg:mt-0">
        <CardContent className="flex flex-col gap-1">
          <h3 className="m-0 text-base font-semibold">{row.title}</h3>
          <p className="m-0 text-sm">{row.question}</p>
          <p className="m-0 text-xs text-muted-foreground">{row.examples}</p>
          {row.relatedDataset ? (
            <p className="m-0 text-xs text-muted-foreground">
              社会の問いの台帳: <code className="font-mono">{relatedPaths[row.relatedDataset]}</code>
            </p>
          ) : null}
        </CardContent>
      </Card>
      {row.cells.map((cell) => (
        <MatrixCell key={cell.id} cell={cell} />
      ))}
    </>
  );
}

/** 事業イシューマップ (型 C: 読み物)。問い → 分解 → 前提 → 判定日 → ストーリーライン */
export default function IssueMapPage() {
  const { today, map, relatedPaths, requiredPv, error } = issueMap();

  return (
    <>
      <PageHeading title="事業イシューマップ" source={`${ISSUE_MAP_PATH} + 参照先の台帳`}>
        <p className="max-w-4xl text-sm text-muted-foreground">
          事業の問いをコンテンツの型と収益源で分解した図。判定日と進み具合は improvements・pilot-board・experiments・backlog から引き、ここには写さない。
          マスの評価は判定日の実測で /weekly-review が更新する。記事の素材にする社会の問いの台帳とは別物。
        </p>
      </PageHeading>

      {error ? <ErrorNote error={error} /> : null}

      {map ? (
        <Stack gap="lg">
          {map.problems.length ? (
            <PanelCard title="台帳の確認が要る">
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm">
                {map.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </PanelCard>
          ) : null}

          <PanelCard title="今、白黒をつけるべき問い" description={`根拠の数字は ${map.observedAt} 時点の観測`}>
            <p className="m-0 text-lg font-semibold">{map.issue.question}</p>
            <p className="m-0 text-sm">仮説: {map.issue.hypothesis}</p>
            <div className="flex flex-wrap gap-1.5">
              {map.issue.criteria.map((c) => (
                <StatusBadge key={c}>{c}</StatusBadge>
              ))}
            </div>
          </PanelCard>

          <Section title="イシューの分解" count={`${map.rows.length} 型 × ${map.columns.length} 収益源`} note="◎ 主力・有力 / ○ 条件つき / △ 補助 / ✕ やらない。評価は実測で更新する仮説。">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
              <div className="hidden p-2 text-xs text-muted-foreground lg:block">行 = コンテンツの型 / 列 = 収益源</div>
              {map.columns.map((c) => (
                <div key={c.id} className="hidden flex-col gap-0.5 p-2 lg:flex">
                  <h3 className="m-0 text-base font-semibold">{c.title}</h3>
                  <p className="m-0 text-xs text-muted-foreground">{c.description}</p>
                </div>
              ))}
              {map.rows.map((row) => (
                <MatrixRow key={row.id} row={row} relatedPaths={relatedPaths} />
              ))}
            </div>
          </Section>

          {requiredPv ? (
            <TrendChart
              title={`月 ¥${count.format(MONTHLY_AD_REVENUE_TARGET_YEN)} の広告収益に要る PV`}
              description={`28 日の GA4 Japan PV (万)。KPI site-pageviews・ad-yield の ${requiredPv.week} の値から計算`}
              data={requiredPv.bars.map((b) => ({ label: b.label, pv: manPv(b.pv) }))}
              xKey="label"
              series={[{ key: "pv", label: "28 日の PV (万)" }]}
              kind="bar"
              valueFormat="decimal"
              footer={
                <p className="m-0">
                  広告収益効率 ¥{requiredPv.adYield} / 1,000 PV のとき、月 ¥{count.format(MONTHLY_AD_REVENUE_TARGET_YEN)} (28 日に直すと 28/30) には 28 日{" "}
                  {count.format(requiredPv.requiredPv)} PV が要る。実績 {count.format(requiredPv.currentPv)} PV の {requiredPv.multiple} 倍。
                  {requiredPv.target ? ` 目標は ${requiredPv.target.dueWeek} の ${count.format(requiredPv.target.value)} PV。` : null}
                </p>
              }
            />
          ) : null}

          <Section title="前提" count={map.premises.length} note="どのマスの判定にも要る。欠けると判定日が来ても判定不能になる。">
            <Grid lines={false} gap="sm">
              {map.premises.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{p.title}</span>
                      <StatusBadge tone={stateTone[p.state.kind]}>{p.state.label}</StatusBadge>
                    </div>
                    <p className="m-0 text-sm">{p.evidence}</p>
                    {p.judgmentRefs.length ? (
                      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                        {p.judgmentRefs.map((r) => (
                          <RefLine key={`${r.kind}:${r.id}`} refItem={r} />
                        ))}
                      </ul>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Section>

          <Section title="判定日" count={map.schedule.length} note={`今日 ${today}。日付は参照先の台帳の値で、参照先に日付が無いものは未定。`}>
            <DataTable columns={["判定日", "マス", "白黒がつく絵", "参照先", "参照先の状態"]}>
              {map.schedule.map((s) => (
                <Row key={`${s.label}:${s.picture}`}>
                  <Cell>
                    <div className="flex min-w-24 flex-col items-start gap-1">
                      {s.date ?? "未定"}
                      {s.overdue ? <StatusBadge tone="warn">過ぎた</StatusBadge> : null}
                    </div>
                  </Cell>
                  <Cell>
                    <div className="min-w-36">{s.label}</div>
                  </Cell>
                  <Cell>
                    <div className="min-w-64">{s.picture}</div>
                  </Cell>
                  <Cell nowrap muted>
                    {s.ref ? <code className="font-mono text-xs">{s.ref.id}</code> : "参照先なし"}
                  </Cell>
                  <Cell nowrap muted>
                    {s.ref ? (s.ref.found ? s.ref.status : "見つからない") : "—"}
                  </Cell>
                </Row>
              ))}
            </DataTable>
          </Section>

          <Section title="ストーリーライン" note={map.storyline.summary}>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
              {map.storyline.steps.map((step) => (
                <Card key={step.key}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold">{step.key}</span>
                      <span className="text-xs text-muted-foreground">{step.kind}</span>
                    </div>
                    <h3 className="m-0 text-base font-semibold">{step.title}</h3>
                    <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm">
                      {step.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        </Stack>
      ) : null}
    </>
  );
}
