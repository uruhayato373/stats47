import { ContentAuditPanel, FilterLink, StageBadge } from "@/components/content/content-ui";
import { ErrorNote, PageHeading, Section, Table, Td, Tr } from "@/components/ops/primitives";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kindle運用 — stats47 admin" };

type Query = { stage?: string; q?: string };
const STAGES = ["ready", "draft", "published"] as const;

function filterHref(stage?: string) {
  return stage ? `/content/kindle?stage=${stage}` : "/content/kindle";
}

export default async function KindleContentPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const data = contentOperations();
  const query = await searchParams;
  if (hasError(data)) {
    return (
      <div className="space-y-4">
        <PageHeading title="Kindle運用" source="Kindle catalog + KDP listings" />
        <ErrorNote error={data.error} />
      </div>
    );
  }
  const stage = STAGES.includes(query.stage as (typeof STAGES)[number]) ? query.stage : undefined;
  const word = query.q?.trim().toLowerCase() ?? "";
  const books = data.kindle.filter(
    (book) =>
      (!stage || book.stage === stage) &&
      (!word || `${book.id} ${book.title} ${book.subtitle ?? ""}`.toLowerCase().includes(word)),
  );
  const findings = data.audit.findings.filter((x) => x.channel === "kindle");

  return (
    <div className="space-y-8">
      <PageHeading
        title="Kindle運用"
        source="book-catalog.ts / manuscripts / kindle-status.json / kdp-listings.json / .local EPUB"
      >
        <p className="text-xs text-console-muted">
          書籍設計・原稿・ローカル成果物・KDP公開状態を突合します。公開操作は /kdp-publish とオーナー承認のままです。
        </p>
      </PageHeading>

      <div className="flex flex-wrap items-center gap-2">
        <FilterLink href={filterHref()} active={!stage}>すべて {data.kindle.length}</FilterLink>
        {STAGES.map((value) => (
          <FilterLink key={value} href={filterHref(value)} active={stage === value}>
            {value} {data.kindle.filter((x) => x.stage === value).length}
          </FilterLink>
        ))}
        <form className="ml-auto flex gap-2" action="/content/kindle">
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          <input
            name="q"
            defaultValue={query.q}
            aria-label="Kindleを検索"
            placeholder="ID・書名で検索"
            className="h-8 w-52 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          />
          <button className="rounded-md border border-console-border px-3 text-xs text-console-muted">検索</button>
        </form>
      </div>

      <Section title="書籍" count={books.length}>
        <Table columns={["ID・書名", "状態", "原稿・成果物", "KDP", "次の作業"]}>
          {books.map((book) => (
            <Tr key={book.id}>
              <Td>
                <div className="font-mono text-[11px] text-console-muted">{book.id} · {book.series}</div>
                <div className="font-medium">{book.title}</div>
                {book.subtitle ? <div className="text-[11px] text-console-muted">{book.subtitle}</div> : null}
              </Td>
              <Td nowrap><StageBadge stage={book.stage} /></Td>
              <Td nowrap muted>
                <div>原稿 {book.manuscriptCount}章</div>
                <div>EPUB {book.hasEpub ? "あり" : "なし"} / 表紙 {book.hasCover ? "あり" : "なし"}</div>
              </Td>
              <Td muted>
                <div>{book.listingStatus} · ¥{book.priceYen.toLocaleString("ja-JP")}</div>
                <div className="font-mono text-[11px]">ASIN {book.asin ?? "審査中/未公開"}</div>
                <div className="text-[11px]">{book.publishedAt ?? "—"}</div>
              </Td>
              <Td>{book.nextAction}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="Kindle監査">
        <ContentAuditPanel
          status={findings.some((x) => x.severity === "error") ? "fail" : findings.length ? "warn" : "pass"}
          findings={findings}
        />
      </Section>
    </div>
  );
}
