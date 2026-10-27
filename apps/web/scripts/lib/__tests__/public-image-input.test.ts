import { describe, expect, it, vi } from 'vitest';
import { fetchPublicImageInput } from '../public-image-input';

describe('public image input recovery', () => {
  it('recovers a transient transport failure without dropping the input', async () => {
    const request = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValue(new Response('{"rows":47}'));
    const wait = vi.fn().mockResolvedValue(undefined);
    expect(await fetchPublicImageInput('https://storage.stats47.jp/input.json', request, wait)).toBe('{"rows":47}');
    expect(request).toHaveBeenCalledTimes(2);expect(wait).toHaveBeenCalledWith(1000);
  });
  it('stops after three temporary responses', async () => {
    const request = vi.fn().mockImplementation(() => Promise.resolve(new Response('', { status: 503 })));
    await expect(fetchPublicImageInput('https://storage.stats47.jp/input.json', request, async () => {})).rejects.toThrow('HTTP 503');
    expect(request).toHaveBeenCalledTimes(3);
  });
  it.each([400, 403, 404])('does not retry permanent HTTP %s', async (status) => {
    const request = vi.fn().mockResolvedValue(new Response('', { status }));
    await expect(fetchPublicImageInput('https://storage.stats47.jp/input.json', request, async () => {})).rejects.toThrow(`HTTP ${status}`);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
