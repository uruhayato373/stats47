import Link from "next/link";

import { buttonVariants } from "@stats47/components";

import { DataGrid, type GridColumn, type GridRow } from "@/components/admin-ui";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { COVERAGE_CHANNELS, UNCLASSIFIED, type CoverageItem } from "@/lib/content-coverage";
import { contentCoverage } from "@/lib/server/content-coverage";
import { questionProgress } from "@/lib/server/question-progress";
import { hasError } from "@/lib/server/state-io";
import { QUESTION_STAGES, type QuestionRow } from "@/lib/question-progress";

export const dynamic = "force-dynamic";
export const metadata = { title: "コンテンツ一覧 — stats47 admin" };

const PAGE = "/content/types";
/** 1 タブの上限。全件をブラウザへ送らない */
const MAX_ITEMS = 3000;
/** サイトのページ種別の表示名。無いものは種別の ID を出す */
const KIND_LABEL: Record<string, string> = { blog: "記事", ranking: "ランキング", "municipality-ranking": "市区町村ランキング", area: "都道府県", "area-theme": "県のテーマ", city: "市区町村", survey: "調査", theme: "テーマ", "japan-theme": "全国テーマ", "municipality-theme": "市区町村テーマ", geo: "地域分析", "geo-layer": "地図の層", "原稿": "原稿" };
const LINK = "font-medium underline-offset-4 hover:underline";

const ITEM_COLUMNS: GridColumn[] = [
  { id: "title", header: "題名", sortable: true },
  { id: "detail", header: "種別", sortable: true },
  { id: "state", header: "状態", sortable: true, nowrap: true },
];

const QUESTION_COLUMNS: GridColumn[] = [
  { id: "question", header: "問い", sortable: true },
  { id: "stage", header: "段階", sortable: true, nowrap: true },
  { id: "site", header: "サイト", numeric: true, sortable: true },
  { id: "note", header: "note", numeric: true, sortable: true },
  { id: "sns", header: "SNS", numeric: true, sortable: true },
  { id: "products", header: "商品", numeric: true, sortable: true },
];

const wired = (r: QuestionRow) => r.products * 1000 + r.figures * 100 + r.answers;

function toItemRow(i: CoverageItem): GridRow {
  return {
    id: i.id,
    facet: i.state,
    search: `${i.title} ${i.id}`,
    sort: [i.title, i.detail, i.state],
    cells: [
      i.href ? (
        <a key="title" href={i.href} target="_blank" rel="noreferrer" className={LINK}>
          {i.title}
        </a>
      ) : (
        i.title
      ),
      i.detail,
      i.state,
    ],
  };
}

function toQuestionRow(r: QuestionRow): GridRow {
  return {
    id: r.id,
    facet: r.stage,
    search: `${r.id} ${r.question}`,
    sort: [r.question, r.stage, r.answers + r.evidence, r.relatedNotes, r.relatedPosts, r.products],
    cells: [
      <Link key="question" className={LINK} href={`/content/questions/${encodeURIComponent(r.id)}`}>
        {r.question}
      </Link>,
      r.stage,
      r.answers + r.evidence,
      r.relatedNotes,
      r.relatedPosts,
      r.products,
    ],
  };
}

/** 論文型は問いが主で、配線された記事・note・SNS・商品の数を問いごとに並べる。中身は問いの詳細で見る */
function PaperPage({ title, question }: { title: string; question: string }) {
  const data = questionProgress();
  return (
    <>
      <PageHeading title={title} source="問いの台帳 + issue-links / 図の台帳 / external">
        <p className="m-0 text-sm text-muted-foreground">{question}</p>
      </PageHeading>
      {hasError(data) ? (
        <ErrorNote error={data.error} />
      ) : (
        <DataGrid
          columns={QUESTION_COLUMNS}
          rows={[...data.rows].sort((a, b) => wired(b) - wired(a)).map(toQuestionRow)}
          searchPlaceholder="問いを検索…"
          facets={QUESTION_STAGES.map((stage) => ({ value: stage, label: stage }))}
        />
      )}
    </>
  );
}

/** 型ごとのコンテンツの一覧 (型 B)。媒体のタブと表だけを置く */
export default async function ContentTypesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const data = contentCoverage();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="コンテンツ一覧" source="4 型の台帳" />
        <ErrorNote error={data.error} />
      </>
    );
  }
  const row = data.rows.find((r) => r.type === `type:${params.type}` || r.type === params.type) ?? data.rows[0];
  if (row.type === "type:paper") return <PaperPage title={row.title} question={row.question} />;
  const type = row.type === UNCLASSIFIED ? null : row.type;
  const available = COVERAGE_CHANNELS.filter((c) => row.cells[c.id].published + row.cells[c.id].preparing > 0);
  const tab = available.find((c) => c.id === params.channel)?.id ?? available[0]?.id ?? "site";
  const href = (channel: string) => `${PAGE}?type=${row.type.replace("type:", "")}&channel=${channel}`;
  const channelItems = data.items.filter((i) => i.channel === tab && i.type === type);
  const kinds = tab === "site" ? [...new Set(channelItems.map((i) => i.detail))].sort((a, b) => channelItems.filter((i) => i.detail === b).length - channelItems.filter((i) => i.detail === a).length) : [];
  const kind = kinds.find((k) => k === params.kind) ?? (kinds.includes("blog") ? "blog" : kinds[0]);
  const items = kind ? channelItems.filter((i) => i.detail === kind) : channelItems;

  return (
    <>
      <PageHeading title={row.title} source="4 型の台帳 + ページ索引 / posts / note 記事台帳 / 商品の台帳">
        <p className="m-0 text-sm text-muted-foreground">{row.question}</p>
      </PageHeading>
      <div className="flex flex-wrap gap-2">
        {available.map((c) => (
          <Link key={c.id} href={href(c.id)} className={buttonVariants({ variant: tab === c.id ? "default" : "outline", size: "sm" })}>
            {c.label} {(row.cells[c.id].published + row.cells[c.id].preparing).toLocaleString()}
          </Link>
        ))}
      </div>
      {kinds.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {kinds.map((k) => (
            <Link key={k} href={`${href("site")}&kind=${encodeURIComponent(k)}`} className={buttonVariants({ variant: k === kind ? "secondary" : "ghost", size: "sm" })}>
              {KIND_LABEL[k] ?? k} {channelItems.filter((i) => i.detail === k).length.toLocaleString()}
            </Link>
          ))}
        </div>
      ) : null}
      {items.length > MAX_ITEMS ? <p className="m-0 text-sm text-muted-foreground">先頭の {MAX_ITEMS.toLocaleString()} 件を表示している。検索は表示分だけが対象である。</p> : null}
      <DataGrid columns={ITEM_COLUMNS} rows={items.slice(0, MAX_ITEMS).map(toItemRow)} searchPlaceholder="題名を検索…" facets={[{ value: "公開", label: "公開" }, { value: "未公開", label: "未公開" }]} />
    </>
  );
}
