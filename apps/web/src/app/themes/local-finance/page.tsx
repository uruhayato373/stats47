import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContentDisclosure } from '@/components/content';

import { loadFinanceCards } from '@/features/local-finance-dashboard';
import {
  ALL_THEMES,
  loadThemeData,
  resolveInitialThemePrefecture,
  THEME_PREFECTURE_COOKIE_NAME,
  ThemePageLayout,
} from '@/features/theme-dashboard/server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { LocalFinanceThemeDetails } from './LocalFinanceThemeDetails';

import type { Metadata } from 'next';

const theme = ALL_THEMES.find((entry) => entry.themeKey === 'local-finance');

// R2 を実行時に読み、他のテーマと同じ県選択・比較を提供する。
export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  if (!theme) return {};
  return {
    title: theme.title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: '/themes/local-finance' },
    ...generateOGMetadata({
      title: theme.title,
      description: theme.description ?? '',
      imageUrl: '/themes/local-finance/opengraph-image',
    }),
  };
}

export default async function LocalFinanceThemePage({
  searchParams,
}: {
  searchParams: Promise<{ pref?: string | string[] }>;
}) {
  if (!theme) notFound();
  const [data, query, cookieStore] = await Promise.all([
    loadThemeData(theme),
    searchParams,
    cookies(),
  ]);
  if (!data) throw new Error('theme data unavailable: local-finance');

  // 旧決算カードの2桁URLも引き続き受け付ける。
  const pref = Array.isArray(query.pref) ? query.pref[0] : query.pref;
  const initialPrefecture = resolveInitialThemePrefecture({
    urlPreference: pref && /^\d{2}$/.test(pref) ? `${pref}000` : pref,
    cookiePreference: cookieStore.get(THEME_PREFECTURE_COOKIE_NAME)?.value,
  });

  return (
    <ThemePageLayout
      theme={theme}
      data={data}
      initialPrefecture={initialPrefecture}
      supplement={
        <ContentDisclosure title="決算カード・市区町村の内訳" className="mt-5">
          <Link
            href="/municipalities"
            className="text-sm text-primary underline"
          >
            市区町村統計へ
          </Link>
          <LocalFinanceThemeDetails cards={loadFinanceCards()} />
        </ContentDisclosure>
      }
    />
  );
}
