/**
 * 調査名ハブページ（Server Component）
 *
 * `/survey/{surveyKey}` でアクセスされ、
 * 調査概要 + 関連ランキング一覧を表示。
 */

import { notFound, permanentRedirect } from 'next/navigation';

import { PanelGrid } from '@stats47/components';
import { buttonVariants } from '@stats47/components/atoms/ui/button';
import { getMetricConfig, listCategories, METRICS_REGISTRY } from '@stats47/data-configs';
import { canonicalSurveyHubKey, hrefFor, surveyHubSourceIds } from "@stats47/data-configs/content/href";
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import {
  CATEGORY_TOPIC_CATALOGS,
  OTHER_TOPIC_KEY,
  OTHER_TOPIC_LABEL,
  resolveTopicKey,
  toTopicResolutionInput,
} from '@stats47/data-configs/topics';
import { metricDisplayName } from '@stats47/ranking';
import {
  readRankingItemsBySurveyFromR2,
  readRankingValuesFromR2,
  readSurveyByIdFromR2,
} from '@stats47/ranking/server';
import { resolveThemeSurveyTaxonomy } from '@stats47/ranking/survey';
import { isOk } from '@stats47/types';
import {
  ArrowRight,
  ChartLine,
  ExternalLink,
  LayoutGrid,
} from 'lucide-react';

import { SourcesSheet } from '@/components/charts/SourcesSheet';
import { ArticleShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { ArticleTeaserCard, CardGrid, RailCard, RailNavRow, SurfaceLinkCard } from '@/components/surface';

import {
  AdRow,
  composeAdRows,
} from '@/features/ads';
import { listArticleSummariesBySurveyId } from '@/features/blog/server';
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  type CategoryRankingListItem,
} from '@/features/ranking';
import { buildFeaturedRankingCardModel, rankingTop1Label } from '@/features/ranking/server';
import {
  excludeFeaturedQuestions,
  getSurveyEditorialContent,
  selectSurveyRepresentativeRankings,
  surveyLatestYear,
  SurveyOutboundLinkArea,
} from '@/features/survey';
import { themeHref } from "@/features/theme-dashboard/config/theme-href";
import {
  THEME_NAV_GROUP_ICONS,
  themeNavGroupOf,
} from "@/features/theme-dashboard/config/theme-navigation";

import { CONTENT_FOOTER, HUB_INCONTENT, HUB_ROW_2 } from '@/lib/google-adsense';
import { getIcon } from '@/lib/icons';
import { generateOGMetadata } from '@/lib/metadata/og-generator';
import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

/** 24時間 ISR */
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ surveyKey: string }>;
}

function parseLatestYear(latestYear: unknown): string {
  try {
    const parsed =
      typeof latestYear === 'string' ? JSON.parse(latestYear) : latestYear;
    if (parsed?.yearCode) return parsed.yearCode;
  } catch {
    /* fallback */
  }
  return '2024';
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { surveyKey } = await params;

  try {
    const result = await readSurveyByIdFromR2(surveyKey);
    const survey = isOk(result) ? result.data : null;

    if (!survey) {
      return { title: 'ページが見つかりません' };
    }

    const title = `${survey.name}のランキング一覧`;
    const editorial = getSurveyEditorialContent(surveyKey);
    const description =
      editorial?.summary ??
      `${survey.organization}「${survey.name}」に基づく都道府県別ランキング一覧。47都道府県を統計データで比較できます。`;

    return {
      title,
      description,
      alternates: {
        canonical: hrefFor('survey', { surveyKey }),
      },
      ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
    };
  } catch {
    return { title: '調査別ランキング一覧' };
  }
}

export default async function SurveyPage({ params }: PageProps) {
  const { surveyKey } = await params;

  const surveyResult = await readSurveyByIdFromR2(surveyKey);
  const survey = isOk(surveyResult) ? surveyResult.data : null;

  if (!survey) {
    notFound();
  }

  // 同じ調査の別 ID は middleware が 301 で寄せるが、直接描画されたときも同じハブへ送る
  if (canonicalSurveyHubKey(surveyKey) !== surveyKey) {
    permanentRedirect(hrefFor('survey', { surveyKey }));
  }
  // ハブに集める調査 ID (家計調査は品目別と、社会・人口統計体系経由の収入・支出割合の 2 つ。2026-11-02)
  const sourceIds = surveyHubSourceIds(surveyKey);
  const rankingResults = await Promise.all(sourceIds.map((id) => readRankingItemsBySurveyFromR2(id)));
  const seenRankingKeys = new Set<string>();
  const rankingItems = rankingResults
    .flatMap((result) => (isOk(result) ? result.data : []))
    // 終わった系列 (指標の定義の seriesEnd) はハブの一覧に出さない。ランキングページは残す (2026-11-02)
    .filter((item) => !METRICS_REGISTRY[item.rankingKey]?.seriesEnd)
    .filter((item) => {
      if (seenRankingKeys.has(item.rankingKey)) return false;
      seenRankingKeys.add(item.rankingKey);
      return true;
    });
  if (rankingItems.length === 0) {
    notFound();
  }

  const categoryCounts = new Map<string, number>();
  for (const item of rankingItems) {
    if (!item.categoryKey) continue;
    categoryCounts.set(
      item.categoryKey,
      (categoryCounts.get(item.categoryKey) ?? 0) + 1
    );
  }
  const relatedCategories = listCategories().flatMap((category) => {
    const count = categoryCounts.get(category.categoryKey) ?? 0;
    return count > 0
      ? [
          {
            categoryKey: category.categoryKey,
            label: category.categoryName,
            icon: category.icon,
            count,
          },
        ]
      : [];
  });
  const relatedThemes = Object.values(THEME_CATALOGS)
    .filter((catalog) =>
      resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY).surveys.some(
        (entry) => sourceIds.includes(entry.id)
      )
    )
    .map((catalog) => ({ key: catalog.key, title: catalog.title, metricCount: catalog.metrics.length }));
  // 日本全体のテーマ (/japan/<テーマ>) は 2026-11-12 に全国のテーマへまとめた (家計の品目は「食卓と家計の支出」の章)。カードはテーマだけ
  const themeCards = [
    ...relatedThemes.map((theme) => ({
      key: theme.key,
      title: theme.title,
      href: themeHref(theme.key),
      groupKey: theme.key,
      meta: `${theme.metricCount} 指標`,
    })),
  ];
  const relatedArticles = await listArticleSummariesBySurveyId(
    sourceIds,
    6,
    getSurveyEditorialContent(surveyKey)?.relatedArticleSlugs ?? []
  ).catch(() => []);
  // 広告の段: 地図付きのランキングのカードの後・全ランキングの前・ページの最後に、AdSense 1 つを本文の幅いっぱい (上限 580px) に出す
  // (位置は 2026-11-13 オーナー決定で並べ替えた)
  // (2026-11-12 オーナー決定でアフィリエイトを止め、PR を外した)。2 段目はハブ用の HUB_ROW_2 (THEMES_CONTENT はテーマの段に使う)
  const [surveyRow1, surveyRow2, surveyRow3] = composeAdRows(
    [['adsense'], ['adsense'], ['adsense']],
    [HUB_INCONTENT, HUB_ROW_2, CONTENT_FOOTER],
    [],
  );
  const editorial = getSurveyEditorialContent(surveyKey);
  const isKakei = surveyKey === 'kakei-chousa';
  const economyTopics = CATEGORY_TOPIC_CATALOGS.economy;
  const topicLabels = new Map(
    economyTopics?.topics.map((topic) => [topic.key, topic.label]) ?? []
  );
  topicLabels.set(OTHER_TOPIC_KEY, OTHER_TOPIC_LABEL);

  // 見出しの最新年。毎年でない調査は編集情報の実施周期から出す (国勢調査は 5 年ごと)。指標の最新年の最大を出すと、
  // 人口推計も原典に持つ総人口の年が国勢調査の最新回に読める (2026-09-25 の点検。SURVEY-PAGES-01)
  const latestYear = surveyLatestYear(rankingItems, editorial?.surveyCycle);

  const allItems: CategoryRankingListItem[] = rankingItems.map((item) => {
    const latestYear = parseLatestYear(item.latestYear);
    const config = isKakei ? METRICS_REGISTRY[item.rankingKey] : undefined;
    const topicKey = config && economyTopics
      ? resolveTopicKey(toTopicResolutionInput(config), economyTopics)
      : OTHER_TOPIC_KEY;
    return {
      rankingKey: item.rankingKey,
      areaType: 'prefecture',
      // 名前の組み立ては共通関数に寄せる。補足が題を含む家計調査の指標で「納豆消費支出額（…年間納豆消費支出額）」と
      // 同じ語が 2 回並んでいた (2026-11-02)
      title: metricDisplayName(item),
      latestYear,
      unit: item.unit,
      top1: rankingTop1Label(item),
      ...(isKakei ? { topicLabel: topicLabels.get(topicKey) ?? OTHER_TOPIC_LABEL } : {}),
    };
  });
  const availableTopicLabels = new Set(
    allItems.map((item) => item.topicLabel ?? OTHER_TOPIC_LABEL)
  );
  const topicOptions = isKakei
    ? [...topicLabels.values()]
        .filter((label) => availableTopicLabels.has(label))
        .map((label) => ({ value: label, label }))
    : undefined;

  // 編集設定の「読者の問い」が指すランキングを最優先にし、残りはサイト共通の代表集合と
  // カテゴリ分散で選ぶ。最大12候補まで値を確認し、欠測があっても 3 列の格子を埋める枚数 (最大 9 件) を残す。
  const questionByKey = new Map(
    editorial?.readerQuestions.map((item) => [item.rankingKey, item.question]) ?? []
  );
  const featuredRaw = selectSurveyRepresentativeRankings(
    rankingItems,
    12,
    editorial?.readerQuestions.map((item) => item.rankingKey) ?? []
  );
  // home/category と同じカードモデルを、1 回の全47件 read から導出する。
  // (旧: 独自の縦型カード + baseThumbnailUrl の画像サムネイル)。
  const featuredValues = await Promise.all(
    featuredRaw.map((item) =>
      readRankingValuesFromR2(
        item.rankingKey,
        'prefecture',
        parseLatestYear(item.latestYear)
      )
    )
  );
  // 読者の問いは地図付きのカードで答える。カードの格子は 3 列なので、問いの数を 3 の倍数に切り上げる (最大 3 段)
  const readerQuestionCount = new Set(
    editorial?.readerQuestions
      .map((item) => item.rankingKey)
      .filter((key) => rankingItems.some((item) => item.rankingKey === key)) ?? []
  ).size;
  const featuredLimit = Math.min(9, Math.max(3, Math.ceil(readerQuestionCount / 3) * 3));
  const featuredItems = featuredRaw
    .flatMap((item, idx) => {
      const latestYear = parseLatestYear(item.latestYear);
      const valuesResult = featuredValues[idx];
      if (!isOk(valuesResult) || valuesResult.data.length === 0) return [];

      const title = metricDisplayName(item);
      const model = buildFeaturedRankingCardModel({
        rankingKey: item.rankingKey,
        title,
        values: valuesResult.data,
        hook: questionByKey.get(item.rankingKey),
      });
      if (!model) return [];

      return [
        {
          rankingKey: item.rankingKey,
          title,
          latestYear,
          unit: item.unit,
          valueDisplay: getMetricConfig(item.rankingKey)?.display,
          model,
        },
      ];
    })
    .slice(0, featuredLimit);

  const areaLabel = editorial?.areaLabel ?? '47都道府県';
  const rankingKeys = new Set(rankingItems.map((item) => item.rankingKey));
  const readerQuestions = excludeFeaturedQuestions(
    editorial?.readerQuestions.filter((item) =>
      rankingKeys.has(item.rankingKey)
    ) ?? [],
    featuredItems.map((item) => item.rankingKey)
  );
  return (
    <ArticleShell
      breadcrumb={
        <Breadcrumbs
          items={[
            { label: 'ホーム', href: '/' },
            { label: '調査', href: '/survey' },
            { label: survey.name },
          ]}
        />
      }
    >
      <PageHeader
        eyebrow="政府統計"
        title={survey.name}
        description={
          <>
            {/* 調査の規模と対象は数値タイルにせず 1 行にまとめ、最初の画面を問いと答えに使う (2026-11-03) */}
            <span className="block">
              <span className="font-medium text-foreground">{survey.organization}</span>
              {` ・ ランキング ${rankingItems.length.toLocaleString('ja-JP')} 件`}
              {latestYear && ` ・ 最新 ${latestYear} 年`}
              {` ・ ${areaLabel}`}
            </span>
            {survey.description && (
              <span className="mt-1 block">{survey.description}</span>
            )}
          </>
        }
        actions={
          <>
            {/* 読むときの注意・分かること・出典は、テーマのページと同じ共通のシートで開く (2026-11-03)。
                先頭に置き、ページの最初から誤読の注意 (県庁所在市の値など) に届くようにする */}
            {editorial && (
              <SourcesSheet
                id="survey-sources"
                groups={[
                  {
                    title: '数字を読むときの注意',
                    notes: editorial.caveats,
                    sources: [{ label: `${survey.organization}「${survey.name}」`, url: survey.url }],
                    rankings: [],
                  },
                  { title: 'この調査で分かること', notes: editorial.whatYouCanLearn, sources: [], rankings: [] },
                ]}
              />
            )}
            {survey.url && (
              <a
                href={survey.url}
                target="_blank"
                rel="noopener noreferrer"
                data-slot="button"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                公式サイト
                <ExternalLink data-icon="inline-end" aria-hidden />
              </a>
            )}
          </>
        }
      />

      {/* 読者の問いに地図付きのカードで答えるのを最初に置く。目次や分類の一覧を先に出さない (2026-11-03) */}
      {featuredItems.length > 0 && (
        // カードの格子を含むセルは余白を持たないので、見出しと格子を別のセルにした格子の節にする
        <PanelGrid as="section" id="representative-rankings" className="scroll-mt-24">
          <SectionHeader title="ランキング" hideRule />
          <SurveyOutboundLinkArea surface="survey_ranking">
            {/* 記事と同じカードの格子に並べ、列をそろえる (2026-11-03) */}
            <CardGrid>
              {featuredItems.map((item) => (
                <FeaturedRankingCard
                  key={item.rankingKey}
                  rankingKey={item.rankingKey}
                  year={item.latestYear}
                  unit={item.unit}
                  valueDisplay={item.valueDisplay}
                  model={item.model}
                />
              ))}
            </CardGrid>
          </SurveyOutboundLinkArea>
        </PanelGrid>
      )}

      {readerQuestions.length > 0 && (
        <section id="more-questions" className="mb-4 scroll-mt-24">
          <SectionHeader title="ほかのランキング" />
          <SurveyOutboundLinkArea surface="survey_ranking">
            <div className="grid gap-3 sm:grid-cols-2">
              {readerQuestions.map((item) => (
                <SurfaceLinkCard
                  key={item.rankingKey}
                  href={hrefFor("ranking", { rankingKey: item.rankingKey })}
                  className="text-sm font-medium leading-6 text-foreground hover:bg-accent/50"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0">{item.question}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </span>
                </SurfaceLinkCard>
              ))}
            </div>
          </SurveyOutboundLinkArea>
        </section>
      )}

      {/* 1 段目: 地図付きのランキングのカードの後 (ブログ記事・テーマの前)。2026-11-13 オーナー決定で、最初の約 4,400px (スマホ)
          に広告が無く最後の 2 段が約 600px で並んでいた配置を、上から下まで約 2,400px おきに並べ替えた。カードが無い調査では
          最初の画面に入るので出さず、後ろにブログ記事かテーマがあるときだけ出す (次の 2 段目と隣り合わせにしない) */}
      {featuredItems.length > 0 && (relatedArticles.length > 0 || themeCards.length > 0) && surveyRow1.length > 0 && (
        <AdRow cells={surveyRow1} position="survey-row-1" trackingCategory={`survey-${surveyKey}`} wide />
      )}

      {relatedArticles.length > 0 && (
        // 記事カードの格子を含むセルは余白を持たないので、見出しと格子を別のセルにした格子の節にする
        <PanelGrid as="section" id="related-articles" className="scroll-mt-24">
          <SectionHeader title="ブログ記事" hideRule />
          <SurveyOutboundLinkArea surface="survey_blog">
            <CardGrid>
              {relatedArticles.map((article) => (
                <ArticleTeaserCard
                  key={article.slug}
                  href={hrefFor('blog', { slug: article.slug })}
                  title={article.title}
                  thumbnail={{
                    lightSrc: blogThumbnailUrl(article.slug, 'light'),
                    darkSrc: blogThumbnailUrl(article.slug, 'dark'),
                  }}
                />
              ))}
            </CardGrid>
          </SurveyOutboundLinkArea>
        </PanelGrid>
      )}

      {themeCards.length > 0 && (
        <section id="related-themes" className="mb-4 scroll-mt-24">
          <SectionHeader title="テーマ" />
          <SurveyOutboundLinkArea surface="survey_theme">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {themeCards.map((theme) => {
                const group = theme.groupKey ? themeNavGroupOf(theme.groupKey) : undefined;
                const Icon = group ? THEME_NAV_GROUP_ICONS[group.id] : theme.groupKey ? LayoutGrid : ChartLine;
                return (
                  <SurfaceLinkCard
                    key={theme.key}
                    href={theme.href}
                    className="text-sm text-foreground hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{theme.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {group ? `${group.label}・` : ''}
                          {theme.meta}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </span>
                  </SurfaceLinkCard>
                );
              })}
            </div>
          </SurveyOutboundLinkArea>
        </section>
      )}

      {/* 2 段目: 全ランキングの表の前。表は必ず描かれるので、ページの最後の段と隣り合わない (2026-07-29 是正の考え方) */}
      {surveyRow2.length > 0 && (
        <AdRow cells={surveyRow2} position="survey-row-2" trackingCategory={`survey-${surveyKey}`} wide />
      )}

      <section id="all-rankings" className="mb-4 scroll-mt-24">
        <SectionHeader
          title={`全${rankingItems.length}件のランキング`}
        />
        {isKakei && (
          <p className="mb-3 text-sm leading-6 text-muted-foreground">
            品目名または分類から探せます。各ランキングの年・単位と、対象都市を確認して比較してください。
          </p>
        )}
        <CategoryRankingTable items={allItems} topicOptions={topicOptions} trackingSurface="survey_ranking" />
        {/* 表はページ送りなので、サーバーの HTML に出るリンクは先頭 20 件だけになる。全件のリンクを畳んだ一覧で
            出し、検索エンジンと JavaScript 無しの閲覧でも全ランキングへ辿れるようにする (GSC-INTERNAL-DISCOVERY-01) */}
        <RailCard title={`全 ${allItems.length} 件を名前の一覧で見る`} collapsible bodyClassName="p-0">
          <nav aria-label="すべてのランキング (名前の一覧)" className="grid gap-x-5 px-4 pb-3 sm:grid-cols-2">
            {allItems.map((item) => (
              <RailNavRow key={item.rankingKey} href={hrefFor('ranking', { rankingKey: item.rankingKey })} chevron={false}>
                {item.title}
              </RailNavRow>
            ))}
          </nav>
        </RailCard>
      </section>

      {relatedCategories.length > 0 && (
        <section id="related-categories" className="mb-4 scroll-mt-24">
          <SectionHeader title="分類から探す" />
          {/* 件数はこの調査のランキング数で、分類全体の件数ではない */}
          <SurveyOutboundLinkArea surface="survey_category">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCategories.map((category) => {
              const Icon = getIcon(category.icon);
              return (
                <SurfaceLinkCard
                  key={category.categoryKey}
                  href={hrefFor('category', { categoryKey: category.categoryKey })}
                  className="text-sm text-foreground hover:bg-accent/50"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 font-medium">{category.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{category.count} 件</span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </span>
                </SurfaceLinkCard>
              );
            })}
          </div>
          </SurveyOutboundLinkArea>
        </section>
      )}

      {/* 調査の要約はページに残す。シートの中身は押すまで読み込まないので、ページの説明文がゼロにならないようにし、
          PR の列とページ末の広告の間も空ける (2026-11-03) */}
      {editorial && (
        <section id="survey-overview" className="mb-4 scroll-mt-24">
          <SectionHeader title="この調査について" />
          <p className="text-sm leading-6 text-foreground">{editorial.summary}</p>
        </section>
      )}

      {/* 3 段目: ページの最後。2 段目との間には全ランキングの表が必ず入る */}
      {surveyRow3.length > 0 && (
        <AdRow cells={surveyRow3} position="survey-row-3" trackingCategory={`survey-${surveyKey}`} wide />
      )}
    </ArticleShell>
  );
}
