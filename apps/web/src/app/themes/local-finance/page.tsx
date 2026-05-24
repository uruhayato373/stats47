import Link from "next/link";

import { ThemePageLayout, loadThemeData, LOCAL_FINANCE_THEME } from "@/features/theme-dashboard/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";


const theme = LOCAL_FINANCE_THEME;

export function generateMetadata(): Metadata {
  const title = `${theme.title}`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/${theme.themeKey}` },
    ...generateOGMetadata({ title, description: theme.description, imageUrl: `/themes/${theme.themeKey}/opengraph-image` }),
  };
}

export default async function LocalFinanceThemePage() {
  const data = await loadThemeData(theme);
  if (!data) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-muted-foreground">データの取得に失敗しました。</p>
      </div>
    );
  }
  return (
    <div>
      {/* 市区町村版へのナビゲーション */}
      <div className="container mx-auto px-4 pt-4">
        <nav
          aria-label="表示単位切替"
          className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm text-xs"
        >
          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium">
            都道府県
          </span>
          <Link
            href="/themes/local-finance/cities"
            className="px-3 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            市区町村
          </Link>
        </nav>
      </div>
      <ThemePageLayout theme={theme} data={data} />
    </div>
  );
}
