import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { resolveAffiliateBanners } from "@/features/ads/server";
import { loadPageComponents } from "@/features/stat-charts/server";
import { prefetchThemeKpiData } from "@/features/stat-charts/services/prefetch-theme-kpi";
import { NativeAffiliateRow } from "@/features/redesign";

import { AdSenseAd, THEMES_CONTENT } from "@/lib/google-adsense";

import {
  generateThemeBreadcrumbStructuredData,
  generateThemePageStructuredData,
} from "../utils";

import { ThemeDashboardClient } from "./ThemeDashboardClient";
import { ThemeRelatedArticles } from "./ThemeRelatedArticles";

import type { ThemePageData } from "../lib/load-theme-data";
import type { ThemeConfig } from "../types";

interface Props {
  theme: ThemeConfig;
  data: ThemePageData;
}

/**
 * テーマダッシュボードの共通レイアウト
 *
 * Breadcrumb + ヘッダー + ThemeDashboardClient を配置。
 * chart_definitions から DB 管理チャートを取得してクライアントに渡す。
 */
export async function ThemePageLayout({ theme, data }: Props) {
  const pageCharts = await loadPageComponents("theme", theme.themeKey);
  const kpiDataByArea = await prefetchThemeKpiData(pageCharts);
  const breadcrumbData = generateThemeBreadcrumbStructuredData(theme);
  const pageData = generateThemePageStructuredData(theme);

  // D Phase 3: ネイティブアフィリエイト枠 (テーマ関連書籍/商品)
  const nativeBanners = theme.relatedArticleTagKeys && theme.relatedArticleTagKeys.length > 0
    ? await resolveAffiliateBanners(theme.relatedArticleTagKeys, 4).catch(() => [])
    : [];
  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageData) }}
      />
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">ホーム</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{theme.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero (軽量・データ主役): タイトル + 1 行 description + 指標数バッジ */}
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          テーマダッシュボード
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {theme.title}
          <span className="ml-3 align-middle text-xs font-medium text-muted-foreground">
            {theme.rankingKeys.length}指標
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {theme.description}
        </p>
      </header>

      <ThemeDashboardClient
        themeConfig={theme}
        indicatorDataMap={data.indicatorDataMap}
        topology={data.topology}
        pageCharts={pageCharts}
        kpiDataByArea={kpiDataByArea}
      />

      {/* 広告: ダッシュボード読了後・関連記事の前 */}
      <div className="mt-8">
        <AdSenseAd format={THEMES_CONTENT.format} slotId={THEMES_CONTENT.slotId} />
      </div>

      {/* ネイティブアフィリエイト枠 (D Phase 3) */}
      {nativeBanners.length > 0 && (
        <div className="mt-8">
          <NativeAffiliateRow
            title={`${theme.title}の関連書籍・商品`}
            banners={nativeBanners}
            position="theme-native"
            trackingCategory={`theme-${theme.themeKey}`}
          />
        </div>
      )}

      {theme.relatedArticleTagKeys && theme.relatedArticleTagKeys.length > 0 && (
        <ThemeRelatedArticles tagKeys={theme.relatedArticleTagKeys} />
      )}
    </div>
  );
}
