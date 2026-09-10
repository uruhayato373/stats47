import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { ImageObjectStore, StoredImageObject } from '../../image-pipeline';
import {
  exactManifestPublishPhase,
  parseExactManifestArgs,
  preflightExactR2Manifest,
  publishExactR2Manifest,
  readExactR2Manifest,
} from '../push-exact-r2-manifest-core';

const roots: string[] = [];
const hash = (body: Buffer) => createHash('sha256').update(body).digest('hex');
function fixture(keys = ['app/themes/tourism/example.json']) {
  const root = mkdtempSync(join(tmpdir(), 'stats47-release-manifest-'));
  roots.push(root);
  const files = keys.map((key) => {
    const body = Buffer.from('{"source":"verified"}');
    const path = join(root, '.local/r2', key);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
    return { key, bytes: body.length, sha256: hash(body) };
  });
  const input = { schemaVersion: 1, status: 'staged-unpublished', files };
  const save = () => {
    const body = Buffer.from(JSON.stringify(input));
    writeFileSync(join(root, 'manifest.json'), body);
    return hash(body);
  };
  const manifest = () => readExactR2Manifest(root, 'manifest.json', save());
  return { root, input, save, manifest };
}
function store() {
  const objects = new Map<string, StoredImageObject>();
  const puts: string[] = [];
  const heads: string[] = [];
  const conditions: unknown[] = [];
  const api: ImageObjectStore = {
    async get(key) {
      return objects.get(key) ?? null;
    },
    async head(key) {
      heads.push(key);
      const current = objects.get(key);
      if (!current) return null;
      const { body: _body, ...metadata } = current;
      return metadata;
    },
    async put(options) {
      const previous = objects.get(options.key);
      conditions.push(options.ifMatch ?? options.ifNoneMatch);
      if (
        (options.ifNoneMatch && previous) ||
        (options.ifMatch && previous?.etag !== options.ifMatch)
      )
        throw new Error('CAS conflict');
      puts.push(options.key);
      objects.set(options.key, {
        body: options.body,
        contentLength: options.body.length,
        contentType: options.contentType,
        contentEncoding: options.contentEncoding ?? null,
        metadata: options.metadata,
        etag: `"revision-${puts.length}"`,
      });
    },
    async delete() {
      throw new Error('delete is forbidden');
    },
  };
  return { api, objects, puts, heads, conditions };
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('fixed release manifest publication', () => {
  it('separates offline verify-only from remote dry-run and rejects prefix/override mixing', () => {
    const args = [
      '--manifest',
      'manifest.json',
      '--manifest-sha256',
      'a'.repeat(64),
    ];
    expect(parseExactManifestArgs([...args, '--verify-only'])).toEqual({
      manifestPath: 'manifest.json',
      manifestSha256: 'a'.repeat(64),
      dryRun: false,
      verifyOnly: true,
    });
    expect(parseExactManifestArgs([...args, '--dry-run']).dryRun).toBe(true);
    for (const suffix of [
      ['--key', 'app/x/a.json'],
      ['--prefix', 'app/x'],
      ['--allow-partial'],
      ['--verify-only', '--dry-run'],
    ])
      expect(() => parseExactManifestArgs([...args, ...suffix])).toThrow();
    expect(() =>
      parseExactManifestArgs(['--manifest', 'manifest.json'])
    ).toThrow();
  });

  it('rejects changed/missing manifest members against the approved manifest SHA', () => {
    const f = fixture(['app/themes/a/a.json', 'app/themes/b/b.json']);
    const approved = f.save();
    f.input.files.pop();
    f.save();
    expect(() =>
      readExactR2Manifest(f.root, 'manifest.json', approved)
    ).toThrow('SHA不一致');
  });

  it.each([
    'duplicate',
    'traversal',
    'unsupported',
    'bad-bytes',
    'bad-sha',
    'not-staged',
    'empty',
  ])('rejects malformed %s manifests even when freshly hashed', (change) => {
    const f = fixture();
    if (change === 'duplicate') f.input.files.push({ ...f.input.files[0] });
    if (change === 'traversal') f.input.files[0].key = '../outside.json';
    if (change === 'unsupported') f.input.files[0].key = 'app/x/a.topojson';
    if (change === 'bad-bytes') f.input.files[0].bytes = -1;
    if (change === 'bad-sha') f.input.files[0].sha256 = 'bad';
    if (change === 'not-staged') f.input.status = 'failed';
    if (change === 'empty') f.input.files = [];
    expect(() => f.manifest()).toThrow();
  });

  it.each(['changed', 'missing', 'symlink'])(
    'rejects %s local bytes before any remote operation',
    async (change) => {
      const f = fixture(['app/themes/a/a.json', 'app/themes/z/z.json']);
      const manifest = f.manifest();
      const path = join(f.root, '.local/r2', manifest.files[1].key);
      if (change === 'changed') writeFileSync(path, '{"source":"tampered"}');
      else rmSync(path);
      if (change === 'symlink')
        symlinkSync(join(f.root, '.local/r2', manifest.files[0].key), path);
      const s = store();
      await expect(
        publishExactR2Manifest({
          projectRoot: f.root,
          manifest,
          store: s.api,
          dryRun: false,
        })
      ).rejects.toThrow();
      expect(s.puts).toEqual([]);
      expect(s.heads).toEqual([]);
    }
  );

  it('rejects partial/noncommercial scope mixed with safe app assets before HEAD or PUT', async () => {
    for (const blocked of [
      'gis/mlit-ksj/A33/25/26.zip',
      'gis/mlit-ksj/A40/99/22.zip',
      'gis/mlit-ksj/P03/13/a.zip',
    ]) {
      const f = fixture(['app/themes/a/a.json', blocked]);
      const s = store();
      await expect(
        publishExactR2Manifest({
          projectRoot: f.root,
          manifest: f.manifest(),
          store: s.api,
          dryRun: false,
        })
      ).rejects.toThrow();
      expect(s.puts).toEqual([]);
      expect(s.heads).toEqual([]);
    }
  });

  it('publishes GeoJSON unchanged, sources and leaves before manifest and theme references', async () => {
    const keys = [
      'app/page-components/theme/a.json',
      'app/geo/a/manifest.json',
      'app/geo/a/item.json',
      'app/geo/a/pref/01.json',
      'gis/mlit-ksj/P05/22/01.geojson',
    ];
    const f = fixture(keys),
      s = store(),
      manifest = f.manifest();
    const first = await publishExactR2Manifest({
      projectRoot: f.root,
      manifest,
      store: s.api,
      dryRun: false,
    });
    expect(first.uploaded).toBe(5);
    expect(s.puts).toEqual([...keys].reverse());
    const raw = s.objects.get(keys[4])!;
    expect(raw.contentType).toBe('application/geo+json');
    expect(raw.body).toEqual(readFileSync(join(f.root, '.local/r2', keys[4])));
    expect(s.conditions).toEqual(['*', '*', '*', '*', '*']);
    const second = await publishExactR2Manifest({
      projectRoot: f.root,
      manifest,
      store: s.api,
      dryRun: false,
    });
    expect(second).toMatchObject({ changed: 0, uploaded: 0, skipped: 5 });
    expect(s.puts).toHaveLength(5);
  });

  it('publishes source parts before county and global source indexes', async () => {
    const keys = [
      'app/geo/a/source/index.json',
      'app/geo/a/source/01.json',
      'app/geo/a/source/parts/01-000.json',
    ];
    const f = fixture(keys), s = store();
    await publishExactR2Manifest({
      projectRoot: f.root, manifest: f.manifest(), store: s.api, dryRun: false,
    });
    expect(s.puts).toEqual([...keys].reverse());
  });

  it('publishes snow verification after every artifact it certifies and before theme references', async () => {
    const root = 'app/geo/population-snow-designation';
    const ordered = [
      `${root}/source/01.json`,
      `${root}/item.json`,
      `${root}/manifest.json`,
      `${root}/verification.json`,
      'app/page-components/theme/climate.json',
    ];
    const f = fixture([...ordered].reverse()), s = store();
    await publishExactR2Manifest({
      projectRoot: f.root, manifest: f.manifest(), store: s.api, dryRun: false,
    });
    expect(s.puts).toEqual(ordered);
    // Tsunami's manifest refers to its verification, so its direction differs.
    expect(exactManifestPublishPhase('app/geo/tsunami-scenario-exposure/verification.json'))
      .toBeLessThan(exactManifestPublishPhase('app/geo/tsunami-scenario-exposure/manifest.json'));
  });

  it('dry-run only HEADs and offline preflight needs no object store', async () => {
    const f = fixture(),
      s = store(),
      manifest = f.manifest();
    expect(() => preflightExactR2Manifest(f.root, manifest)).not.toThrow();
    const result = await publishExactR2Manifest({
      projectRoot: f.root,
      manifest,
      store: s.api,
      dryRun: true,
    });
    expect(result).toMatchObject({ changed: 1, uploaded: 0, dryRun: true });
    expect(s.heads).toHaveLength(1);
    expect(s.puts).toHaveLength(0);
  });

  it('rechecks a later file changed during upload and never writes the manifest afterward', async () => {
    const f = fixture([
      'app/geo/a/pref/01.json',
      'app/geo/a/pref/02.json',
      'app/geo/a/manifest.json',
    ]);
    const manifest = f.manifest(),
      s = store(),
      put = s.api.put;
    s.api.put = async (options) => {
      await put(options);
      writeFileSync(
        join(f.root, '.local/r2/app/geo/a/pref/02.json'),
        'changed after preflight'
      );
    };
    await expect(
      publishExactR2Manifest({
        projectRoot: f.root,
        manifest,
        store: s.api,
        dryRun: false,
      })
    ).rejects.toThrow('local bytesが不一致');
    expect(s.puts).toEqual(['app/geo/a/pref/01.json']);
  });
});
