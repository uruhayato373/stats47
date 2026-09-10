import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/theme-dashboard', () => ({ useThemePrefecture: vi.fn() }));
vi.mock('../GeoSpatialEvidenceExplorer', () => ({
  GeoSpatialEvidenceExplorer: vi.fn(() => <div data-testid="station-map" />),
}));

import { useThemePrefecture } from '@/features/theme-dashboard';

import { manifestFixture } from '../../lib/__tests__/geo-manifest-fixture';
import { GeoSpatialEvidenceExplorer } from '../GeoSpatialEvidenceExplorer';
import { ThemeGeoStationAccessClient } from '../ThemeGeoStationAccessClient';

import type { GeoAnalysisSnapshot } from '@stats47/gis';

const snapshot: GeoAnalysisSnapshot = {
  schemaVersion: 1,
  slug: 'population-station-access',
  generatedAt: '2026-09-05T00:00:00.000Z',
  dataVersion: '合成テストデータ',
  geography: 'prefecture',
  title: '合成テスト',
  question: '合成テスト',
  primaryMetricKey: 'stationAccessShare2050',
  metrics: [
    {
      key: 'stationAccessShare2020',
      label: '2020年駅800m圏人口比率',
      unit: '%',
      format: 'percent1',
      description: 'テスト',
    },
    {
      key: 'stationAccessShare2050',
      label: '2050年駅800m圏人口比率',
      unit: '%',
      format: 'percent1',
      description: 'テスト',
    },
    {
      key: 'accessiblePopulation2050',
      label: '2050年駅800m圏人口',
      unit: '人',
      format: 'integer',
      description: 'テスト',
    },
  ],
  rows: PREFECTURE_LIST_2DIGIT.map((pref, index) => ({
    areaCode: `${pref.code}000`,
    areaName: pref.name,
    rank: 47 - index,
    values: {
      stationAccessShare2020: index + 0.2,
      stationAccessShare2050: index + 0.5,
      accessiblePopulation2050: index === 46 ? null : 1000 + index,
    },
  })),
  summary: {
    observationCount: 47,
    medianValue: 23.5,
    topAreaCodes: ['47000'],
    bottomAreaCodes: ['01000'],
  },
  method: ['合成テスト'],
  sources: [
    {
      name: '合成資料',
      url: 'https://example.org/station-test',
      datasetId: 'test',
      version: '1',
      license: 'CC BY 4.0',
    },
  ],
  caveats: ['合成テスト'],
  dataQuality: {
    expectedAreas: 47,
    actualAreas: 47,
    missingAreaCodes: [],
    inputCounts: { meshes: 47 },
    coverageNote: '合成テスト',
  },
};
const manifest = manifestFixture('population-station-access');
const setSelected = vi.fn();

function select(code: string | null) {
  vi.mocked(useThemePrefecture).mockReturnValue({
    hasProvider: true,
    selectedPrefectureCode: code,
    selectedAreaName:
      snapshot.rows.find((row) => row.areaCode === code)?.areaName ?? null,
    setSelected,
  });
}

describe('テーマの駅アクセス分析', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    select(null);
  });

  it('全国表示は47県の原集計を県コード順に表示し、地図は県選択後に読み込む', () => {
    render(
      <ThemeGeoStationAccessClient
        analysisId="station-test"
        snapshot={snapshot}
        manifest={manifest}
      />
    );
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(48);
    expect(rows[1]).toHaveTextContent('北海道');
    expect(rows[1]).toHaveTextContent('0.2%');
    expect(rows[1]).toHaveTextContent('0.5%');
    expect(rows[1]).toHaveTextContent('1,000人');
    expect(rows[47]).toHaveTextContent('沖縄県');
    expect(
      within(rows[47]!).getByRole('cell', { name: '—' })
    ).toBeInTheDocument();
    expect(GeoSpatialEvidenceExplorer).not.toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: '駅アクセスの分析詳細を見る' })
    ).toHaveAttribute('href', '/geo/population-station-access');
    expect(
      screen.getByRole('link', { name: '沖縄県の地点・検算データ' })
    ).toHaveAttribute('href', '/geo/data/population-station-access/47');
    fireEvent.click(screen.getByRole('button', { name: '兵庫県の地図を表示' }));
    expect(setSelected).toHaveBeenCalledWith('28000', '兵庫県');
  });

  it('共通の県選択に地図と集計が追従し、埋込地図はURLを書き換えない', () => {
    select('28000');
    const view = render(
      <ThemeGeoStationAccessClient
        analysisId="station-test"
        snapshot={snapshot}
        manifest={manifest}
      />
    );
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(
      2
    );
    expect(screen.getByRole('table')).toHaveTextContent('兵庫県');
    expect(screen.getByRole('table')).toHaveTextContent('27.5%');
    expect(GeoSpatialEvidenceExplorer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        slug: 'population-station-access',
        initialPrefCode: '28',
        initialView: 'overlap',
        fixedPrefecture: true,
        syncUrl: false,
        manifest,
      }),
      undefined
    );
    select('01000');
    view.rerender(
      <ThemeGeoStationAccessClient
        analysisId="station-test"
        snapshot={snapshot}
        manifest={manifest}
      />
    );
    expect(screen.getByRole('table')).toHaveTextContent('北海道');
    expect(screen.getByRole('table')).not.toHaveTextContent('兵庫県');
    expect(GeoSpatialEvidenceExplorer).toHaveBeenLastCalledWith(
      expect.objectContaining({ initialPrefCode: '01', syncUrl: false }),
      undefined
    );
    select(null);
    view.rerender(
      <ThemeGeoStationAccessClient
        analysisId="station-test"
        snapshot={snapshot}
        manifest={manifest}
      />
    );
    expect(screen.queryByTestId('station-map')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(
      48
    );
  });
});
