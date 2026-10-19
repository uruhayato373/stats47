import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
const storage = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('../../../../.claude/scripts/media/lib/storage.mjs', () => ({ readVerified: storage.read }));
import { GET } from '@/app/api/template-samples/[id]/route';
import { RANKING_BAR_INPUT } from '@/lib/server/template-ranking-sample';
describe('ranking basic-form PNG endpoint', () => {
  beforeAll(async () => { await import('d3'); }, 30000);
  beforeEach(() => { storage.read.mockReset(); });
  it.each(['maximum-temperature-bars', 'maximum-temperature-table', 'maximum-temperature-tile-map'])('renders %s from the fixed SHA-verified snapshot as a 4:5 PNG', async (id) => {
    storage.read.mockResolvedValue(Buffer.from(JSON.stringify({
      metricKey: 'maximum-temperature', entityKind: 'prefecture',
      meta: {rowCount:47,areaCount:47,yearRange:['2024','2024'],generatedAt:'2026-10-19'},
      rows: Array.from({ length: 47 }, (_, i) => ({ rank: i + 1, areaCode: String(i + 1).padStart(2, '0') + '000', areaName: '県' + i, yearCode: '2024', yearName:'2024年',unit:'℃',value: 36 - i / 10 })),
    })));
    const response = await GET(new Request('http://localhost/api/template-samples/' + id), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(storage.read).toHaveBeenCalledExactlyOnceWith(RANKING_BAR_INPUT);
    expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({ width: 1080, height: 1350 });
  });
  it.each(['unknown', 'toString', '__proto__'])('never accepts arbitrary sample path %s', async (id) => {
    const response = await GET(new Request('http://localhost/api/template-samples/' + id), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(404);
    expect(storage.read).not.toHaveBeenCalled();
  });
  it.each(['maximum-temperature-bars', 'maximum-temperature-table', 'maximum-temperature-tile-map'])('%s fails explicitly when the fixed snapshot cannot be verified, with no reference-image fallback', async (id) => {
    storage.read.mockRejectedValue(Error('source mismatch'));
    const response = await GET(new Request('http://localhost/api/template-samples/' + id), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).not.toBe('image/png');
  });
});
