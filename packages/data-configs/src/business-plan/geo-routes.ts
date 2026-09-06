import { BUSINESS_PLAN_M1_GEO_ANALYSES, BUSINESS_PLAN_M1_X_POSTS } from './m1';

/** Geoの公開・索引・リダイレクトを同じ集合から決定する。 */
export const GEO_STAGES = ['population', 'overlap', 'audit'] as const;
export const GEO_PREF_CODES = Array.from({ length: 47 }, (_, i) =>
  String(i + 1).padStart(2, '0')
);
export const GEO_ANALYSIS_SLUGS = BUSINESS_PLAN_M1_GEO_ANALYSES.map(
  (a) => a.slug
);
export const GEO_STAGE_LANDINGS = [
  ...new Set(
    BUSINESS_PLAN_M1_X_POSTS.map((p) => p.canonicalUrl).filter((path) =>
      /^\/geo\/[^/]+\/\d{2}\/(population|overlap|audit)$/.test(path)
    )
  ),
];
export const GEO_INDEXABLE_ROUTES = [
  '/geo',
  '/geo/compare',
  '/geo/method',
  '/geo/data-catalog',
  ...GEO_ANALYSIS_SLUGS.map((slug) => `/geo/${slug}`),
  ...GEO_STAGE_LANDINGS,
];

export function resolveGeoStageRoute(
  path: string
):
  | { kind: 'landing'; canonical: string }
  | { kind: 'redirect'; canonical: string; prefCode: string; stage: string }
  | null {
  const match = path.match(/^\/geo\/([^/]+)\/(\d{2})\/([^/]+)$/);
  if (!match) return null;
  const [, slug, prefCode, stage] = match;
  if (
    !GEO_ANALYSIS_SLUGS.some((s) => s === slug) ||
    !GEO_PREF_CODES.includes(prefCode) ||
    !GEO_STAGES.some((s) => s === stage)
  )
    return null;
  return GEO_STAGE_LANDINGS.includes(path)
    ? { kind: 'landing', canonical: path }
    : { kind: 'redirect', canonical: `/geo/${slug}`, prefCode, stage };
}
