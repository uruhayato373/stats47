import { notFound, permanentRedirect } from 'next/navigation';

import { StatTile, StatTileGrid } from '@stats47/components';
import { hrefFor } from '@stats47/data-configs/content/href';
import {
  MUNICIPALITY_THEME_CATALOGS,
  isMunicipalityPrefectureRankingKey,
  municipalityMetricKeysForPrefectureTheme,
  scopeHrefsForPrefectureTheme,
} from '@stats47/data-configs/geo-scope';
import { MUNICIPALITY_THEME_FOR_PREFECTURE_THEME } from '@stats47/data-configs/geo-scope/scope-theme-map';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';
import { buildMunicipalityPrefectureRanking, municipalityRankingDisplayTitle } from '@stats47/ranking';

import Link from '@/components/atoms/SiteLink';
import { PageHeader, PageShell, PanelGrid } from '@/components/layout';

import { getCityRouteContext } from '@/features/area-profile';
import { getSpecialWardCodes, readMunicipalityRanking } from '@/features/municipalities/server';
import { ThemeRegionNav } from '@/features/theme-dashboard';
import { ALL_THEMES, isAreaTheme, prefectureCityOptions, THEME_SWITCHER_THEMES } from '@/features/theme-dashboard/server';

import { UrlPolicy } from '@/lib/url-policy';

import { AREA_CATEGORY_TO_THEME } from '@/config/legacy-theme-redirects';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ areaCode: string; cityCode: string; themeSlug: string }>;
}

/**
 * 1 つの市区町村×テーマのページ (2026-10-31 オーナー決定 IA-REGION-THEME-01 の 3 段目)。
 *
 * 都道府県のテーマに対応する市区町村テーマ (`MUNICIPALITY_THEME_FOR_PREFECTURE_THEME`) の指標ごとに、この市区町村の値と、
 * 県内・全国の順位を数値タイルで並べる。約 45,900 ページになるので、最初は noindex でサイトマップにも入れない
 * (人口の多い市から段階的に出す。オーナー決定)。旧 市区町村×分野の URL は middleware が対応するテーマへ 301 する。
 * R2 を読むので generateStaticParams を持たせない (nextjs-ssg-preservation.md)。
 */
export const revalidate = 86400;

function resolvePage(areaCode: string, cityCode: string, themeSlug: string) {
  const context = getCityRouteContext(areaCode, cityCode);
  const theme = ALL_THEMES.find((t) => t.themeKey === themeSlug);
  const municipalitySlug = MUNICIPALITY_THEME_FOR_PREFECTURE_THEME[themeSlug];
  const municipalityTheme = municipalitySlug ? MUNICIPALITY_THEME_CATALOGS[municipalitySlug] : undefined;
  if (!context || !theme || !isAreaTheme(themeSlug) || !municipalityTheme || municipalityTheme.status !== 'active') {
    return null;
  }
  return { context, theme, municipalityTheme };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, cityCode, themeSlug } = await params;
  const resolved = resolvePage(areaCode, cityCode, themeSlug);
  if (!resolved) return { title: 'ページが見つかりません', robots: 'noindex, follow' };
  const { context, theme } = resolved;
  // 「兵庫県西宮市の労働・賃金」(同じ名前の市区町村があるので県名を付け、間の空白は外す)
  const title = `${context.pref.areaName}${context.cityShortName}の${theme.title}`;
  return {
    title,
    description: `${context.pref.areaName}${context.cityShortName}の${theme.title}の指標を、県内・全国の順位とあわせて並べます。`,
    // 約 45,900 ページの中身の薄いページを一度に出さない (オーナー決定 2026-10-31)。人口の多い市から段階的に外す
    robots: 'noindex, follow',
    alternates: { canonical: hrefFor('city-theme', { areaCode, cityCode, themeSlug }) },
  };
}

export default async function CityThemePage({ params }: PageProps) {
  const { areaCode, cityCode, themeSlug } = await params;
  const resolved = resolvePage(areaCode, cityCode, themeSlug);
  if (!resolved) {
    // 旧 市区町村×分野の URL が middleware を通らずに届いたとき (開発環境など) も同じ移り先へ
    const legacyTheme = AREA_CATEGORY_TO_THEME[themeSlug];
    const context = getCityRouteContext(areaCode, cityCode);
    if (context && UrlPolicy.cityCategory.isKnown(themeSlug)) {
      permanentRedirect(
        legacyTheme && Object.hasOwn(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME, legacyTheme)
          ? hrefFor('city-theme', { areaCode, cityCode, themeSlug: legacyTheme })
          : context.cityBasePath
      );
    }
    notFound();
  }
  const { context, theme } = resolved;
  const specialWardCodes = getSpecialWardCodes();

  const loaded = await Promise.all(
    // 対応する市区町村テーマ (1 対 1 の対応と、市区町村テーマ側から寄せた分) の指標をまとめる (4 段目でそろえた)
    municipalityMetricKeysForPrefectureTheme(theme.themeKey).map(async (rankingKey) => {
      const { item, values } = await readMunicipalityRanking(rankingKey).catch(() => ({ item: null, values: null }));
      if (!item || !values) return null;
      const row = values.values.find((v) => v.areaCode === cityCode);
      if (!row) return null;
      const prefectureRow = buildMunicipalityPrefectureRanking(values.values, areaCode, specialWardCodes)?.rows.find(
        (r) => r.areaCode === cityCode
      );
      return { rankingKey, item, values, row, prefectureRank: prefectureRow?.prefectureRank ?? null };
    })
  );
  const metrics = loaded.filter((entry) => entry !== null);
  const prefectureCities = prefectureCityOptions(areaCode);

  return (
    <PageShell>
      <PanelGrid>
        <ThemeRegionNav
          themeKey={theme.themeKey}
          themes={THEME_SWITCHER_THEMES}
          areaContext={{ areaCode }}
          hasAreaPages
          hasMunicipalityPages
          scopeHrefs={scopeHrefsForPrefectureTheme(theme.themeKey)}
          current="city"
          city={{ code: cityCode, name: context.cityShortName }}
          prefectureCities={prefectureCities}
        />
        <PageHeader title={`${context.pref.areaName}${context.cityShortName}の${theme.title}`} stats={`${metrics.length} 指標`} />

        {metrics.length === 0 ? (
          <p role="status" className="p-4 text-sm text-muted-foreground">
            {context.cityShortName}の値を準備しています。しばらくしてから再度ご確認ください。
          </p>
        ) : (
          <StatTileGrid>
            {metrics.map(({ rankingKey, item, values, row, prefectureRank }) => (
              <StatTile
                key={rankingKey}
                label={
                  <Link
                    href={
                      isMunicipalityPrefectureRankingKey(rankingKey)
                        ? hrefFor('municipality-pref-ranking', { rankingKey, prefCode: areaCode })
                        : `${hrefFor('municipality-ranking', { rankingKey })}?pref=${areaCode}`
                    }
                    className="hover:underline"
                  >
                    {municipalityRankingDisplayTitle(item)}
                  </Link>
                }
                value={row.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                unit={formatUnitForDisplay(values.unit) || undefined}
                meta={[
                  values.yearName,
                  prefectureRank ? `県内 ${prefectureRank}位` : null,
                  `全国 ${row.rank.toLocaleString('ja-JP')}位 / ${values.count.toLocaleString('ja-JP')}`,
                ]
                  .filter(Boolean)
                  .join('・')}
              />
            ))}
          </StatTileGrid>
        )}
      </PanelGrid>
    </PageShell>
  );
}
