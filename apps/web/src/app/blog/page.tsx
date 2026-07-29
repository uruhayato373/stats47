import Link from "next/link";

import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";
import { RightRailWidgets } from "@/components/rail";

import { FooterAdSlot } from "@/features/ads/slots";
import { BlogArticleGrid, BlogAuthorProfileCard } from "@/features/blog/listing";
import { readBlogIndexPageFromR2 } from "@/features/blog/listing.server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

export const revalidate = 86400;

const PAGE_SIZE = 24;

const BLOG_INDEX_TITLE = "ブログ | stats47";
const BLOG_INDEX_DESCRIPTION =
    "都道府県の統計データを分析した記事一覧。人口、経済、教育、福祉などのランキングや時系列分析を掲載。";

export const metadata: Metadata = {
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
    alternates: {
        canonical: "/blog",
    },
    // per-page R2 OGP を持たない一覧ページは静的 /og-image.jpg を明示する。
    // 未指定だと Next が root の opengraph-image.tsx (ランタイム next/og) を自動注入し、
    // Cloudflare Worker で 500 になる (正典: .claude/rules/ogp-image-standards.md §3 課題0)。
    ...generateOGMetadata({
        title: BLOG_INDEX_TITLE,
        description: BLOG_INDEX_DESCRIPTION,
        imageUrl: "/og-image.jpg",
        url: "https://stats47.jp/blog",
    }),
};

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
    const { page: pageParam } = await searchParams;
    const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
    const offset = (currentPage - 1) * PAGE_SIZE;

    // 記事・meta・次ページ判定を snapshot 1 回読みでまとめて取る。
    // 個別 reader を並べると同一リクエスト内で full snapshot を 3 回取得していた。
    const indexPage = await readBlogIndexPageFromR2(PAGE_SIZE, offset).catch(
        () => null,
    );
    const articles = indexPage?.articles ?? [];
    const meta = indexPage?.meta ?? null;
    const hasNextPage = indexPage?.hasNextPage ?? false;
    const hasPrevPage = currentPage > 1;

    return (
        // doboku-note スタイル: 左=記事カード一覧 / 右=共通サイドバー (運営者プロフィール + promo/広告)。
        // 運営者は上部の BlogAuthorProfileCard が担うため、RightRailWidgets 内蔵の promo 版は無効化する
        <PageShell
            rightRailBreakpoint="lg"
            rightRail={
                <RightRailWidgets
                    // 運営者プロフィール (E-E-A-T) は右レールに PC のみ表示
                    topWidgets={
                        <div className="hidden lg:block">
                            <BlogAuthorProfileCard />
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
            <BlogArticleGrid articles={articles} />

            {/*
              記事内広告は置かない。この面は単一の記事グリッドしか無く、直後のページネーションは
              前後ページが両方無いと消えるため、置くと最終ページ等でフッター広告と隣接して
              広告 2 連になる (2026-07-29 是正)。末尾の Multiplex 1 枠に統一する。
            */}
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
                        <span className="rounded-none border border-border px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed" aria-disabled="true">
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
