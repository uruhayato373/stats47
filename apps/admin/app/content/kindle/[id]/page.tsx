import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenIcon, ImageIcon, LinkIcon, TypeIcon } from "lucide-react";

import { DataGrid, StatCard } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { BOOK_ID, readKindleBook } from "@/lib/server/kindle-epub";

export const dynamic = "force-dynamic";

/** 本文の HTML (EPUB の生成物) に当てる最小の読み物の体裁。 */
const PROSE =
  "flex flex-col gap-3 text-sm leading-relaxed [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold " +
  "[&_h3]:font-semibold [&_figure]:my-2 [&_figure]:rounded-md [&_figure]:border [&_figure]:bg-background [&_figure]:p-2 " +
  "[&_img]:mx-auto [&_img]:max-h-[560px] [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_.callout]:rounded-md [&_.callout]:border-l-4 [&_.callout]:border-info [&_.callout]:bg-info-soft [&_.callout]:p-3 " +
  "[&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 " +
  "[&_a]:text-primary [&_a]:underline";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} の中身 — stats47 admin` };
}

export default async function KindleBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!BOOK_ID.test(id)) notFound();
  const book = readKindleBook(id);
  if (!book) notFound();

  const total = (key: "chars" | "figures" | "figuresWithoutText" | "fullTables" | "siteLinks" | "siteLinksWithUtm") =>
    book.chapters.reduce((sum, chapter) => sum + chapter[key], 0);
  const chars = total("chars");
  const figures = total("figures");
  const withoutText = total("figuresWithoutText");
  const noFigureChapters = book.chapters.filter((chapter) => chapter.figures === 0 && chapter.chars >= 1000).length;

  return (
    <>
      <PageHeading title={book.title} source={`${book.epubPath} (出品台帳 kdp-listings.json の epubPath)`}>
        <p className="text-sm text-muted-foreground">
          {book.id}
          {book.asin ? ` · ASIN ${book.asin}` : ""}
          {book.modified ? ` · EPUB の更新 ${book.modified}` : ""} ·{" "}
          <Link href="/content/kindle" className="text-primary underline">Kindle運用へ戻る</Link>
        </p>
        <p className="text-xs text-muted-foreground">
          出品台帳が指す入稿版を読んでいます。KDP で販売中の版と同じかは、KDP 本棚の版と照合して確かめてください。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="章" icon={<BookOpenIcon />} value={book.chapters.length} sub={`文字 ${chars.toLocaleString("ja-JP")}`} />
        <StatCard
          label="図"
          icon={<ImageIcon />}
          value={figures}
          sub={`1万字あたり ${chars ? ((figures / chars) * 10000).toFixed(1) : "—"} 枚`}
        />
        <StatCard
          label="直後に説明の無い図"
          icon={<TypeIcon />}
          value={withoutText}
          tone={withoutText > 0 ? "bad" : "good"}
          sub={`図の無い長い章 (1,000字以上) ${noFigureChapters}`}
        />
        <StatCard
          label="サイトへのリンク"
          icon={<LinkIcon />}
          value={total("siteLinks")}
          sub={`UTM 付き ${total("siteLinksWithUtm")} · 全県表 ${total("fullTables")}`}
        />
      </Grid>

      <Section title="章ごとの数字" count={book.chapters.length} note="「直後に説明の無い図」は、図のすぐ後ろが段落でないもの。図の読み方を本文で補えているかの目安。">
        <DataGrid
          columns={[
            { id: "title", header: "章" },
            { id: "chars", header: "文字", sortable: true, nowrap: true },
            { id: "figures", header: "図", sortable: true, nowrap: true },
            { id: "without", header: "説明の無い図", sortable: true, nowrap: true },
            { id: "tables", header: "表 (全県)", nowrap: true },
            { id: "links", header: "サイトへのリンク", nowrap: true },
          ]}
          rows={book.chapters.map((chapter) => ({
            id: chapter.id,
            cells: [
              <a key="title" href={`#${chapter.id}`} className="text-primary underline">{chapter.title}</a>,
              chapter.chars.toLocaleString("ja-JP"),
              chapter.figures,
              chapter.figuresWithoutText,
              chapter.tables ? `${chapter.tables} (${chapter.fullTables})` : "—",
              chapter.siteLinks ? `${chapter.siteLinks} (UTM ${chapter.siteLinksWithUtm})` : "—",
            ],
          }))}
        />
      </Section>

      {book.chapters.map((chapter) => (
        <Section key={chapter.id} id={chapter.id} title={chapter.title} count={`図 ${chapter.figures}`}>
          <article
            className={`rounded-lg border bg-card p-5 ${PROSE}`}
            // 自分たちが生成した EPUB の本文。script・style・on* 属性は kindle-epub.ts で落としてある
            dangerouslySetInnerHTML={{ __html: chapter.html }}
          />
        </Section>
      ))}
    </>
  );
}
