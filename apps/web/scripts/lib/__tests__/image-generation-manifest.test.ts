import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ImageObjectStore } from '@stats47/r2-storage/image-pipeline';

import {
  BLOG_IMAGE_GENERATOR_SPEC,
  IMAGE_GENERATOR_SPECS,
  IMAGE_GENERATOR_TYPES,
  blogRendererSources,
} from '../../data/image-generator-registry';
import {
  adoptLegacyAiBackgroundSha256,
  createBlogImagePlan,
  publishedBlogSlugsFromIndex,
} from '../blog-image-generation';
import {
  buildImageGenerationManifest,
  calculateRendererHash,
  canonicalJson,
  compareImageGenerationManifest,
  createImageGenerationPlan,
  createImageGenerationPublishPlan,
  inspectRemoteImageGeneration,
  prioritizeChangedImageCandidates,
  selectChangedImageBatch,
  sha256,
} from '../image-generation-manifest';
import { inspectR2ImageGeneration } from '../image-generation-r2-inspector';

const temporaryDirectories: string[] = [];
const RENDERER_HASH = 'a'.repeat(64);

function makeTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'stats47-image-manifest-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('image generation fingerprint', () => {
  it('object key order and generatedAt do not change the deterministic plan', () => {
    const base = {
      generator: 'ranking-card',
      entityId: 'metric-a',
      manifestKey: 'app/ranking/metric-a/thumbnail.json',
      rendererHash: RENDERER_HASH,
      assets: [
        {
          key: 'app/ranking/metric-a/light.webp',
          variant: 'light',
          contentType: 'image/webp' as const,
          width: 640,
          height: 360,
        },
      ],
    };
    const first = createImageGenerationPlan({
      ...base,
      input: { title: 'A', values: [{ rank: 1, value: 10 }] },
    });
    const second = createImageGenerationPlan({
      ...base,
      input: { values: [{ value: 10, rank: 1 }], title: 'A' },
    });

    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(first).toEqual(second);
  });

  it('input, renderer, or asset contract changes the fingerprint', () => {
    const make = (
      input: unknown,
      rendererHash = 'renderer-a',
      contentType: `image/${string}` = 'image/webp'
    ) =>
      createImageGenerationPlan({
        generator: 'ranking-card',
        entityId: 'metric-a',
        manifestKey: 'app/ranking/metric-a/thumbnail.json',
        input,
        rendererHash,
        assets: [
          {
            key: 'app/ranking/metric-a/light.webp',
            variant: 'light',
            contentType,
            width: 640,
            height: 360,
          },
        ],
      });
    const base = make({ value: 1 });

    expect(make({ value: 2 }).fingerprint).not.toBe(base.fingerprint);
    expect(make({ value: 1 }, 'renderer-b').fingerprint).not.toBe(
      base.fingerprint
    );
    expect(make({ value: 1 }, 'renderer-a', 'image/png').fingerprint).not.toBe(
      base.fingerprint
    );
  });

  it('renderer dependency content changes the renderer hash', () => {
    const root = makeTemporaryDirectory();
    writeFileSync(join(root, 'a.ts'), 'export const value = 1;\n');
    const first = calculateRendererHash(root, ['a.ts']);
    writeFileSync(join(root, 'a.ts'), 'export const value = 2;\n');

    expect(calculateRendererHash(root, ['a.ts'])).not.toBe(first);
  });

  it('rejects ambiguous or non-JSON semantic inputs', () => {
    expect(() => canonicalJson({ value: undefined })).toThrow('未対応の型');
    expect(() => canonicalJson([Number.NaN])).toThrow('有限でない数値');
    expect(() => canonicalJson(new Date())).toThrow('plain object');
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalJson(cyclic)).toThrow('循環参照');
  });

  it('creates an exact publish plan only for isolated image staging', () => {
    const plan = createImageGenerationPlan({
      generator: 'ranking-card',
      entityId: 'metric-a',
      manifestKey: 'app/ranking/metric-a/thumbnail.json',
      input: { value: 1 },
      rendererHash: RENDERER_HASH,
      assets: [
        {
          key: 'app/ranking/metric-a/light.webp',
          variant: 'light',
          contentType: 'image/webp',
          width: 640,
          height: 360,
        },
      ],
    });
    const root = makeTemporaryDirectory();
    const assetPath = join(root, 'light.webp');
    writeFileSync(assetPath, 'image-bytes');
    const manifest = buildImageGenerationManifest({
      plan,
      assetFiles: new Map([[plan.assets[0].key, assetPath]]),
      metadata: {},
      generatedAt: '2026-07-26T00:00:00.000Z',
    });
    expect(
      createImageGenerationPublishPlan({
        generator: 'ranking-card',
        stageRoot: '.local/image-staging/ranking-cards',
        items: [
          {
            plan,
            manifest,
            expectedRemoteFingerprint: null,
            expectedRemoteManifestSha256: null,
          },
        ],
        createdAt: '2026-07-26T00:00:00.000Z',
      })
    ).toMatchObject({
      stageRoot: '.local/image-staging/ranking-cards',
      items: [
        {
          entityId: 'metric-a',
          fingerprint: plan.fingerprint,
          assets: manifest.assets,
        },
      ],
    });
    expect(() =>
      createImageGenerationPublishPlan({
        generator: 'ranking-card',
        stageRoot: '.local/r2',
        items: [
          {
            plan,
            manifest,
            expectedRemoteFingerprint: null,
            expectedRemoteManifestSha256: null,
          },
        ],
      })
    ).toThrow('許可範囲外');
  });

  it('writes a valid exact plan even when no image changed', () => {
    expect(
      createImageGenerationPublishPlan({
        generator: 'ranking-card',
        stageRoot: '.local/image-staging/ranking-cards',
        items: [],
        createdAt: '2026-07-26T00:00:00.000Z',
      })
    ).toMatchObject({ generator: 'ranking-card', items: [] });
  });

  it('batches only changed entities and refuses an implicit partial write', () => {
    expect(
      selectChangedImageBatch(['a', 'b', 'c'], {
        limit: 2,
        maxGenerate: 2,
      })
    ).toEqual({ targets: ['a', 'b'], remaining: 1 });
    expect(() =>
      selectChangedImageBatch(['a', 'b', 'c'], {
        limit: null,
        maxGenerate: 2,
      })
    ).toThrow('安全上限');
  });

  it('prioritizes missing public bundles before legacy manifest migration', () => {
    const status = (
      reason:
        | 'manifest-missing'
        | 'asset-missing'
        | 'manifest-invalid'
        | 'fingerprint-changed'
    ) => ({
      isCurrent: false as const,
      reason,
      remoteFingerprint: null,
      remoteManifestSha256: null,
    });

    const prioritized = prioritizeChangedImageCandidates([
      { item: { id: 'legacy-b' }, status: status('manifest-invalid') },
      { item: { id: 'new-b' }, status: status('manifest-missing') },
      { item: { id: 'stale-a' }, status: status('fingerprint-changed') },
      { item: { id: 'broken-a' }, status: status('asset-missing') },
      { item: { id: 'new-a' }, status: status('manifest-missing') },
    ]);

    expect(prioritized.map(({ item }) => item.id)).toEqual([
      'new-a',
      'new-b',
      'broken-a',
      'legacy-b',
      'stale-a',
    ]);
  });

  it('separates AI background content from the final composite renderer', () => {
    const base = {
      slug: 'article-a',
      data: { title: '記事A', subtitle: '要約' },
      background: {
        source: 'ai' as const,
        promptHash: 'prompt-a',
        sha256: 'b'.repeat(64),
      },
      rendererHash: RENDERER_HASH,
    };
    const current = createBlogImagePlan(base);
    const rendererChanged = createBlogImagePlan({
      ...base,
      rendererHash: 'c'.repeat(64),
    });
    const backgroundChanged = createBlogImagePlan({
      ...base,
      background: { ...base.background, sha256: 'd'.repeat(64) },
    });

    expect(rendererChanged.inputHash).toBe(current.inputHash);
    expect(rendererChanged.fingerprint).not.toBe(current.fingerprint);
    expect(backgroundChanged.inputHash).not.toBe(current.inputHash);
    expect(backgroundChanged.fingerprint).not.toBe(current.fingerprint);
  });

  it('selects only explicitly published blog articles and rejects ambiguous index rows', () => {
    expect(
      publishedBlogSlugsFromIndex({
        articles: [
          { slug: 'published-b', published: true },
          { slug: 'draft-a', published: false },
          { slug: 'published-a', published: true },
        ],
      })
    ).toEqual(['published-a', 'published-b']);
    expect(() =>
      publishedBlogSlugsFromIndex({
        articles: [{ slug: 'ambiguous' }],
      })
    ).toThrow('schema不正');
  });

  it('adopts a legacy AI background only when R2 ETag matches its bytes', () => {
    const body = Buffer.from('legacy-ai-background');
    const etag = `"${createHash('md5').update(body).digest('hex')}"`;
    expect(adoptLegacyAiBackgroundSha256(body, etag)).toBe(sha256(body));
    expect(() =>
      adoptLegacyAiBackgroundSha256(body, '"00000000000000000000000000000000"')
    ).toThrow('ETag');
  });
});

describe('image generation manifest status', () => {
  const plan = createImageGenerationPlan({
    generator: 'ranking-card',
    entityId: 'metric-a',
    manifestKey: 'app/ranking/metric-a/thumbnail.json',
    input: { value: 1 },
    rendererHash: RENDERER_HASH,
    assets: [
      {
        key: 'app/ranking/metric-a/light.webp',
        variant: 'light',
        contentType: 'image/webp',
        width: 640,
        height: 360,
      },
      {
        key: 'app/ranking/metric-a/dark.webp',
        variant: 'dark',
        contentType: 'image/webp',
        width: 640,
        height: 360,
      },
    ],
  });

  function manifest() {
    const root = makeTemporaryDirectory();
    const light = join(root, 'light.webp');
    const dark = join(root, 'dark.webp');
    writeFileSync(light, 'light');
    writeFileSync(dark, 'dark');
    return buildImageGenerationManifest({
      plan,
      assetFiles: new Map([
        [plan.assets[0].key, light],
        [plan.assets[1].key, dark],
      ]),
      metadata: { year: '2024' },
      generatedAt: '2026-07-26T00:00:00.000Z',
    });
  }

  it('matching manifest is current and changed fingerprint is stale', () => {
    const current = manifest();
    expect(compareImageGenerationManifest(current, plan)).toEqual({
      isCurrent: true,
      reason: 'current',
      remoteFingerprint: plan.fingerprint,
      remoteManifestSha256: null,
    });
    expect(
      compareImageGenerationManifest(
        { ...current, fingerprint: 'd'.repeat(64) },
        plan
      )
    ).toEqual({
      isCurrent: false,
      reason: 'fingerprint-changed',
      remoteFingerprint: 'd'.repeat(64),
      remoteManifestSha256: null,
    });
  });

  it('requires every declared remote asset to exist with the expected content type', async () => {
    const current = manifest();
    const assetBodies = new Map([
      [current.assets[0].key, Buffer.from('light')],
      [current.assets[1].key, Buffer.from('dark')],
    ]);
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('thumbnail.json')) {
          return new Response(JSON.stringify(current), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        const asset = current.assets.find((item) =>
          url.pathname.endsWith(item.key)
        );
        if (!asset) return new Response(null, { status: 404 });
        if (init?.method === 'HEAD') {
          return new Response(null, {
            status: 200,
            headers: {
              'content-type': asset.contentType,
              'content-length': String(asset.bytes),
              'x-amz-meta-stats47-sha256': asset.sha256,
            },
          });
        }
        return new Response(assetBodies.get(asset.key), {
          status: 200,
          headers: { 'content-type': asset.contentType },
        });
      }
    );

    await expect(
      inspectRemoteImageGeneration('https://storage.example', plan, fetchMock)
    ).resolves.toEqual({
      isCurrent: true,
      reason: 'current',
      remoteFingerprint: plan.fingerprint,
      remoteManifestSha256: sha256(Buffer.from(JSON.stringify(current))),
    });

    fetchMock.mockImplementationOnce(
      async () => new Response(null, { status: 404 })
    );
    await expect(
      inspectRemoteImageGeneration('https://storage.example', plan, fetchMock)
    ).resolves.toEqual({
      isCurrent: false,
      reason: 'manifest-missing',
      remoteFingerprint: null,
      remoteManifestSha256: null,
    });
  });

  it('verifies public asset bytes when a custom domain omits R2 metadata', async () => {
    const current = manifest();
    const assetBodies = new Map([
      [current.assets[0].key, Buffer.from('light')],
      [current.assets[1].key, Buffer.from('dark')],
    ]);
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('thumbnail.json')) {
          return new Response(JSON.stringify(current), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        const asset = current.assets.find((item) =>
          url.pathname.endsWith(item.key)
        );
        if (!asset) return new Response(null, { status: 404 });
        if (init?.method === 'HEAD') {
          return new Response(null, {
            status: 200,
            headers: {
              'content-type': asset.contentType,
              'content-length': String(asset.bytes),
            },
          });
        }
        return new Response(assetBodies.get(asset.key), {
          status: 200,
          headers: { 'content-type': asset.contentType },
        });
      }
    );

    await expect(
      inspectRemoteImageGeneration('https://storage.example', plan, fetchMock)
    ).resolves.toMatchObject({ isCurrent: true, reason: 'current' });

    assetBodies.set(current.assets[0].key, Buffer.from('stale'));
    await expect(
      inspectRemoteImageGeneration('https://storage.example', plan, fetchMock)
    ).resolves.toMatchObject({ isCurrent: false, reason: 'asset-missing' });
  });

  it('deep-inspects S3 SHA metadata instead of trusting only size', async () => {
    const current = manifest();
    const body = Buffer.from(JSON.stringify(current));
    const store: ImageObjectStore = {
      get: vi.fn(async () => ({
        body,
        etag: '"manifest"',
        contentType: 'application/json',
        contentEncoding: null,
        contentLength: body.byteLength,
        metadata: {
          'stats47-fingerprint': current.fingerprint,
          'stats47-sha256': sha256(body),
        },
      })),
      head: vi.fn(async (key) => {
        const asset = current.assets.find((candidate) => candidate.key === key);
        return asset
          ? {
              etag: '"asset"',
              contentType: asset.contentType,
              contentEncoding: null,
              contentLength: asset.bytes,
              metadata: {
                'stats47-sha256': asset.sha256,
                'stats47-fingerprint': 'old-renderer-fingerprint',
                'stats47-manifest': plan.manifestKey,
              },
            }
          : null;
      }),
      put: vi.fn(),
      delete: vi.fn(),
    };

    await expect(inspectR2ImageGeneration(plan, store)).resolves.toMatchObject({
      isCurrent: true,
      reason: 'current',
    });
    vi.mocked(store.head).mockImplementationOnce(async () => ({
      etag: '"asset"',
      contentType: 'image/webp',
      contentEncoding: null,
      contentLength: current.assets[0].bytes,
      metadata: {
        'stats47-sha256': 'f'.repeat(64),
        'stats47-manifest': plan.manifestKey,
      },
    }));
    await expect(inspectR2ImageGeneration(plan, store)).resolves.toMatchObject({
      isCurrent: false,
      reason: 'asset-missing',
    });
  });
});

describe('image generator registry', () => {
  const projectRoot = join(import.meta.dirname, '../../../../..');
  const allSpecs = {
    ...IMAGE_GENERATOR_SPECS,
    blog: BLOG_IMAGE_GENERATOR_SPEC,
  } as const;

  it('all generator types have unique IDs and existing renderer dependencies', () => {
    expect(IMAGE_GENERATOR_TYPES).toEqual([
      'ranking',
      'areas',
      'ranking-cards',
      'note-covers',
      'pref-silhouette',
    ]);
    const ids = IMAGE_GENERATOR_TYPES.map(
      (type) => IMAGE_GENERATOR_SPECS[type].generator
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const type of IMAGE_GENERATOR_TYPES) {
      expect(() =>
        calculateRendererHash(
          projectRoot,
          IMAGE_GENERATOR_SPECS[type].rendererSources
        )
      ).not.toThrow();
    }
    expect(() =>
      calculateRendererHash(projectRoot, blogRendererSources('brand'))
    ).not.toThrow();
  });

  it('brand background changes do not invalidate AI-background composites', () => {
    for (const background of BLOG_IMAGE_GENERATOR_SPEC.brandBackgroundSources) {
      expect(blogRendererSources('brand')).toContain(background);
      expect(blogRendererSources('ai')).not.toContain(background);
    }
  });

  it('AI normalizer changes do not invalidate brand-background composites', () => {
    const normalizerSource =
      'apps/web/scripts/lib/blog-ai-background-normalizer.ts';
    expect(BLOG_IMAGE_GENERATOR_SPEC.rendererSources).toContain(
      normalizerSource
    );
    expect(blogRendererSources('ai')).toContain(normalizerSource);
    expect(blogRendererSources('brand')).not.toContain(normalizerSource);
  });

  it('runtime import closure is declared in rendererSources', () => {
    const toProjectPath = (absolutePath: string) =>
      relative(projectRoot, absolutePath).split('\\').join('/');
    const resolveRelativeImport = (sourcePath: string, specifier: string) => {
      const base = resolve(projectRoot, dirname(sourcePath), specifier);
      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.json`,
        join(base, 'index.ts'),
        join(base, 'index.tsx'),
      ];
      const match = candidates.find(existsSync);
      if (!match)
        throw new Error(`${sourcePath}: import ${specifier} を解決できません`);
      return toProjectPath(match);
    };
    const packageManifest = (specifier: string) => {
      const parts = specifier.split('/');
      const packageName = specifier.startsWith('@')
        ? `${parts[0]}/${parts[1]}`
        : parts[0];
      if (packageName.startsWith('@stats47/')) {
        return `packages/${packageName.slice('@stats47/'.length)}/package.json`;
      }
      return `node_modules/${packageName}/package.json`;
    };

    for (const [type, spec] of Object.entries(allSpecs)) {
      const declared = new Set<string>(spec.rendererSources);
      for (const sourcePath of declared) {
        if (!/\.(?:ts|tsx)$/.test(sourcePath)) continue;
        const source = readFileSync(resolve(projectRoot, sourcePath), 'utf8');
        const runtimeImports = [
          ...source.matchAll(
            /import\s+(?!type\b)[\s\S]*?\sfrom\s+["']([^"']+)["']/g
          ),
        ].map((match) => match[1]);
        for (const specifier of runtimeImports) {
          if (specifier.startsWith('node:')) continue;
          const dependency = specifier.startsWith('.')
            ? resolveRelativeImport(sourcePath, specifier)
            : packageManifest(specifier);
          expect(
            declared.has(dependency),
            `${type}: ${sourcePath} の runtime import ${specifier} (${dependency}) をrendererSourcesへ追加`
          ).toBe(true);
        }
      }
    }
  });
});
