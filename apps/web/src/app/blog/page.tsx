import Link from "next/link";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { PageShell, PageHeader } from "@/components/layout";

import { BlogArticleGrid } from "@/features/blog";
import { listLatestArticles, readBlogSnapshotMetaFromR2 } from "@/features/blog/server";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";

import type { Metadata } from "next";

export const revalidate = 86400;

const PAGE_SIZE = 24;

export const metadata: Metadata = {
    title: "ブログ | stats47",
    description: "都道府県の統計データを分析した記事一覧。人口、経済、教育、福祉などのランキングや時系列分析を掲載。",
    alternates: {
        canonical: "/blog",
    },
};

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
    const { page: pageParam } = await searchParams;
    const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
    const offset = (currentPage - 1) * PAGE_SIZE;

    const [articles, meta] = await Promise.all([
        listLatestArticles(PAGE_SIZE, offset).catch(() => []),
        readBlogSnapshotMetaFromR2().catch(() => null),
    ]);

    // Total count: fetch one extra article to check if there's a next page.
    // We don't need the exact total — just enough to render prev/next.
    const nextArticles = articles.length === PAGE_SIZE
        ? await listLatestArticles(1, offset + PAGE_SIZE).catch(() => [])
        : [];
    const hasNextPage = nextArticles.length > 0;
    const hasPrevPage = currentPage > 1;

    return (
        <PageShell>
            {/* パンくずナビゲーション */}
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/">ホーム</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>ブログ</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <PageHeader
                eyebrow="統計ブログ"
                title="ブログ"
                description="都道府県の統計データを分析した記事を掲載しています"
            />

            <div className="mb-6 flex flex-wrap gap-4">
                <Link href="/search?type=blog" className="text-sm text-primary hover:underline">
                    記事を検索する →
                </Link>
                <Link href="/blog/tags" className="text-sm text-primary hover:underline">
                    タグ一覧から記事を探す →
                </Link>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
                {currentPage > 1 ? `${currentPage} ページ目` : `全 ${meta ? "記事一覧" : "記事一覧"}`}
            </p>
            <BlogArticleGrid articles={articles} firstPagePriority={currentPage === 1} />

            {/* ページネーション */}
            {(hasPrevPage || hasNextPage) && (
                <nav className="mt-8 flex items-center justify-center gap-3" aria-label="ページネーション">
                    {hasPrevPage ? (
                        <Link
                            href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`}
                            className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                        >
                            ← 前のページ
                        </Link>
                    ) : (
                        <span className="rounded-none border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                            ← 前のページ
                        </span>
                    )}
                    <span className="text-sm text-muted-foreground">{currentPage} ページ</span>
                    {hasNextPage ? (
                        <Link
                            href={`/blog?page=${currentPage + 1}`}
                            className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                        >
                            次のページ →
                        </Link>
                    ) : (
                        <span className="rounded-none border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                            次のページ →
                        </span>
                    )}
                </nav>
            )}

            <div className="mt-8">
                <AdSenseAd format={CONTENT_FOOTER.format} slotId={CONTENT_FOOTER.slotId} />
            </div>
        </PageShell>
    );
}
