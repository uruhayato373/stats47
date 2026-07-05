import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { loadPageComponents } from "@/components/stat-charts/server";
import { prefetchThemeKpiData } from "@/components/stat-charts/services/prefetch-theme-kpi";

import {
  InContentAdSlot,
  NativeAffiliateRow,
  SidebarPromoBanner,
} from "@/features/ads";
import { resolveAffiliateBanners } from "@/features/ads/server";

import { AdSenseAd, HUB_INCONTENT, THEMES_CONTENT } from "@/lib/google-adsense";

import { THEME_SECTION_REGISTRY } from "../config/theme-section-registry";
import {
  generateThemeBreadcrumbStructuredData,
  generateThemePageStructuredData,
} from "../utils";

import { ThemeAreaHeader } from "./ThemeAreaHeader";
import { ThemeDashboardClient } from "./ThemeDashboardClient";
import { ThemeIndicatorCatalogSection } from "./ThemeIndicatorCatalogSection";
import { ThemePrefectureProvider } from "./ThemePrefectureContext";
import { ThemeRelatedArticles } from "./ThemeRelatedArticles";

import type { ThemePageData } from "../lib/load-theme-data";
import type { ThemeConfig } from "../types";

interface Props {
  theme: ThemeConfig;
  data: ThemePageData;
  /** エリアページ経由時の都道府県コード（5桁）と名称 */
  areaContext?: { areaCode: string; areaName: string };
}

/**
 * テーマダッシュボードの共通レイアウト
 *
 * Breadcrumb + ヘッダー + ThemeDashboardClient を配置。
 * chart_definitions から DB 管理チャートを取得してクライアントに渡す。
 */
export async function ThemePageLayout({ theme, data, areaContext }: Props) {
  const pageCharts = await loadPageComponents("theme", theme.themeKey);
  const kpiDataByArea = await prefetchThemeKpiData(pageCharts);
  const breadcrumbData = generateThemeBreadcrumbStructuredData(theme);
  const pageData = generateThemePageStructuredData(theme);

  // D Phase 3: ネイティブアフィリエイト枠 (テーマ関連書籍/商品)
  const nativeBanners = theme.relatedArticleTagKeys && theme.relatedArticleTagKeys.length > 0
    ? await resolveAffiliateBanners(theme.relatedArticleTagKeys, 4).catch(() => [])
    : [];

  return (
    <ThemePrefectureProvider
      initialAreaCode={areaContext?.areaCode ?? null}
      initialAreaName={areaContext?.areaName ?? null}
    >
    <div className="text-foreground">
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
          {areaContext ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/areas">都道府県一覧</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/areas/${areaContext.areaCode}`}>{areaContext.areaName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{theme.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>{theme.title}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* エリアページ経由時の視点バナー */}
      {areaContext && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span className="font-medium text-primary">{areaContext.areaName}の視点</span>
          <span className="text-muted-foreground">— 全国チャートで{areaContext.areaName}をハイライト表示しています</span>
          <Link href={`/areas/${areaContext.areaCode}`} className="ml-auto text-xs text-primary hover:underline">
            {areaContext.areaName}プロフィールへ →
          </Link>
        </div>
      )}

      {/* エリア連動の H1 + 都道府県セレクタ（全国デフォルト・client-side、SSG 不変） */}
      <ThemeAreaHeader themeTitle={theme.title} description={theme.description} />

      <ThemeDashboardClient
        themeConfig={theme}
        indicatorDataMap={data.indicatorDataMap}
        topology={data.topology}
        pageCharts={pageCharts}
        kpiDataByArea={kpiDataByArea}
        highlightAreaCode={areaContext?.areaCode}
      />

      {/* 記事内広告（ダッシュボード直後・ページ 1 枠まで。slotId 未発行の間は非表示） */}
      <InContentAdSlot slot={HUB_INCONTENT} />

      {/*
        埋め込み GIS セクション (人口移動 Sankey / 高速道路タイムライン / 駅乗降 /
        過疎×医療 / 日照地図)。定義は all-themes.ts の EMBEDDED_SECTIONS。
        hideMap (地図タブ非表示) とは独立に描画する — カード主役レイアウトのまま
        主題深掘りの GIS 可視化を復活 (2026-07-04)。
      */}
      {theme.embeddedSections?.map((sectionKey) => {
        const Section = THEME_SECTION_REGISTRY[sectionKey];
        if (!Section) return null;
        return (
          <div key={sectionKey} className="mt-8">
            <Section />
          </div>
        );
      })}

      {/* このテーマの全指標 (context 指標・選定根拠を含む完全一覧) */}
      <ThemeIndicatorCatalogSection themeKey={theme.themeKey} />

      {/* 広告: ダッシュボード読了後・関連記事の前 */}
      <div className="mt-8">
        <AdSenseAd format={THEMES_CONTENT.format} slotId={THEMES_CONTENT.slotId} />
      </div>

      {/* 高単価アフィリエイトバナー (AdSense と並行) */}
      <div className="mt-8 flex justify-center">
        <SidebarPromoBanner index={0} position="theme-banner" />
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
    </ThemePrefectureProvider>
  );
}
