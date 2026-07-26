import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { ImageObjectStore, StoredImageObject } from '../../image-pipeline';
import {
  parseExactAssetArgs,
  publishExactR2Assets,
  resolveExactAssetCandidates,
} from '../push-exact-r2-assets-core';

interface FakeObject {
  body: Buffer;
  etag: string;
  contentType: string;
  metadata: Record<string, string>;
}

const roots: string[] = [];

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'stats47-exact-assets-'));
  roots.push(root);
  mkdirSync(join(root, '.local/r2/app/blog/article-a'), {
    recursive: true,
  });
  return root;
}

function makeStore(initial: Record<string, FakeObject> = {}) {
  const objects = new Map(Object.entries(initial));
  const puts: string[] = [];
  let revision = 0;
  const asStored = (value: FakeObject | undefined): StoredImageObject | null =>
    value
      ? {
          body: value.body,
          etag: value.etag,
          contentLength: value.body.byteLength,
          contentType: value.contentType,
          metadata: value.metadata,
        }
      : null;
  const store: ImageObjectStore = {
    async get(key) {
      return asStored(objects.get(key));
    },
    async head(key) {
      const stored = asStored(objects.get(key));
      if (!stored) return null;
      const { body: _body, ...head } = stored;
      return head;
    },
    async put(options) {
      puts.push(options.key);
      const current = objects.get(options.key);
      if (options.ifNoneMatch === '*' && current)
        throw new Error('precondition failed');
      if (options.ifMatch && current?.etag !== options.ifMatch)
        throw new Error('precondition failed');
      objects.set(options.key, {
        body: options.body,
        etag: `"${++revision}"`,
        contentType: options.contentType,
        metadata: options.metadata,
      });
    },
    async delete() {
      throw new Error('not used');
    },
  };
  return { store, puts, objects };
}

function exactMetadata(body: Buffer, contentType: string) {
  return {
    'stats47-sha256': createHash('sha256').update(body).digest('hex'),
    'stats47-size': String(body.byteLength),
    'stats47-content-type': contentType,
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('exact R2 asset publisher', () => {
  it('同一bytes・size・MIME・metadataならPUTしない', async () => {
    const root = makeRoot();
    const key = 'app/blog/article-a/chart.svg';
    const body = Buffer.from('<svg/>');
    writeFileSync(join(root, '.local/r2', key), body);
    const candidates = resolveExactAssetCandidates(root, {
      keys: [key],
      prefix: null,
      extensions: [],
    });
    const { store, puts } = makeStore({
      [key]: {
        body,
        etag: '"before"',
        contentType: 'image/svg+xml',
        metadata: exactMetadata(body, 'image/svg+xml'),
      },
    });

    const result = await publishExactR2Assets({
      candidates,
      store,
      dryRun: false,
    });

    expect(result).toEqual({
      candidates: 1,
      changed: 0,
      uploaded: 0,
      skipped: 1,
    });
    expect(puts).toEqual([]);
  });

  it('bytesが変わったファイルだけPUTしHEAD再検証する', async () => {
    const root = makeRoot();
    const key = 'app/blog/article-a/chart.svg';
    const body = Buffer.from('<svg>new</svg>');
    writeFileSync(join(root, '.local/r2', key), body);
    const candidates = resolveExactAssetCandidates(root, {
      keys: [key],
      prefix: null,
      extensions: [],
    });
    const previous = Buffer.from('<svg>old</svg>');
    const { store, puts, objects } = makeStore({
      [key]: {
        body: previous,
        etag: '"before"',
        contentType: 'image/svg+xml',
        metadata: exactMetadata(previous, 'image/svg+xml'),
      },
    });

    const result = await publishExactR2Assets({
      candidates,
      store,
      dryRun: false,
    });

    expect(result).toEqual({
      candidates: 1,
      changed: 1,
      uploaded: 1,
      skipped: 0,
    });
    expect(puts).toEqual([key]);
    expect(objects.get(key)?.body).toEqual(body);
  });

  it('dry-runは差分を検出してもPUTしない', async () => {
    const root = makeRoot();
    const key = 'app/blog/article-a/chart.svg';
    writeFileSync(
      join(root, '.local/r2', key),
      Buffer.from('<svg>changed</svg>')
    );
    const candidates = resolveExactAssetCandidates(root, {
      keys: [key],
      prefix: null,
      extensions: [],
    });
    const { store, puts } = makeStore();

    const result = await publishExactR2Assets({
      candidates,
      store,
      dryRun: true,
    });

    expect(result).toEqual({
      candidates: 1,
      changed: 1,
      uploaded: 0,
      skipped: 0,
    });
    expect(puts).toEqual([]);
  });

  it('staging escapeと広域prefixを拒否する', () => {
    const root = makeRoot();
    expect(() => parseExactAssetArgs(['--key', '../outside.svg'])).toThrow(
      '安全でないR2 key'
    );
    expect(() =>
      parseExactAssetArgs(['--prefix', 'app/blog', '--extension', 'svg'])
    ).toThrow('広すぎるprefix');
    expect(() =>
      parseExactAssetArgs(['--prefix', 'sns/buzz-map', '--extension', 'png'])
    ).toThrow('広すぎるprefix');
  });

  it('prefixに候補が0件なら拒否する', () => {
    const root = makeRoot();
    expect(() =>
      resolveExactAssetCandidates(root, {
        keys: [],
        prefix: 'app/blog/article-a',
        extensions: ['.svg'],
      })
    ).toThrow('publish対象ファイルが0件');
  });

  it('複数keyと狭いprefix+extensionだけを決定的に列挙する', () => {
    const parsedKeys = parseExactAssetArgs([
      '--key',
      'app/blog/b/chart.svg,app/blog/a/chart.svg',
      '--key=app/blog/a/chart.svg',
      '--dry-run',
    ]);
    expect(parsedKeys).toEqual({
      selection: {
        keys: ['app/blog/a/chart.svg', 'app/blog/b/chart.svg'],
        prefix: null,
        extensions: [],
      },
      dryRun: true,
    });

    const root = makeRoot();
    writeFileSync(
      join(root, '.local/r2/app/blog/article-a/chart.svg'),
      '<svg/>'
    );
    writeFileSync(join(root, '.local/r2/app/blog/article-a/ignore.json'), '{}');
    const candidates = resolveExactAssetCandidates(root, {
      keys: [],
      prefix: 'app/blog/article-a',
      extensions: ['svg'],
    });
    expect(candidates.map(({ key }) => key)).toEqual([
      'app/blog/article-a/chart.svg',
    ]);
  });
});
