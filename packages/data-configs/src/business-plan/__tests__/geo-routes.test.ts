import { describe, expect, it } from 'vitest';
import { BUSINESS_PLAN_M1_X_POSTS } from '../m1';
import {
  GEO_ANALYSIS_SLUGS,
  GEO_PREF_CODES,
  GEO_STAGES,
  GEO_STAGE_LANDINGS,
  GEO_INDEXABLE_ROUTES,
  resolveGeoStageRoute,
} from '../geo-routes';

describe('Geo canonical route projection', () => {
  it('全423途中URLを投稿着地またはquery付き分析への転送に一意分類する', () => {
    let count = 0;
    for (const slug of GEO_ANALYSIS_SLUGS)
      for (const pref of GEO_PREF_CODES)
        for (const stage of GEO_STAGES) {
          const path = `/geo/${slug}/${pref}/${stage}`;
          const route = resolveGeoStageRoute(path);
          expect(route?.kind).toBe(
            GEO_STAGE_LANDINGS.includes(path) ? 'landing' : 'redirect'
          );
          expect(GEO_INDEXABLE_ROUTES.includes(path)).toBe(
            route?.kind === 'landing'
          );
          count++;
        }
    expect(count).toBe(423);
  });
  it('空間分析9投稿は県・途中段階まで特定した索引可能URLに着地する', () => {
    const posts = BUSINESS_PLAN_M1_X_POSTS.filter(
      (p) => p.geoRole === 'cross-analysis'
    );
    expect(posts).toHaveLength(9);
    for (const post of posts)
      expect(resolveGeoStageRoute(post.canonicalUrl)?.kind).toBe('landing');
  });
  it('存在しないslug/県/段階を転送で救済しない', () => {
    for (const path of [
      '/geo/unknown/13/overlap',
      '/geo/population-flood-risk/00/overlap',
      '/geo/population-land-price/48/audit',
      '/geo/population-station-access/13/unknown',
    ]) {
      expect(resolveGeoStageRoute(path)).toBeNull();
    }
    expect(new Set(GEO_INDEXABLE_ROUTES).size).toBe(
      GEO_INDEXABLE_ROUTES.length
    );
  });
});
