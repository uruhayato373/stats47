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

import { ArticleShell } from "@/components/layout";
import { ShareButtons } from "@/components/molecules/ShareButtons";
import { ArticleCard, RailCard, RailLinkItem, RailLinkList, SurfaceLinkCard } from "@/components/surface";

import {
    BannerAd,
    RailAdSlot,
    SidebarPromoBanner,
    selectPromoBannerIndexForRanking,
} from "@/features/ads";
import { resolveContentVertical } from "@/features/ads/constants/affiliate-category";
import { RakutenItemsCard, resolveAffiliateBannersByCategory, resolveAffiliateBannersForContent, resolveAffiliateTextAdsForContent } from "@/features/ads/server";
import { BLOG_IN_BODY_BANNER_COUNT, BlogAuthorProfileCard, TagBadge, ArticleRenderer, ArticleTableOfContents, generateBlogMetadata, type Article } from "@/features/blog";
import {
    RelatedRankingsSection,
    listLatestArticles,
    listArticlesByTagKey,
    findArticleBySlug,
    findArticleTitlesBySlugs,
    getTagKeysForArticle,
    getTagsForArticles,
    articleService,
    resolveArticleSurveyTaxonomy,
} from "@/features/blog/server";
import { BlogProductCta } from "@/features/products";
import { SurveyTaxonomyCard } from "@/features/survey";

import { getRequiredBaseUrl } from "@/lib/env";
import { RANKING_PAGE_SIDEBAR } from "@/lib/google-adsense";
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
    const [articleTagData, relatedArticleTitles, affiliateBannersByCategory, articleSurveys] =
        await Promise.all([
            getTagKeysForArticle(slug),
            findArticleTitlesBySlugs(uniqueSlugs),
            resolveAffiliateBannersByCategory(),
            resolveArticleSurveyTaxonomy({
                slug,
                content: article.content,
                snapshotSurveyIds: article.surveyIds,
            }),
        ]);
    const tagKeys = articleTagData.map((t) => t.tagKey);
    // テキスト広告は本文 inline のみに置く。右レールの PR は画像バナーへ統一する。
    // 在庫が薄い vertical では空枠を作らない (md-content 側が index 不足を握りつぶす)。
    // ★ 2026-09-03: 解決順を **出典調査 → タグ** に統一 (`resolveContentVertical`、ranking と同じ)。
    //   家計調査の記事 (ブログ imp の 17%) は食文化タグで economy に落ち金融広告が出ていた。
    //   all.json の surveyIds 焼き込みで家計調査 → furusato、気象統計 → 広告なし、のように決める。
    const affiliateInput = { surveyIds: article.surveyIds, tagKeys };
    const affiliateTextAds = await resolveAffiliateTextAdsForContent(
        affiliateInput,
        "sidebar-bottom",
        4,
    );
    // 本文3 + 末尾1 + サイドバー2 = 最大6件を1回で解決し、用途ごとに切り出す。
    //   (同一 vertical では priority 降順で返るため、先頭ほど確定EPC が高い順に当たる)。
    const affiliateBannerPool = await resolveAffiliateBannersForContent(affiliateInput, BLOG_IN_BODY_BANNER_COUNT + 2);
    const articleBanners = affiliateBannerPool.slice(0, BLOG_IN_BODY_BANNER_COUNT);
    // 右レールは「バナーだけ」。本文で使った分より後ろを回して重複を避ける。
    const sidebarBanners = affiliateBannerPool.slice(BLOG_IN_BODY_BANNER_COUNT, BLOG_IN_BODY_BANNER_COUNT + 2);
    const affiliateVertical = resolveContentVertical(affiliateInput).vertical;
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

    // レール通常領域: 関連コンテンツ → 運営者 → 広告の順で、記事理解と回遊を優先する。
    const rail = (
        <>
            <RelatedRankingsSection tagKeys={tagKeys} compact />

            <SurveyTaxonomyCard
                surveys={articleSurveys}
                title="この記事の出典調査"
                surface="blog_survey"
            />

            <BlogRelatedArticlesSection articles={relatedArticles} currentSlug={slug} articleTagsMap={articleTagsMap} compact />

            <BlogAuthorProfileCard compact />

            <hr className="my-1 border-t border-border" />

            <SidebarPromoBanner
                index={selectPromoBannerIndexForRanking()}
                position="sidebar"
            />

            {/* ★ 2026-08-04: 右レールに記事 vertical で解決した 300x250 を追加。
                右レールは**バナーのみ**とし、テキストリンクは本文 inline に寄せる方針は不変。
                在庫が無い vertical では空配列になり何も描画しない。 */}
            {sidebarBanners.map((b) => (
                <BannerAd
                    key={b.id}
                    href={b.href}
                    imageUrl={b.imageUrl}
                    trackingPixelUrl={b.trackingPixelUrl}
                    width={b.width}
                    height={b.height}
                    label={b.title}
                    category={b.vertical ?? affiliateVertical ?? "other"}
                    position="blog-sidebar"
                    adId={b.id}
                    creativeSize={`${b.width}x${b.height}`}
                />
            ))}

            {/* 右レールの広告枠。RightRailWidgets と同じ slot 部品に寄せた (2026-07-29) */}
            <RailAdSlot slot={RANKING_PAGE_SIDEBAR} />

            {/* 記事の主題が品目のとき楽天市場の商品を出す (公開 430 記事中 131 件が該当)。
                品目を検出できない記事では何も描画しない。 */}
            <RakutenItemsCard sourceText={article.title} position="blog-sidebar" />
        </>
    );

    // レール末尾の sticky クラスタ: PCでTOCが読中に追従する。モバイルは本文冒頭だけを使う。
    const railSticky = (
        <div className="hidden lg:block">
            <ArticleTableOfContents content={article.content} compact />
        </div>
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            <ArticleShell
                rail={rail}
                railSticky={railSticky}
                breadcrumb={
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
                }
            >
                <div className="space-y-6">
                    <ArticleCard>
                            {/* 記事ヘッダー */}
                            <header className="mb-8 border-b border-border pb-6 font-news-article">
                                <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium leading-6 text-muted-foreground">
                                    <span className="text-primary">stats47 データジャーナル</span>
                                    <span aria-hidden="true">/</span>
                                    <span>統計で読む地域ニュース</span>
                                    <span aria-hidden="true">/</span>
                                    <span>PRを含む場合があります</span>
                                </div>
                                <h1 className="article-title mb-4 text-[1.45rem] font-bold text-foreground sm:text-[28px]">{article.title}</h1>
                                {article.frontmatter.subtitle && (
                                    <p className="mb-5 text-[15px] leading-8 text-muted-foreground sm:text-base">{article.frontmatter.subtitle}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {articleTagData.map((t) => (
                                            <TagBadge key={t.tagKey} tag={t.tagKey} tagKey={t.tagKey} />
                                        ))}
                                        {article.publishedAt && (
                                            <time dateTime={article.publishedAt} className="text-xs text-muted-foreground">
                                                公開日 {article.publishedAt.slice(0, 10)}
                                            </time>
                                        )}
                                    </div>
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
                            <ArticleRenderer
                                article={article}
                                slug={slug}
                                relatedArticleTitles={relatedArticleTitles}
                                affiliateBannersByCategory={affiliateBannersByCategory}
                                affiliateTextAds={affiliateTextAds}
                                affiliateVertical={affiliateVertical}
                                affiliateBanners={articleBanners}
                            />

                            <BlogProductCta blogSlug={slug} />

                            {/* SNSシェアボタン */}
                            <div className="mt-8 pt-6 border-t flex justify-center">
                                <ShareButtons title={article.title} url={`/blog/${slug}`} variant="prominent" />
                            </div>
                    </ArticleCard>
                </div>
            </ArticleShell>
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
