import { Suspense, type ReactNode } from 'react';


import { buttonVariants } from '@stats47/components';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@stats47/components/atoms/ui/breadcrumb';
import { METRICS_REGISTRY } from '@stats47/data-configs';
import { hrefFor } from "@stats47/data-configs/content/href";
import { scopeHrefsForPrefectureTheme } from '@stats47/data-configs/geo-scope';
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { getSurveyTaxonomyEntries, resolveThemeSurveyTaxonomy } from '@stats47/ranking/survey';

import Link from '@/components/atoms/SiteLink';
import { PageShell } from '@/components/layout';
import { THEME_HEROES } from '@/components/layout/page-heroes';
import { StatisticsScopeNav } from '@/components/navigation';
import { RailStack } from '@/components/rail';
import { loadPageComponents } from '@/components/stat-charts/server';
import { prefetchThemeKpiData } from '@/components/stat-charts/services/prefetch-theme-kpi';
import { RailCard, RailNavRow } from '@/components/surface';

import {
  InContentAdSlot,
  isLandscapeBanner,
  NativeAffiliateRow,
} from '@/features/ads';
import { THEME_AFFILIATE_MAP } from '@/features/ads/constants/affiliate-category';
import {
  resolveAffiliateBanners,
  resolveAffiliateBannersByVertical,
} from '@/features/ads/server';

import { HUB_INCONTENT, THEMES_CONTENT } from '@/lib/google-adsense';

import { THEME_SECTION_REGISTRY } from '../config/theme-section-registry';
import { THEME_SWITCHER_THEMES } from '../config/theme-switcher-themes';
import { getAreaThemeHighlights } from '../lib/area-theme-highlights';
import {
  generateThemeBreadcrumbStructuredData,
  generateThemePageStructuredData,
} from '../utils';

import { PrefectureSelect } from './PrefectureSelect';
import { ThemeAreaHeader } from './ThemeAreaHeader';
import { ThemeChapterLinks } from './ThemeChapterLinks';
import { ThemeCorrelatedMetrics } from './ThemeCorrelatedMetrics';
import { ThemeDashboardClient } from './ThemeDashboardClient';
import { ThemeEvidenceTopicsSection } from './ThemeEvidenceTopicsSection';
import { ThemeGeoInsightsSection } from './ThemeGeoInsightsSection';
import { ThemeHero } from './ThemeHero';
import { ThemePrefectureProvider } from './ThemePrefectureContext';
import { ThemeRelatedArticles } from './ThemeRelatedArticles';
import { ThemeSwitcher } from './ThemeSwitcher';

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
export async function ThemePageLayout({
  theme,
  data,
  areaContext,
  initialPrefecture,
  toolbar,
}: Props) {
  const pageCharts = await loadPageComponents('theme', theme.themeKey);
  const kpiDataByArea = await prefetchThemeKpiData(pageCharts);
  const breadcrumbData = generateThemeBreadcrumbStructuredData(theme);
  const pageData = generateThemePageStructuredData(theme);
  const catalog = THEME_CATALOGS[theme.themeKey];
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
      const Section = THEME_SECTION_REGISTRY[key];
      return Section
        ? [[key, <Suspense key={key} fallback={null}><Section /></Suspense>]]
        : [];
    })
  );

  // D Phase 3: ネイティブアフィリエイト枠 (テーマの関連サービス)
  // relatedArticleTagKeys で解決 → 空なら theme→vertical 写像 (THEME_AFFILIATE_MAP) でフォールバック。
  // これにより relatedArticleTagKeys 未設定のテーマでも意図一致広告が出る (在庫機会損失の解消)。
  // ★ 2026-08-06: 縦長 (スカイスクレイパー) は本文枠に出さない (isLandscapeBanner で除外。
  //   受け皿は sidebar-sticky スロット)。除外後も3件が埋まる余裕を持たせるためlimitは8を維持する。
  let nativeBanners =
    theme.relatedArticleTagKeys && theme.relatedArticleTagKeys.length > 0
      ? await resolveAffiliateBanners(theme.relatedArticleTagKeys, 8).catch(
          () => []
        )
      : [];
  if (nativeBanners.length === 0) {
    const vertical = THEME_AFFILIATE_MAP[theme.themeKey];
    if (vertical) {
      nativeBanners = await resolveAffiliateBannersByVertical(
        vertical,
        8
      ).catch(() => []);
    }
  }
  nativeBanners = nativeBanners.filter(isLandscapeBanner);
  const providerPrefecture = areaContext ?? initialPrefecture;
  const areaHighlights = areaContext
    ? getAreaThemeHighlights(data, areaContext.areaCode)
    : [];

  return (
    <ThemePrefectureProvider
      initialAreaCode={providerPrefecture?.areaCode ?? null}
      initialAreaName={providerPrefecture?.areaName ?? null}
    >
      <PageShell>
        <div className="text-foreground">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(pageData) }}
          />
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>ホーム</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {areaContext ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/areas" />}>都道府県一覧</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href={hrefFor('area', { areaCode: areaContext.areaCode })} />}>
                        {areaContext.areaName}
                      </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{theme.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{theme.title}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>

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

          {!areaContext && (
            <StatisticsScopeNav
              current="prefectures"
              hrefs={scopeHrefsForPrefectureTheme(theme.themeKey)}
            />
          )}

          {toolbar}

          {/* テーマ切替と地域選択は同じ高さ・同じ基準線の 1 行に置き、テーマ一覧への出口は右端のボタンにする。
          areaContext がある場合は都道府県文脈を維持したまま切り替える。 */}
          <div
            role="group"
            aria-label="テーマと地域"
            className="mb-4 flex flex-wrap items-end gap-3"
          >
            <div className="w-full min-w-0 sm:w-64">
              <ThemeSwitcher
                themes={THEME_SWITCHER_THEMES}
                currentThemeKey={theme.themeKey}
                areaContext={
                  areaContext ? { areaCode: areaContext.areaCode } : undefined
                }
                compact
              />
            </div>
            <div className="w-full min-w-0 sm:w-48">
              <span className="block text-xs font-medium text-muted-foreground">
                地域
              </span>
              <PrefectureSelect className="mt-1 w-full" />
            </div>
            <Link
              href="/themes"
              data-slot="button"
              className={buttonVariants({
                variant: 'outline',
                className: 'sm:ml-auto',
              })}
            >
              テーマ一覧
            </Link>
          </div>

          <RailStack className="mb-4">
            {/* 項目が 1 つの目次は役に立たず主要データを押し下げるだけなので出さない (2026-10-04 週次 UI 検査) */}
            {pageLinks.length > 1 && (
              <RailCard title="ページ内" bodyClassName="px-4 pb-3 pt-0">
                <nav
                  aria-label="このページの内容"
                  className="flex flex-wrap items-center gap-x-5 gap-y-1"
                >
                  <ThemeChapterLinks
                    links={pageLinks}
                    themeKey={theme.themeKey}
                    className="py-1.5 text-sm font-medium text-foreground hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
                  />
                </nav>
              </RailCard>
            )}

            {(themeMetrics.length > 0 || themeSurveys.length > 0) && (
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
                            className="px-0"
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
                      className="px-0 font-medium"
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
                            className="px-0"
                          >
                            {survey.name}
                          </RailNavRow>
                        ))}
                      </nav>
                    )}
                  </div>
                </div>
              </RailCard>
            )}
          </RailStack>

          {/* エリアページ経由時の視点バナー */}
          {areaContext && (
            // 狭い幅では文と導線を縦に積む (横並びだと 1〜2 文字ずつ折り返す。2026-10-04 週次 UI 検査)
            <div className="mb-4 flex flex-col gap-1 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm sm:flex-row sm:items-center sm:gap-2">
              <span className="font-medium text-primary">
                {areaContext.areaName}の視点
              </span>
              <span className="text-muted-foreground">
                — 47都道府県チャートで{areaContext.areaName}
                をハイライト表示しています
              </span>
              <Link
                href={hrefFor('area', { areaCode: areaContext.areaCode })}
                className="text-sm text-primary hover:underline sm:ml-auto sm:shrink-0 sm:text-xs"
              >
                {areaContext.areaName}プロフィールへ →
              </Link>
            </div>
          )}

          {areaContext && areaHighlights.length > 0 && (
            <section
              aria-labelledby="area-theme-highlights"
              className="mb-6 border-y border-border bg-muted/30 px-4 py-4"
            >
              <h2
                id="area-theme-highlights"
                className="text-base font-semibold"
              >
                {areaContext.areaName}の主なデータ
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                このテーマに関連する最新公表値です。
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
                {areaHighlights.map((highlight) => (
                  <div key={highlight.key}>
                    <dt className="text-xs text-muted-foreground">
                      {highlight.title}
                    </dt>
                    <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums">
                      {highlight.value.toLocaleString('ja-JP')} {formatUnitForDisplay(highlight.unit)}
                    </dd>
                    <dd className="text-xs text-muted-foreground">
                      {highlight.yearName}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {((theme.relatedArticleTagKeys?.length ?? 0) > 0 || theme.rankingKeys.length > 0) && (
            <Suspense fallback={null}>
              <ThemeRelatedArticles
                themeKey={theme.themeKey}
                tagKeys={theme.relatedArticleTagKeys ?? []}
                rankingKeys={theme.rankingKeys}
              />
            </Suspense>
          )}


          <ThemeDashboardClient
            themeConfig={theme}
            metricGroups={data.metricGroups}
            sections={catalog?.sections}
            embeddedSections={embeddedSections}
            indicatorDataMap={data.indicatorDataMap}
            topology={data.topology}
            pageCharts={pageCharts}
            chartSourceLinks={chartSourceLinks}
            kpiDataByArea={kpiDataByArea}
            highlightAreaCode={areaContext?.areaCode}
          />

          {/* 記事内広告（ダッシュボード直後・ページ 1 枠まで。slotId 未発行の間は非表示） */}
          <InContentAdSlot slot={HUB_INCONTENT} />

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

          {/*
        広告: ダッシュボード読了後・関連記事の前。生 AdSenseAd から slot 部品へ寄せ、
        全テーマページでラベル表記と未発行時の非描画を揃える (2026-07-29)。
      */}
          <InContentAdSlot slot={THEMES_CONTENT} />

          {/* ネイティブアフィリエイト枠。読了位置では広告を二段に分けず、
          desktop 3件 / mobile 最優先1件の単一ブロックにする。 */}
          {nativeBanners.length > 0 && (
            <div className="mt-8">
              <NativeAffiliateRow
                banners={nativeBanners}
                position="theme-native"
                trackingCategory={`theme-${theme.themeKey}`}
                variant="three-up"
              />
            </div>
          )}

        </div>
      </PageShell>
    </ThemePrefectureProvider>
  );
}
