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

/**
 * テーマダッシュボード動的ルート (2026-05-28 移行)
 *
 * 旧: 17 個の静的 `app/themes/<key>/page.tsx` ハードコード
 * 新: 1 個の動的 `[themeSlug]/page.tsx` で全テーマを生成
 *
 * 例外: `themes/local-finance/page.tsx` と `themes/local-finance/cities/page.tsx`
 * は都道府県/市区町村切替 UI を持つため static のまま維持。
 * Next.js のルート優先順位 (static > dynamic) で正しく解決される。
 *
 * Plan: /root/.claude/plans/ok-validated-stroustrup.md Phase 3
 */

/** 24時間 ISR */
export const revalidate = 86400;

/** ALL_THEMES から static params を生成。local-finance は専用ファイルが優先されるため除外。 */
export function generateStaticParams() {
  return ALL_THEMES.filter((t) => t.themeKey !== "local-finance").map((t) => ({
    themeSlug: t.themeKey,
  }));
}

interface PageProps {
  params: Promise<{ themeSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { themeSlug } = await params;
  const theme = ALL_THEMES.find((t) => t.themeKey === themeSlug);
  if (!theme) return {};

  const title = theme.title;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/${theme.themeKey}` },
    ...generateOGMetadata({
      title,
      description: theme.description,
      imageUrl: `/themes/${theme.themeKey}/opengraph-image`,
    }),
  };
}

export default async function ThemeDynamicPage({ params }: PageProps) {
  const { themeSlug } = await params;
  const theme = ALL_THEMES.find((t) => t.themeKey === themeSlug);
  if (!theme) {
    notFound();
  }

  const data = await loadThemeData(theme);
  if (!data) {
    return (
      <PageShell>
        <p className="text-muted-foreground">データの取得に失敗しました。</p>
      </PageShell>
    );
  }

  return (
    <PageShell leftRail={<ThemeSidebar theme={theme} />}>
      <ThemePageLayout theme={theme} data={data} />
    </PageShell>
  );
}
