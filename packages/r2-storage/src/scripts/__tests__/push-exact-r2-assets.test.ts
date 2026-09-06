import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

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
  contentEncoding?: string;
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
          contentEncoding: value.contentEncoding ?? null,
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
        contentEncoding: options.contentEncoding,
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
    'stats47-content-encoding': 'identity',
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('exact R2 asset publisher', () => {
  it('gzip済みの旧観測値も展開して検査し、混在バッチをPUT前に拒否する', async () => {
    const root = makeRoot();
    const allowedKey = 'app/blog/article-a/chart.svg';
    const oldKey = 'app/stats/roadside-station-count/values.json';
    mkdirSync(join(root, '.local/r2/app/stats/roadside-station-count'), { recursive: true });
    writeFileSync(join(root, '.local/r2', allowedKey), '<svg/>');
    writeFileSync(join(root, '.local/r2', oldKey), JSON.stringify({ stale: 'x'.repeat(10000) }));
    const candidates = resolveExactAssetCandidates(root, {
      keys: [allowedKey, oldKey], prefix: null, extensions: [],
    });
    // JSONの通常選択はidentity。圧縮済み候補を渡す経路も検査する。
    const old = candidates.find((candidate) => candidate.key === oldKey)!;
    old.body = gzipSync(old.body);
    old.contentEncoding = 'gzip';
    old.size = old.body.length;
    old.sha256 = createHash('sha256').update(old.body).digest('hex');
    const { store, puts } = makeStore();
    await expect(publishExactR2Assets({ candidates, store, dryRun: false }))
      .rejects.toThrow('一次資料移行後の旧版');
    expect(puts).toEqual([]);
  });

  it.each([false, true])('非商用KSJが混在したバッチは全件PUT前に拒否する (dryRun=%s)', async (dryRun) => {
    const root = makeRoot();
    const key = 'app/blog/article-a/chart.svg';
    writeFileSync(join(root, '.local/r2', key), '<svg/>');
    const [allowed] = resolveExactAssetCandidates(root, {
      keys: [key], prefix: null, extensions: [],
    });
    const { store, puts } = makeStore();

    await expect(publishExactR2Assets({
      candidates: [allowed, { ...allowed, key: 'gis/mlit-ksj/P03/13/data.topojson' }],
      store, dryRun,
    })).rejects.toThrow('KSJ public mirror禁止');
    expect(puts).toEqual([]);
  });

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

  it('記事Markdownをtext/markdownとしてPUTする', async () => {
    const root = makeRoot();
    const key = 'app/blog/article-a/article.md';
    const body = Buffer.from('# article\n');
    writeFileSync(join(root, '.local/r2', key), body);
    const candidates = resolveExactAssetCandidates(root, {
      keys: [key],
      prefix: null,
      extensions: [],
    });
    const { store, objects } = makeStore();

    await publishExactR2Assets({ candidates, store, dryRun: false });

    expect(objects.get(key)?.contentType).toBe('text/markdown; charset=utf-8');
    expect(objects.get(key)?.body).toEqual(body);
  });

  it('TopoJSONを決定的にgzip圧縮しContent-Encoding付きでPUTする', async () => {
    const root = makeRoot();
    const key = 'gis/mlit-ksj/A42/national/data.topojson';
    const source = Buffer.from(
      JSON.stringify({
        type: 'Topology',
        objects: { example: { type: 'GeometryCollection', geometries: [] } },
        arcs: Array.from({ length: 100 }, () => [[1, 2], [3, 4]]),
      })
    );
    mkdirSync(join(root, '.local/r2/gis/mlit-ksj/A42/national'), {
      recursive: true,
    });
    writeFileSync(join(root, '.local/r2', key), source);

    const [candidate] = resolveExactAssetCandidates(root, {
      keys: [key],
      prefix: null,
      extensions: [],
    });
    const { store, objects } = makeStore();
    await publishExactR2Assets({ candidates: [candidate], store, dryRun: false });

    expect(candidate.contentEncoding).toBe('gzip');
    expect(candidate.size).toBeLessThan(source.byteLength);
    expect(gunzipSync(candidate.body)).toEqual(source);
    expect(objects.get(key)?.contentEncoding).toBe('gzip');
    expect(objects.get(key)?.metadata['stats47-content-encoding']).toBe('gzip');
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
    expect(
      parseExactAssetArgs([
        '--prefix',
        'gis/mlit-ksj/G04-a/11',
        '--extension',
        'topojson,json',
      ]).selection.extensions
    ).toEqual(['.json', '.topojson']);

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
