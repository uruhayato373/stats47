import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';

import { LEFT_RAIL_NARROW_ONLY_CLASS, PageShell } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';

import { InContentAdSlot } from '@/features/ads';
import type { FinanceFlowData } from '@/features/finance-flow';
import { loadFinanceCards, splitLocalFinanceSections } from '@/features/local-finance-dashboard';
import {
  PrefectureSelect,
  ThemePrefectureProvider,
  ThemeChapterLinks,
} from '@/features/theme-dashboard';
import { ALL_THEMES } from '@/features/theme-dashboard/config/all-themes';
import {
  THEME_PREFECTURE_COOKIE_NAME,
  resolveInitialThemePrefecture,
  ThemeAreaHeader,
  ThemeIndicatorCatalogSection,
  ThemeSideNav,
  ThemeSwitcher,
  ThemeDashboardClient,
  loadThemeData,
} from '@/features/theme-dashboard/server';

import { HUB_INCONTENT, THEMES_CONTENT } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { LocalFinanceThemeClient } from './LocalFinanceThemeClient';

import type { Metadata } from 'next';

/** サイドバー用に ALL_THEMES のエントリ (テーマ一覧 + 指標) を使う */
const theme = ALL_THEMES.find((t) => t.themeKey === 'local-finance');
const sections = THEME_CATALOGS['local-finance'].sections ?? [];
const { dedicated, supplementary } = splitLocalFinanceSections(sections);
const supplementaryGroups = THEME_CATALOGS['local-finance'].metricGroups ?? [];
const supplementaryKeys = new Set(supplementaryGroups.flatMap((group) => group.rankingKeys));

const R2_BASE = 'https://storage.stats47.jp';

// 財政フロー(R2 public URL fetch) を runtime で確実に読むため force-dynamic。
// 本ページは bespoke LocalFinanceDashboard を使い、汎用 loadThemeData は経由しない。
export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  if (!theme) return {};
  const title = theme.title;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/local-finance` },
    ...generateOGMetadata({
      title,
      description: theme.description ?? '',
      imageUrl: `/themes/local-finance/opengraph-image`,
    }),
  };
}

/** 選択県の財政フローを SSR で R2 公開 URL から読む */
async function loadInitialFinanceFlow(
  code: string | null
): Promise<FinanceFlowData | undefined> {
  if (!code) return undefined;
  try {
    const res = await fetch(`${R2_BASE}/app/finance-flow/${code}.json`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) return (await res.json()) as FinanceFlowData;
  } catch {
    // client 側 /api/flow フォールバックに任せる
  }
  return undefined;
}

export default async function LocalFinanceThemePage({
  searchParams,
}: {
  searchParams: Promise<{ pref?: string | string[] }>;
}) {
  if (!theme) notFound();

  const cards = loadFinanceCards();
  const supplementaryConfig = {
    ...theme,
    rankingKeys: [...supplementaryKeys],
    tabIndicators: theme.tabIndicators?.filter((indicator) => supplementaryKeys.has(indicator.rankingKey)),
    defaultRankingKey: [...supplementaryKeys][0],
    hideMap: true,
  };
  const supplementaryData = await loadThemeData(supplementaryConfig);
  const [query, cookieStore] = await Promise.all([searchParams, cookies()]);
  const rawPref = Array.isArray(query.pref) ? query.pref[0] : query.pref;
  // Existing shared links used two-digit codes before all theme routes adopted five digits.
  const initialPrefecture = resolveInitialThemePrefecture({
    urlPreference:
      rawPref && /^\d{2}$/.test(rawPref) ? `${rawPref}000` : rawPref,
    cookiePreference: cookieStore.get(THEME_PREFECTURE_COOKIE_NAME)?.value,
  });
  const initialFinanceFlow = await loadInitialFinanceFlow(
    initialPrefecture?.areaCode.slice(0, 2) ?? null
  );
  const pageLinks = sections.map((section) => ({
    href: `#theme-section-${section.key}`,
    label: section.title,
  }));

  return (
    <ThemePrefectureProvider
      initialAreaCode={initialPrefecture?.areaCode ?? null}
      initialAreaName={initialPrefecture?.areaName ?? null}
    >
      <PageShell
        leftRail={
          <ThemeSideNav currentThemeKey="local-finance" pageLinks={pageLinks} />
        }
        leftRailNarrowBehavior="hide"
      >
        <ThemeAreaHeader themeTitle="地方財政" />
        {/* Regional selection shares the URL / Cookie provider with the other themes. */}
        <div className={LEFT_RAIL_NARROW_ONLY_CLASS}>
          <ThemeSwitcher currentThemeKey="local-finance" />
          <div className="my-3">
            <PrefectureSelect className="w-full" />
          </div>
          <nav aria-label="このページの内容" className="flex flex-wrap gap-4">
            <ThemeChapterLinks
              links={pageLinks}
              themeKey="local-finance"
              className="py-2 text-sm hover:text-primary"
            />
          </nav>
          <nav
            aria-label="テーマ・調査の一覧"
            className="flex flex-wrap gap-x-5"
          >
            <Link
              href="/themes"
              className="inline-flex min-h-10 items-center text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              テーマ一覧へ
            </Link>
            <Link
              href="/survey"
              className="inline-flex min-h-10 items-center text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              調査一覧へ
            </Link>
          </nav>
          <StatisticsScopeNav current="prefectures" />
        </div>
        <nav aria-label="関連する統計範囲" className="mb-4 text-sm">
          <Link
            href="/municipalities"
            className="font-medium text-primary hover:underline"
          >
            市区町村の地方財政は、市区町村統計で管理しています →
          </Link>
        </nav>
        <LocalFinanceThemeClient
          cards={cards}
          sections={dedicated}
          initialFinanceFlow={initialFinanceFlow}
        />
        <ThemeDashboardClient
          themeConfig={supplementaryConfig}
          metricGroups={supplementaryGroups}
          sections={supplementary}
          indicatorDataMap={supplementaryData?.indicatorDataMap ?? {}}
          topology={null}
        />

        {/*
        広告 2 枠。bespoke ページなので ThemePageLayout を通らず、他テーマが ThemePageLayout から持つ枠が
        丸ごと抜けていた (2026-07-29 是正)。位置・スロットとも ThemePageLayout に合わせ、
        全指標セクションを挟んで 2 枠が隣接しないようにする。
      */}
        <InContentAdSlot slot={HUB_INCONTENT} />
        <ThemeIndicatorCatalogSection themeKey="local-finance" />
        <InContentAdSlot slot={THEMES_CONTENT} />
      </PageShell>
    </ThemePrefectureProvider>
  );
}
