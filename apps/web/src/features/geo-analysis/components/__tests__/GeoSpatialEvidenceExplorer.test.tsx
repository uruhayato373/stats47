import type { ReactNode } from 'react';

import { buildFloodPrefDetail, type GeoAnalysisPrefDetail } from '@stats47/gis';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('応答が止まったときは再読み込みへ戻り、遅着した旧応答を表示しない', async () => {
    vi.useFakeTimers();
    let resolveOld!: (value: GeoAnalysisPrefDetail) => void;
    vi.mocked(fetchGeoDetailAction)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockImplementationOnce(async () => detail('13', versionB));
    const view = render(<GeoSpatialEvidenceExplorer {...props()} />);
    try {
      await act(() => vi.advanceTimersByTimeAsync(30_000));
      expect(screen.getByRole('alert')).toHaveTextContent('読み込めませんでした');
      await act(async () => fireEvent.click(screen.getByRole('button', { name: '再読み込み' })));
      expect(screen.getByTestId('map')).toHaveTextContent(versionB);
      await act(async () => resolveOld(detail('13', versionA)));
      expect(screen.getByTestId('map')).toHaveTextContent(versionB);
    } finally {
      view.unmount();
      vi.useRealTimers();
    }
  });

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
  it('既定では県と表示段階をGeo canonical URLへ同期する', async () => {
    window.history.replaceState({}, '', '/geo/population-flood-risk');
    vi.mocked(fetchGeoDetailAction).mockImplementation(
      async (_slug, pref, expected) => detail(pref, expected.generatedAt)
    );
    render(<GeoSpatialEvidenceExplorer {...props()} />);
    await screen.findByTestId('map');
    fireEvent.change(screen.getByRole('combobox', { name: '県' }), {
      target: { value: '28' },
    });
    fireEvent.mouseDown(
      screen.getByRole('tab', { name: '3. 数値の確かめ方' }),
      {
        button: 0,
        ctrlKey: false,
      }
    );
    expect(window.location.pathname).toBe('/geo/population-flood-risk');
    expect(new URLSearchParams(window.location.search).get('pref')).toBe('28');
    expect(new URLSearchParams(window.location.search).get('stage')).toBe(
      'audit'
    );
    expect(window.location.hash).toBe('#spatial-evidence');
    expect(screen.getByRole('link', { name: 'この県・この表示を共有' }))
      .toHaveAttribute('href', '/geo/population-flood-risk?pref=28&stage=audit');
  });
  it('テーマ内では段階切替と外部県選択後もテーマURLを維持する', async () => {
    const themeUrl = '/themes/geographic-access?pref=13000#station-access';
    window.history.replaceState({}, '', themeUrl);
    vi.mocked(fetchGeoDetailAction).mockImplementation(
      async (_slug, pref, expected) => detail(pref, expected.generatedAt)
    );
    const view = render(
      <GeoSpatialEvidenceExplorer
        {...props()}
        fixedPrefecture
        syncUrl={false}
      />
    );
    await screen.findByTestId('map');
    fireEvent.mouseDown(
      screen.getByRole('tab', { name: '3. 数値の確かめ方' }),
      {
        button: 0,
        ctrlKey: false,
      }
    );
    expect(
      screen.getByRole('tab', { name: '3. 数値の確かめ方' })
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    ).toBe(themeUrl);
    view.rerender(
      <GeoSpatialEvidenceExplorer
        {...props()}
        initialPrefCode="28"
        fixedPrefecture
        syncUrl={false}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('map')).toHaveTextContent('28000')
    );
    expect(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    ).toBe(themeUrl);
    expect(
      screen.getByRole('link', { name: 'この県の地点・検算データを見る' })
    ).toHaveAttribute('href', '/geo/data/population-flood-risk/28');
  });
});
