import { Suspense, type ReactNode } from 'react';


import { METRICS_REGISTRY } from '@stats47/data-configs';
import { hrefFor } from "@stats47/data-configs/content/href";
import { scopeHrefsForPrefectureTheme } from '@stats47/data-configs/geo-scope';
import { MUNICIPALITY_THEME_FOR_PREFECTURE_THEME } from '@stats47/data-configs/geo-scope/scope-theme-map';
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import { getSurveyTaxonomyEntries, resolveThemeSurveyTaxonomy } from '@stats47/ranking/survey';

import { PageShell, PanelGrid } from '@/components/layout';
import { THEME_HEROES } from '@/components/layout/page-heroes';
import {
  LinkRowFrame,
  linkRowItemClass,
} from '@/components/navigation/StatisticsScopeNav';
import { loadPageComponents } from '@/components/stat-charts/server';
import { RailCard, RailNavRow } from '@/components/surface';

import { AdRow, composeAdRows, isLandscapeBanner } from '@/features/ads';
import { resolveGenericAffiliateBanners } from '@/features/ads/server';

import { CONTENT_FOOTER, HUB_INCONTENT, RAIL_RECT, THEMES_CONTENT } from '@/lib/google-adsense';
import { AD_FREE_THEME_KEYS } from '@/lib/google-adsense/ad-free-paths';

import { isAreaTheme } from '../config/area-theme-slugs';
import { THEME_SECTION_REGISTRY } from '../config/theme-section-registry';
import { THEME_SWITCHER_THEMES } from '../config/theme-switcher-themes';
import { areaThemeDescription, getAreaThemeHighlights } from '../lib/area-theme-highlights';
import { prefectureCityOptions } from '../lib/prefecture-city-options';
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
  const pageData = generateThemePageStructuredData(theme, structuredArea);
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

  // 本文の広告の段 (PR の列)。2026-11-03 (オーナー決定・収益化戦略 §3.2) からテーマごとの文脈の案件をやめ、
  // 共通の案件 (対象者が広く気軽に始められる商品) を横 3 枠で出す。
  // 非商用データの節を埋め込むテーマは広告・アフィリエイトを出さない (ad-free-paths.ts。AdSense の script も止まる)
  const isAdFree = AD_FREE_THEME_KEYS.includes(theme.themeKey);
  const nativeBanners = isAdFree
    ? []
    : (await resolveGenericAffiliateBanners(5).catch(() => [])).filter(isLandscapeBanner);
  // 広告の段 (2026-11-03 オーナー決定): 1 章目の後・3 章目の後・ページの最後の 3 段。幅に入る数だけ左から出す
  // (モバイル 1 枠・本文 608px 以上 2 枠・916px 以上 3 枠)。モバイルで上から AdSense → PR → AdSense になるよう先頭の種類を変える。
  // AdSense は段ごとに別のユニット (同じユニットを 1 ページで重ねない)。テーマには右レールが無いので RAIL_RECT も使う
  const [chapterRow1, chapterRow2, endRow] = isAdFree
    ? [[], [], []]
    : composeAdRows(
        [
          ['adsense', 'affiliate', 'adsense'],
          ['affiliate', 'adsense', 'affiliate'],
          ['adsense', 'affiliate', 'affiliate'],
        ],
        [HUB_INCONTENT, THEMES_CONTENT, CONTENT_FOOTER, RAIL_RECT],
        nativeBanners,
      );
  const providerPrefecture = areaContext ?? initialPrefecture;

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
            indicatorDataMap={data.indicatorDataMap}
            pageCharts={pageCharts}
            chartSourceLinks={chartSourceLinks}
            chapterAdRows={[chapterRow1, chapterRow2]}
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
            <AdRow cells={endRow} position="theme-row-end" trackingCategory={`theme-${theme.themeKey}`} />
          )}

        </PanelGrid>
      </PageShell>
    </ThemePrefectureProvider>
  );
}
