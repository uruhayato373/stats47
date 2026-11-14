import { notFound } from "next/navigation";

import { fetchPrefectures } from "@stats47/area";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { CATEGORIES } from "@stats47/data-configs";
import { contentTagIds, resolveContentTag } from '@stats47/data-configs/content';
import { hrefFor } from "@stats47/data-configs/content/href";
import { normalizeUnitsInText } from "@stats47/data-configs/unit";

import Link from "@/components/atoms/SiteLink";
import { ArticleShell, CURRENT_ITEM_CLASS, PanelGrid } from "@/components/layout";
import { DataSourceList } from "@/components/molecules/DataSourceList";
import { ShareButtons } from "@/components/molecules/ShareButtons";
import { RailDataDiscoveryCards, RailLinksCard, RailSearchCard } from "@/components/rail";
import { ContentNavigation } from '@/components/rail/ContentNavigation';
import { ArticleCard } from "@/components/surface";

import {
    composeAdRows,
    OperatorProfileCard,
    RailAdSlot,
    type AdRowPattern,
    RelatedAmazonBook,
} from "@/features/ads";
import { resolveContentVertical } from "@/features/ads/constants/affiliate-category";
import { resolveBlogBannerInput } from "@/features/ads/constants/blog-affiliate-policy";
import { adRowTargets, TagBadge, ArticleRenderer, ArticleTableOfContents, generateBlogMetadata, migrateLegacyDataSourceSection } from "@/features/blog";
import { blogR2Key } from "@/features/blog/r2-key";
import {
    listLatestArticles,
    findArticleBySlug,
    findArticleTitlesBySlugs,
    readPopularArticlesFromR2,
    getTagKeysForArticle,
    getRankingKeysForArticle,
    articleService,
    resolveArticleDataSources,
    resolveArticleSurveyTaxonomy,
} from "@/features/blog/server";
import { readContentRecommendations } from '@/features/content-navigation/server';
import { BlogProductCta, findKindleProductForBlog } from "@/features/products";
import { SurveyTaxonomyCard } from "@/features/survey";

import { getRequiredBaseUrl } from "@/lib/env";
import { BLOG_ARTICLE_INLINE, BLOG_END, BLOG_RAIL, BLOG_RAIL_MIDDLE, BLOG_RAIL_STICKY, BLOG_ROW_2, BLOG_ROW_3 } from "@/lib/google-adsense";
import { blogThumbnailUrl } from "@/lib/metadata/ogp-image";
import { buildPersonAsAuthor } from "@/lib/structured-data/person";
import { buildPublisherOrganization } from "@/lib/structured-data/scripts";


import { R2_PUBLIC_BASE_URL } from "@/config/site";

import type { Metadata } from "next";

// ブログ記事はランタイムで動的レンダリング（R2バインディングが必要なため）
// ISR: 24時間キャッシュ（初回リクエスト時にR2から取得→以降キャッシュ）

interface PageProps {
    params: Promise<{ slug: string }>;
}

const BLOG_RAIL_CATEGORIES = CATEGORIES.slice(0, 6).map((category) => ({
    categoryKey: category.categoryKey,
    categoryName: category.categoryName,
}));
const BLOG_RAIL_PREFECTURES = fetchPrefectures();


/**
 * ブログの本文の広告の段 (h2 の 2・4・6 番目の前) の AdSense のユニット。段ごとに 1 つ・本文の幅いっぱい (2026-11-12 オーナー決定)。
 * 位置とユニットを固定する (見出しが少ない記事で段が減っても、末尾の段に本文の段のユニットが回らないようにする)
 */
const BLOG_BODY_AD_ROW_SLOTS = [BLOG_ARTICLE_INLINE, BLOG_ROW_2, BLOG_ROW_3];
const BLOG_AD_ROW_PATTERN: AdRowPattern = ["adsense"];
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

    // snapshot に sources が焼かれていれば追加 R2 read なし。旧 snapshot だけ source.json から解決する
    const dataSources =
        article.sources ?? (await resolveArticleDataSources({ slug, content: article.content }));
    // 手書きの旧「データ出典」節は DataSourceList と重複するので、描画時にも一括移行と同じ変換
    // (引用だけなら除去 / 説明を含めば「データについて」へ改名) をかける。Kindle 書籍の章に使う記事は
    // 本文を変えられないので、この変換が恒久的に表示をそろえる。出典を解決できない記事は手書き節を残す。
    // 題と本文は、数字の直後の全角の単位 (「96.6％」) を表示時に半角へそろえる。記事に埋め込むランキングのカードや
    // 一覧の単位は半角で書くので、原稿のままだと同じページに ％ と % が並ぶ (原稿と R2 は書き換えない。UNIT-NOTATION-FORMAT-01)
    const renderedArticle = {
        ...article,
        title: normalizeUnitsInText(article.title),
        content: normalizeUnitsInText(
            dataSources.length > 0 ? migrateLegacyDataSourceSection(article.content).content : article.content
        ),
    };

    // 記事本文中の /blog/{slug} リンクからスラッグを抽出し、DB からタイトルを取得
    const blogLinkSlugs = [...article.content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)]
        .map((m) => m[1])
        .filter((s) => s !== slug);
    const uniqueSlugs = [...new Set(blogLinkSlugs)];

    // tagKeys / 本文リンクのタイトル / 出典調査は互いに独立 → 並列取得 (waterfall 解消)
    const [articleTagData, relatedArticleTitles, articleSurveys] =
        await Promise.all([
            getTagKeysForArticle(slug),
            findArticleTitlesBySlugs(uniqueSlugs),
            resolveArticleSurveyTaxonomy({
                slug,
                content: article.content,
                snapshotSurveyIds: article.surveyIds,
            }),
        ]);
    const tagKeys = articleTagData.map((t) => t.tagKey);
    // テキスト広告は本文 inline のみに置く。右レールの PR は画像バナーへ統一する。
    // 在庫が薄い vertical では空枠を作らない (md-content 側が index 不足を握りつぶす)。
    // 解決順は **記事明示policy → 出典調査 → タグ** (`resolveContentVertical`)。
    //   家計調査の記事 (ブログ imp の 17%) は食文化タグで economy に落ち金融広告が出ていた。
    //   all.json の surveyIds 焼き込みで家計調査 → furusato、気象統計 → 広告なし、のように決める。
    // A8 のバナー・テキスト広告は、出典調査だけで furusato になる地域の食卓・特産品以外の記事には出さない
    //   (ビール記事にふるさと納税ポータルが出ていた。2026-09-24)。
    const bannerInput = resolveBlogBannerInput(
        slug,
        { surveyIds: article.surveyIds, tagKeys },
        { title: article.title, subtitle: article.frontmatter.subtitle },
    );
    // 広告の段 (2026-11-03 オーナー決定): 本文の h2 の 2・4・6 番目の前と記事の末尾。
    // どの段も AdSense 1 つを本文の幅いっぱいに出し、PR は出さない (2026-11-12 オーナー決定。アフィリエイトは戦略を決め直すまで止める)。
    // 見出しの数で本文の段が減るので、差し込める段だけに割り当て、末尾の段は常に BLOG_END にする
    const bodyRowCount = adRowTargets(article.content, BLOG_BODY_AD_ROW_SLOTS.length).length;
    const adRows = composeAdRows(
        Array.from({ length: bodyRowCount + 1 }, () => BLOG_AD_ROW_PATTERN),
        [...BLOG_BODY_AD_ROW_SLOTS.slice(0, bodyRowCount), BLOG_END],
        [],
    );
    const bannerVertical = resolveContentVertical(bannerInput).vertical;
    // relatedArticles は tagKeys に依存するため、上段の並列取得後に解決する。
    const articleRankingKeys = await getRankingKeysForArticle(slug);
    // 関連記事は 5 件 (2026-11-12 オーナー決定。PC の右レールの下が空いていたため 3 件から増やした)
    const relatedArticles = await readContentRecommendations({sourceId: 'blog:' + slug, kinds: ['blog'], rankingKeys: articleRankingKeys, tagIds: contentTagIds(tagKeys), limit: 5});
    // よく読まれている記事 (GA4 の直近 28 日の閲覧数・週次。自分と関連記事に出した記事を除いて 5 件)
    const popularArticles = (await readPopularArticlesFromR2(slug, 10))
        .filter((article) => !relatedArticles.some((item) => item.id === `blog:${article.slug}`))
        .slice(0, 5);
    const dataNavigation = await readContentRecommendations({sourceId: 'blog:' + slug, kinds: ['ranking', 'municipality-ranking', 'geo', 'theme'], rankingKeys: articleRankingKeys, limit: 3});
    const railThemes = (await readContentRecommendations({sourceId: 'blog:' + slug, kinds: ['theme'], rankingKeys: articleRankingKeys, limit: 3}))
        .filter(theme => !dataNavigation.some(item => item.id === theme.id))
        .map(theme => ({themeKey: theme.key, title: theme.title}));
    const baseUrl = getRequiredBaseUrl();
    const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || R2_PUBLIC_BASE_URL;
    // E-E-A-T 強化（#76）: author を Person に変更、publisher に logo 追加。
    // frontmatter.author / reviewedBy で記事ごとの上書きも可能。
    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.frontmatter.description ?? "",
        image: `${R2_PUBLIC_URL}/${blogR2Key(slug, "ogp/ogp.png")}`,
        url: `${baseUrl}${hrefFor("blog", { slug })}`,
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

    // レール通常領域: 関連コンテンツ → AdSense (上段) → 探索導線 → 運営者 → 追従する AdSense の順。
    const rail = (
        // 右レールは広告インテントの対象外にする (ad-intent-scope.ts)。contents なので右レールの格子の並びは変わらない
        <div className="google-anno-skip contents">
            {/* 出し分けは ArticleShell の右レールと同じ shell コンテナ 988px 基準 (ビューポートの lg を使わない) */}
            <div className="hidden rail:block"><ContentNavigation title="この記事のデータを確かめる" items={dataNavigation} surface="blog_sidebar" /></div>

            <SurveyTaxonomyCard
                surveys={articleSurveys}
                title="この記事の出典調査"
                surface="blog_survey"
            />

            <ContentNavigation title="関連記事" items={relatedArticles} surface="blog_sidebar" />

            {/* 右レールの上段の AdSense (2026-11-12 オーナー決定: アフィリエイトを止め、PR のバナー (最大 2 枚) から替えた)。
                右レールが本文の横にあるとき (PC) だけ出る (RailAdSlot) */}
            <RailAdSlot slot={BLOG_RAIL} />

            {/* よく読まれている記事 (2026-11-12 オーナー決定。GA4 の閲覧数で週次に選ぶ。ブログ一覧と同じ見せ方) */}
            <RailLinksCard
                title="よく読まれている記事"
                items={popularArticles.map((article) => ({
                    id: article.slug,
                    label: article.title,
                    href: hrefFor("blog", { slug: article.slug }),
                    trackingLabel: `popular:${article.slug}`,
                    thumbnail: {
                        lightSrc: blogThumbnailUrl(article.slug, "light"),
                        darkSrc: blogThumbnailUrl(article.slug, "dark"),
                        alt: "",
                    },
                }))}
                layout="ranked"
                trackingSurface="blog_sidebar"
            />

            {/* 記事の主題が品目のとき楽天市場の商品を出す (公開 430 記事中 131 件が該当)。
                品目を検出できない記事では何も描画しない。 */}

            {/* 個別記事では本文後へ積まれるモバイルを長くしないため、追加探索カードは右レールだけに置く。 */}
            <div className="hidden rail:contents">
                <RailSearchCard
                    title="記事検索"
                    action="/search"
                    placeholder="キーワードで検索"
                    ariaLabel="ブログ記事を検索"
                    hiddenFields={{ type: "blog" }}
                />

                <RailLinksCard
                    title="この記事のタグ"
                    items={articleTagData.flatMap((tag) => {
                        const registered = resolveContentTag(tag.tagKey);
                        return registered ? [{id: registered.id, label: registered.label,
                            href: hrefFor("tag", { tagKey: registered.key }), trackingLabel: registered.id}] : [];
                    })}
                    moreLink={{
                        href: "/blog/tags",
                        label: "タグ一覧を見る",
                        trackingLabel: "tag:all",
                    }}
                    trackingSurface="blog_sidebar"
                />

                <RailDataDiscoveryCards
                    categories={BLOG_RAIL_CATEGORIES}
                    themes={railThemes}
                    prefectures={BLOG_RAIL_PREFECTURES}
                    trackingSurface="blog_sidebar"
                />
            </div>

            {/* 右レールの中段の AdSense (2026-11-12 オーナー決定。追従しない 300×250)。運営者のプロフィールを挟んで
                最後の追従する枠と隣り合わせにしない (広告の枠の台帳の noAdjacentSlots) */}
            <RailAdSlot slot={BLOG_RAIL_MIDDLE} />

            <OperatorProfileCard />

            {/* 右レールの最後: 300×600 をヘッダーの下に追従させる (2026-11-12 オーナー決定。右レールの中身が本文より短く、
                PC で下が約 5,000px 空いていた)。PC だけ。仕組みと Google の条件は RailAdSlot の sticky */}
            <RailAdSlot slot={BLOG_RAIL_STICKY} sticky />
        </div>
    );
    // レール末尾: ここまでが右レールの静的範囲 (check-ad-placement.cjs と広告配置の契約テストが範囲の終わりの目印に使う)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            <ArticleShell
                rail={rail}
                breadcrumb={
                    <Breadcrumb className="mb-4" data-nav-surface="breadcrumb">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink render={<Link href="/" />}>ホーム</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink render={<Link href="/blog" />}>ブログ</BreadcrumbLink>
                            </BreadcrumbItem>
                            {/* 現在の記事名はどの幅でも出し、長い題は 1 行で省略する (Breadcrumbs と同じクラス) */}
                            <BreadcrumbSeparator />
                            <BreadcrumbItem className={CURRENT_ITEM_CLASS}>
                                <BreadcrumbPage>{renderedArticle.title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                }
            >
                <PanelGrid>
                    <ArticleCard>
                            {/* 記事ヘッダー */}
                            <header className="google-anno-skip border-b border-border pb-4">
                                {/* 肩書きと PR 表記は別の行の muted テキストにする (区切りの「・」が狭い幅で行末に残らない) */}
                                <div className="mb-2 text-xs text-muted-foreground">
                                    <p>stats47 データジャーナル / 統計で読む地域ニュース</p>
                                    <p>PRを含む場合があります</p>
                                </div>
                                <h1 className="article-title mb-3 text-xl font-semibold text-foreground sm:text-2xl">{renderedArticle.title}</h1>
                                {article.frontmatter.subtitle && (
                                    <p className="mb-3 text-sm text-muted-foreground sm:text-base">{normalizeUnitsInText(article.frontmatter.subtitle)}</p>
                                )}
                                {articleTagData.length > 0 && (
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        {articleTagData.map((t) => (
                                            <TagBadge key={t.tagKey} tag={t.tagKey} tagKey={t.tagKey} />
                                        ))}
                                    </div>
                                )}
                                {/* 公開日とシェアは同じ行の左右に置く (390px でもシェアを次の行へ落とさない) */}
                                <div className="flex items-center justify-between gap-3">
                                    {article.publishedAt ? (
                                        <time dateTime={article.publishedAt} className="text-xs text-muted-foreground">
                                            公開日 {article.publishedAt.slice(0, 10)}
                                        </time>
                                    ) : (
                                        <span />
                                    )}
                                    <ShareButtons title={article.title} url={hrefFor("blog", { slug })} variant="simple" platforms={["X (Twitter)", "LINE"]} />
                                </div>
                            </header>

                            {/* 目次 (全幅共通でタイトルの後・本文の前に 1 か所だけ) */}
                            <ArticleTableOfContents content={renderedArticle.content} />

                            {/* 記事本文 */}
                            <ArticleRenderer
                                article={renderedArticle}
                                slug={slug}
                                relatedArticleTitles={relatedArticleTitles}
                                affiliateVertical={bannerVertical}
                                adRows={adRows}
                            />

                            {/* データ出典 (chart source.json から派生。本文に手書きしない) */}
                            <div className="google-anno-skip"><DataSourceList sources={dataSources} surface="blog_source" /></div>

                            {/* 右レールが出ない幅では、データの確認先を本文の後ろに置く (本文より先に出さない) */}
                            <div className="mt-6 rail:hidden"><ContentNavigation title="この記事のデータを確かめる" frame="inline" items={dataNavigation.slice(0, 2)} surface="blog_discovery_mobile" /></div>

                            {/* SNSシェアボタン */}
                            <div className="mt-8 pt-6 border-t flex justify-center">
                                <ShareButtons title={article.title} url={hrefFor("blog", { slug })} variant="prominent" />
                            </div>
                    </ArticleCard>

                    <BlogProductCta blogSlug={slug} />
                    {/* 自社 Kindle 本が無い記事だけ、バナーと同じ vertical に合う一般書籍 (Amazon) を出す */}
                    {!findKindleProductForBlog(slug) && <RelatedAmazonBook vertical={bannerVertical} />}

                </PanelGrid>
            </ArticleShell>
        </>
    );
}
