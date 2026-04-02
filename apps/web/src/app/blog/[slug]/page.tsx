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
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { getDrizzle } from "@stats47/database/server";

import { ShareButtons } from "@/components/molecules/ShareButtons";

import { TagBadge, ArticleRelatedBooks, ArticleRenderer, type Article } from "@/features/blog";
import {
    ArticleAffiliateBanner,
    listLatestArticles,
    listArticlesByTagKey,
    findArticleBySlug,
    findArticleTitlesBySlugs,
    getTagKeysForArticle,
    getTagsForArticles,
    articleService,
} from "@/features/blog/server";

import { getRequiredBaseUrl } from "@/lib/env";
import { AdSenseAd, RANKING_SIDEBAR_TOP, RANKING_PAGE_SIDEBAR } from "@/lib/google-adsense";


import type { Metadata } from "next";

// ブログ記事はランタイムで動的レンダリング（R2バインディングが必要なため）
// ISR: 24時間キャッシュ（初回リクエスト時にR2から取得→以降キャッシュ）

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    try {
        getDrizzle();
    } catch {
        return [];
    }
    const articles = await listLatestArticles(1000);
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
    const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";
    const imageUrl = `${R2_PUBLIC_URL}/blog/${slug}/ogp/ogp.png`;

    return {
        title,
        description,
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            title,
            description,
            type: "article",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        },
    };
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

    const articleTagData = await getTagKeysForArticle(slug);
    const tagKeys = articleTagData.map((t) => t.tagKey);
    const relatedArticles = await getRelatedArticles(tagKeys, slug);

    // 記事本文中の /blog/{slug} リンクからスラッグを抽出し、DB からタイトルを取得
    const blogLinkSlugs = [...article.content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)]
        .map((m) => m[1])
        .filter((s) => s !== slug);
    const uniqueSlugs = [...new Set(blogLinkSlugs)];
    const relatedArticleTitles = await findArticleTitlesBySlugs(uniqueSlugs);
    const articleTagsMap = await getTagsForArticles(relatedArticles.map((a) => a.slug));

    const baseUrl = getRequiredBaseUrl();
    const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";
    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.frontmatter.description ?? "",
        image: `${R2_PUBLIC_URL}/blog/${slug}/ogp/ogp.png`,
        url: `${baseUrl}/blog/${slug}`,
        datePublished: article.publishedAt ?? undefined,
        dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
        author: {
            "@type": "Organization",
            name: "Stats47",
            url: baseUrl,
        },
        publisher: {
            "@type": "Organization",
            name: "Stats47",
            url: baseUrl,
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            {/* パンくずナビゲーション */}
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
                            <BreadcrumbPage>{article.title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* 1カラムレイアウト */}
            <div className="container mx-auto px-4 py-8">
                <main className="space-y-6">
                    <Card>
                        <CardContent className="p-6 sm:p-8 max-w-4xl overflow-hidden">
                            {/* 記事ヘッダー */}
                            <header className="mb-8">
                                <h1 className="mb-4 border-b-4 border-primary pb-3 text-lg font-bold">{article.title}</h1>
                                {article.frontmatter.subtitle && (
                                    <p className="mb-4 text-sm text-muted-foreground">{article.frontmatter.subtitle}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    {articleTagData.map((t) => (
                                        <TagBadge key={t.tagKey} tag={t.tagName} tagKey={t.tagKey} />
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

                            {/* 記事本文 */}
                            <ArticleRenderer article={article} slug={slug} relatedArticleTitles={relatedArticleTitles} />

                            {/* SNSシェアボタン */}
                            <div className="mt-8 pt-6 border-t flex justify-center">
                                <ShareButtons title={article.title} url={`/blog/${slug}`} variant="prominent" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 広告（記事本文後） */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">広告</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center overflow-hidden">
                            <AdSenseAd format={RANKING_SIDEBAR_TOP.format} slotId={RANKING_SIDEBAR_TOP.slotId} showLabel={false} />
                        </CardContent>
                    </Card>

                    {/* バナー広告（タグキーベース・ランダム表示） */}
                    <ArticleAffiliateBanner tagKeys={tagKeys} />

                    {/* 関連書籍（タグキーベース自動配置） */}
                    <ArticleRelatedBooks tagKeys={tagKeys} />

                    {/* 関連記事 */}
                    <BlogRelatedArticlesSection articles={relatedArticles} currentSlug={slug} articleTagsMap={articleTagsMap} />

                    {/* 広告（関連記事後） */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">広告</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center overflow-hidden">
                            <AdSenseAd format={RANKING_PAGE_SIDEBAR.format} slotId={RANKING_PAGE_SIDEBAR.slotId} showLabel={false} />
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    );
}

function BlogRelatedArticlesSection({
    articles,
    currentSlug,
    articleTagsMap,
}: {
    articles: Article[];
    currentSlug: string;
    articleTagsMap: Map<string, Array<{ tagKey: string; tagName: string }>>;
}) {
    const filtered = articles.filter((a) => a.slug !== currentSlug);
    if (filtered.length === 0) return null;

    return (
        <Card>
            <CardHeader className="py-4 px-4">
                <CardTitle className="text-base">関連記事</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((article) => (
                        <Link
                            key={article.slug}
                            href={`/blog/${article.slug}`}
                            className="block rounded-md border border-border p-3 transition-colors hover:border-primary hover:bg-accent/50"
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
                                            <TagBadge key={t.tagKey} tag={t.tagName} static />
                                        ))}
                                    </div>
                                );
                            })()}
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
