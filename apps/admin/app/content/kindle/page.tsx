import { BookCheckIcon, BookOpenIcon, CircleAlertIcon, PackageCheckIcon } from "lucide-react";

import { ContentAuditPanel, FilterLink, StageBadge } from "@/components/content/content-ui";
import { DataGrid, StatCard } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

import { NativeSelect, Input, Button, Card, CardContent } from "@stats47/components";

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
      <>
        <PageHeading title="Kindle運用" source="Kindle catalog + KDP listings" />
        <ErrorNote error={data.error} />
      </>
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
    <>
      <PageHeading
        title="Kindle運用"
        source="book-catalog.ts / manuscripts / kdp-listings.json / kindle-archives.json / .local EPUB"
      >
        <p className="text-sm text-muted-foreground">
          書籍設計・原稿・ローカル成果物・KDP公開状態を突合します。公開操作は /kdp-publish とオーナー承認のままです。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="書籍" icon={<BookOpenIcon />} value={data.kindle.length} sub={`絞り込み後 ${books.length} 冊`} />
        <StatCard label="公開済み" icon={<BookCheckIcon />} value={data.kindle.filter((x) => x.stage === "published").length} tone="good" />
        <StatCard
          label="公開準備完了・審査中"
          icon={<PackageCheckIcon />}
          value={data.kindle.filter((x) => x.stage === "ready" || x.stage === "review").length}
          tone="info"
        />
        <StatCard
          label="要対応"
          icon={<CircleAlertIcon />}
          value={data.kindle.filter((x) => x.stage === "blocked").length}
          tone={data.kindle.some((x) => x.stage === "blocked") ? "bad" : "neutral"}
        />
      </Grid>

      <div className="flex flex-wrap items-center gap-2">
        <FilterLink href={filterHref(undefined, query)} active={!stage}>すべて {data.kindle.length}</FilterLink>
        {STAGES.map((value) => (
          <FilterLink key={value} href={filterHref(value, query)} active={stage === value}>
            {value} {data.kindle.filter((x) => x.stage === value).length}
          </FilterLink>
        ))}
        <form className="ml-auto flex flex-wrap gap-2" action="/content/kindle">
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          <NativeSelect
            name="series"
            defaultValue={series ?? ""}
            aria-label="シリーズで絞り込み" size="sm">
            <option value="">全シリーズ</option>
            {seriesOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </NativeSelect>
          <NativeSelect
            name="theme"
            defaultValue={theme ?? ""}
            aria-label="画像テーマで絞り込み" size="sm">
            <option value="">全画像テーマ</option>
            {themeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </NativeSelect>
          <NativeSelect
            name="cover"
            defaultValue={cover ?? ""}
            aria-label="表紙制作状態で絞り込み" size="sm">
            <option value="">全表紙状態</option>
            {Object.entries(COVER_REVIEW_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </NativeSelect>
          <Input
            name="q"
            defaultValue={query.q}
            aria-label="Kindleを検索"
            placeholder="ID・書名で検索" className="w-52" />
          <Button type="submit" variant="outline">検索</Button>
        </form>
      </div>

      <Section title="表紙一覧" count={books.filter((book) => book.hasCover).length} note="表紙を選ぶと原寸画像を開きます。">
        <Grid min="sm" lines={false} gap="sm">
          {books.map((book) => (
            <Card key={book.id} className="gap-0 overflow-hidden py-0">
              {book.hasCover ? (
                <a
                  href={`/kindle-cover/${book.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-5/8 bg-background"
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
                <div className="flex aspect-5/8 items-center justify-center bg-background text-xs text-muted-foreground">
                  表紙なし
                </div>
              )}
              <CardContent className="flex flex-col gap-1 border-t p-2">
                <div className="font-mono text-xs text-muted-foreground">
                  {book.id} · {book.seriesLabel}
                </div>
                <div className="line-clamp-2 text-xs font-medium text-foreground">{book.title}</div>
                <div className="text-xs text-muted-foreground">
                  {book.coverThemeLabel} · {COVER_REVIEW_LABELS[book.coverReviewStatus]}
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  {book.coverDataLabels.join("・")}
                </div>
                <StageBadge stage={book.stage} />
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section title="書籍" count={books.length}>
        <DataGrid
          columns={[
            { id: "book", header: "ID・書名", sortable: true },
            { id: "stage", header: "状態", sortable: true, nowrap: true },
            { id: "cover", header: "表紙設計" },
            { id: "artifacts", header: "原稿・成果物", nowrap: true },
            { id: "kdp", header: "KDP" },
            { id: "next", header: "次の作業" },
          ]}
          rows={books.map((book) => ({
            id: book.id,
            cells: [
              <div key="book">
                <div className="font-mono text-xs text-muted-foreground">{book.id} · {book.seriesLabel}</div>
                <div className="font-medium">{book.title}</div>
                {book.subtitle ? <div className="text-xs text-muted-foreground">{book.subtitle}</div> : null}
              </div>,
              <StageBadge key="stage" stage={book.stage} />,
              <div key="cover" className="text-muted-foreground">
                <div>{book.coverThemeLabel} · {book.coverTemplateLabel}</div>
                <div className="text-xs">{book.coverDataLabels.join("・")}</div>
                <div className="text-xs">
                  背景台帳 {book.hasCoverBackground ? "登録" : "未登録"} / {COVER_REVIEW_LABELS[book.coverReviewStatus]}
                </div>
                <div className="font-mono text-xs">{book.coverVersion ?? "版不明"} · {book.coverPalette}</div>
              </div>,
              <div key="artifacts" className="text-muted-foreground">
                <div>原稿 {book.manuscriptCount}章</div>
                <div>EPUB {book.hasEpub ? "あり" : "なし"} / 表紙 {book.hasCover ? "あり" : "なし"}</div>
                <div>R2 {book.archiveStatus}{book.archiveRevision ? ` · ${book.archiveRevision}` : ""}</div>
              </div>,
              <div key="kdp" className="text-muted-foreground">
                <div>{book.kdpStatusLabel} · ¥{book.priceYen.toLocaleString("ja-JP")}</div>
                <div>{book.royaltyPlan}% · KU {book.kuEnrolled ? "登録" : "未登録"}</div>
                <div className="font-mono text-xs">ASIN {book.asin ?? "割当待ち"}</div>
                <div className="text-xs">申請 {book.lastSubmittedAt ?? "—"} / 販売確認 {book.salesStartedAt ?? "—"}</div>
                <div className="text-xs">状態確認 {book.kdpStatusCheckedAt ?? "未同期"}</div>
              </div>,
              book.nextAction,
            ],
            sort: [book.id, book.stage, null, null, null, null],
            search: `${book.id} ${book.title} ${book.subtitle ?? ""} ${book.seriesLabel}`,
            tone: book.stage === "blocked" ? ("bad" as const) : undefined,
          }))}
          searchPlaceholder="この中から ID・書名で絞り込み"
        />
      </Section>

      <ContentAuditPanel
        status={findings.some((x) => x.severity === "error") ? "fail" : findings.length ? "warn" : "pass"}
        findings={findings}
      />
    </>
  );
}
