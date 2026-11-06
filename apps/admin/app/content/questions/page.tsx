import { CircleAlertIcon, FileImageIcon, MessageCircleQuestionIcon, SendIcon, ShapesIcon, SquareCheckBigIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, Row, StatCard, StatusBadge, type GridColumn, type GridRow } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { QUESTION_STAGES, type QuestionRow, type QuestionStage } from "@/lib/question-progress";
import { questionProgress } from "@/lib/server/question-progress";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "問いの進み具合 — stats47 admin" };

const SOURCE = "問いの台帳 + issue-links / analyses / figures + 配信先の台帳";

const stageTone: Record<QuestionStage, "good" | "info" | "warn" | "neutral"> = {
  答えなし: "neutral",
  既存記事のみ: "info",
  分析中: "info",
  配信待ち: "warn",
  配信済み: "good",
};

const COLUMNS: GridColumn[] = [
  { id: "id", header: "ID", sortable: true, nowrap: true },
  { id: "question", header: "問い" },
  { id: "stage", header: "段階", sortable: true, nowrap: true },
  { id: "answers", header: "答えのページ", numeric: true, sortable: true },
  { id: "evidence", header: "根拠のページ", numeric: true, sortable: true },
  { id: "analyses", header: "分析", numeric: true, sortable: true },
  { id: "figures", header: "図", numeric: true, sortable: true },
  { id: "open", header: "配信待ち", numeric: true, sortable: true },
  { id: "notes", header: "note", numeric: true, sortable: true },
  { id: "posts", header: "SNS", numeric: true, sortable: true },
  { id: "paid", header: "有料 note", numeric: true, sortable: true },
  { id: "products", header: "企画した商品", numeric: true, sortable: true },
];

function toGridRow(r: QuestionRow): GridRow {
  return {
    id: r.id,
    facet: r.stage,
    search: `${r.id} ${r.question}`,
    tone: r.openDestinations > 0 ? "warn" : undefined,
    sort: [r.id, null, QUESTION_STAGES.indexOf(r.stage), r.answers, r.evidence, r.analyses, r.figures, r.openDestinations, r.relatedNotes, r.relatedPosts, r.relatedPaidNotes, r.products],
    cells: [
      <code key="id" className="font-mono text-xs">
        {r.id.replace("issue:", "")}
      </code>,
      <span key="question">
        {r.question}
        {r.sensitive ? <span className="ml-1 text-xs text-muted-foreground">(慎重に扱う)</span> : null}
      </span>,
      <StatusBadge key="stage" tone={stageTone[r.stage]}>
        {r.stage}
      </StatusBadge>,
      r.answers,
      r.evidence,
      r.analyses,
      r.figures,
      r.openDestinations,
      r.relatedNotes,
      r.relatedPosts,
      r.relatedPaidNotes,
      r.products,
    ],
  };
}

/** 問いの進み具合 (型 B: 一覧・キュー)。件数 → 次の作業 → 問いの一覧。記事の素材にする問いだけを扱う */
export default function QuestionProgressPage() {
  const data = questionProgress();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="問いの進み具合" source={SOURCE} />
        <ErrorNote error={data.error} />
      </>
    );
  }
  const { summary, open, rows } = data;

  return (
    <>
      <PageHeading title="問いの進み具合" source={SOURCE}>
        <p className="max-w-4xl text-sm text-muted-foreground">
          記事の素材にする社会の問いごとに、ページ・分析・図・配信先のどこまで進んだかを集める。値は毎回それぞれの台帳から集計し、ここには写さない。
        </p>
      </PageHeading>

      <Section title="全体">
        <Grid min="sm">
          <StatCard label="問い" icon={<MessageCircleQuestionIcon />} value={summary.questions} sub={`答えのページあり ${summary.answered}`} />
          <StatCard label="分析" icon={<ShapesIcon />} value={summary.analyses} sub={`図 ${summary.figures}`} />
          <StatCard label="配信待ち" icon={<SendIcon />} value={summary.openDestinations} tone={summary.openDestinations ? "warn" : "good"} sub="図の配信先の件数" />
          <StatCard label="背景画像の待ち" icon={<FileImageIcon />} value={summary.imageWaiting} tone={summary.imageWaiting ? "warn" : "good"} sub="記事の本数" />
          <StatCard label="台帳のずれ" icon={<CircleAlertIcon />} value={summary.drift} tone={summary.drift ? "bad" : "good"} sub="図の台帳と配信先の台帳" />
          <StatCard label="商品につながる問い" icon={<SquareCheckBigIcon />} value={summary.withProduct} sub={`ページ経由の有料 note ${summary.withPaidNote}`} />
        </Grid>
      </Section>

      <Section title={`次の作業 (${open.length})`}>
        {open.length ? (
          <DataTable columns={["次の作業", "問い", "図", "配信先", "台帳", "実際"]}>
            {open.map((d) => (
              <Row key={`${d.figure}:${d.target}`}>
                <Cell nowrap>
                  <StatusBadge tone={d.drift ? "bad" : "warn"}>{d.next}</StatusBadge>
                </Cell>
                <Cell>{d.question}</Cell>
                <Cell>
                  {d.figureTitle} <span className="text-xs text-muted-foreground">({d.template})</span>
                </Cell>
                <Cell>
                  {d.channel} <code className="font-mono text-xs">{d.target}</code>
                </Cell>
                <Cell nowrap muted>
                  {d.status}
                </Cell>
                <Cell nowrap muted>
                  {d.actual}
                </Cell>
              </Row>
            ))}
          </DataTable>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">配信待ちの図はありません。</p>
        )}
      </Section>

      <Section title="問いの一覧">
        <p className="m-0 text-sm text-muted-foreground">note・SNS・有料 note は、問いのページを経由して辿れる件数である。企画した商品は、問いの台帳の products が直接指す商品の数である。</p>
        <DataGrid
          columns={COLUMNS}
          rows={rows.map(toGridRow)}
          searchPlaceholder="問いを検索…"
          facets={QUESTION_STAGES.map((s) => ({ value: s, label: s }))}
        />
      </Section>
    </>
  );
}
