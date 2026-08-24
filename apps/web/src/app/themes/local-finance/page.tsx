import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PAGE_SHELL_NARROW_ONLY_CLASS, PageShell } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';

import { InContentAdSlot } from '@/features/ads';
import type { FinanceFlowData } from '@/features/finance-flow';
import {
  LocalFinanceDashboard,
  loadFinanceCards,
} from '@/features/local-finance-dashboard';
import { ALL_THEMES } from '@/features/theme-dashboard/config/all-themes';
import {
  ThemeIndicatorCatalogSection,
  ThemeSideNav,
  ThemeSwitcher,
} from '@/features/theme-dashboard/server';

import { HUB_INCONTENT, THEMES_CONTENT } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import type { Metadata } from 'next';

/** サイドバー用に ALL_THEMES のエントリ (テーマ一覧 + 指標) を使う */
const theme = ALL_THEMES.find((t) => t.themeKey === 'local-finance');

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

/** 既定県 (13 東京) の財政フローを SSR で R2 公開 URL から読む */
async function loadInitialFinanceFlow(): Promise<FinanceFlowData | undefined> {
  try {
    const res = await fetch(`${R2_BASE}/app/finance-flow/13.json`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) return (await res.json()) as FinanceFlowData;
  } catch {
    // client 側 /api/flow フォールバックに任せる
  }
  return undefined;
}

export default async function LocalFinanceThemePage() {
  if (!theme) notFound();

  const cards = loadFinanceCards();
  const initialFinanceFlow = await loadInitialFinanceFlow();

  return (
    <PageShell
      leftRail={
        <ThemeSideNav currentThemeKey="local-finance" showRegion={false} />
      }
      leftRailNarrowBehavior="hide"
    >
      {/* 狭幅のテーマ切替（bespoke ページのため ThemePageLayout を使わず個別配置）。
          992px+ は左レールが担う。本ページは ThemePrefectureProvider を持たないので
          左レールの都道府県選択だけを出さない (showRegion=false)。比較単位は表示する。
          ★境界は PageShell の共有クラスと必ず一致させること。 */}
      <div className={PAGE_SHELL_NARROW_ONLY_CLASS}>
        <ThemeSwitcher currentThemeKey="local-finance" />
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
      <LocalFinanceDashboard
        cards={cards}
        initialFinanceFlow={initialFinanceFlow}
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
  );
}
