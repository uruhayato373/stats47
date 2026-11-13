import { Suspense, type ReactNode } from 'react';



import { METRICS_REGISTRY } from '@stats47/data-configs';
import { hrefFor } from "@stats47/data-configs/content/href";
import { scopeHrefsForPrefectureTheme } from '@stats47/data-configs/geo-scope';
import { MUNICIPALITY_THEME_FOR_PREFECTURE_THEME } from '@stats47/data-configs/geo-scope/scope-theme-map';
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import { getRankingTitle } from '@stats47/ranking';
import { getSurveyTaxonomyEntries, resolveThemeSurveyTaxonomy } from '@stats47/ranking/survey';

import { FaqSection } from '@/components/content/FaqSection';
import { PageShell, PanelGrid } from '@/components/layout';
import { THEME_HEROES } from '@/components/layout/page-heroes';
import {
  LinkRowFrame,
  linkRowItemClass,
} from '@/components/navigation/StatisticsScopeNav';
import { loadPageComponents } from '@/components/stat-charts/server';
import { RailCard, RailNavRow } from '@/components/surface';

import { AdRow, composeAdRows } from '@/features/ads';
import { loadThemeProducts, ThemeProductLinks } from '@/features/products/server';

import { THEME_END, THEME_ROW_2, THEMES_CONTENT } from '@/lib/google-adsense';
import { AD_FREE_THEME_KEYS } from '@/lib/google-adsense/ad-free-paths';

import { isAreaTheme } from '../config/area-theme-slugs';
import {
  NATIONAL_ONLY_SECTIONS,
  PREFECTURE_ONLY_SECTIONS,
  THEME_SECTION_REGISTRY,
} from '../config/theme-section-registry';
import { THEME_SWITCHER_THEMES } from '../config/theme-switcher-themes';
import { areaThemeDescription, getAreaThemeHighlights } from '../lib/area-theme-highlights';
import { loadInitialThemeData } from '../lib/initial-theme-data';
import { KAKEI_RANKING_DIRECTORY } from '../lib/kakei-ranking-directory.generated';
import { prefectureCityOptions } from '../lib/prefecture-city-options';
import {
  buildAreaThemeFaqItems,
  buildFaqStructuredData,
  buildThemeFaqItems,
  leadFactFromValues,
  themeLeadRankingKeys,
} from '../lib/theme-seo';
import {
  generateThemeBreadcrumbStructuredData,
  generateThemePageStructuredData,
} from '../utils';

import { ThemeAreaHeader } from './ThemeAreaHeader';
import { ThemeChapterLinks } from './ThemeChapterLinks';
import { ThemeCorrelatedMetrics } from './ThemeCorrelatedMetrics';
import { ThemeDashboardClient } from './ThemeDashboardClient';
import { ThemeEvidenceTopicsSection } from './ThemeEvidenceTopicsSection';
import { ThemeGeoInsightsSection } from './ThemeGeoInsightsSection';
import { ThemeHero } from './ThemeHero';
import { ThemePrefectureProvider } from './ThemePrefectureContext';
import { ThemeRegionNav } from './ThemeRegionNav';
import { ThemeRelatedArticles } from './ThemeRelatedArticles';


import type { ThemePageData } from '../lib/load-theme-data';
import type { ThemeConfig } from '../types';

interface Props {
  theme: ThemeConfig;
  data: ThemePageData;
  /** エリアページ経由時の都道府県コード（5桁）と名称 */
  areaContext?: { areaCode: string; areaName: string };
  /** 通常テーマ画面で URL / Cookie / 初回既定値から解決した初期都道府県 */
  initialPrefecture?: { areaCode: string; areaName: string } | null;
  /**
   * パンくず直下に差し込むページ固有のコントロール
   * （テーマ固有の補助ナビゲーションなど）。
   */
  toolbar?: ReactNode;
}

/**
 * テーマダッシュボードの共通レイアウト
 *
 * `PageShell` + Breadcrumb + ヘッダー + 本文上部の切替行 + ThemeDashboardClient。
 * chart_definitions から DB 管理チャートを取得してクライアントに渡す。
 *
 * テーマ間の移動はサイドバーの「テーマ」が持つので、ページ内に左レール (2 本目のナビ列) を
 * 作らない (2026-10-28 テンプレート寄せ)。テーマ切替・地域選択は本文上部の 1 行に置く。
 *
 * ★Shell を本コンポーネントが持つ理由: 本文上部の都道府県セレクタが
 * `ThemePrefectureProvider` の内側に無いと動かないため、Provider → PageShell の
 * 入れ子をここで固定する。呼び出し側の page.tsx は PageShell を重ねない。
 */
/** 家計調査の全品目の一覧を出すテーマ。値は読まず、ランキングへのリンクだけを置く */
const KAKEI_DIRECTORY_THEME_KEY = 'household-food-spending';

export async function ThemePageLayout({
  theme,
  data,
  areaContext,
  initialPrefecture,
  toolbar,
}: Props) {
  const pageCharts = await loadPageComponents('theme', theme.themeKey);
  // 県の値と順位は説明文 (meta description・構造化データ) にだけ使う。本文は下の指標カードの 1 か所で見せる
  // (2026-10-30。旧: 本文にも「主なデータ」の節を別に描き、同じ値が名前・丸め・順位なしで 2 回出ていた)
  const areaHighlights = areaContext
    ? getAreaThemeHighlights(data, areaContext.areaCode, theme.tabIndicators)
    : [];
  // 県のページは、構造化データの名前・URL・説明・パンくずをその県のものにする (説明は meta description と同じ文)
  const structuredArea = areaContext
    ? {
        ...areaContext,
        description: areaThemeDescription(areaContext.areaName, theme.description, areaHighlights),
      }
    : undefined;
  const breadcrumbData = generateThemeBreadcrumbStructuredData(theme, structuredArea);
  // 主な指標の順位の Q&A (2026-11-12 オーナー決定・theme-seo.ts)。画面に出す Q&A と構造化データを同じデータから作る
  // (Google は FAQ の構造化データに画面と同じ内容を求める)。全国のページは 1 位・最下位、県のページはその県の全国順位
  const leadData = themeLeadRankingKeys(theme.themeKey)
    .map((key) => data.indicatorDataMap[key])
    .filter((d): d is NonNullable<typeof d> => d != null);
  const faqItems = areaContext
    ? buildAreaThemeFaqItems(
        areaContext.areaName,
        leadData.flatMap((d) => {
          const finite = d.rankingValues.filter((v) => v.areaCode !== '00000' && typeof v.value === 'number' && Number.isFinite(v.value));
          const row = finite.find((v) => v.areaCode === areaContext.areaCode);
          if (!row || typeof row.value !== 'number' || row.rank == null) return [];
          return [{
            itemName: getRankingTitle(d.rankingItem),
            unit: d.rankingItem.unit ?? '',
            yearName: d.rankingItem.latestYear?.yearName ?? '',
            value: row.value,
            rank: row.rank,
            total: finite.length,
          }];
        }),
      )
    : buildThemeFaqItems(
        leadData.flatMap((d) => {
          const fact = leadFactFromValues(d.rankingItem, d.rankingValues);
          return fact ? [fact] : [];
        }),
      );
  const faqData = buildFaqStructuredData(faqItems);
  const pageData = generateThemePageStructuredData(theme, structuredArea);
  const catalog = THEME_CATALOGS[theme.themeKey];
  const productLinks = await loadThemeProducts(theme.themeKey);
  const sectionFooters = Object.fromEntries(Object.entries(productLinks).map(([key, entries]) =>
    [key, <ThemeProductLinks key={key} entries={entries} />]));
  const catalogTaxonomy = catalog
    ? resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY)
    : null;
  const catalogSurveyIds =
    catalogTaxonomy?.surveys.map((survey) => survey.id) ?? [];
  const chartSourceLinks = Object.fromEntries(
    (catalogTaxonomy?.charts ?? [])
      .filter((chart) => chart.surveys.length > 0)
      .map((chart) => [
        chart.componentKey,
        chart.surveys.map((survey) => ({
          label: survey.name,
          url: hrefFor('survey', { surveyKey: survey.id }),
        })),
      ])
  );
  const indicatorSurveyIds = Object.values(data.indicatorDataMap).flatMap(
    ({ rankingItem }) =>
      (rankingItem.originalSurveys ?? []).map((survey) => survey.id)
  );
  const themeSurveys = getSurveyTaxonomyEntries([
    ...catalogSurveyIds,
    ...indicatorSurveyIds,
  ]);
  const themeMetrics = (catalog?.metrics ?? []).map((metric) => ({
    rankingKey: metric.rankingKey,
    label: metric.shortLabel,
  }));
  const pageLinks = [
    ...(catalog?.sections?.length
      ? catalog.sections.map((section) => ({
          href: `#theme-section-${section.key}`,
          label: section.title,
        }))
      : [{ href: '#theme-indicators', label: '主要指標' }]),
    ...((catalog?.evidenceTopics?.length ?? 0) > 0
      ? [{ href: '#theme-evidence', label: '白書・統計の論点' }]
      : []),
  ];
  const embeddedSections = Object.fromEntries(
    (theme.embeddedSections ?? []).flatMap((key) => {
      // 全国の値の図の章は、県のページでは組み立てない (章ごと出さない)
      if (areaContext && NATIONAL_ONLY_SECTIONS.has(key)) return [];
      // 県を選んだときだけ描く章は、県を選べない全国のページ (県のページを持つテーマ) では組み立てない
      if (!areaContext && isAreaTheme(theme.themeKey) && PREFECTURE_ONLY_SECTIONS.has(key)) return [];
      const Section = THEME_SECTION_REGISTRY[key];
      return Section
        ? [[key, <Suspense key={key} fallback={null}><Section /></Suspense>]]
        : [];
    })
  );

  // 本文の広告の段 (2026-11-12 オーナー決定): アフィリエイトを止め、3 段とも AdSense 1 つを本文の幅いっぱい (上限 580px) に出す。
  // ユニットは段ごとにテーマ専用 (2 段目と最後は同日に作成。それまではハブ・一覧と共用で、テーマの分を測れなかった)。
  // 非商用データの節を埋め込むテーマは広告を出さない (ad-free-paths.ts。AdSense の script も止まる)
  const isAdFree = AD_FREE_THEME_KEYS.includes(theme.themeKey);
  const [chapterRow1, chapterRow2, endRow] = isAdFree
    ? [[], [], []]
    : composeAdRows([['adsense'], ['adsense'], ['adsense']], [THEMES_CONTENT, THEME_ROW_2, THEME_END], []);
  const providerPrefecture = areaContext ?? initialPrefecture;
  // 指標カードの時系列と章の図の結果を初回描画で渡す (表示直後の POST を出さない。GSC-CRAWL-WASTE-01)
  const initialThemeData = await loadInitialThemeData({
    metricKeys: Object.keys(data.indicatorDataMap),
    charts: pageCharts,
    prefectureCode: providerPrefecture?.areaCode ?? null,
  });

  return (
    <ThemePrefectureProvider
      initialAreaCode={providerPrefecture?.areaCode ?? null}
      initialAreaName={providerPrefecture?.areaName ?? null}
    >
      <PageShell>
        <PanelGrid className="text-foreground">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(pageData) }}
          />
          {faqData && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
            />
          )}
          {/* パンくずの各段と右端のアイコンから、地域・テーマを Sheet で選ぶ (2026-10-31 IA-REGION-THEME-01)。
          旧: パンくずとは別に、地域単位のリンク・テーマのボタン・県の Select を並べた帯を置いていた */}
          <div className="mb-4">
            <ThemeRegionNav
              themeKey={theme.themeKey}
              themes={THEME_SWITCHER_THEMES}
              areaContext={areaContext ? { areaCode: areaContext.areaCode } : undefined}
              hasAreaPages={isAreaTheme(theme.themeKey)}
              hasMunicipalityPages={isAreaTheme(theme.themeKey) && Object.hasOwn(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME, theme.themeKey)}
              scopeHrefs={scopeHrefsForPrefectureTheme(theme.themeKey)}
              prefectureCities={areaContext ? prefectureCityOptions(areaContext.areaCode) : undefined}
            />
          </div>

          {/* h1 は狭幅ナビより先に置き、画面を開いた時点でページの主語を示す。
          hero 画像を持つテーマ (THEME_HEROES) は画像付きの ThemeHero に差し替える。 */}
          {THEME_HEROES[theme.themeKey] ? (
            <ThemeHero
              themeTitle={theme.title}
              hero={THEME_HEROES[theme.themeKey]}
            />
          ) : (
            <ThemeAreaHeader themeTitle={theme.title} />
          )}

          {toolbar}

          {/* 地域単位・テーマ・地域を 1 行の操作群にまとめ、その下に章のリンク列を 1 行で置く。
          テーマは今のテーマ名のボタン 1 つで、押すと Sheet でテーマの一覧が開く (2026-10-29。旧: Select + テーマ一覧ボタン)。
          関連記事はページの最後に置く (同日。h1 の直下では主要データを押し下げていた)。
          areaContext がある場合は都道府県文脈を維持したまま切り替える。
          県ごとのページを持つテーマでは、県を選ぶとその県のページ (/areas/県/テーマ) へ移り、地域単位の切り替えは
          テーマのページと県のページの両方に置く (県×テーマの交点を 1 つの URL・同じ部品にする。2026-10-30) */}
          <div className="mb-4 flex flex-col gap-3">
            {/* 項目が 1 つの目次は役に立たず主要データを押し下げるだけなので出さない (2026-10-04 週次 UI 検査)。
            狭い幅でも 1 行に保ち、はみ出す分は横スクロールにする (右端のフェードで続きを示すリンク列) */}
            {pageLinks.length > 1 && (
              <LinkRowFrame label="このページの内容">
                <ThemeChapterLinks
                  links={pageLinks}
                  themeKey={theme.themeKey}
                  className={linkRowItemClass()}
                />
              </LinkRowFrame>
            )}
          </div>


          <ThemeDashboardClient
            themeConfig={theme}
            metricGroups={data.metricGroups}
            sections={catalog?.sections}
            embeddedSections={embeddedSections}
            sectionFooters={sectionFooters}
            indicatorDataMap={data.indicatorDataMap}
            pageCharts={pageCharts}
            chartSourceLinks={chartSourceLinks}
            chapterAdRows={[chapterRow1, chapterRow2]}
            initialThemeData={initialThemeData}
          />

          {(themeMetrics.length > 0 || themeSurveys.length > 0) && (
            <div className="mt-8">
              <RailCard title="全指標・出典調査" collapsible bodyClassName="p-0">
                <div className="grid gap-5 px-4 pb-3 sm:grid-cols-2">
                  {themeMetrics.length > 0 && (
                    <div>
                      <p className="pt-3 text-sm font-semibold text-muted-foreground">
                        全指標（{themeMetrics.length}）
                      </p>
                      <nav aria-label="このテーマの全指標">
                        {themeMetrics.map((metric) => (
                          <RailNavRow
                            key={metric.rankingKey}
                            href={hrefFor("ranking", { rankingKey: metric.rankingKey })}
                            chevron={false}
                          >
                            {metric.label}
                          </RailNavRow>
                        ))}
                      </nav>
                    </div>
                  )}
                  <div>
                    <p className="pt-3 text-sm font-semibold text-muted-foreground">
                      出典調査
                    </p>
                    <RailNavRow
                      href="/survey"
                      chevron={false}
                      className="font-medium"
                    >
                      調査一覧へ
                    </RailNavRow>
                    {themeSurveys.length > 0 && (
                      <nav aria-label="このテーマの出典調査">
                        {themeSurveys.map((survey) => (
                          <RailNavRow
                            key={survey.id}
                            href={hrefFor('survey', { surveyKey: survey.id })}
                            chevron={false}
                          >
                            {survey.name}
                          </RailNavRow>
                        ))}
                      </nav>
                    )}
                  </div>
                </div>
              </RailCard>
              {theme.themeKey === KAKEI_DIRECTORY_THEME_KEY &&
                KAKEI_RANKING_DIRECTORY.map((group) => (
                  <RailCard
                    key={group.title}
                    title={`${group.title}のランキング（${group.links.length}）`}
                    collapsible
                    bodyClassName="p-0"
                  >
                    <nav aria-label={`${group.title}のランキング`} className="grid gap-x-5 px-4 pb-3 sm:grid-cols-2">
                      {group.links.map((link) => (
                        <RailNavRow
                          key={link.rankingKey}
                          href={hrefFor("ranking", { rankingKey: link.rankingKey })}
                          chevron={false}
                        >
                          {link.label}
                        </RailNavRow>
                      ))}
                    </nav>
                  </RailCard>
                ))}
            </div>
          )}


          <Suspense fallback={null}>
            <ThemeGeoInsightsSection
              themeKey={theme.themeKey}
              areaCode={areaContext?.areaCode}
              areaName={areaContext?.areaName}
            />
          </Suspense>

          <Suspense fallback={null}>
            <ThemeEvidenceTopicsSection themeKey={theme.themeKey} />
          </Suspense>

          <Suspense fallback={null}>
            <ThemeCorrelatedMetrics themeKey={theme.themeKey} />
          </Suspense>

          {/* 主な指標の順位の Q&A。上の構造化データ (FAQPage) と同じ内容 */}
          {faqItems.length > 0 && (
            <div className="mt-8">
              <FaqSection
                title={`${theme.title}の順位についてのよくある質問`}
                subtitle={areaContext ? undefined : '都道府県の並びは、各指標のランキングのページで見られます。'}
                items={faqItems.map(({ q, a }) => ({ question: q, answer: a }))}
              />
            </div>
          )}

          {/* このテーマを読み解く記事はページの最後 (ダッシュボードを読み終えた位置) に置く (2026-10-29) */}
          {((theme.relatedArticleTagKeys?.length ?? 0) > 0 || theme.rankingKeys.length > 0) && (
            <div className="mt-8">
              <Suspense fallback={null}>
                <ThemeRelatedArticles
                  themeKey={theme.themeKey}
                  tagKeys={theme.relatedArticleTagKeys ?? []}
                  rankingKeys={theme.rankingKeys}
                />
              </Suspense>
            </div>
          )}

          {/* ページの最後の広告の段 (このテーマを読み解く記事の後) */}
          {endRow.length > 0 && (
            <AdRow cells={endRow} position="theme-row-end" trackingCategory={`theme-${theme.themeKey}`} wide />
          )}

        </PanelGrid>
      </PageShell>
    </ThemePrefectureProvider>
  );
}
