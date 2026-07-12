import Link from "next/link";

import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";
import { RightRailWidgets } from "@/components/rail";

import { InContentAdSlot, FooterAdSlot, OperatorProfileCard } from "@/features/ads";
import { BlogArticleGrid } from "@/features/blog";
import { listLatestArticles, readBlogSnapshotMetaFromR2 } from "@/features/blog/server";

import { HUB_INCONTENT } from "@/lib/google-adsense";

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
        // doboku-note スタイル: 左=記事カード一覧 / 右=共通サイドバー (運営者プロフィール + promo/広告)。
        // 運営者は上部の OperatorProfileCard が担うため、RightRailWidgets 内蔵の promo 版は無効化する
        <PageShell
            rightRailBreakpoint="lg"
            rightRail={
                <RightRailWidgets
                    // 運営者プロフィール (E-E-A-T) は右レールに PC のみ表示
                    topWidgets={
                        <div className="hidden lg:block">
                            <OperatorProfileCard />
                        </div>
                    }
                />
            }
        >
            <Breadcrumbs
                items={[
                    { label: "ホーム", href: "/" },
                    { label: "ブログ" },
                ]}
            />

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

            {/* 記事内広告（一覧グリッド後。slotId 未発行の間は非表示） */}
            <InContentAdSlot slot={HUB_INCONTENT} />

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

            {/* コンテンツ末尾の全幅フッター広告 */}
            <FooterAdSlot />
        </PageShell>
    );
}
