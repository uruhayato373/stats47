import { notFound } from 'next/navigation';

import { getMetricConfig } from '@stats47/data-configs';
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

import { AdRow, composeAdRows } from '@/features/ads';
import { TrackedMunicipalityThemeLink } from '@/features/municipalities';
import { ThemeRegionNav } from '@/features/theme-dashboard';
import {
  buildThemeDescription,
  buildThemeTitle,
  ALL_THEMES,
  isAreaTheme,
  THEME_SWITCHER_THEMES,
} from '@/features/theme-dashboard/server';

import { THEME_END } from '@/lib/google-adsense';
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
  // 題と説明文は単位に関係なく theme-seo.ts で作る (2026-11-12 オーナー決定)。指標名はこのページが実際に出す市区町村の指標の先頭 2 つ
  // (台帳から引くので R2 は読まない)。都道府県のテーマの指標名を使うと、ページに無い指標 (出生率など) を題がうたってしまう
  const labels = [
    ...new Set(
      municipalityMetricKeysForPrefectureTheme(theme.themeKey)
        .map((key) => getMetricConfig(key)?.title?.replace(/[（(].*$/, '').trim())
        .filter((title): title is string => Boolean(title)),
    ),
  ].slice(0, 2);
  const title = buildThemeTitle({ scope: 'municipalities', themeTitle: theme.title, labels });
  const description = buildThemeDescription({ scope: 'municipalities', base: theme.description, labels });
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

  const items = (
    await Promise.all(municipalityMetricKeysForPrefectureTheme(theme.themeKey).map((key) => readMunicipalityRankingItem(key)))
  ).filter((item) => item !== null);

  // 広告の段 (2026-11-12 オーナー決定): アフィリエイトを止め、AdSense 1 つを本文の幅いっぱい (上限 580px) に出す。
  // ユニットは都道府県のテーマのページの最後と同じテーマ専用の stats47-theme-end (1 ページに 1 回だけ使う)
  const [rowCells] = composeAdRows([['adsense']], [THEME_END], []);
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
      {rowCells.length > 0 && (
        <div className="mt-8">
          <AdRow cells={rowCells} position="municipality-theme-row-1" trackingCategory={`municipality-theme-${theme.themeKey}`} wide />
        </div>
      )}

      <aside className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        比較対象は市・町・村です。政令指定都市の行政区と、個別自治体ではない集約行は除外しています。
      </aside>
    </PageShell>
  );
}
