import type { ReactNode } from 'react';

import { buildFloodPrefDetail, type GeoAnalysisPrefDetail } from '@stats47/gis';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics/events', () => ({
  trackGeoRegionSelect: vi.fn(),
  trackGeoMapInteraction: vi.fn(),
}));
vi.mock('../../actions', () => ({ fetchGeoDetailAction: vi.fn() }));
vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({ detail }: { detail: GeoAnalysisPrefDetail }) => (
      <div data-testid="map">
        {detail.areaCode}:{detail.generatedAt}
      </div>
    ),
}));
vi.mock('@stats47/components/atoms/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select
      aria-label="県"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

import { fetchGeoDetailAction } from '../../actions';
import { manifestFixture } from '../../lib/__tests__/geo-manifest-fixture';
import { GeoSpatialEvidenceExplorer } from '../GeoSpatialEvidenceExplorer';

const versionA = '2026-09-05T00:00:00.000Z';
const versionB = '2026-09-06T00:00:00.000Z';
function detail(pref: string, generatedAt: string) {
  return buildFloodPrefDetail({
    generatedAt,
    areaCode: `${pref}000`,
    areaName: pref === '13' ? '東京都' : '兵庫県',
    meshes: [
      {
        meshId: '53394525',
        areaCode: `${pref}000`,
        longitude: 139.70625,
        latitude: 35.6041665,
        bounds: [139.7, 35.6, 139.7125, 35.608333],
        population2020: 100,
        population2050: 80,
        floodDepthClass: 2,
      },
    ],
  });
}
function props(generatedAt = versionA) {
  return {
    slug: 'population-flood-risk' as const,
    analysisId: 'test',
    dataVersion: generatedAt,
    initialPrefCode: '13',
    initialView: 'population' as const,
    manifest: { ...manifestFixture('population-flood-risk'), generatedAt },
  };
}

describe('Geo表示境界の県・段階・証跡版', () => {
  it('同一ページへのNext query遷移のprops更新で、県と段階を同期する', async () => {
    vi.mocked(fetchGeoDetailAction).mockImplementation(
      async (_slug, pref, expected) => detail(pref, expected.generatedAt)
    );
    const view = render(<GeoSpatialEvidenceExplorer {...props()} />);
    await waitFor(() =>
      expect(screen.getByTestId('map')).toHaveTextContent(`13000:${versionA}`)
    );
    view.rerender(
      <GeoSpatialEvidenceExplorer
        {...props()}
        initialPrefCode="28"
        initialView="audit"
      />
    );
    expect(screen.getByRole('combobox', { name: '県' })).toHaveValue('28');
    expect(
      screen.getByRole('tab', { name: '3. 数値の確かめ方' })
    ).toHaveAttribute('aria-selected', 'true');
    await waitFor(() =>
      expect(fetchGeoDetailAction).toHaveBeenLastCalledWith(
        'population-flood-risk',
        '28',
        expect.objectContaining({ generatedAt: versionA })
      )
    );
    expect(
      screen.getByRole('link', { name: 'この県の地点・検算データを見る' })
    ).toHaveAttribute('href', '/geo/data/population-flood-risk/28');
  });
  it('県cacheは同版のみ再利用し、manifest更新後は旧地図を表示しない', async () => {
    const fetchMock = vi.mocked(fetchGeoDetailAction);
    fetchMock.mockClear();
    fetchMock.mockImplementation(async (_slug, pref, expected) =>
      detail(pref, expected.generatedAt)
    );
    const view = render(<GeoSpatialEvidenceExplorer {...props()} />);
    await waitFor(() =>
      expect(screen.getByTestId('map')).toHaveTextContent(versionA)
    );
    fireEvent.change(screen.getByRole('combobox', { name: '県' }), {
      target: { value: '28' },
    });
    await waitFor(() =>
      expect(screen.getByTestId('map')).toHaveTextContent('28000')
    );
    fireEvent.change(screen.getByRole('combobox', { name: '県' }), {
      target: { value: '13' },
    });
    await waitFor(() =>
      expect(screen.getByTestId('map')).toHaveTextContent('13000')
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    view.rerender(<GeoSpatialEvidenceExplorer {...props(versionB)} />);
    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('map')).toHaveTextContent(versionB)
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenLastCalledWith('population-flood-risk', '13', {
      generatedAt: versionB,
      sha256: props(versionB).manifest.stages[0]!.outputs[12]!.sha256,
    });
  });
});
