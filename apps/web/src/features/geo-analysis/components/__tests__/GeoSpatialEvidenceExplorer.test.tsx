import type { ReactNode } from 'react';

import { buildFloodPrefDetail, type GeoAnalysisPrefDetail } from '@stats47/gis';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics/events', () => ({
  trackGeoRegionSelect: vi.fn(),
  trackGeoMapInteraction: vi.fn(),
}));
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

import { manifestFixture } from '../../lib/__tests__/geo-manifest-fixture';
import { spatialAuditRows } from '../../lib/geo-spatial-evidence';
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

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});
const json = (value: unknown) => new Response(JSON.stringify(value));
// The explorer reads one prefecture from /api/geo/analysis/<slug>/<pref>?v=<generatedAt>&sha=<sha256>.
function respondWithDetail(url: unknown) {
  const { pathname, searchParams } = new URL(String(url), 'http://localhost');
  const pref = pathname.split('/').pop()!;
  return json(detail(pref, searchParams.get('v')!));
}
const detailUrl = (pref: string, generatedAt: string) =>
  `/api/geo/analysis/population-flood-risk/${pref}?${new URLSearchParams({
    v: generatedAt,
    sha: props(generatedAt).manifest.stages[0]!.outputs[Number(pref) - 1]!.sha256,
  })}`;

describe('Geo表示境界の県・段階・証跡版', () => {
  it('応答が止まったときは再読み込みへ戻り、遅着した旧応答を表示しない', async () => {
    vi.useFakeTimers();
    let resolveOld!: (value: Response) => void;
    fetchMock.mockReset();
    fetchMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockImplementationOnce(async () => json(detail('13', versionB)));
    const view = render(<GeoSpatialEvidenceExplorer {...props()} />);
    try {
      await act(() => vi.advanceTimersByTimeAsync(30_000));
      expect(screen.getByRole('alert')).toHaveTextContent('読み込めませんでした');
      await act(async () => fireEvent.click(screen.getByRole('button', { name: '再読み込み' })));
      expect(screen.getByTestId('map')).toHaveTextContent(versionB);
      await act(async () => resolveOld(json(detail('13', versionA))));
      expect(screen.getByTestId('map')).toHaveTextContent(versionB);
    } finally {
      view.unmount();
      vi.useRealTimers();
    }
  });

  it('同一ページへのNext query遷移のprops更新で、県と段階を同期する', async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url) => respondWithDetail(url));
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
    // Audit URLs open the overlap map; the audit block is always rendered below it.
    expect(
      screen.getByRole('tab', { name: '浸水包含の判定結果' })
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: /数値の確かめ方/ })).toBeNull();
    expect(
      screen.getByRole('heading', { name: '数値の確かめ方' })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(detailUrl('28', versionA))
    );
    expect(
      screen.getByRole('link', { name: 'この県の地点・検算データを見る' })
    ).toHaveAttribute('href', '/geo/data/population-flood-risk/28');
  });
  it('県cacheは同版のみ再利用し、manifest更新後は旧地図を表示しない', async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url) => respondWithDetail(url));
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
    expect(fetchMock).toHaveBeenLastCalledWith(detailUrl('13', versionB));
  });
  it('既定では県と表示段階をGeo canonical URLへ同期する', async () => {
    window.history.replaceState({}, '', '/geo/population-flood-risk');
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url) => respondWithDetail(url));
    render(<GeoSpatialEvidenceExplorer {...props()} />);
    await screen.findByTestId('map');
    fireEvent.change(screen.getByRole('combobox', { name: '県' }), {
      target: { value: '28' },
    });
    // Base UI の Tabs は click で切り替わる (Radix の mousedown ではない) ので user-event で操作する
    await userEvent.setup().click(
      screen.getByRole('tab', { name: '浸水包含の判定結果' })
    );
    expect(window.location.pathname).toBe('/geo/population-flood-risk');
    expect(new URLSearchParams(window.location.search).get('pref')).toBe('28');
    expect(new URLSearchParams(window.location.search).get('stage')).toBe(
      'overlap'
    );
    expect(window.location.hash).toBe('#spatial-evidence');
    expect(screen.getByRole('link', { name: 'この県・この表示を共有' }))
      .toHaveAttribute('href', '/geo/population-flood-risk?pref=28&stage=overlap');
  });
  it('タブに手順番号を付けず、検算は表示切替なしで地図の下に出す', async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url) => respondWithDetail(url));
    render(
      <GeoSpatialEvidenceExplorer {...props()} initialView="overlap" />
    );
    await screen.findByTestId('map');
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual(['人口の分布と変化', '浸水包含の判定結果']);
    for (const label of tabs) expect(label).not.toMatch(/^\d+\./);
    const audit = screen.getByTestId('spatial-audit');
    expect(audit).toHaveTextContent('数値の確かめ方');
    expect(audit).toHaveTextContent('全47県の途中データと県別集計を照合');
    // 検算の値は読み込んだ県別データ (spatialAuditRows) から作り、共通の数値タイル (StatTile) を
    // 数値タイルの格子 (StatTileGrid) に並べる。値を大きく見せる箱をこの部品の中で手組みしない。
    const grid = audit.querySelector('[data-slot-kind="stat-tile-grid"]');
    expect(grid).not.toBeNull();
    const tiles = [...grid!.querySelectorAll('[data-slot-kind="stat-tile"]')];
    expect(
      tiles.map((tile) => ({
        label: tile.querySelector('dt')?.textContent,
        value: tile.querySelectorAll('dd')[0]?.textContent,
        // 式の結果を値に、内訳の式を値の下の補足に出す (UI-FOLLOWUP-01)
        meta: tile.querySelectorAll('dd')[1]?.textContent,
      }))
    ).toEqual(spatialAuditRows(detail('13', versionA)));
    expect(tiles.map((tile) => tile.querySelectorAll('dd')[1]?.textContent)).toContain(
      spatialAuditRows(detail('13', versionA))[0]!.meta
    );
    for (const tile of tiles) expect(tile).not.toHaveClass('wrap-anywhere');
    expect(audit.querySelectorAll('p.tabular-nums')).toHaveLength(0);
  });

  it('GETが失敗（版不一致の404や通信断）したときは地図を出さず再読み込みへ戻る', async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(new Response('Not found', { status: 404 }));
    const view = render(<GeoSpatialEvidenceExplorer {...props()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('読み込めませんでした');
    expect(screen.queryByTestId('map')).toBeNull();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '再読み込み' })));
    expect(await screen.findByRole('alert')).toHaveTextContent('読み込めませんでした');
    view.unmount();
  });

  it('テーマ内では段階切替と外部県選択後もテーマURLを維持する', async () => {
    const themeUrl = '/themes/geographic-access?pref=13000#station-access';
    window.history.replaceState({}, '', themeUrl);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url) => respondWithDetail(url));
    const view = render(
      <GeoSpatialEvidenceExplorer
        {...props()}
        fixedPrefecture
        syncUrl={false}
      />
    );
    await screen.findByTestId('map');
    // Base UI の Tabs は click で切り替わる (Radix の mousedown ではない) ので user-event で操作する
    await userEvent.setup().click(
      screen.getByRole('tab', { name: '浸水包含の判定結果' })
    );
    expect(
      screen.getByRole('tab', { name: '浸水包含の判定結果' })
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
