import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/features/theme-dashboard', () => ({ useThemePrefecture: vi.fn() }));
vi.mock('../GeoSpatialEvidenceExplorer', () => ({ GeoSpatialEvidenceExplorer: vi.fn(() => <div data-testid="snow-map" />) }));
import { useThemePrefecture } from '@/features/theme-dashboard';

import { manifestFixture } from '../../lib/__tests__/geo-manifest-fixture';
import { snowNationalValues } from '../GeoSnowDesignationSummary';
import { GeoSpatialEvidenceExplorer } from '../GeoSpatialEvidenceExplorer';
import { ThemeGeoSnowDesignationClient } from '../ThemeGeoSnowDesignationClient';

import type { GeoAnalysisSnapshot } from '@stats47/gis';
const snapshot: GeoAnalysisSnapshot = {
  schemaVersion: 1, slug: 'population-snow-designation', generatedAt: '2026-09-11T00:00:00Z', dataVersion: '合成テスト', geography: 'prefecture', title: '合成テスト', question: '合成テスト', primaryMetricKey: 'designatedCenterPopulationShare',
  metrics: [
    { key: 'population2020', label: '2020年基準人口', unit: '人', format: 'integer', description: '合成' },
    { key: 'designatedCenterPopulation', label: '指定区域内人口', unit: '人', format: 'integer', description: '合成' },
    { key: 'designatedCenterPopulationShare', label: '指定区域内割合', unit: '%', format: 'percent1', description: '合成' },
  ],
  rows: PREFECTURE_LIST_2DIGIT.map((pref, i) => ({ areaCode: `${pref.code}000`, areaName: pref.name, rank: 47-i, values: { population2020: i === 0 ? 100.0001 : 200.0001, designatedCenterPopulation: i === 0 ? 50.0001 : 0, designatedCenterPopulationShare: i === 0 ? 50.0001/100.0001*100 : 0 } })),
  summary: { observationCount: 47, medianValue: 0, topAreaCodes: ['01000'], bottomAreaCodes: ['47000'] }, method: ['合成'], sources: [], caveats: [], dataQuality: { expectedAreas: 47, actualAreas: 47, missingAreaCodes: [], inputCounts: { meshes: 47 }, coverageNote: '合成' },
};
const manifest = { ...manifestFixture('population-flood-risk'), slug: 'population-snow-designation' };
const setSelected = vi.fn();
function select(code: string | null) {
  vi.mocked(useThemePrefecture).mockReturnValue({ hasProvider: true, selectedPrefectureCode: code, selectedAreaName: snapshot.rows.find(r => r.areaCode === code)?.areaName ?? null, setSelected });
}
beforeEach(() => { vi.clearAllMocks(); select(null); });
it('全国は分母を合計し、都道府県率の単純平均を使わない', () => {
  const values = snowNationalValues(snapshot);
  expect(values.population2020).toBe(9300.0047);
  expect(values.designatedCenterPopulation).toBe(50.0001);
  expect(values.designatedCenterPopulationShare).toBe(50.0001/9300.0047*100);
});
it('全国と47県を県コード順で表示し、地図の取得は県選択後に行う', () => {
  render(<ThemeGeoSnowDesignationClient analysisId="snow-test" snapshot={snapshot} manifest={manifest} />);
  const rows = within(screen.getByRole('table')).getAllByRole('row');
  expect(rows).toHaveLength(49);
  expect(rows[1]).toHaveTextContent('全国');
  expect(rows[2]).toHaveTextContent('北海道');
  expect(rows[48]).toHaveTextContent('沖縄県');
  expect(GeoSpatialEvidenceExplorer).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '新潟県' }));
  expect(setSelected).toHaveBeenCalledWith('15000', '新潟県');
});
it('47県の共通セレクタに追従し、県固定の地図と同じ県の表を表示する', () => {
  const view = render(<ThemeGeoSnowDesignationClient analysisId="snow-test" snapshot={snapshot} manifest={manifest} />);
  for (const pref of PREFECTURE_LIST_2DIGIT) {
    select(`${pref.code}000`);
    view.rerender(<ThemeGeoSnowDesignationClient analysisId="snow-test" snapshot={snapshot} manifest={manifest} />);
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveTextContent(pref.name);
    expect(GeoSpatialEvidenceExplorer).toHaveBeenLastCalledWith(expect.objectContaining({ initialPrefCode: pref.code, fixedPrefecture: true, syncUrl: false }), undefined);
  }
  select(null);
  view.rerender(<ThemeGeoSnowDesignationClient analysisId="snow-test" snapshot={snapshot} manifest={manifest} />);
  expect(screen.queryByTestId('snow-map')).not.toBeInTheDocument();
});
