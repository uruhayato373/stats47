import Link from "next/link";

import { PageShell } from "@/components/layout";

import {
  ThemePageLayout,
  loadThemeData,
  LOCAL_FINANCE_CITY_THEME,
} from "@/features/theme-dashboard/server";


import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

const theme = LOCAL_FINANCE_CITY_THEME;

export function generateMetadata(): Metadata {
  const title = `${theme.title}｜${theme.description.slice(0, 30)}`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/local-finance/cities` },
    ...generateOGMetadata({
      title,
      description: theme.description,
      imageUrl: `/themes/local-finance/cities/opengraph-image`,
    }),
  };
}

export default async function LocalFinanceCityThemePage() {
  const data = await loadThemeData(theme, { areaType: "city" });
  if (!data) {
    return (
      <PageShell>
        <p className="text-muted-foreground">市区町村財政データの取得に失敗しました。</p>
      </PageShell>
    );
  }

  return (
    <div>
      {/* 都道府県版へのナビゲーション */}
      <PageShell className="pb-0">
        <nav
          aria-label="表示単位切替"
          className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm text-xs"
        >
          <Link
            href="/themes/local-finance"
            className="px-3 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            都道府県
          </Link>
          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium">
            市区町村
          </span>
        </nav>
      </PageShell>
      <ThemePageLayout theme={theme} data={data} />
    </div>
  );
}
