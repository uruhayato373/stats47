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
import { Newspaper } from "lucide-react";

import { PageShell } from "@/components/layout";
import { ShareButtons } from "@/components/molecules/ShareButtons";
import { RailCard, RailLinkItem, RailLinkList, SurfaceCard, SurfaceLinkCard } from "@/components/surface";

import {
    SidebarPromoBanner,
} from "@/features/ads";
import { BlogSidebarTextAds, resolveAffiliateBannersByCategory } from "@/features/ads/server";
import { TagBadge, ArticleRenderer, ArticleTableOfContents, generateBlogMetadata, type Article } from "@/features/blog";
import {
    RelatedRankingsSection,
    listLatestArticles,
    listArticlesByTagKey,
    findArticleBySlug,
    findArticleTitlesBySlugs,
    getTagKeysForArticle,
    getTagsForArticles,
    articleService,
} from "@/features/blog/server";

import { getRequiredBaseUrl } from "@/lib/env";
import { AdSenseAd, RANKING_PAGE_SIDEBAR } from "@/lib/google-adsense";
import { buildPersonAsAuthor } from "@/lib/structured-data/person";
import { buildPublisherOrganization } from "@/lib/structured-data/scripts";


import type { Metadata } from "next";

// ブログ記事はランタイムで動的レンダリング（R2バインディングが必要なため）
// ISR: 24時間キャッシュ（初回リクエスト時にR2から取得→以降キャッシュ）

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const articles = await listLatestArticles(1000).catch(() => []);
    return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    let article = null;
    try {
        article = await findArticleBySlug(slug);
    } catch {
        // D1接続エラー: フォールバックメタデータを返す
    }

    if (!article) {
        return {
            title: "記事が見つかりません",
            description: "指定された記事は存在しません。",
        };
    }

    const title = article.frontmatter.seoTitle ?? article.title;
    const description = article.frontmatter.description ?? `${article.title} | stats47 ブログ`;

    return generateBlogMetadata({ title, description, slug });
}

async function getRelatedArticles(tagKeys: string[], currentSlug: string) {
    if (tagKeys.length === 0) {
        const latest = await listLatestArticles(6);
        return latest.filter((a) => a.slug !== currentSlug);
    }

    const firstTagKey = tagKeys[0];
    const related = await listArticlesByTagKey(firstTagKey, 10);
    const filtered = related.filter((a) => a.slug !== currentSlug);

    if (filtered.length >= 3) return filtered.slice(0, 5);

    const latest = await listLatestArticles(10);
    const slugs = new Set(filtered.map((a) => a.slug));
    slugs.add(currentSlug);
    for (const a of latest) {
        if (!slugs.has(a.slug)) {
            filtered.push(a);
            slugs.add(a.slug);
        }
        if (filtered.length >= 5) break;
    }
    return filtered;
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    let article;
    try {
        article = await articleService.getArticle(slug);
    } catch {
        // D1接続エラー時は404として扱う（5xxより適切）
        notFound();
    }

    if (!article) {
        notFound();
    }

    // 記事本文中の /blog/{slug} リンクからスラッグを抽出し、DB からタイトルを取得
    const blogLinkSlugs = [...article.content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)]
        .map((m) => m[1])
        .filter((s) => s !== slug);
    const uniqueSlugs = [...new Set(blogLinkSlugs)];

    // tagKeys / 本文リンクのタイトル / アフィバナーは互いに独立 → 並列取得 (waterfall 解消)
    const [articleTagData, relatedArticleTitles, affiliateBannersByCategory] =
        await Promise.all([
            getTagKeysForArticle(slug),
            findArticleTitlesBySlugs(uniqueSlugs),
            resolveAffiliateBannersByCategory(),
        ]);
    const tagKeys = articleTagData.map((t) => t.tagKey);
    // relatedArticles は tagKeys 依存、articleTagsMap は relatedArticles 依存 (チェーン)
    const relatedArticles = await getRelatedArticles(tagKeys, slug);
    const articleTagsMap = await getTagsForArticles(relatedArticles.map((a) => a.slug));

    const baseUrl = getRequiredBaseUrl();
    const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";
    // E-E-A-T 強化（#76）: author を Person に変更、publisher に logo 追加。
    // frontmatter.author / reviewedBy で記事ごとの上書きも可能。
    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.frontmatter.description ?? "",
        image: `${R2_PUBLIC_URL}/app/blog/${slug}/ogp/ogp.png`,
        url: `${baseUrl}/blog/${slug}`,
        datePublished: article.publishedAt ?? undefined,
        dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
        author: article.frontmatter.author
            ? {
                "@type": "Person",
                name: article.frontmatter.author,
                url: `${baseUrl}/about`,
            }
            : buildPersonAsAuthor(baseUrl),
        ...(article.frontmatter.reviewedBy
            ? {
                reviewedBy: {
                    "@type": "Person",
                    name: article.frontmatter.reviewedBy,
                    url: `${baseUrl}/about`,
                },
            }
            : {}),
        publisher: buildPublisherOrganization(baseUrl),
    };

    const rightRail = (
        <aside className="flex flex-col gap-3">
            <ArticleTableOfContents content={article.content} compact />

            {/* 本文関連 widget（主役・上） */}
            <RelatedRankingsSection tagKeys={tagKeys} compact />

            <BlogRelatedArticlesSection articles={relatedArticles} currentSlug={slug} articleTagsMap={articleTagsMap} compact />

            <hr className="my-1 border-t border-border" />

            {/* promo / 広告（本文関連の下へ降格） */}
            <SidebarPromoBanner index={0} position="sidebar-left" />
            <SidebarPromoBanner index={1} position="sidebar-right" />

            <RailCard title="広告" bodyClassName="flex justify-center overflow-hidden px-4 pb-4 pt-3">
                <div className="flex justify-center overflow-hidden">
                    <AdSenseAd format={RANKING_PAGE_SIDEBAR.format} slotId={RANKING_PAGE_SIDEBAR.slotId} showLabel={false} />
                </div>
            </RailCard>

            {/* テキストリンク広告 (strategy career / 就職エージェントneo) */}
            <BlogSidebarTextAds tagKeys={tagKeys} />
        </aside>
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            <PageShell rightRail={rightRail} rightRailBreakpoint="lg">
                {/* パンくず (tag/areas と同じく単一 PageShell の先頭子として配置) */}
                <Breadcrumb className="mb-4">
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
                            <BreadcrumbPage>{article.title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* 中央カラム: 記事 */}
                <main className="min-w-0 space-y-6">
                    <SurfaceCard className="p-0">
                        <div className="overflow-hidden p-6 sm:p-8">
                            {/* 記事ヘッダー */}
                            <header className="mb-8">
                                <h1 className="mb-4 border-b pb-3 text-2xl font-bold">{article.title}</h1>
                                {article.frontmatter.subtitle && (
                                    <p className="mb-4 text-sm text-muted-foreground">{article.frontmatter.subtitle}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    {articleTagData.map((t) => (
                                        <TagBadge key={t.tagKey} tag={t.tagKey} tagKey={t.tagKey} />
                                    ))}
                                    {article.publishedAt && (
                                        <time dateTime={article.publishedAt} className="text-xs text-muted-foreground">
                                            {article.publishedAt.slice(0, 10)}
                                        </time>
                                    )}
                                    <div className="ml-auto">
                                        <ShareButtons title={article.title} url={`/blog/${slug}`} variant="simple" platforms={["X (Twitter)", "LINE"]} />
                                    </div>
                                </div>
                            </header>

                            {/* TOC (lg 未満で記事冒頭に表示。lg 以上は右 rail に表示) */}
                            <div className="mb-8 lg:hidden">
                                <ArticleTableOfContents content={article.content} />
                            </div>

                            {/* 記事本文 */}
                            <ArticleRenderer article={article} slug={slug} relatedArticleTitles={relatedArticleTitles} affiliateBannersByCategory={affiliateBannersByCategory} />

                            {/* SNSシェアボタン */}
                            <div className="mt-8 pt-6 border-t flex justify-center">
                                <ShareButtons title={article.title} url={`/blog/${slug}`} variant="prominent" />
                            </div>
                        </div>
                    </SurfaceCard>
                </main>
            </PageShell>
        </>
    );
}

function BlogRelatedArticlesSection({
    articles,
    currentSlug,
    articleTagsMap,
    compact = false,
}: {
    articles: Article[];
    currentSlug: string;
    articleTagsMap: Map<string, Array<{ tagKey: string }>>;
    compact?: boolean;
}) {
    const filtered = articles.filter((a) => a.slug !== currentSlug);
    if (filtered.length === 0) return null;

    return (
        <RailCard
            title="関連記事"
            icon={<Newspaper className="h-4 w-4 text-muted-foreground" />}
            titleClassName="text-base font-semibold text-foreground"
            bodyClassName="p-4 pt-3"
        >
            {compact ? (
                <RailLinkList>
                    {filtered.map((article) => (
                        <RailLinkItem key={article.slug} href={`/blog/${article.slug}`}>
                            <span className="line-clamp-2 leading-snug">{article.title}</span>
                        </RailLinkItem>
                    ))}
                </RailLinkList>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((article) => (
                        <SurfaceLinkCard
                            key={article.slug}
                            href={`/blog/${article.slug}`}
                            className="block p-3"
                        >
                            <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                            {article.publishedAt && (
                                <p className="mt-1 text-xs text-muted-foreground">{article.publishedAt.slice(0, 10)}</p>
                            )}
                            {(() => {
                                const tagData = articleTagsMap.get(article.slug);
                                if (!tagData || tagData.length === 0) return null;
                                return (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {tagData.slice(0, 2).map((t) => (
                                            <TagBadge key={t.tagKey} tag={t.tagKey} static />
                                        ))}
                                    </div>
                                );
                            })()}
                        </SurfaceLinkCard>
                    ))}
                </div>
            )}
        </RailCard>
    );
}
