import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { to5DigitPrefCode } from '@stats47/area';
import { scopeHrefsForPrefectureTheme } from '@stats47/data-configs/geo-scope';
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';

import Link from '@/components/atoms/SiteLink';
import { PageShell } from '@/components/layout';

import { InContentAdSlot } from '@/features/ads';
import type { FinanceFlowData } from '@/features/finance-flow';
import { loadFinanceCards, splitLocalFinanceSections } from '@/features/local-finance-dashboard';
import { ThemePrefectureProvider } from '@/features/theme-dashboard';
import { ALL_THEMES } from '@/features/theme-dashboard/config/all-themes';
import {
  THEME_PREFECTURE_COOKIE_NAME,
  resolveInitialThemePrefecture,
  ThemeAreaHeader,
  ThemeIndicatorCatalogSection,
  ThemeSideNav,
  THEME_SWITCHER_THEMES,
  ThemeDashboardClient,
  loadThemeData,
} from '@/features/theme-dashboard/server';

import { HUB_INCONTENT, THEMES_CONTENT } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { R2_PUBLIC_BASE_URL } from '@/config/site';

import { LocalFinanceThemeClient } from './LocalFinanceThemeClient';

import type { Metadata } from 'next';

/** サイドバー用に ALL_THEMES のエントリ (テーマ一覧 + 指標) を使う */
const theme = ALL_THEMES.find((t) => t.themeKey === 'local-finance');
const sections = THEME_CATALOGS['local-finance'].sections ?? [];
const { dedicated, supplementary } = splitLocalFinanceSections(sections);
const supplementaryGroups = THEME_CATALOGS['local-finance'].metricGroups ?? [];
const supplementaryKeys = new Set(supplementaryGroups.flatMap((group) => group.rankingKeys));

const R2_BASE = R2_PUBLIC_BASE_URL;

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
      imageUrl: `${R2_BASE}/app/themes/local-finance/ogp/ogp.png?v=20261026-pop`,
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
  };
  const supplementaryData = await loadThemeData(supplementaryConfig);
  const [query, cookieStore] = await Promise.all([searchParams, cookies()]);
  const rawPref = Array.isArray(query.pref) ? query.pref[0] : query.pref;
  // Existing shared links used two-digit codes before all theme routes adopted five digits.
  const initialPrefecture = resolveInitialThemePrefecture({
    urlPreference:
      rawPref && /^\d{2}$/.test(rawPref) ? to5DigitPrefCode(rawPref) : rawPref,
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
      {/* ページ内ナビ (ThemeSideNav) は h1 の後・本文の上に置く (PageShell の header → leftRail → 本文) */}
      <PageShell
        header={<ThemeAreaHeader themeTitle="地方財政" />}
        leftRail={
          <ThemeSideNav
            themes={THEME_SWITCHER_THEMES}
            currentThemeKey="local-finance"
            pageLinks={pageLinks}
            scopeHrefs={scopeHrefsForPrefectureTheme('local-finance')}
          />
        }
      >
        <nav aria-label="関連する統計範囲" className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">市区町村の財政:</span>
          {[
            { href: '/municipalities/themes/local-finance', label: '財政指標' },
            { href: '/municipalities/themes/municipal-revenue', label: '歳入' },
            { href: '/municipalities/themes/municipal-expenditure', label: '歳出' },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-primary hover:underline">
              {link.label} →
            </Link>
          ))}
        </nav>
        <LocalFinanceThemeClient
          cards={cards}
          sections={dedicated}
          initialFinanceFlow={initialFinanceFlow}
        />
        <ThemeDashboardClient
          themeConfig={supplementaryConfig}
          metricGroups={supplementaryData?.metricGroups ?? supplementaryGroups}
          sections={supplementary}
          indicatorDataMap={supplementaryData?.indicatorDataMap ?? {}}
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
