import { notFound } from 'next/navigation';

import { fetchPrefectures } from '@stats47/area';
import { ChartPanel } from '@stats47/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { hrefFor } from '@stats47/data-configs/content/href';
import {
  MUNICIPALITY_THEME_CATALOGS,
  isMunicipalityPrefectureRankingKey,
  scopeHrefsForPrefectureTheme,
} from '@stats47/data-configs/geo-scope';
import { MUNICIPALITY_THEME_FOR_PREFECTURE_THEME } from '@stats47/data-configs/geo-scope/scope-theme-map';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';
import {
  buildMunicipalityPrefectureRanking,
  municipalityPrefectureAreaLabel,
  municipalityRankingDisplayTitle,
} from '@stats47/ranking';

import Link from '@/components/atoms/SiteLink';
import { PageHeader, PageShell, PanelGrid } from '@/components/layout';

import { getSpecialWardCodes, readMunicipalityRanking } from '@/features/municipalities/server';
import { isAreaTheme, ThemeRegionNav } from '@/features/theme-dashboard';
import { ALL_THEMES, prefectureCityOptions, THEME_SWITCHER_THEMES } from '@/features/theme-dashboard/server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

interface Params {
  areaCode: string;
  themeSlug: string;
}

/** 1 指標で見せる県内の上位の数 (残りは県内ランキングのページで見る) */
const TOP_ROWS = 3;

/**
 * 県内の市区町村を比べるページ (2026-10-31 オーナー決定 IA-REGION-THEME-01 の 2 段目)。
 *
 * 都道府県のテーマに対応する市区町村テーマ (`MUNICIPALITY_THEME_FOR_PREFECTURE_THEME`) の指標ごとに、県内の上位を並べ、
 * 県内ランキングのページ (県別の独立ページがある指標) か、全国の市区町村ランキングへつなぐ。
 * 値は R2 の市区町村ランキング (県内ランキングのページと同じ `buildMunicipalityPrefectureRanking`) から組む。
 * R2 を読むので generateStaticParams を持たせない (nextjs-ssg-preservation.md)。
 */
export const revalidate = 86400;

function resolvePage({ areaCode, themeSlug }: Params) {
  const prefecture = fetchPrefectures().find((p) => p.prefCode === areaCode);
  const theme = ALL_THEMES.find((t) => t.themeKey === themeSlug);
  const municipalitySlug = MUNICIPALITY_THEME_FOR_PREFECTURE_THEME[themeSlug];
  const municipalityTheme = municipalitySlug ? MUNICIPALITY_THEME_CATALOGS[municipalitySlug] : undefined;
  if (!prefecture || !theme || !isAreaTheme(themeSlug) || !municipalityTheme || municipalityTheme.status !== 'active') {
    return null;
  }
  return { prefecture, theme, municipalityTheme };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = resolvePage(await params);
  if (!resolved) return {};
  const { prefecture, theme } = resolved;
  const title = `${prefecture.prefName}の市区町村別の${theme.title}`;
  const description = `${prefecture.prefName}の市区町村を${theme.title}の指標で比べます。指標ごとに県内の上位と、県内ランキングへの入口を並べます。`;
  return {
    title,
    description,
    alternates: { canonical: hrefFor('area-theme-cities', { areaCode: prefecture.prefCode, themeSlug: theme.themeKey }) },
    ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
  };
}

export default async function AreaThemeCitiesPage({ params }: { params: Promise<Params> }) {
  const resolved = resolvePage(await params);
  if (!resolved) notFound();
  const { prefecture, theme, municipalityTheme } = resolved;
  const specialWardCodes = getSpecialWardCodes();

  const loaded = await Promise.all(
    municipalityTheme.metricKeys.map(async (rankingKey) => {
      const { item, values } = await readMunicipalityRanking(rankingKey).catch(() => ({ item: null, values: null }));
      if (!item || !values) return null;
      const ranking = buildMunicipalityPrefectureRanking(values.values, prefecture.prefCode, specialWardCodes);
      if (!ranking) return null;
      return { rankingKey, item, values, ranking };
    })
  );
  const metrics = loaded.filter((entry) => entry !== null);

  return (
    <PageShell>
      <PanelGrid>
        <ThemeRegionNav
          themeKey={theme.themeKey}
          themes={THEME_SWITCHER_THEMES}
          areaContext={{ areaCode: prefecture.prefCode }}
          hasAreaPages
          hasMunicipalityPages
          scopeHrefs={scopeHrefsForPrefectureTheme(theme.themeKey)}
          current="prefecture-municipalities"
          prefectureCities={prefectureCityOptions(prefecture.prefCode)}
        />
        <PageHeader
          title={`${prefecture.prefName}の市区町村別の${theme.title}`}
          stats={`${metrics.length} 指標`}
        />

        {metrics.length === 0 ? (
          <p role="status" className="p-4 text-sm text-muted-foreground">
            {prefecture.prefName}の市区町村の値を準備しています。しばらくしてから再度ご確認ください。
          </p>
        ) : (
          <PanelGrid className="@md:grid-cols-2">
            {metrics.map(({ rankingKey, item, values, ranking }) => {
              const areaLabel = municipalityPrefectureAreaLabel(ranking.hasSpecialWards);
              const unit = formatUnitForDisplay(values.unit);
              // 県別の独立ページがある指標はそこへ、無い指標は全国の市区町村ランキングを県で絞って開く
              const href = isMunicipalityPrefectureRankingKey(rankingKey)
                ? hrefFor('municipality-pref-ranking', { rankingKey, prefCode: prefecture.prefCode })
                : `${hrefFor('municipality-ranking', { rankingKey })}?pref=${prefecture.prefCode}`;
              return (
                <ChartPanel
                  key={rankingKey}
                  title={municipalityRankingDisplayTitle(item)}
                  description={`${values.yearName}・県内 ${ranking.rows.length.toLocaleString('ja-JP')} ${areaLabel}`}
                  footer={
                    <Link href={href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                      {prefecture.prefName}の{areaLabel}ランキングを見る
                    </Link>
                  }
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">県内</TableHead>
                        <TableHead>{areaLabel}</TableHead>
                        <TableHead className="text-right!">値</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranking.rows.slice(0, TOP_ROWS).map((row) => (
                        <TableRow key={row.areaCode}>
                          <TableCell className="tabular-nums">{row.prefectureRank}位</TableCell>
                          {/* 値の名前は「兵庫県 南あわじ市」の形。県のページなので県名を外す */}
                          <TableCell>{row.areaName.replace(`${prefecture.prefName} `, '')}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })} {unit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ChartPanel>
              );
            })}
          </PanelGrid>
        )}
      </PanelGrid>
    </PageShell>
  );
}
