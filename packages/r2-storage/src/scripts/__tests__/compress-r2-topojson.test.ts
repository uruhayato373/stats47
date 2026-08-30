import { gunzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import type { ImageObjectStore, StoredImageObject } from '../../image-pipeline';
import { compressR2TopoJsonObject } from '../compress-r2-topojson-core';

function makeStore(source: Buffer) {
  let current: StoredImageObject = {
    body: source,
    etag: '"before"',
    contentType: 'application/json',
    contentEncoding: null,
    contentLength: source.byteLength,
    metadata: { provenance: 'kept' },
  };
  let puts = 0;
  const store: ImageObjectStore = {
    async get() {
      return current;
    },
    async head() {
      const { body: _body, ...head } = current;
      return head;
    },
    async put(options) {
      expect(options.ifMatch).toBe(current.etag);
      puts += 1;
      current = {
        body: options.body,
        etag: '"after"',
        contentType: options.contentType,
        contentEncoding: options.contentEncoding ?? null,
        contentLength: options.body.byteLength,
        metadata: options.metadata,
      };
    },
    async delete() {
      throw new Error('not used');
    },
  };
  return { store, current: () => current, puts: () => puts };
}

describe('compressR2TopoJsonObject', () => {
  it('TopoJSONをgzip化し、既存metadataを維持してHEAD検証する', async () => {
    const source = Buffer.from(
      JSON.stringify({
        type: 'Topology',
        objects: {},
        arcs: Array.from({ length: 100 }, () => [[1, 2], [3, 4]]),
      })
    );
    const fake = makeStore(source);
    const result = await compressR2TopoJsonObject({
      key: 'gis/mlit-ksj/A42/national/data.topojson',
      store: fake.store,
      dryRun: false,
    });

    expect(result.status).toBe('compressed');
    expect(fake.puts()).toBe(1);
    expect(fake.current().contentEncoding).toBe('gzip');
    expect(fake.current().metadata.provenance).toBe('kept');
    expect(gunzipSync(fake.current().body)).toEqual(source);
  });

  it('gzip済みobjectはGETもPUTもしない', async () => {
    const fake = makeStore(Buffer.from('{}'));
    fake.current().contentEncoding = 'gzip';
    const result = await compressR2TopoJsonObject({
      key: 'gis/mlit-ksj/A42/national/data.topojson',
      store: fake.store,
      dryRun: false,
    });
    expect(result.status).toBe('skipped');
    expect(fake.puts()).toBe(0);
  });

  it('KSJ外のkeyを拒否する', async () => {
    const fake = makeStore(Buffer.from('{}'));
    await expect(
      compressR2TopoJsonObject({
        key: 'app/stats/data.topojson',
        store: fake.store,
        dryRun: true,
      })
    ).rejects.toThrow('KSJ TopoJSON以外');
  });
});
