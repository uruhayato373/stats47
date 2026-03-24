/**
 * 検索ページ（Server Component）
 *
 * URL パラメータ ?q= が存在する場合、サーバーサイドで検索を実行し
 * 初期結果を HTML に含める。クローラーが検索結果をインデックスできる。
 * インタラクティブな検索・フィルタリングはクライアント側で処理。
 */
import { SearchPageClient, type ContentType } from "@/features/search";
import { getSearchIndexMeta, searchDocumentsServer } from "@/features/search/server";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const searchTitle = "検索 | stats47";
const searchDescription =
  "都道府県ランキング・ブログ記事をキーワードで検索。カテゴリやタグで絞り込みも可能です。";

export const metadata: Metadata = {
  title: searchTitle,
  description: searchDescription,
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
  ...generateOGMetadata({ title: searchTitle, description: searchDescription, imageUrl: "/og-image.jpg" }),
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    tags?: string;
    year?: string;
    month?: string;
  }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, type, category, tags, year, month } =
    await searchParams;

  const parsedType =
    type === "blog" || type === "ranking" ? (type as ContentType) : undefined;
  const parsedTags = tags
    ? tags.split(",").filter(Boolean)
    : undefined;

  const initialResults = q
    ? searchDocumentsServer(q, {
        type: parsedType,
        category: parsedType !== "blog" ? category : undefined,
        tags: parsedType === "blog" ? parsedTags : undefined,
        year: parsedType === "blog" ? year : undefined,
        month: parsedType === "blog" ? month : undefined,
      }).results
    : [];

  const filterMeta = getSearchIndexMeta();

  return (
    <SearchPageClient
      initialResults={initialResults}
      initialQuery={q || ""}
      initialType={parsedType ?? "all"}
      initialCategory={category}
      initialTags={parsedTags}
      initialYear={year}
      initialMonth={month}
      filterMeta={filterMeta}
    />
  );
}
