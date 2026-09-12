import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ImageObjectStore,
  StoredImageObject,
} from '../../../packages/r2-storage/src/image-pipeline';
import { GEO_SOURCE_PAGES } from '../../../packages/data-configs/src/business-plan/geo-source-pages';
import {
  CATALOG_KEY,
  mapGeoSourceBatch,
  buildExactPlan,
  candidateForGeoKey,
  decoded,
  executeGeoSourcePlan,
  parseRepairIds,
  sha256,
  validateFloodManifest,
  validateLocalOutput,
  validateRepairManifest,
  type RepairManifest,
} from './geo-source-publish-core';
import { buildGeoSourceCatalog } from './export-geo-source-catalog';

const roots: string[] = [];
afterEach(() => {
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }));
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'geo-source-publish-test-'));
  roots.push(root);
  const objects = new Map<string, StoredImageObject>();
  const writes: string[] = [];
  const store: ImageObjectStore = {
    get: async (key) => objects.get(key) ?? null,
    head: async (key) => objects.get(key) ?? null,
    put: async (request) => {
      const current = objects.get(request.key);
      if (
        (current?.etag ?? null) !== (request.ifMatch ?? null) ||
        (!current && request.ifNoneMatch !== '*')
      )
        throw Error('Conditional write failed');
      writes.push(request.key);
      objects.set(request.key, {
        body: request.body,
        etag: `"v${writes.length}"`,
        contentType: request.contentType,
        contentEncoding: request.contentEncoding ?? null,
        contentLength: request.body.length,
        metadata: request.metadata,
      });
    },
    delete: async () => {
      throw Error('Deletion is forbidden');
    },
  };
  const write = (key: string, value: Buffer | object) => {
    mkdirSync(path.dirname(path.join(root, key)), { recursive: true });
    writeFileSync(
      path.join(root, key),
      Buffer.isBuffer(value) ? value : JSON.stringify(value)
    );
  };
  return { root, objects, writes, store, write };
}
const topo = {
  type: 'Topology',
  arcs: [],
  objects: {
    W09: {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [139, 35], properties: { name: '湖' } },
      ],
    },
  },
};
const gisKey = 'gis/mlit-ksj/W09/05/national.topojson';
const itemKey = 'app/geo/datasets/W09/item.json';

describe('Geo exact source publication', () => {
  it('waits for in-flight failures before proceeding and bounds concurrency at four', async () => {
    let active = 0;
    let maximum = 0;
    let settled = 0;
    let started = 0;
    await expect(
      mapGeoSourceBatch([0, 1, 2, 3, 4], async (index) => {
        active++;
        started++;
        maximum = Math.max(maximum, active);
        try {
          if (index === 0) throw Error('failed source');
          await new Promise((resolve) => setTimeout(resolve, 5));
          settled++;
        } finally {
          active--;
        }
      })
    ).rejects.toThrow('failed source');
    expect(maximum).toBeLessThanOrEqual(4);
    expect(started).toBe(4);
    expect(settled).toBe(3);
    expect(active).toBe(0);
  });
  it('accepts the 13 reviewed repairs and rejects duplicates, unknown or unsafe scope', () => {
    expect(parseRepairIds('all')).toHaveLength(13);
    expect(parseRepairIds('A38,W09')).toEqual(['A38', 'W09']);
    expect(parseRepairIds('none')).toEqual([]);
    for (const value of ['', 'W09,W09', 'P03', '../../gis', 'all,A38'])
      expect(() => parseRepairIds(value)).toThrow();
  });
  it('preserves exactly one gzip layer and verifies decoded feature conservation', () => {
    const f = fixture();
    const body = gzipSync(Buffer.from(JSON.stringify(topo)));
    f.write(gisKey, body);
    expect(candidateForGeoKey(f.root, gisKey).body).toEqual(body);
    validateLocalOutput(f.root, {
      key: gisKey,
      bytes: body.length,
      outputSha256: sha256(body),
      featureCount: 1,
    });
    expect(() =>
      validateLocalOutput(f.root, {
        key: gisKey,
        bytes: body.length,
        outputSha256: sha256(body),
        featureCount: 2,
      })
    ).toThrow();
    f.write(gisKey, gzipSync(body));
    expect(() => candidateForGeoKey(f.root, gisKey)).toThrow('Double gzip');
  });
  it('rejects image writes and source publication forbidden by current license', () => {
    const f = fixture();
    const forbidden = 'gis/mlit-ksj/P03/13/national.topojson';
    f.write(forbidden, topo);
    expect(() => candidateForGeoKey(f.root, forbidden)).toThrow('policy');
    const image = 'app/geo/datasets/W09/thumbnails/05/wide.webp';
    f.write(image, Buffer.from('image'));
    expect(() => candidateForGeoKey(f.root, image)).toThrow('scope');
    expect(() => candidateForGeoKey(f.root, '../outside.json')).toThrow(
      'Unsafe'
    );
  });
  it('requires original SHA evidence and per-archive conservation before accepting repairs', () => {
    const m: RepairManifest = {
      dataId: 'W09',
      version: '05',
      sourceFeatureCount: 1,
      sources: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/data/W09/W09-05/W09-05_GML.zip',
          sha256: 'a'.repeat(64),
          scope: 'national',
          datum: 'jgd',
          featureCount: 1,
        },
      ],
      outputs: [
        {
          key: gisKey,
          bytes: 12,
          outputSha256: 'b'.repeat(64),
          featureCount: 1,
          sourceSha256: 'a'.repeat(64),
          sourceUrl:
            'https://nlftp.mlit.go.jp/ksj/gml/data/W09/W09-05/W09-05_GML.zip',
        },
      ],
    };
    expect(validateRepairManifest(m)).toHaveLength(1);
    expect(() =>
      validateRepairManifest({
        ...m,
        outputs: [{ ...m.outputs[0], featureCount: 2 }],
      })
    ).toThrow('conservation');
    expect(() =>
      validateRepairManifest({
        ...m,
        sources: [{ ...m.sources![0], sha256: 'wrong' }],
      })
    ).toThrow('evidence');
    expect(() =>
      validateRepairManifest({ ...m, outputs: [m.outputs[0], m.outputs[0]] })
    ).toThrow();
    expect(() =>
      validateFloodManifest({
        dataId: 'A31b',
        version: '25',
        sourceUrl: '',
        sourceCount: 201,
        inputManifestSha256: 'a'.repeat(64),
        sources: [],
        assets: [],
      })
    ).toThrow('Incomplete');
  });
  it('dry-run makes no PUTs and refuses local apply', async () => {
    const f = fixture();
    f.write(gisKey, topo);
    const plan = await buildExactPlan(f.root, [gisKey], ['W09'], f.store);
    const result = await executeGeoSourcePlan({
      root: f.root,
      plan,
      store: f.store,
      publicBase: 'https://example.test',
      apply: false,
    });
    expect(result.changed).toBe(1);
    expect(f.writes).toEqual([]);
    vi.stubEnv('CI', 'false');
    await expect(
      executeGeoSourcePlan({
        root: f.root,
        plan,
        store: f.store,
        publicBase: 'https://example.test',
        apply: true,
      })
    ).rejects.toThrow('CI-only');
  });
  it('preflights the complete plan before the first write and rejects stale remote ETags', async () => {
    const f = fixture();
    f.write(gisKey, topo);
    f.write(itemKey, {});
    const plan = await buildExactPlan(
      f.root,
      [gisKey, itemKey],
      ['W09'],
      f.store
    );
    f.write(itemKey, { changed: true });
    vi.stubEnv('CI', 'true');
    await expect(
      executeGeoSourcePlan({
        root: f.root,
        plan,
        store: f.store,
        publicBase: 'https://example.test',
        apply: true,
      })
    ).rejects.toThrow('Staging changed');
    expect(f.writes).toEqual([]);
    f.write(itemKey, {});
    f.objects.set(itemKey, {
      body: Buffer.from('{}'),
      etag: 'concurrent',
      contentType: 'application/json',
      contentEncoding: null,
      contentLength: 2,
      metadata: {},
    });
    await expect(
      executeGeoSourcePlan({
        root: f.root,
        plan,
        store: f.store,
        publicBase: 'https://example.test',
        apply: true,
      })
    ).rejects.toThrow('Remote changed');
    expect(f.writes).toEqual([]);
  });
  it('publishes verified GIS first, indexes second, catalog last, and compares public decoded bytes', async () => {
    const f = fixture();
    f.write(gisKey, gzipSync(Buffer.from(JSON.stringify(topo))));
    f.write(itemKey, {});
    f.write(CATALOG_KEY, {});
    const plan = await buildExactPlan(
      f.root,
      [CATALOG_KEY, itemKey, gisKey],
      ['W09'],
      f.store
    );
    vi.stubEnv('CI', 'true');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const key = new URL(url).pathname.slice(1);
        const object = f.objects.get(key);
        expect(object).toBeDefined();
        return new Response(new Uint8Array(decoded(object!.body)));
      })
    );
    const result = await executeGeoSourcePlan({
      root: f.root,
      plan,
      store: f.store,
      publicBase: 'https://example.test',
      apply: true,
    });
    expect(f.writes).toEqual([gisKey, itemKey, CATALOG_KEY]);
    expect(result.verified).toBe(3);
    expect(f.objects.get(gisKey)?.body).toEqual(
      candidateForGeoKey(f.root, gisKey).body
    );
  });
  it('a public source mismatch prevents all viewer index writes', async () => {
    const f = fixture();
    f.write(gisKey, topo);
    f.write(itemKey, {});
    f.write(CATALOG_KEY, {});
    const plan = await buildExactPlan(
      f.root,
      [CATALOG_KEY, itemKey, gisKey],
      ['W09'],
      f.store
    );
    vi.stubEnv('CI', 'true');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}'))
    );
    await expect(
      executeGeoSourcePlan({
        root: f.root,
        plan,
        store: f.store,
        publicBase: 'https://example.test',
        apply: true,
      })
    ).rejects.toThrow('hash differs');
    expect(f.writes).toEqual([gisKey]);
  });
  it('fails closed if even one of the 50 source indexes is missing', () => {
    const rows = GEO_SOURCE_PAGES.map((page) => ({
      key: `gis/mlit-ksj/${page.dataId}/${page.version}/${page.dataId === 'A31b' ? 'display/10/5339/0001.geojson' : 'national.topojson'}`,
      bytes: 100,
    }));
    const metadata = {
      items: GEO_SOURCE_PAGES.map((p) => ({
        dataId: p.dataId,
        sourcePageUrl: `https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-${p.dataId}.html`,
      })),
    };
    const result = buildGeoSourceCatalog({
      rows,
      metadata,
      generatedAt: '2026-09-13T00:00:00Z',
    });
    expect(result.items).toHaveLength(50);
    expect(result.catalog.items.every((item) => item.assetCount === 1)).toBe(
      true
    );
    expect(() =>
      buildGeoSourceCatalog({
        rows: rows.slice(1),
        metadata,
        generatedAt: '2026-09-13T00:00:00Z',
      })
    ).toThrow('Missing');
  });
});
