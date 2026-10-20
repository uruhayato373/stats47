import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
const storage = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('../../../../.claude/scripts/media/lib/storage.mjs', () => ({ readVerified: storage.read }));
import { GET } from '@/app/api/template-samples/[id]/route';
import { RANKING_SAMPLE_ASSETS } from '@/lib/template-ranking-assets';
describe('ranking basic-form PNG endpoint', () => {
  let savedPng: Buffer;
  beforeAll(async () => {
    savedPng = await sharp({ create: { width: 1080, height: 1350, channels: 3, background: '#ffffff' } }).png().toBuffer();
  });
  beforeEach(() => { storage.read.mockReset(); });
  it.each(['bars', 'table', 'tile-map'] as const)('serves the exact saved %s PNG without fetching live data or rendering', async (kind) => {
    const id = 'maximum-temperature-' + kind;
    storage.read.mockResolvedValue(savedPng);
    const response = await GET(new Request('http://localhost/api/template-samples/' + id), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(storage.read).toHaveBeenCalledExactlyOnceWith(RANKING_SAMPLE_ASSETS[kind].png);
    const actual = Buffer.from(await response.arrayBuffer());
    expect(actual).toEqual(savedPng);
    expect(await sharp(actual).metadata()).toMatchObject({ width: 1080, height: 1350 });
  });
  it.each(['unknown', 'toString', '__proto__'])('never accepts arbitrary sample path %s', async (id) => {
    const response = await GET(new Request('http://localhost/api/template-samples/' + id), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(404);
    expect(storage.read).not.toHaveBeenCalled();
  });
  it.each(['maximum-temperature-bars', 'maximum-temperature-table', 'maximum-temperature-tile-map'])('%s fails when the saved PNG cannot be verified, without regeneration or a reference-image fallback', async (id) => {
    storage.read.mockRejectedValue(Error('saved PNG missing or SHA mismatch'));
    const response = await GET(new Request('http://localhost/api/template-samples/' + id), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).not.toBe('image/png');
    expect(storage.read).toHaveBeenCalledTimes(1);
  });
});
