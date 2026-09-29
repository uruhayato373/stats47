import { ContentAuditPanel, FilterLink, StageBadge } from "@/components/content/content-ui";
import { ErrorNote, PageHeading, Section, Table, Td, Tr } from "@/components/ops/primitives";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kindle運用 — stats47 admin" };

type Query = { stage?: string; q?: string; series?: string; theme?: string; cover?: string };
const STAGES = ["ready", "draft", "review", "published", "blocked"] as const;
const COVER_REVIEW_LABELS = {
  "needs-redesign": "要再設計",
  draft: "制作中",
  approved: "承認済み",
} as const;

function filterHref(stage: string | undefined, query: Query) {
  const params = new URLSearchParams();
  if (stage) params.set("stage", stage);
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.series) params.set("series", query.series);
  if (query.theme) params.set("theme", query.theme);
  if (query.cover) params.set("cover", query.cover);
  const search = params.toString();
  return search ? `/content/kindle?${search}` : "/content/kindle";
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
  const seriesOptions = [...new Map(data.kindle.map((book) => [book.series, book.seriesLabel])).entries()];
  const themeOptions = [...new Map(data.kindle.map((book) => [book.coverTheme, book.coverThemeLabel])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ja"));
  const series = seriesOptions.some(([value]) => value === query.series) ? query.series : undefined;
  const theme = themeOptions.some(([value]) => value === query.theme) ? query.theme : undefined;
  const cover = query.cover && query.cover in COVER_REVIEW_LABELS
    ? query.cover as keyof typeof COVER_REVIEW_LABELS
    : undefined;
  const word = query.q?.trim().toLowerCase() ?? "";
  const books = data.kindle.filter(
    (book) =>
      (!stage || book.stage === stage) &&
      (!series || book.series === series) &&
      (!theme || book.coverTheme === theme) &&
      (!cover || book.coverReviewStatus === cover) &&
      (!word || `${book.id} ${book.title} ${book.subtitle ?? ""} ${book.seriesLabel} ${book.coverThemeLabel} ${book.coverDataLabels.join(" ")}`.toLowerCase().includes(word)),
  );
  const findings = data.audit.findings.filter((x) => x.channel === "kindle");

  return (
    <div className="space-y-8">
      <PageHeading
        title="Kindle運用"
        source="book-catalog.ts / manuscripts / kdp-listings.json / kindle-archives.json / .local EPUB"
      >
        <p className="text-xs text-console-muted">
          書籍設計・原稿・ローカル成果物・KDP公開状態を突合します。公開操作は /kdp-publish とオーナー承認のままです。
        </p>
      </PageHeading>

      <div className="flex flex-wrap items-center gap-2">
        <FilterLink href={filterHref(undefined, query)} active={!stage}>すべて {data.kindle.length}</FilterLink>
        {STAGES.map((value) => (
          <FilterLink key={value} href={filterHref(value, query)} active={stage === value}>
            {value} {data.kindle.filter((x) => x.stage === value).length}
          </FilterLink>
        ))}
        <form className="ml-auto flex flex-wrap gap-2" action="/content/kindle">
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          <select
            name="series"
            defaultValue={series ?? ""}
            aria-label="シリーズで絞り込み"
            className="h-8 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          >
            <option value="">全シリーズ</option>
            {seriesOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select
            name="theme"
            defaultValue={theme ?? ""}
            aria-label="画像テーマで絞り込み"
            className="h-8 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          >
            <option value="">全画像テーマ</option>
            {themeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select
            name="cover"
            defaultValue={cover ?? ""}
            aria-label="表紙制作状態で絞り込み"
            className="h-8 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          >
            <option value="">全表紙状態</option>
            {Object.entries(COVER_REVIEW_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
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

      <Section title="表紙一覧" count={books.filter((book) => book.hasCover).length}>
        <p className="text-xs text-console-muted">表紙を選ぶと原寸画像を開きます。</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {books.map((book) => (
            <figure
              key={book.id}
              className="overflow-hidden rounded-md border border-console-border bg-console-card"
            >
              {book.hasCover ? (
                <a
                  href={`/kindle-cover/${book.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-[5/8] bg-console-bg"
                  aria-label={`${book.title}の表紙を原寸で開く`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/kindle-cover/${book.id}`}
                    alt={`${book.title}の表紙`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </a>
              ) : (
                <div className="flex aspect-[5/8] items-center justify-center bg-console-bg text-xs text-console-muted">
                  表紙なし
                </div>
              )}
              <figcaption className="space-y-1 border-t border-console-border p-2">
                <div className="font-mono text-[10px] text-console-muted">
                  {book.id} · {book.seriesLabel}
                </div>
                <div className="line-clamp-2 text-xs font-medium text-console-fg">{book.title}</div>
                <div className="text-[10px] text-console-muted">
                  {book.coverThemeLabel} · {COVER_REVIEW_LABELS[book.coverReviewStatus]}
                </div>
                <div className="line-clamp-2 text-[10px] text-console-muted">
                  {book.coverDataLabels.join("・")}
                </div>
                <StageBadge stage={book.stage} />
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="書籍" count={books.length}>
        <Table columns={["ID・書名", "状態", "表紙設計", "原稿・成果物", "KDP", "次の作業"]}>
          {books.map((book) => (
            <Tr key={book.id}>
              <Td>
                <div className="font-mono text-[11px] text-console-muted">{book.id} · {book.seriesLabel}</div>
                <div className="font-medium">{book.title}</div>
                {book.subtitle ? <div className="text-[11px] text-console-muted">{book.subtitle}</div> : null}
              </Td>
              <Td nowrap><StageBadge stage={book.stage} /></Td>
              <Td muted>
                <div>{book.coverThemeLabel} · {book.coverTemplateLabel}</div>
                <div className="text-[11px]">{book.coverDataLabels.join("・")}</div>
                <div className="text-[11px]">
                  背景台帳 {book.hasCoverBackground ? "登録" : "未登録"} / {COVER_REVIEW_LABELS[book.coverReviewStatus]}
                </div>
                <div className="font-mono text-[10px]">{book.coverVersion ?? "版不明"} · {book.coverPalette}</div>
              </Td>
              <Td nowrap muted>
                <div>原稿 {book.manuscriptCount}章</div>
                <div>EPUB {book.hasEpub ? "あり" : "なし"} / 表紙 {book.hasCover ? "あり" : "なし"}</div>
                <div>R2 {book.archiveStatus}{book.archiveRevision ? ` · ${book.archiveRevision}` : ""}</div>
              </Td>
              <Td muted>
                <div>{book.kdpStatusLabel} · ¥{book.priceYen.toLocaleString("ja-JP")}</div>
                <div>{book.royaltyPlan}% · KU {book.kuEnrolled ? "登録" : "未登録"}</div>
                <div className="font-mono text-[11px]">ASIN {book.asin ?? "割当待ち"}</div>
                <div className="text-[11px]">申請 {book.lastSubmittedAt ?? "—"} / 販売確認 {book.salesStartedAt ?? "—"}</div>
                <div className="text-[11px]">状態確認 {book.kdpStatusCheckedAt ?? "未同期"}</div>
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
