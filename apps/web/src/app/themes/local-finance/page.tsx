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

/** ALL_THEMES のエントリ (hideMap・embeddedSections 込み) を正典として使う */
const theme = ALL_THEMES.find((t) => t.themeKey === "local-finance");

// SSG にすると build 時に R2 を読めず loadThemeData が null になるため runtime 描画
// （[themeSlug] / home と同型。memory: feedback_home_pure_ssg_r2_empty）
export const dynamic = "force-dynamic";

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
      description: theme.description ?? "",
      imageUrl: `/themes/local-finance/opengraph-image`,
    }),
  };
}

export default async function LocalFinanceThemePage() {
  if (!theme) notFound();

  const data = await loadThemeData(theme);
  if (!data) {
    return (
      <PageShell>
        <p className="text-muted-foreground">地方財政データの取得に失敗しました。</p>
      </PageShell>
    );
  }

  return (
    <PageShell leftRail={<ThemeSidebar theme={theme} />}>
      {/* 都道府県 / 市区町村 切替 */}
      <nav
        aria-label="表示単位切替"
        className="mb-4 inline-flex rounded-full border border-border bg-white p-1 shadow-sm text-xs"
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
      <ThemePageLayout theme={theme} data={data} />
    </PageShell>
  );
}
