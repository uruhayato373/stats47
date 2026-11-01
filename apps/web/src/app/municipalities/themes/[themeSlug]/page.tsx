import { notFound } from 'next/navigation';

import { hrefFor } from "@stats47/data-configs/content/href";
import {
  isMunicipalityThemePageSlug,
  municipalityMetricKeysForPrefectureTheme,
  scopeHrefsForPrefectureTheme,
} from '@stats47/data-configs/geo-scope';
import { readMunicipalityRankingItem } from '@stats47/ranking/server';
import { ChartNoAxesColumnIncreasing } from 'lucide-react';

import { MiniDistributionBars } from '@/components/charts/MiniDistributionBars';
import { PageHeader, PageShell } from '@/components/layout';

import { NativeAffiliateRow } from '@/features/ads';
import { THEME_AFFILIATE_MAP } from '@/features/ads/constants/affiliate-category';
import { resolveAffiliateBannersByVertical } from '@/features/ads/server';
import { TrackedMunicipalityThemeLink } from '@/features/municipalities';
import { ThemeRegionNav } from '@/features/theme-dashboard';
import { ALL_THEMES, isAreaTheme, THEME_SWITCHER_THEMES } from '@/features/theme-dashboard/server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

interface Params {
  themeSlug: string;
}

export const dynamic = 'force-dynamic';

/**
 * 全国の市区町村を比べるページ。slug は都道府県のテーマ名にそろえ、対応する市区町村テーマの指標をまとめて出す
 * (2026-10-31 オーナー決定 IA-REGION-THEME-01 の 4 段目。旧: 市区町村テーマ 29 個ごとのページ。旧 slug は middleware が 301)。
 */
function resolveTheme(themeSlug: string) {
  if (!isMunicipalityThemePageSlug(themeSlug)) return null;
  return ALL_THEMES.find((t) => t.themeKey === themeSlug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { themeSlug } = await params;
  const theme = resolveTheme(themeSlug);
  if (!theme) return {};
  // 題名に今の地域を入れる (2026-10-31 IA-REGION-THEME-01)
  const title = `市区町村別の${theme.title}`;
  const description = `${theme.title}を市・町・村のランキングで比較します。`;
  return {
    title,
    description,
    alternates: { canonical: hrefFor("municipality-theme", { themeSlug: theme.themeKey }) },
    ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
  };
}

export default async function MunicipalityThemePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { themeSlug } = await params;
  const theme = resolveTheme(themeSlug);
  if (!theme) notFound();

  const themeVertical = THEME_AFFILIATE_MAP[theme.themeKey];
  const [itemsOrNull, nativeBanners] = await Promise.all([
    Promise.all(municipalityMetricKeysForPrefectureTheme(theme.themeKey).map((key) => readMunicipalityRankingItem(key))),
    // 写像が無い slug は汎用の案件 (2026-10-31)
    resolveAffiliateBannersByVertical(themeVertical, 8).catch(() => []),
  ]);
  const items = itemsOrNull.filter((item) => item !== null);

  return (
    <PageShell>
      {/* パンくずの各段と右端のアイコンから地域・テーマを Sheet で選ぶ (テーマのページと同じ部品・2026-10-31) */}
      <ThemeRegionNav
        themeKey={theme.themeKey}
        themes={THEME_SWITCHER_THEMES}
        hasAreaPages={isAreaTheme(theme.themeKey)}
        hasMunicipalityPages={isAreaTheme(theme.themeKey)}
        scopeHrefs={scopeHrefsForPrefectureTheme(theme.themeKey)}
        current="municipalities"
      />
      <PageHeader
        title={`市区町村別の${theme.title}`}
        stats={`${items.length} 指標`}
      />

      {items.length === 0 ? (
        <div
          role="status"
          className="border border-border bg-muted/20 p-5 text-sm text-muted-foreground"
        >
          配信用データを準備しています。しばらくしてから再度ご確認ください。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <TrackedMunicipalityThemeLink
              key={item.rankingKey}
              href={hrefFor("municipality-ranking", { rankingKey: item.rankingKey })}
              label={
                item.subtitle ? `${item.title}（${item.subtitle}）` : item.title
              }
              className="block"
            >
              <h3 className="font-semibold text-foreground">
                {item.subtitle ? `${item.title}（${item.subtitle}）` : item.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
              {item.distribution && item.distribution.length > 0 && (
                <MiniDistributionBars
                  bins={item.distribution}
                  className="mt-3"
                />
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {/* 総数 (ハブの「N 自治体を比較」) ではなく、この指標で値のある自治体の数 */}
                {item.latestYear.yearName}・値のある
                {item.valueCount.toLocaleString('ja-JP')}自治体
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <ChartNoAxesColumnIncreasing className="size-4" aria-hidden />
                ランキング
              </p>
            </TrackedMunicipalityThemeLink>
          ))}
        </div>
      )}

      {/* ネイティブアフィリエイト枠 (テーマ slug → vertical。写像が無ければ描画しない) */}
      {nativeBanners.length > 0 && (
        <div className="mt-8">
          <NativeAffiliateRow
            banners={nativeBanners}
            position="municipality-theme-native"
            trackingCategory={`municipality-theme-${theme.themeKey}`}
            variant="three-up"
          />
        </div>
      )}

      <aside className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        比較対象は市・町・村です。政令指定都市の行政区と、個別自治体ではない集約行は除外しています。
      </aside>
    </PageShell>
  );
}
