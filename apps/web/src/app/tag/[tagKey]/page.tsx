import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";
import { RightRailWidgets } from "@/components/rail";
import { SurfaceCard } from "@/components/surface";

import {
    InContentAdSlot,
    FooterAdSlot,
    NativeAffiliateRow,
} from "@/features/ads";
import { resolveAffiliateBanners } from "@/features/ads/server";
import {
    listAllUniqueTags,
    listArticleSummariesByTagKey,
} from "@/features/blog/server";

import { HUB_INCONTENT } from "@/lib/google-adsense";

import type { Metadata } from "next";


export async function generateStaticParams() {
    const tagKeys = await listAllUniqueTags().catch(() => []);
    return tagKeys.map((tagKey) => ({ tagKey }));
}

interface PageProps {
    params: Promise<{ tagKey: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { tagKey } = await params;
    const tag = decodeURIComponent(tagKey);

    // 記事が 2 本未満のタグは thin content と判定されやすいため noindex。
    // 0 本の場合はページ本体で notFound() が呼ばれる。
    const articles = await listArticleSummariesByTagKey(tagKey, 2);
    const indexable = articles.length >= 2;

    const title = `「${tag}」タグの記事一覧`;
    const description = `「${tag}」タグが付いた都道府県統計ブログの記事一覧。`;

    return {
        title,
        description,
        alternates: {
            canonical: `/tag/${tagKey}`,
        },
        robots: indexable ? "index, follow" : "noindex, follow",
        openGraph: {
            title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

export default async function TagArticlesPage({ params }: PageProps) {
    const { tagKey } = await params;
    const tag = decodeURIComponent(tagKey);
    const [articles, nativeBanners] = await Promise.all([
        listArticleSummariesByTagKey(tagKey, 50),
        resolveAffiliateBanners([tagKey], 4).catch(() => []),
    ]);

    if (articles.length === 0) {
        notFound();
    }

    return (
        <PageShell rightRail={<RightRailWidgets />}>
            <Breadcrumbs
                items={[
                    { label: "ホーム", href: "/" },
                    { label: "ブログ", href: "/blog" },
                    { label: "タグ一覧", href: "/blog/tags" },
                    { label: tag },
                ]}
            />

            <PageHeader
                eyebrow="タグ"
                title={tag}
                description={`「${tag}」タグが付いた都道府県統計ブログの記事 ${articles.length} 本を掲載しています。`}
                stats={`全 ${articles.length} 記事`}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                    <Link
                        key={article.slug}
                        href={`/blog/${article.slug}`}
                        className="group block h-full"
                    >
                        <SurfaceCard className="flex h-full flex-col rounded-none transition-colors hover:border-primary/50 hover:shadow-md">
                            <div className="py-3 px-4 pb-3 flex flex-col items-start gap-2 space-y-0 border-b border-border">
                                <div className="mb-2 flex items-center gap-2">
                                    {article.description && (
                                        <span className="text-xs text-muted-foreground">
                                            {article.slug}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-base font-semibold leading-none text-lg transition-colors group-hover:text-primary">
                                    {article.title}
                                </h3>
                                {article.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {article.description}
                                    </p>
                                )}
                            </div>
                        </SurfaceCard>
                    </Link>
                ))}
            </div>

            {/* 記事内広告（一覧グリッド後。slotId 未発行の間は非表示） */}
            <InContentAdSlot slot={HUB_INCONTENT} />

            {/* ネイティブアフィリエイト (D Phase 4) */}
            {nativeBanners.length > 0 && (
                <div className="mt-10">
                    <NativeAffiliateRow
                        title={`「${tag}」関連の書籍・商品`}
                        banners={nativeBanners}
                        position="tag-native"
                        trackingCategory={`tag-${tagKey}`}
                    />
                </div>
            )}

            {/* コンテンツ末尾の全幅フッター広告 */}
            <FooterAdSlot />
        </PageShell>
    );
}
