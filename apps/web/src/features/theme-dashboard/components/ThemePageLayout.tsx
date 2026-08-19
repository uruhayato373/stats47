import { type ReactNode } from "react";

import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";

import { PageShell } from "@/components/layout";
import { THEME_HEROES } from "@/components/layout/page-heroes";
import { loadPageComponents } from "@/components/stat-charts/server";
import { prefetchThemeKpiData } from "@/components/stat-charts/services/prefetch-theme-kpi";

import {
  BannerAd,
  InContentAdSlot,
  NativeAffiliateRow,
} from "@/features/ads";
import { THEME_AFFILIATE_MAP } from "@/features/ads/constants/affiliate-category";
import { resolveAffiliateBanners, resolveAffiliateBannersByVertical } from "@/features/ads/server";
import { isLandscapeBanner } from "@/features/ads/services/banner-geometry";

import { HUB_INCONTENT, THEMES_CONTENT } from "@/lib/google-adsense";

import {
  HALF_WIDTH_SECTIONS,
  THEME_SECTION_REGISTRY,
} from "../config/theme-section-registry";
import {
  generateThemeBreadcrumbStructuredData,
  generateThemePageStructuredData,
} from "../utils";

import { ThemeAreaHeader } from "./ThemeAreaHeader";
import { ThemeDashboardClient } from "./ThemeDashboardClient";
import { ThemeHero } from "./ThemeHero";
import { ThemeIndicatorCatalogSection } from "./ThemeIndicatorCatalogSection";
import { PrefectureSelect } from "./PrefectureSelect";
import { ThemePrefectureProvider } from "./ThemePrefectureContext";
import { ThemeRelatedArticles } from "./ThemeRelatedArticles";
import { ThemeSideNav } from "./ThemeSideNav";
import { ThemeSwitcher } from "./ThemeSwitcher";

import type { ThemePageData } from "../lib/load-theme-data";
import type { ThemeConfig } from "../types";

interface Props {
  theme: ThemeConfig;
  data: ThemePageData;
  /** エリアページ経由時の都道府県コード（5桁）と名称 */
  areaContext?: { areaCode: string; areaName: string };
  /**
   * パンくず直下に差し込むページ固有のコントロール
   * （local-finance/cities の「都道府県 / 市区町村」切替など）。
   */
  toolbar?: ReactNode;
}

/**
 * テーマダッシュボードの共通レイアウト
 *
 * `PageShell`（左レール = ThemeSideNav）+ Breadcrumb + ヘッダー + ThemeDashboardClient。
 * chart_definitions から DB 管理チャートを取得してクライアントに渡す。
 *
 * ★Shell を本コンポーネントが持つ理由: 左レールの都道府県セレクタが
 * `ThemePrefectureProvider` の内側に無いと動かないため、Provider → PageShell(leftRail) の
 * 入れ子をここで固定する。呼び出し側の page.tsx は PageShell を重ねない。
 */
export async function ThemePageLayout({ theme, data, areaContext, toolbar }: Props) {
  const pageCharts = await loadPageComponents("theme", theme.themeKey);
  const kpiDataByArea = await prefetchThemeKpiData(pageCharts);
  const breadcrumbData = generateThemeBreadcrumbStructuredData(theme);
  const pageData = generateThemePageStructuredData(theme);

  // D Phase 3: ネイティブアフィリエイト枠 (テーマの関連サービス)
  // relatedArticleTagKeys で解決 → 空なら theme→vertical 写像 (THEME_AFFILIATE_MAP) でフォールバック。
  // これにより relatedArticleTagKeys 未設定のテーマでも意図一致広告が出る (在庫機会損失の解消)。
  // ★ 2026-08-04: 4 → 5 に増やし、先頭 4 件をネイティブ枠、5 件目をページ末尾の 300x250 に回す。
  // ★ 2026-08-06: 5 → 8。縦長 (スカイスクレイパー) は本文枠に出さない (isLandscapeBanner で
  //   除外。受け皿は sidebar-sticky スロット)。除外後も native 4 + 末尾 1 が埋まる余裕を持たせる。
  let nativeBanners = theme.relatedArticleTagKeys && theme.relatedArticleTagKeys.length > 0
    ? await resolveAffiliateBanners(theme.relatedArticleTagKeys, 8).catch(() => [])
    : [];
  if (nativeBanners.length === 0) {
    const vertical = THEME_AFFILIATE_MAP[theme.themeKey];
    if (vertical) {
      nativeBanners = await resolveAffiliateBannersByVertical(vertical, 8).catch(() => []);
    }
  }
  nativeBanners = nativeBanners.filter(isLandscapeBanner);
  // 在庫が 4 件以下なら末尾バナーは出さない (ネイティブ枠と同じ広告の重複を避ける)。
  const themeEndBanner = nativeBanners[4] ?? null;

  return (
    <ThemePrefectureProvider
      initialAreaCode={areaContext?.areaCode ?? null}
      initialAreaName={areaContext?.areaName ?? null}
    >
    <PageShell
      leftRail={
        <ThemeSideNav
          currentThemeKey={theme.themeKey}
          areaContext={areaContext ? { areaCode: areaContext.areaCode } : undefined}
        />
      }
      leftRailNarrowBehavior="hide"
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

      {toolbar}

      {/* 狭幅（lg 未満）のテーマ・地域切替。lg+ は左レール ThemeSideNav が担うので隠す。
          ★境界は PageShell の左レール (hidden lg:block) と必ず一致させること。
          ずれると両方出る幅ができる (2026-08-05 に xl/lg のずれを是正)。
          areaContext がある場合は都道府県文脈を維持したまま切り替える。 */}
      <div
        role="group"
        aria-label="テーマと地域"
        className="mb-4 grid grid-cols-1 gap-2 border-y border-border py-3 sm:grid-cols-2 lg:hidden"
      >
        <ThemeSwitcher
          currentThemeKey={theme.themeKey}
          areaContext={areaContext ? { areaCode: areaContext.areaCode } : undefined}
          compact
        />
        <div className="min-w-0">
          <span className="block text-xs font-medium text-muted-foreground">地域</span>
          <PrefectureSelect className="mt-1 w-full" />
        </div>
      </div>

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

      {/* エリア連動の H1（全国デフォルト・client-side、SSG 不変）。
          hero 画像を持つテーマ (THEME_HEROES) は画像付きの ThemeHero に差し替える。 */}
      {THEME_HEROES[theme.themeKey] ? (
        <ThemeHero themeTitle={theme.title} hero={THEME_HEROES[theme.themeKey]} />
      ) : (
        <ThemeAreaHeader themeTitle={theme.title} description={theme.description} />
      )}

      <ThemeDashboardClient
        themeConfig={theme}
        metricGroups={THEME_CATALOGS[theme.themeKey]?.metricGroups}
        indicatorDataMap={data.indicatorDataMap}
        topology={data.topology}
        pageCharts={pageCharts}
        kpiDataByArea={kpiDataByArea}
        highlightAreaCode={areaContext?.areaCode}
      />

      {/* 記事内広告（ダッシュボード直後・ページ 1 枠まで。slotId 未発行の間は非表示） */}
      <InContentAdSlot slot={HUB_INCONTENT} />

      {/*
        埋め込み section。定義は all-themes.ts の EMBEDDED_SECTIONS、実体は
        THEME_SECTION_REGISTRY。半幅 (フロー 2 種 = 人口移動 / 通勤) は 2 カラム grid、
        全幅 (高速道路タイムライン / 駅乗降 / 過疎×医療 / 日照地図) は 1 段ずつ。
        hideMap (地図タブ非表示) とは独立に描画する — カード主役レイアウトのまま
        主題深掘りの可視化を出す (2026-07-04)。
        registry に無いキーは描画できないので落とすが、typo が無言で消えないよう
        all-themes.test.ts が「embeddedSections ⊆ registry」を固定している。
      */}
      {(() => {
        const keys = (theme.embeddedSections ?? []).filter(
          (k) => THEME_SECTION_REGISTRY[k],
        );
        if (keys.length === 0) return null;
        const halfCandidates = keys.filter((k) => HALF_WIDTH_SECTIONS.has(k));
        // 半幅が 1 件だけだと 2 カラムの右半分が空くので全幅に戻す
        const half = halfCandidates.length >= 2 ? halfCandidates : [];
        const full = keys.filter((k) => !half.includes(k));
        return (
          <>
            {half.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {half.map((key) => {
                  const Section = THEME_SECTION_REGISTRY[key];
                  return <Section key={key} />;
                })}
              </div>
            )}
            {full.map((key) => {
              const Section = THEME_SECTION_REGISTRY[key];
              return (
                <div key={key} className="mt-8">
                  <Section />
                </div>
              );
            })}
          </>
        );
      })()}

      {/* このテーマの全指標 (context 指標・選定根拠を含む完全一覧) */}
      <ThemeIndicatorCatalogSection themeKey={theme.themeKey} />

      {/*
        広告: ダッシュボード読了後・関連記事の前。生 AdSenseAd から slot 部品へ寄せ、
        全テーマページでラベル表記と未発行時の非描画を揃える (2026-07-29)。
      */}
      <InContentAdSlot slot={THEMES_CONTENT} />

      {/* ネイティブアフィリエイト枠 (D Phase 3)。
          旧・本文中央の SidebarPromoBanner は撤去 (316px レール前提の部品を本文幅で使う誤用。
          native 行 + theme-end 300x250 で枠は充足する。2026-08-06)。 */}
      {nativeBanners.length > 0 && (
        <div className="mt-8">
          <NativeAffiliateRow
            banners={nativeBanners.slice(0, 4)}
            position="theme-native"
            trackingCategory={`theme-${theme.themeKey}`}
          />
        </div>
      )}

      {/* ★ 2026-08-04: ページ末尾の 300x250 (theme→vertical で意図一致)。 */}
      {themeEndBanner && (
        <div className="mt-8 flex justify-center">
          <BannerAd
            href={themeEndBanner.href}
            imageUrl={themeEndBanner.imageUrl}
            trackingPixelUrl={themeEndBanner.trackingPixelUrl}
            width={themeEndBanner.width}
            height={themeEndBanner.height}
            label={themeEndBanner.title}
            category={themeEndBanner.vertical ?? "other"}
            position="theme-end"
            adId={themeEndBanner.id}
            creativeSize={`${themeEndBanner.width}x${themeEndBanner.height}`}
          />
        </div>
      )}

      {theme.relatedArticleTagKeys && theme.relatedArticleTagKeys.length > 0 && (
        <ThemeRelatedArticles tagKeys={theme.relatedArticleTagKeys} />
      )}
    </div>
    </PageShell>
    </ThemePrefectureProvider>
  );
}
