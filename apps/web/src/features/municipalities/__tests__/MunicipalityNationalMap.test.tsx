import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MunicipalityNationalMap } from '../components/MunicipalityNationalMap';

/** 守る意図: 全国の形データは地図が画面に入るまで読まない。読めないときは枠を残さず閉じる */
vi.mock('@/features/ranking/widgets', () => ({ RankingMapChartClient: () => <div data-testid="map" /> }));

let intersect: (entries: Array<{ isIntersecting: boolean }>) => void;
const props = { title: 'A', unit: '円', decimalPlaces: 0, visualization: {} as never, values: [] };

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof intersect) {
        intersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
    callback();
    return 1;
  });
  vi.stubGlobal('cancelIdleCallback', () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MunicipalityNationalMap', () => {
  it('画面に入るまで形データを読まず、入ったら地図を描く', async () => {
    const fetchMock = vi.fn(async () => new Response('{"type":"Topology"}'));
    vi.stubGlobal('fetch', fetchMock);
    render(<MunicipalityNationalMap {...props} />);
    expect(fetchMock).not.toHaveBeenCalled();
    intersect([{ isIntersecting: true }]);
    await waitFor(() => expect(screen.getByTestId('map')).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith('/municipalities.topojson');
  });

  it('読めなければ節ごと出さない', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    const { container } = render(<MunicipalityNationalMap {...props} />);
    intersect([{ isIntersecting: true }]);
    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });
});
