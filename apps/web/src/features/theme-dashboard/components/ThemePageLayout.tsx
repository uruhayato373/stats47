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
import {
  HeroShell,
  KpiGrid,
  KpiTile,
  NativeAffiliateRow,
} from "@/features/redesign";
import { loadPageComponents } from "@/features/stat-charts/server";
import { prefetchThemeKpiData } from "@/features/stat-charts/services/prefetch-theme-kpi";

import { AdSenseAd, THEMES_CONTENT } from "@/lib/google-adsense";

import { THEME_SECTION_REGISTRY } from "../config/theme-section-registry";
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

      {/* Hero (D 暗色) — マスタープラン § 5.3 準拠 */}
      <HeroShell variant="dark" className="mb-6">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr,360px] md:p-8">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
              テーマダッシュボード
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {theme.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              {theme.description}
            </p>
          </div>
          <div>
            <KpiGrid columns={2}>
              <KpiTile
                label="指標数"
                value={String(theme.rankingKeys.length)}
                unit="件"
                variant="dark"
              />
              <KpiTile
                label="エリア"
                value="47"
                unit="都道府県"
                variant="dark"
              />
              <KpiTile
                label="可視化"
                value="地図 + グラフ"
                variant="dark"
              />
              <KpiTile
                label="データ"
                value="CSV"
                unit="DL 可"
                variant="dark"
              />
            </KpiGrid>
          </div>
        </div>
      </HeroShell>

      <ThemeDashboardClient
        themeConfig={theme}
        indicatorDataMap={data.indicatorDataMap}
        topology={data.topology}
        pageCharts={pageCharts}
        kpiDataByArea={kpiDataByArea}
      />

      {theme.embeddedSections?.map((sectionKey) => {
        const Section = THEME_SECTION_REGISTRY[sectionKey];
        if (!Section) return null;
        return (
          <div key={sectionKey} className="mt-8">
            <Section />
          </div>
        );
      })}

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
