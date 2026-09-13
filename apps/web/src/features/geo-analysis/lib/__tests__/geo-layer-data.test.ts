import { GEO_LAYERS } from '@stats47/data-configs/business-plan';
import { describe, expect, it } from 'vitest';

import { buildGeoCardPreview } from '../geo-card-preview';
import { projectGeoLayer } from '../geo-layer-data';

import { geoArtifactBundleFixture } from './geo-artifact-bundle-fixture';

import type { GeoAnalysisPrefDetail } from '@stats47/gis';

describe('standalone GIS does not imply cross-analysis results', () => {
  for (const layer of GEO_LAYERS)
    it(`projects only ${layer.kind}`, () => {
      const detail = geoArtifactBundleFixture(layer.sourceAnalysis).get(
        'pref/13'
      ) as GeoAnalysisPrefDetail;
      const before = JSON.stringify(detail);
      const projected = projectGeoLayer(layer.slug, detail)!;
      expect(projected.kind).toBe(layer.kind);
      expect(projected).not.toHaveProperty('pointMeshIds');
      if (projected.kind === 'population') {
        expect(projected).not.toHaveProperty('points');
        expect(projected.meshes[0]).toHaveLength(7);
      } else expect(projected).not.toHaveProperty('meshes');
      const preview = buildGeoCardPreview(
        detail,
        { rings: [], bounds: [139, 35, 140, 36] },
        [],
        layer.kind
      );
      if (layer.kind === 'population') {
        expect(preview.points).toEqual([]);
        expect(preview.paths.length).toBeGreaterThan(0);
      } else {
        expect(preview.paths).toEqual([]);
        expect(preview.points.length).toBeGreaterThan(0);
      }
      expect(JSON.stringify(detail)).toBe(before);
    });
  it('rejects wrong representations and unknown layers', () => {
    const detail = geoArtifactBundleFixture('population-flood-risk').get(
      'pref/13'
    ) as GeoAnalysisPrefDetail;
    expect(projectGeoLayer('population-mesh', detail)).toBeNull();
    expect(projectGeoLayer('../flood', detail)).toBeNull();
  });
});
