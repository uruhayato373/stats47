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

import { ShareButtons } from "@/components/molecules/ShareButtons";

import {
    BannerAd,
    FurusatoNozeiCard,
    FurusatoNozeiPopularCard,
    TechSchoolPromoCard,
    pickPrefCodeForSlug,
} from "@/features/ads";
import { BlogSidebarTextAds, resolveAffiliateBannersByCategory } from "@/features/ads/server";
import { TagBadge, ArticleRelatedBooks, ArticleRenderer, ArticleTableOfContents, extractPrefecturesFromArticle, generateBlogMetadata, type Article } from "@/features/blog";
import {
    ArticleAffiliateBanner,
    ArticleDataDownloadSection,
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
import { AdSenseAd, RANKING_SIDEBAR_TOP, RANKING_PAGE_SIDEBAR } from "@/lib/google-adsense";
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

    const articleTagData = await getTagKeysForArticle(slug);
    const tagKeys = articleTagData.map((t) => t.tagKey);
    const [relatedArticles, affiliateBannersByCategory] = await Promise.all([
        getRelatedArticles(tagKeys, slug),
        resolveAffiliateBannersByCategory(),
    ]);

    // 記事に登場する都道府県を抽出 (ふるさと納税 widget の表示先決定用)
    const prefCodes = extractPrefecturesFromArticle({
        title: article.title,
        body: article.content,
        tagKeys,
        limit: 1,
    });

    /**
     * ふるさと納税 widget の 3 段ロジック:
     *   1. 記事から都道府県を抽出できた → その県を表示
     *   2. 抽出できなかった → slug ハッシュで決定論的に県を選ぶ (記事固定・サイト全体で 47 県分散)
     *   3. (どちらでも楽天 API レスポンスが空なら) 全国人気返礼品 fallback
     *
     * 1/2 は同じ `<FurusatoNozeiCard>` を使い、3 は別コンポーネント。
     * - 並べて表示する必要はないので「1/2 を表示できなかった時のみ 3 を表示」する想定
     * - ただし FurusatoNozeiCard は API 呼出結果が空でも県固定リンクで描画する
     *   ため、3 は「1 と 2 の両方が無効 (例: 楽天 APP ID 未設定)」時のみ意味を持つ
     */
    const furusatoAreaCode = prefCodes[0] ?? pickPrefCodeForSlug(slug);

    // 記事本文中の /blog/{slug} リンクからスラッグを抽出し、DB からタイトルを取得
    const blogLinkSlugs = [...article.content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)]
        .map((m) => m[1])
        .filter((s) => s !== slug);
    const uniqueSlugs = [...new Set(blogLinkSlugs)];
    const relatedArticleTitles = await findArticleTitlesBySlugs(uniqueSlugs);
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

            {/* メインコンテンツ
                - xl+: 3 カラム (左 300 + 本文 auto + 右 300、左右対称で 300x250 バナーを両サイドに配置)
                - xl 未満: 1 カラム
                container は max-w-[1700px] で 1920px+ 画面の余白を最小化 */}
            <div className="mx-auto max-w-[1700px] px-4 py-6">
                <div className="xl:grid xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:gap-5 xl:items-start">

                    {/* 左カラム (xl+): TOC + 高単価アフィリエイトバナー + 上部 AdSense (sticky) */}
                    <aside className="hidden xl:flex xl:flex-col xl:gap-3 xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1">
                        <ArticleTableOfContents content={article.content} compact />
                        {/* A8.net バナー広告: STRATEGY CAREER (高単価・目次の下) */}
                        <BannerAd
                            href="https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5YZ75"
                            imageUrl="https://www26.a8.net/svt/bgt?aid=260601701360&wid=001&eno=01&mid=s00000026573001003000&mc=1"
                            trackingPixelUrl="https://www10.a8.net/0.gif?a8mat=4B5LK5+5YC2K2+5P1E+5YZ75"
                            width={300}
                            height={250}
                            label="A8 sidebar banner (left, strategy career)"
                            position="sidebar"
                        />
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">広告</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center overflow-hidden">
                                <AdSenseAd format={RANKING_SIDEBAR_TOP.format} slotId={RANKING_SIDEBAR_TOP.slotId} showLabel={false} />
                            </CardContent>
                        </Card>
                    </aside>

                    {/* 中央カラム: 記事 + main 内 widget */}
                    <main className="min-w-0 space-y-6">
                        <Card>
                            <CardContent className="p-6 sm:p-8 overflow-hidden">
                                {/* 記事ヘッダー */}
                                <header className="mb-8">
                                    <h1 className="mb-4 border-b-4 border-primary pb-3 text-lg font-bold">{article.title}</h1>
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

                                {/* TOC (xl 未満で記事冒頭に表示。xl 以上は左カラムに表示) */}
                                <div className="mb-8 xl:hidden">
                                    <ArticleTableOfContents content={article.content} />
                                </div>

                                {/* 記事本文 */}
                                <ArticleRenderer article={article} slug={slug} relatedArticleTitles={relatedArticleTitles} affiliateBannersByCategory={affiliateBannersByCategory} />

                                {/* インラインネイティブ広告: Claude Code 副業講座 (本文と SNS share の間) */}
                                <TechSchoolPromoCard variant="inline" />

                                {/* SNSシェアボタン */}
                                <div className="mt-8 pt-6 border-t flex justify-center">
                                    <ShareButtons title={article.title} url={`/blog/${slug}`} variant="prominent" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* DataPack CSV CTA (マスタープラン § 5.3 「関連 CSV」) */}
                        <ArticleDataDownloadSection tagKeys={tagKeys} />

                        {/* バナー広告（タグキーベース・ランダム表示） */}
                        <ArticleAffiliateBanner tagKeys={tagKeys} />

                        {/* xl 未満で表示する各種関連 widget (xl+ では右カラムに集約) */}
                        <div className="space-y-6 xl:hidden">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">広告</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center overflow-hidden">
                                    <AdSenseAd format={RANKING_SIDEBAR_TOP.format} slotId={RANKING_SIDEBAR_TOP.slotId} showLabel={false} />
                                </CardContent>
                            </Card>

                            <ArticleRelatedBooks tagKeys={tagKeys} />

                            <RelatedRankingsSection tagKeys={tagKeys} />

                            <FurusatoNozeiCard areaCode={furusatoAreaCode} />
                            {prefCodes.length === 0 && <FurusatoNozeiPopularCard />}

                            <BlogRelatedArticlesSection articles={relatedArticles} currentSlug={slug} articleTagsMap={articleTagsMap} />

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">広告</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center overflow-hidden">
                                    <AdSenseAd format={RANKING_PAGE_SIDEBAR.format} slotId={RANKING_PAGE_SIDEBAR.slotId} showLabel={false} />
                                </CardContent>
                            </Card>

                            {/* テキストリンク広告 (strategy career / 就職エージェントneo) */}
                            <BlogSidebarTextAds tagKeys={tagKeys} />
                        </div>
                    </main>

                    {/* 右カラム (xl+): 関連 widget + 広告 (independent scroll) */}
                    <aside className="hidden xl:flex xl:flex-col xl:gap-3 xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1">
                        {/* A8.net バナー広告 (above-fold 最上部) */}
                        <BannerAd
                            href="https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75"
                            imageUrl="https://www24.a8.net/svt/bgt?aid=260516554632&wid=001&eno=01&mid=s00000027444001003000&mc=1"
                            trackingPixelUrl="https://www19.a8.net/0.gif?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75"
                            width={300}
                            height={250}
                            label="A8 sidebar banner (top)"
                            position="sidebar"
                        />

                        {/* 関連書籍 */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-base">関連書籍</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-3">
                                <ArticleRelatedBooks tagKeys={tagKeys} compact />
                            </CardContent>
                        </Card>

                        {/* 関連ランキング */}
                        <RelatedRankingsSection tagKeys={tagKeys} compact />

                        {/* ふるさと納税: 記事の都道府県 (or slug ハッシュ) */}
                        <FurusatoNozeiCard areaCode={furusatoAreaCode} />
                        {prefCodes.length === 0 && <FurusatoNozeiPopularCard />}

                        {/* 関連記事 */}
                        <BlogRelatedArticlesSection articles={relatedArticles} currentSlug={slug} articleTagsMap={articleTagsMap} compact />

                        {/* AdSense Rectangle (下部) */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">広告</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center overflow-hidden">
                                <AdSenseAd format={RANKING_PAGE_SIDEBAR.format} slotId={RANKING_PAGE_SIDEBAR.slotId} showLabel={false} />
                            </CardContent>
                        </Card>

                        {/* テキストリンク広告 (strategy career / 就職エージェントneo) — 右サイドバー下部 */}
                        <BlogSidebarTextAds tagKeys={tagKeys} />
                    </aside>

                </div>
            </div>
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
        <Card>
            <CardHeader className="py-4 px-4">
                <CardTitle className="text-base">関連記事</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3">
                <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"}>
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
                                            <TagBadge key={t.tagKey} tag={t.tagKey} static />
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
