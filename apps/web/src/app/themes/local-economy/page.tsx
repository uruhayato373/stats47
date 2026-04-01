
import { ThemePageLayout, loadThemeData, LOCAL_ECONOMY_THEME } from "@/features/theme-dashboard/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";


const theme = LOCAL_ECONOMY_THEME;

export function generateMetadata(): Metadata {
  const title = `${theme.title} | 統計で見る都道府県`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/${theme.themeKey}` },
    ...generateOGMetadata({ title, description: theme.description, imageUrl: `/themes/${theme.themeKey}/opengraph-image` }),
  };
}

export default async function LocalEconomyThemePage() {
  const data = await loadThemeData(theme);
  if (!data) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-muted-foreground">データの取得に失敗しました。</p>
      </div>
    );
  }
  return <ThemePageLayout theme={theme} data={data} />;
}
