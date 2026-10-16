import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
const fixture = vi.hoisted(() => ({
  objects: new Map<string, Buffer>(),
  register: vi.fn(),
  assess: vi.fn(),
  readOriginal: vi.fn(),
  broken: false,
}));
vi.mock('../../../../.claude/scripts/media/lib/storage.mjs', () => ({
  mediaStore: () => ({
    get: async (key: string) =>
      fixture.objects.has(key)
        ? fixture.broken
          ? Buffer.from('bad')
          : fixture.objects.get(key)
        : null,
    put: async (key: string, bytes: Buffer) => {
      fixture.objects.set(key, bytes);
    },
  }),
  readVerified: vi.fn(),
  readMediaObject: fixture.readOriginal,
}));
vi.mock(
  '../../../../.claude/scripts/media/lib/workspace.mjs',
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
      ...actual,
      imageById: () => ({
        id: 'IMG-' + 'a'.repeat(24),
        owner: 'note/test',
        file: 'chart.png',
        revision: 'current',
        basis: 'basis',
        templateId: 'ranking',
        policy: '',
        inputFiles: [],
        original: { provider: 'r2-private', sha256: 'a'.repeat(64) },
      }),
      registerCandidate: fixture.register,
      assessImage: fixture.assess,
    };
  }
);
import { importImage, saveOriginalReview } from '@/lib/server/content-quality';
describe('candidate upload preserves exact image and evidence before registration', () => {
  beforeEach(() => {
    fixture.objects.clear();
    fixture.register.mockClear();
    fixture.assess.mockClear();
    fixture.readOriginal.mockReset();
    fixture.broken = false;
  });
  const evidence = {
    renderer: 'deterministic renderer v1',
    sourceData: 'fixed fixture values, year 2024',
    changes: 'increase label size',
  };
  async function file() {
    const bytes = await sharp({
      create: { width: 32, height: 24, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer();
    return new File([new Uint8Array(bytes)], 'chart.png', {
      type: 'image/png',
    });
  }
  it('requires meaningful generation evidence before writing', async () => {
    await expect(
      importImage('id', 'current', await file(), {
        renderer: '',
        sourceData: '',
        changes: '',
      })
    ).rejects.toThrow('生成根拠');
    expect(fixture.objects.size).toBe(0);
  });
  it('cannot mark an inaccessible or changed original as reviewed', async () => {
    const review = {
      status: 'pass' as const,
      reason: '原寸・320pxと数値を確認',
      original: true,
      mobile: true,
      data: true,
    };
    fixture.readOriginal.mockRejectedValueOnce(new Error('原本の照合に失敗'));
    await expect(saveOriginalReview('id', 'current', review)).rejects.toThrow(
      '照合'
    );
    expect(fixture.assess).not.toHaveBeenCalled();
    await saveOriginalReview('id', 'current', review);
    expect(fixture.assess).toHaveBeenCalledOnce();
    fixture.assess.mockClear();
    fixture.readOriginal.mockClear();
    await expect(saveOriginalReview('id', 'old', review)).rejects.toThrow(
      '画像が変わりました'
    );
    expect(fixture.readOriginal).not.toHaveBeenCalled();
    expect(fixture.assess).not.toHaveBeenCalled();
    await saveOriginalReview('id', 'current', {
      ...review,
      status: 'needs-revision',
    });
    expect(fixture.readOriginal).not.toHaveBeenCalled();
    expect(fixture.assess).toHaveBeenCalledOnce();
  });
  it('registers only after both immutable R2 objects have been read back', async () => {
    await importImage('id', 'current', await file(), evidence);
    expect(fixture.objects.size).toBe(2);
    expect(fixture.register).toHaveBeenCalledOnce();
    const candidate = fixture.register.mock.calls[0][3];
    expect(candidate.width).toBe(32);
    expect(candidate.height).toBe(24);
    const saved = JSON.parse(
      fixture.objects.get(candidate.input.key)!.toString()
    );
    expect(saved.supplied).toEqual(evidence);
    expect(saved.imageSha256).toBe(candidate.storage.sha256);
  });
  it('rejects stale writers and corrupt bytes without registering candidates', async () => {
    await expect(
      importImage('id', 'outdated', await file(), evidence)
    ).rejects.toThrow('制作条件');
    await expect(
      importImage(
        'id',
        'current',
        new File(['not an image'], 'chart.png'),
        evidence
      )
    ).rejects.toThrow();
    expect(fixture.register).not.toHaveBeenCalled();
  });
  it('does not register if the saved bytes fail verification', async () => {
    fixture.broken = true;
    await expect(
      importImage('id', 'current', await file(), evidence)
    ).rejects.toThrow('照合');
    expect(fixture.register).not.toHaveBeenCalled();
  });
  it('preserves the original SVG and rejects external resources before R2 writes', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="white"/></svg>';
    await importImage(
      'id',
      'current',
      new File([svg], 'chart.svg', { type: 'image/svg+xml' }),
      evidence
    );
    const candidate = fixture.register.mock.calls[0][3];
    expect(candidate.storage.key).toMatch(/\.svg$/);
    expect(fixture.objects.get(candidate.storage.key)!.toString()).toBe(svg);
    fixture.objects.clear();
    fixture.register.mockClear();
    await expect(
      importImage(
        'id',
        'current',
        new File(
          ['<svg><image href="https://example.com/image"/></svg>'],
          'chart.svg',
          { type: 'image/svg+xml' }
        ),
        evidence
      )
    ).rejects.toThrow();
    expect(fixture.objects.size).toBe(0);
    expect(fixture.register).not.toHaveBeenCalled();
  });
});
