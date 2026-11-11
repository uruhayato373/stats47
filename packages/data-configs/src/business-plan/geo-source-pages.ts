import data from '../../../../data/geo/source-pages/pages.json';

/**
 * Authored reading guides. Versions refer to the GIS registry, not the current year.
 * 記録の正本は台帳 `geo.source-pages` (data/geo/source-pages/pages.json + Schema)。ここは型を付けて export するだけ。
 * 配列の並びが公開と監査の順なので、台帳の並びのまま出す。
 */
export type GeoSourceField = {
  key: string;
  label: string;
  description: string;
  unit?: string;
  alternateUnit?: { property: string; value: string; unit: string };
  values?: Record<string, string>;
  /** Some source files have distinct schemas (e.g. primary/secondary medical areas). */
  onlyWhenPresent?: true;
  /** A source may store zero for unpublished values or for a value recorded on another feature. */
  requiredCodes?: { key: string; values: string[]; fallback: string }[];
};
export type GeoSourcePageContent = {
  dataId: string;
  version: string;
  summary: string;
  period: string;
  coverage: string;
  reading: string;
  limitations: string;
  fields: GeoSourceField[];
  relatedIds: string[];
  sourceCheckedAt: string;
  additionalSources?: { label: string; url: string }[];
};

export const GEO_SOURCE_PAGES: GeoSourcePageContent[] = data.pages as GeoSourcePageContent[];

export function findGeoSourcePage(dataId: string, version?: string) {
  return GEO_SOURCE_PAGES.find(
    (page) => page.dataId === dataId && page.version === version
  );
}
