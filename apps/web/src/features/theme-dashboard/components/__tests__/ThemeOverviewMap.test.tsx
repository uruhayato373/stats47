import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mapProps } = vi.hoisted(() => ({ mapProps: vi.fn() }));
vi.mock('next/dynamic', () => ({
  default: () => (props: unknown) => {
    mapProps(props);
    return <div>都道府県地図</div>;
  },
}));

import { ThemeOverviewMap } from '../ThemeOverviewMap';

import type { ThemeIndicatorData } from '../../types';

const data = {
  rankingItem: { title: '割合', unit: '%' },
  rankingValues: [],
} as unknown as ThemeIndicatorData;
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('比較用地図の読み込み', () => {
  it('軽量地図だけを読み、県選択に限定する', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'Topology', objects: {} }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const view = render(
      <ThemeOverviewMap data={data} selectedCode="13000" onSelect={vi.fn()} />
    );
    await waitFor(() =>
      expect(mapProps.mock.lastCall?.[0].topology).toEqual({
        type: 'Topology',
        objects: {},
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/prefecture.topojson',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(mapProps.mock.lastCall?.[0].enableDrilldown).toBe(false);
    const signal = fetchMock.mock.calls[0][1].signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('失敗時は表へ案内し、再読み込みを実行できる', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'Topology', objects: {} }),
      });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <ThemeOverviewMap data={data} selectedCode={null} onSelect={vi.fn()} />
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      '数値は一覧表で確認できます'
    );
    await user.click(screen.getByRole('button', { name: '再読み込み' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
