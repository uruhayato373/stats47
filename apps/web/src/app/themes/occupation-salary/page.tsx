import type { Metadata } from "next";

import { OCCUPATION_SALARY_THEME } from "@/features/theme-dashboard/server";
import { loadThemeData } from "@/features/theme-dashboard/lib/load-theme-data";
import { ThemePageLayout } from "@/features/theme-dashboard/components/ThemePageLayout";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

export const revalidate = 86400;

const theme = OCCUPATION_SALARY_THEME;

export function generateMetadata(): Metadata {
  const title = `${theme.title} | 統計で見る都道府県`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/${theme.themeKey}` },
    ...generateOGMetadata({ title, description: theme.description, imageUrl: "/og-image.jpg" }),
  };
}

export default async function OccupationSalaryThemePage() {
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
