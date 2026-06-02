import Link from "next/link";
import { notFound } from "next/navigation";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";

import { resolveAffiliateBanners } from "@/features/ads/server";
import {
    listAllUniqueTags,
    listArticleSummariesByTagKey,
} from "@/features/blog/server";
import {
    HeroShell,
    KpiGrid,
    KpiTile,
    NativeAffiliateRow,
    RightRailWidgets,
} from "@/features/redesign";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";

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

    return (
        <>
            <div className="container mx-auto px-4 pt-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">ホーム</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/blog">ブログ</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/blog/tags">タグ一覧</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{tag}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="container mx-auto px-4 py-4">
                {/* Hero (D 暗色) — マスタープラン § 5.3 準拠 */}
                <HeroShell variant="dark" className="mb-6">
                    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr,360px] md:p-8">
                        <div className="min-w-0">
                            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-white">
                                タグ
                            </p>
                            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                                {tag}
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
                                「{tag}」タグが付いた都道府県統計ブログの記事 {articles.length} 本を掲載しています。
                            </p>
                        </div>
                        <div>
                            <KpiGrid columns={2}>
                                <KpiTile
                                    label="記事数"
                                    value={String(articles.length)}
                                    unit="件"
                                    variant="dark"
                                />
                                <KpiTile
                                    label="タグ"
                                    value={tag}
                                    variant="dark"
                                />
                            </KpiGrid>
                        </div>
                    </div>
                </HeroShell>

                {articles.length === 0 ? (
                    notFound()
                ) : (
                    <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8 xl:items-start">
                        <main className="min-w-0">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {articles.map((article) => (
                                    <Link
                                        key={article.slug}
                                        href={`/blog/${article.slug}`}
                                        className="group block h-full"
                                    >
                                        <Card className="flex h-full flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/50">
                                            <CardHeader className="pb-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    {article.description && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {article.slug}
                                                        </span>
                                                    )}
                                                </div>
                                                <CardTitle className="text-lg transition-colors group-hover:text-primary">
                                                    {article.title}
                                                </CardTitle>
                                                {article.description && (
                                                    <CardDescription className="line-clamp-2">
                                                        {article.description}
                                                    </CardDescription>
                                                )}
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                ))}
                            </div>

                            {/* ネイティブアフィリエイト (D Phase 4) */}
                            {nativeBanners.length > 0 && (
                                <div className="mt-8">
                                    <NativeAffiliateRow
                                        title={`「${tag}」関連の書籍・商品`}
                                        banners={nativeBanners}
                                        position="tag-native"
                                        trackingCategory={`tag-${tagKey}`}
                                    />
                                </div>
                            )}

                            <div className="mt-8">
                                <AdSenseAd format={CONTENT_FOOTER.format} slotId={CONTENT_FOOTER.slotId} />
                            </div>
                        </main>

                        {/* 右サイドバー (xl+) — タグ記事一覧の脇に常時配置 */}
                        <aside className="mt-8 xl:mt-0 xl:block">
                            <RightRailWidgets />
                        </aside>
                    </div>
                )}
            </div>
        </>
    );
}
