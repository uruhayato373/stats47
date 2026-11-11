import { LANDSLIDE_EXPOSURE_SOURCE as LANDSLIDE } from '../theme-catalog/landslide-exposure-source';
import { SNOW_DESIGNATION_SOURCE as SNOW } from '../theme-catalog/snow-designation-source';

/**
 * 出典を theme-catalog の *-source.ts に持つ Geo 分析の、出典に由来する 7 項目 (台帳 `geo.analyses` の themeSource)。
 * 台帳には書かず、読み込み口 (geo-analyses.ts) がここで埋める。slug は台帳のキーと一致しなければ throw する。
 */
export const GEO_ANALYSIS_THEME_SOURCES = {
  'snow-designation': () => ({
    slug: SNOW.slug,
    r2Key: `${SNOW.r2Root}/item.json`,
    evidenceManifestKey: `${SNOW.r2Root}/manifest.json`,
    detailR2KeyPattern: `${SNOW.r2Root}/pref/{NN}.json`,
    dataVersion: SNOW.dataVersion,
    sourceName: `${SNOW.snow.title}・${SNOW.population.title}`,
    sourceUrl: SNOW.snow.pageUrl,
    caveats: SNOW.notes,
  }),
  'landslide-exposure': () => ({
    slug: LANDSLIDE.slug,
    r2Key: `${LANDSLIDE.r2Root}/item.json`,
    evidenceManifestKey: `${LANDSLIDE.r2Root}/manifest.json`,
    detailR2KeyPattern: `${LANDSLIDE.r2Root}/pref/{NN}.json`,
    dataVersion: LANDSLIDE.dataVersion,
    sourceName: `${LANDSLIDE.a33.title}・${LANDSLIDE.population.title}・${LANDSLIDE.facilities.title}`,
    sourceUrl: LANDSLIDE.a33.pageUrl,
    caveats: LANDSLIDE.notes,
  }),
} as const;

export type GeoAnalysisThemeSource = keyof typeof GEO_ANALYSIS_THEME_SOURCES;
