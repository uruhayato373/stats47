import { ContentAuditPanel, FilterLink, StageBadge } from "@/components/content/content-ui";
import { ErrorNote, PageHeading, Section, Table, Td, Tr } from "@/components/ops/primitives";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "note運用 — stats47 admin" };

type Query = { stage?: string; vertical?: string; q?: string };
const STAGES = ["ready", "draft", "published"] as const;

function href(query: Query, patch: Partial<Query>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...patch })) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `/content/note?${text}` : "/content/note";
}

export default async function NoteContentPage({ searchParams }: { searchParams: Promise<Query> }) {
  const data = contentOperations();
  const query = await searchParams;
  if (hasError(data)) {
    return (
      <div className="space-y-4">
        <PageHeading title="note運用" source="note catalog + R2" />
        <ErrorNote error={data.error} />
      </div>
    );
  }
  const stage = STAGES.includes(query.stage as (typeof STAGES)[number]) ? query.stage : undefined;
  const verticals = [...new Set(data.note.map((x) => x.vertical))].sort();
  const vertical = verticals.includes(query.vertical ?? "") ? query.vertical : undefined;
  const word = query.q?.trim().toLowerCase() ?? "";
  const articles = data.note.filter(
    (article) =>
      (!stage || article.stage === stage) &&
      (!vertical || article.vertical === vertical) &&
      (!word || `${article.key} ${article.title}`.toLowerCase().includes(word)),
  );
  const findings = data.audit.findings.filter((x) => x.channel === "note");

  return (
    <div className="space-y-8">
      <PageHeading
        title="note運用"
        source=".claude/scripts/note/catalog/ (編集メタ) + R2 note/<vertical>/<slug>/ (本文)"
      >
        <p className="text-xs text-console-muted">
          原稿本文を複製せず、git TSの編集メタとR2本文の所在、note.com公開状態をまとめて確認します。
        </p>
      </PageHeading>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <FilterLink href={href(query, { stage: undefined })} active={!stage}>すべて {data.note.length}</FilterLink>
          {STAGES.map((value) => (
            <FilterLink key={value} href={href(query, { stage: value })} active={stage === value}>
              {value} {data.note.filter((x) => x.stage === value).length}
            </FilterLink>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" action="/content/note">
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          <select
            name="vertical"
            defaultValue={vertical}
            aria-label="note vertical"
            className="h-8 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          >
            <option value="">全vertical</option>
            {verticals.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input
            name="q"
            defaultValue={query.q}
            aria-label="note記事を検索"
            placeholder="slug・タイトルで検索"
            className="h-8 w-56 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          />
          <button className="rounded-md border border-console-border px-3 text-xs text-console-muted">絞り込む</button>
        </form>
      </div>

      <Section title="記事" count={articles.length}>
        <Table columns={["記事", "状態", "分類", "本文・公開", "次の作業"]}>
          {articles.map((article) => (
            <Tr key={`${article.vertical}-${article.key}`}>
              <Td>
                <div className="font-medium">{article.title}</div>
                <div className="font-mono text-[10px] text-console-muted">{article.key}</div>
              </Td>
              <Td nowrap><StageBadge stage={article.stage} /></Td>
              <Td nowrap muted>
                <div>{article.vertical}</div>
                <div>{article.series ?? "—"} / {article.magazine ?? "未割当"}</div>
                <div>{article.isPaid ? `有料 ¥${article.priceJpy}` : "無料"}</div>
              </Td>
              <Td muted>
                <div>R2本文 {article.r2Body ? "あり" : "未復元"}</div>
                {article.noteUrl ? (
                  <a href={article.noteUrl} target="_blank" rel="noreferrer" className="text-console-accent hover:underline">
                    note.comを開く
                  </a>
                ) : (
                  <span>未公開</span>
                )}
                <div className="text-[10px]">{article.r2Path}</div>
              </Td>
              <Td>{article.nextAction}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="note監査">
        <ContentAuditPanel
          status={findings.some((x) => x.severity === "error") ? "fail" : findings.length ? "warn" : "pass"}
          findings={findings}
        />
      </Section>
    </div>
  );
}
