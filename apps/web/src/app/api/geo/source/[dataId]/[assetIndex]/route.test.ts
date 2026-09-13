import { gzipSync, gunzipSync } from 'node:zlib';

import { getR2Client } from '@stats47/r2-storage/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';


import { loadGeoSourceItem } from '@/features/geo-analysis';

import { GET } from './route';

vi.mock('@/features/geo-analysis', () => ({ loadGeoSourceItem: vi.fn() }));
vi.mock('@stats47/r2-storage/server', () => ({ getR2Client: vi.fn() }));

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
  vi.stubEnv('CLOUDFLARE_WORKERS', 'false');
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

  it('does not cache the local public mirror stream', async () => {
    const upstream = new Response('{}');
    fetchMock.mockResolvedValue(upstream);
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.body).toBe(upstream.body);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).toBe('{}');
    expect(fetchMock).toHaveBeenCalledWith('https://storage.stats47.jp/' + assetKey,
      expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('streams compressed R2 bytes without expanding or refetching them over HTTP', async () => {
    vi.stubEnv('CLOUDFLARE_WORKERS', 'true');
    const original = JSON.stringify({ type: 'FeatureCollection', features: [], padding: 'x'.repeat(250_000) });
    const bytes = gzipSync(original);
    const body = new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } });
    const arrayBuffer = vi.fn(() => { throw Error('Must not buffer nationwide GIS'); });
    const get = vi.fn().mockResolvedValue({ body, size: bytes.length, httpEtag: '"stored-gzip"', httpMetadata: { contentEncoding: 'gzip' }, arrayBuffer });
    vi.mocked(getR2Client).mockResolvedValue({ get } as unknown as Awaited<ReturnType<typeof getR2Client>>);
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.body).toBe(body);
    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-length')).toBe(String(bytes.length));
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const received = Buffer.from(await response.arrayBuffer());
    expect(received).toEqual(bytes);
    expect(gunzipSync(received).toString()).toBe(original);
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledWith(assetKey);
  });

  it.each(['missing', 'unavailable'])('fails closed when the production binding is %s', async (state) => {
    vi.stubEnv('CLOUDFLARE_WORKERS', 'true');
    if (state === 'missing') vi.mocked(getR2Client).mockResolvedValue({ get: vi.fn().mockResolvedValue(null) } as unknown as Awaited<ReturnType<typeof getR2Client>>);
    else vi.mocked(getR2Client).mockRejectedValue(new Error('binding unavailable'));
    const response = await request();
    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
