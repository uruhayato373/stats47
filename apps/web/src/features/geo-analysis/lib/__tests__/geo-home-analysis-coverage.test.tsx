import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import { GeoAnalysisCards } from '../../components/GeoAnalysisCards';
import { loadGeoAnalysisPrefBundle } from '../load-geo-analysis-evidence';

vi.mock('../load-geo-analysis-evidence', () => ({
  loadGeoAnalysisPrefBundle: vi.fn().mockResolvedValue(null),
}));
vi.mock('../geo-card-geography', () => ({
  getTokyoMainlandGeography: () => ({ rings: [], bounds: [139, 35, 140, 36] }),
  geoCardLandmarks: () => [],
}));

it('keeps every published analysis reachable when previews cover only the original three', async () => {
  const html = renderToStaticMarkup(await GeoAnalysisCards());
  for (const analysis of GEO_ANALYSES) {
    expect(html).toContain(`/geo/${analysis.slug}`);
  }
  expect(loadGeoAnalysisPrefBundle).toHaveBeenCalledTimes(3);
  expect(html).toContain('地図プレビューを取得できませんでした');
});
