/**
 * 検索ページ（Server Component）
 *
 * URL パラメータ ?q= が存在する場合、サーバーサイドで検索を実行し
 * 初期結果を HTML に含める。クローラーが検索結果をインデックスできる。
 * インタラクティブな検索・フィルタリングはクライアント側で処理。
 */
import { PageShell } from "@/components/layout";

import { SearchPageClient, type ContentType } from "@/features/search";
import { getSearchIndexMeta, searchDocumentsServer } from "@/features/search/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/** 検索結果数の summary 表示 */
function buildResultsSummary(
  query: string | undefined,
  resultsCount: number,
): string {
  if (!query) return "キーワードを入力して 1,800 以上のランキング・記事を横断検索できます。";
  if (resultsCount === 0) return `「${query}」に一致する結果は見つかりませんでした。`;
  return `「${query}」の検索結果 ${resultsCount} 件`;
}

// 検索インデックスはビルド時に static JSON として bundle 済み（D1 read なし）。
// searchParams が異なれば Next.js が per-request render に切替えるので force-dynamic は不要。

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
    <PageShell>
      {/* Hero (軽量): 検索クエリ + 結果サマリ */}
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          検索
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {q ? `「${q}」の検索結果` : "サイト内検索"}
          {q && initialResults.length > 0 && (
            <span className="ml-3 align-middle text-xs font-medium text-muted-foreground">
              {initialResults.length} 件
            </span>
          )}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {buildResultsSummary(q, initialResults.length)}
        </p>
      </header>

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
    </PageShell>
  );
}
