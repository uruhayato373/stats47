import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import { GeoAnalysisCards } from '../../components/GeoAnalysisCards';
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
