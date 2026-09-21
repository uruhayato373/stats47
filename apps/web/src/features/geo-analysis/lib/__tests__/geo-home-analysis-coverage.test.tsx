import { GEO_ANALYSES, GEO_LAYERS } from '@stats47/data-configs/business-plan';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import { GeoAnalysisCards } from '../../components/GeoAnalysisCards';
import {
  GEO_HOME_ANALYSIS_NAV_ITEMS,
  GEO_HOME_LAYER_NAV_ITEMS,
  getGeoHomeLayerNavItems,
} from '../geo-home-copy';
import { loadGeoAnalysisPrefBundle } from '../load-geo-analysis-evidence';

vi.mock('../load-geo-analysis-evidence', () => ({
  loadGeoAnalysisPrefBundle: vi.fn().mockResolvedValue(null),
}));
vi.mock('../geo-card-geography', () => ({
  getPrefectureCardGeography: () => ({
    rings: [],
    bounds: [134.2, 34.1, 135.5, 35.7],
  }),
  geoCardLandmarks: () => [],
}));

it('keeps every published analysis reachable when previews cover only the original three', async () => {
  const html = renderToStaticMarkup(await GeoAnalysisCards());
  for (const analysis of GEO_ANALYSES) {
    expect(html).toContain(`href="/geo/${analysis.slug}"`);
  }
  expect(loadGeoAnalysisPrefBundle).toHaveBeenCalledTimes(3);
  expect(html).toContain('地図プレビューを取得できませんでした');
});

it('reads the default prefecture (兵庫県) for previews and links to the canonical analysis URL', async () => {
  const html = renderToStaticMarkup(await GeoAnalysisCards());
  for (const call of vi.mocked(loadGeoAnalysisPrefBundle).mock.calls) {
    expect(call[1]).toBe('28');
  }
  expect(html).not.toContain('pref=');
  expect(html).not.toContain('東京');
});

it('provides one compact navigation label for every published analysis', () => {
  expect(GEO_HOME_ANALYSIS_NAV_ITEMS).toHaveLength(GEO_ANALYSES.length);
  expect(
    new Set(GEO_HOME_ANALYSIS_NAV_ITEMS.map((item) => item.href)).size
  ).toBe(GEO_ANALYSES.length);
  expect(
    GEO_HOME_ANALYSIS_NAV_ITEMS.every((item) => item.label.length <= 20)
  ).toBe(true);
});

it('provides one direct navigation item for every public single-layer GIS', () => {
  expect(GEO_HOME_LAYER_NAV_ITEMS).toHaveLength(GEO_LAYERS.length);
  expect(GEO_HOME_LAYER_NAV_ITEMS).toEqual(
    GEO_LAYERS.map((layer) => ({
      id: layer.slug,
      label: layer.name,
      href: `/geo/layers/${layer.slug}`,
    }))
  );
});

it('marks exactly one single-layer GIS as the current page', () => {
  const items = getGeoHomeLayerNavItems('population-mesh');
  expect(items.filter((item) => item.active)).toEqual([
    expect.objectContaining({ id: 'population-mesh' }),
  ]);
});
