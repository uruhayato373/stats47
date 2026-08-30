import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ImageObjectStore,
  StoredImageObject,
} from '@stats47/r2-storage/image-pipeline';
import sharp from 'sharp';

import {
  aiBackgroundCacheKey,
  computeAiBackgroundCacheFingerprint,
  createAiBackgroundCache,
  readPublishedBackgroundState,
  resolveCachedAiBackground,
} from '../blog-ai-background-cache';
import { blogImageKeys } from '../blog-image-generation';
import { sha256 } from '../image-generation-manifest';

const temporaryDirectories: string[] = [];
const PROMPT_HASH = `sha256-${'a'.repeat(64)}`;
const NORMALIZER_HASH = 'b'.repeat(64);

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'stats47-ai-cache-'));
  temporaryDirectories.push(directory);
  return directory;
}

type StoredImageFixture = Omit<StoredImageObject, 'contentEncoding'> & {
  contentEncoding?: string | null;
};

function makeStore(initial: Record<string, StoredImageFixture> = {}): {
  store: ImageObjectStore;
  objects: Map<string, StoredImageObject>;
} {
  const objects = new Map<string, StoredImageObject>(
    Object.entries(initial).map(([key, object]) => [
      key,
      { ...object, contentEncoding: object.contentEncoding ?? null },
    ])
  );
  const store: ImageObjectStore = {
    get: vi.fn(async (key) => objects.get(key) ?? null),
    head: vi.fn(async (key) => {
      const object = objects.get(key);
      if (!object) return null;
      const { body: _body, ...head } = object;
      return head;
    }),
    put: vi.fn(async (options) => {
      if (options.ifNoneMatch === '*' && objects.has(options.key)) {
        throw new Error('PreconditionFailed');
      }
      objects.set(options.key, {
        body: Buffer.from(options.body),
        etag: `"${sha256(options.body).slice(0, 32)}"`,
        contentType: options.contentType,
        contentEncoding: options.contentEncoding ?? null,
        contentLength: options.body.byteLength,
        metadata: { ...options.metadata },
      });
    }),
    delete: vi.fn(async ({ key }) => {
      objects.delete(key);
    }),
  };
  return { store, objects };
}

function identity(
  overrides: Partial<{
    prompt: string;
    promptHash: string;
    model: string;
    promptVersion: string;
    normalizerHash: string;
  }> = {}
) {
  return {
    prompt: 'draw a map without text',
    promptHash: PROMPT_HASH,
    model: 'gemini-test',
    promptVersion: 'v1',
    normalizerHash: NORMALIZER_HASH,
    ...overrides,
  };
}

async function jpegFixture(
  width = 1200,
  height = 630,
  colour = '#3151d3'
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: colour,
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('blog AI background content-addressed cache', () => {
  it('keys cache by prompt, model, prompt version and normalizer', () => {
    const base = computeAiBackgroundCacheFingerprint(identity());
    expect(base).toMatch(/^[0-9a-f]{64}$/);
    expect(
      computeAiBackgroundCacheFingerprint(identity({ prompt: 'other' }))
    ).not.toBe(base);
    expect(
      computeAiBackgroundCacheFingerprint(identity({ model: 'other' }))
    ).not.toBe(base);
    expect(
      computeAiBackgroundCacheFingerprint(
        identity({ normalizerHash: 'c'.repeat(64) })
      )
    ).not.toBe(base);
  });

  it('persists each AI success before downstream failure and charges zero on rerun', async () => {
    const { store, objects } = makeStore();
    const fingerprint = computeAiBackgroundCacheFingerprint(identity());
    const generate = vi.fn(async () => Buffer.from('raw-ai-result'));
    const normalizedJpeg = await jpegFixture();
    const normalize = vi.fn(async () => normalizedJpeg);

    const firstCache = createAiBackgroundCache({
      projectRoot: temporaryDirectory(),
      store,
    });
    await expect(
      (async () => {
        await resolveCachedAiBackground({
          cache: firstCache,
          fingerprint,
          generate,
          normalize,
        });
        throw new Error('injected render failure');
      })()
    ).rejects.toThrow('injected render failure');

    expect(objects.has(aiBackgroundCacheKey(fingerprint))).toBe(true);
    const secondCache = createAiBackgroundCache({
      projectRoot: temporaryDirectory(),
      store,
    });
    const rerun = await resolveCachedAiBackground({
      cache: secondCache,
      fingerprint,
      generate,
      normalize,
    });

    expect(rerun.buffer).toEqual(normalizedJpeg);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(normalize).toHaveBeenCalledTimes(1);
    expect(store.put).toHaveBeenCalledWith(
      expect.objectContaining({
        key: aiBackgroundCacheKey(fingerprint),
        contentType: 'image/jpeg',
        ifNoneMatch: '*',
        metadata: expect.objectContaining({
          'stats47-cache-fingerprint': fingerprint,
          'stats47-sha256': sha256(normalizedJpeg),
        }),
      })
    );
  });

  it('fails closed when immutable R2 cache MIME, size or SHA is inconsistent', async () => {
    const fingerprint = computeAiBackgroundCacheFingerprint(identity());
    const key = aiBackgroundCacheKey(fingerprint);
    const body = Buffer.from('cached');
    const { store } = makeStore({
      [key]: {
        body,
        etag: '"etag"',
        contentType: 'image/png',
        contentLength: body.byteLength + 1,
        metadata: {
          'stats47-cache-kind': 'blog-ai-background',
          'stats47-cache-fingerprint': fingerprint,
          'stats47-sha256': 'f'.repeat(64),
        },
      },
    });
    const cache = createAiBackgroundCache({
      projectRoot: temporaryDirectory(),
      store,
    });
    await expect(cache.read(fingerprint)).rejects.toThrow('cache契約');
  });

  it('decodes cached JPEG and rejects corrupt or wrong-sized self-consistent bytes', async () => {
    const fingerprint = computeAiBackgroundCacheFingerprint(identity());
    const key = aiBackgroundCacheKey(fingerprint);
    for (const body of [
      Buffer.from('not-a-jpeg'),
      await jpegFixture(600, 315),
    ]) {
      const { store } = makeStore({
        [key]: {
          body,
          etag: '"etag"',
          contentType: 'image/jpeg',
          contentLength: body.byteLength,
          metadata: {
            'stats47-cache-kind': 'blog-ai-background',
            'stats47-cache-fingerprint': fingerprint,
            'stats47-sha256': sha256(body),
          },
        },
      });
      const cache = createAiBackgroundCache({
        projectRoot: temporaryDirectory(),
        store,
      });
      await expect(cache.read(fingerprint)).rejects.toThrow(/decode|画像契約/);
    }
  });
});

describe('published AI background reuse via S3', () => {
  it('does not depend on custom-domain HEAD metadata exposure', async () => {
    const slug = 'article-a';
    const keys = blogImageKeys(slug);
    const backgroundBody = await jpegFixture();
    const backgroundSha = sha256(backgroundBody);
    const manifestBody = Buffer.from(
      JSON.stringify({
        assets: [{ key: keys.background, sha256: backgroundSha }],
        metadata: {
          background: {
            source: 'ai',
            promptHash: PROMPT_HASH,
            sha256: backgroundSha,
          },
        },
      })
    );
    const { store } = makeStore({
      [keys.manifest]: {
        body: manifestBody,
        etag: '"manifest"',
        contentType: 'application/json',
        contentLength: manifestBody.byteLength,
        metadata: { 'stats47-sha256': sha256(manifestBody) },
      },
      [keys.background]: {
        body: backgroundBody,
        etag: '"background"',
        contentType: 'image/jpeg',
        contentLength: backgroundBody.byteLength,
        metadata: {
          'stats47-sha256': backgroundSha,
          'stats47-manifest': keys.manifest,
        },
      },
    });
    const publicFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      })
    );

    await expect(
      readPublishedBackgroundState({
        store,
        slug,
        descriptor: {
          promptHash: PROMPT_HASH,
          legacyPromptHash: null,
        },
      })
    ).resolves.toEqual({
      source: 'ai',
      reusable: { buffer: backgroundBody, sha256: backgroundSha },
    });
    expect(publicFetch).not.toHaveBeenCalled();
    expect(store.get).toHaveBeenCalledWith(keys.manifest);
    expect(store.get).toHaveBeenCalledWith(keys.background);
    expect(store.head).not.toHaveBeenCalled();
  });

  it('rejects a self-consistent published background with wrong dimensions', async () => {
    const slug = 'article-b';
    const keys = blogImageKeys(slug);
    const backgroundBody = await jpegFixture(640, 360);
    const backgroundSha = sha256(backgroundBody);
    const manifestBody = Buffer.from(
      JSON.stringify({
        assets: [{ key: keys.background, sha256: backgroundSha }],
        metadata: {
          background: {
            source: 'ai',
            promptHash: PROMPT_HASH,
            sha256: backgroundSha,
          },
        },
      })
    );
    const { store } = makeStore({
      [keys.manifest]: {
        body: manifestBody,
        etag: '"manifest"',
        contentType: 'application/json',
        contentLength: manifestBody.byteLength,
        metadata: { 'stats47-sha256': sha256(manifestBody) },
      },
      [keys.background]: {
        body: backgroundBody,
        etag: '"background"',
        contentType: 'image/jpeg',
        contentLength: backgroundBody.byteLength,
        metadata: {
          'stats47-sha256': backgroundSha,
          'stats47-manifest': keys.manifest,
        },
      },
    });

    await expect(
      readPublishedBackgroundState({
        store,
        slug,
        descriptor: {
          promptHash: PROMPT_HASH,
          legacyPromptHash: null,
        },
      })
    ).rejects.toThrow('画像契約');
  });
});
