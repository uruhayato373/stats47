import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadGeoSourceItem } from '@/features/geo-analysis';

import { GET } from './route';

vi.mock('@/features/geo-analysis', () => ({ loadGeoSourceItem: vi.fn() }));

const assetKey = 'gis/mlit-ksj/L01/26/prefectures/01.topojson';
const fetchMock = vi.fn<typeof fetch>();
const request = (assetIndex = '0', file = assetKey) => GET(
  new Request('https://stats47.jp/api/geo/source/L01/' + assetIndex + '?file=' + encodeURIComponent(file)),
  { params: Promise.resolve({ dataId: 'L01', assetIndex }) }
);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('R2_PUBLIC_FETCH_URL', 'https://storage.stats47.jp/');
  vi.mocked(loadGeoSourceItem).mockResolvedValue({
    dataId: 'L01', version: '26', sourceUrl: 'https://nlftp.mlit.go.jp/',
    assets: [{ key: assetKey, label: '北海道', bytes: 2 }],
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Geo source proxy cache contract', () => {
  it.each([
    ['../1', assetKey],
    ['99', assetKey],
    ['0', 'gis/mlit-ksj/private/secret.topojson'],
  ])('does not cache invalid asset requests: %s / %s', async (index, file) => {
    const response = await request(index, file);
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not cache an unavailable source manifest', async () => {
    vi.mocked(loadGeoSourceItem).mockResolvedValue(null);
    const response = await request();
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([404, 503])('does not cache upstream status %s', async (status) => {
    fetchMock.mockResolvedValue(new Response('unavailable', { status }));
    const response = await request();
    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('returns a non-cacheable 502 when the upstream connection fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Connection closed'));
    const response = await request();
    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('keeps the successful public object stream cacheable', async () => {
    const upstream = new Response('{}');
    fetchMock.mockResolvedValue(upstream);
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.body).toBe(upstream.body);
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400');
    expect(await response.text()).toBe('{}');
    expect(fetchMock).toHaveBeenCalledWith('https://storage.stats47.jp/' + assetKey,
      expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
