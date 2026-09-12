import { readFile } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
vi.mock('@/features/geo-analysis', async () => {
  return await import('@/features/geo-analysis/lib/geo-source-thumbnail');
});
vi.mock('@/lib/metadata/ogp-image', () => ({
  ogpImageUrl: (key: string) => 'https://storage.stats47.jp/' + key,
}));

const request = (dataId = 'L01', variant = 'wide') =>
  GET(
    new Request('http://localhost/api/geo/thumbnail/' + dataId + '/' + variant),
    {
      params: Promise.resolve({ dataId, variant }),
    }
  );
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.resetAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GIS thumbnail development reader', () => {
  it('prefers the local preview when available', async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from('local preview'));
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(await response.text()).toBe('local preview');
  });
  it('lets another PC use R2 when local staging is absent', async () => {
    vi.mocked(readFile).mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ENOENT' })
    );
    const response = await request();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://storage.stats47.jp/app/geo/datasets/L01/thumbnails/26/wide.webp'
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('does not hide other filesystem failures with a remote redirect', async () => {
    vi.mocked(readFile).mockRejectedValue(
      Object.assign(new Error('denied'), { code: 'EACCES' })
    );
    const response = await request();
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
  });
  it.each([
    ['unknown', 'wide'],
    ['L01', '../manifest'],
  ])('rejects invalid scope %s/%s', async (id, variant) => {
    expect((await request(id, variant)).status).toBe(404);
    expect(readFile).not.toHaveBeenCalled();
  });
  it('keeps the preview API disabled in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect((await request()).status).toBe(404);
    expect(readFile).not.toHaveBeenCalled();
  });
});
