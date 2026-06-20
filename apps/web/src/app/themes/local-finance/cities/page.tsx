import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/layout";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";
import {
  ThemePageLayout,
  ThemeSidebar,
  loadThemeData,
} from "@/features/theme-dashboard/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/** ALL_THEMES のエントリ (hideMap 込み) を正典として使う */
const theme = ALL_THEMES.find((t) => t.themeKey === "local-finance-city");

export function generateMetadata(): Metadata {
  if (!theme) return {};
  const title = `${theme.title}｜${(theme.description ?? "").slice(0, 30)}`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/local-finance/cities` },
    ...generateOGMetadata({
      title,
      description: theme.description ?? "",
      imageUrl: `/themes/local-finance/cities/opengraph-image`,
    }),
  };
}

export default async function LocalFinanceCityThemePage() {
  if (!theme) notFound();

  const data = await loadThemeData(theme, { areaType: "city" });
  if (!data) {
    return (
      <PageShell>
        <p className="text-muted-foreground">市区町村財政データの取得に失敗しました。</p>
      </PageShell>
    );
  }

  return (
    <PageShell leftRail={<ThemeSidebar theme={theme} />}>
      {/* 都道府県版へのナビゲーション */}
      <nav
        aria-label="表示単位切替"
        className="mb-4 inline-flex rounded-full border border-border bg-white p-1 shadow-sm text-xs"
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
      <ThemePageLayout theme={theme} data={data} />
    </PageShell>
  );
}
