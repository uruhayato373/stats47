import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { GIS_DATASETS_BY_ID } from '@stats47/gis/mlit-ksj';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  GEO_SOURCE_THUMBNAILS,
  GEO_THUMBNAIL_SIZES,
  geoThumbnailKey,
} from '../../../src/features/geo-analysis/lib/geo-source-thumbnail';
import { readStagedGeoThumbnails } from '../../sync-geo-source-thumbnails';
import {
  createImageGenerationPlan,
  sha256,
} from '../image-generation-manifest';

vi.mock(
  '../../../src/features/geo-analysis/lib/geo-source-thumbnail',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../../../src/features/geo-analysis/lib/geo-source-thumbnail')
      >();
    return {
      ...actual,
      GEO_SOURCE_THUMBNAILS: { L01: actual.GEO_SOURCE_THUMBNAILS.L01 },
    };
  }
);

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'geo-thumbnail-transfer-'));
  roots.push(root);
  const config = GEO_SOURCE_THUMBNAILS.L01!;
  const manifestKey =
    'app/geo/datasets/L01/thumbnails/' + config.version + '/manifest.json';
  const input = {
    config,
    inputs: config.files.map((file) => ({
      key: 'gis/mlit-ksj/L01/' + config.version + '/' + file,
      sha256: 'a'.repeat(64),
      bytes: 10,
    })),
    sourceUrl: 'https://nlftp.mlit.go.jp/ksj/',
    license: GIS_DATASETS_BY_ID.get('L01')!.license,
  };
  const plan = createImageGenerationPlan({
    generator: 'geo-source-thumbnail',
    entityId: 'L01',
    manifestKey,
    input,
    rendererHash: 'b'.repeat(64),
    assets: Object.entries(GEO_THUMBNAIL_SIZES).map(([variant, size]) => ({
      key: geoThumbnailKey('L01', config.version, variant as 'wide' | 'square'),
      variant,
      contentType: 'image/webp',
      ...size,
    })),
  });
  const image = Buffer.from('reviewed image bytes');
  const manifest = {
    kind: 'stats47-image-generation',
    schemaVersion: 1,
    generator: plan.generator,
    entityId: plan.entityId,
    inputHash: plan.inputHash,
    rendererHash: plan.rendererHash,
    fingerprint: plan.fingerprint,
    generatedAt: '2026-09-09T00:00:00.000Z',
    assets: plan.assets.map((asset) => ({
      ...asset,
      bytes: image.length,
      sha256: sha256(image),
    })),
    metadata: { sourceUrl: input.sourceUrl, inputs: input.inputs },
  };
  const stateDir = join(root, '.claude/state/geo');
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    join(stateDir, 'source-thumbnails.json'),
    JSON.stringify({
      rendererHash: plan.rendererHash,
      items: { L01: { fingerprint: plan.fingerprint, manifestKey } },
    })
  );
  const objects = new Map(plan.assets.map((asset) => [asset.key, image]));
  objects.set(manifestKey, Buffer.from(JSON.stringify(manifest)));
  return {
    root,
    objects,
    manifest,
    manifestKey,
    imageKey: plan.assets[0]!.key,
  };
}

describe('reviewed GIS thumbnail transfer', () => {
  it('accepts the exact reviewed images without needing raw GIS or platform-specific rendering', () => {
    const f = fixture();
    expect(readStagedGeoThumbnails(f.root, f.objects).objects.size).toBe(3);
  });
  it('rejects altered image bytes', () => {
    const f = fixture();
    f.objects.set(f.imageKey, Buffer.from('changed'));
    expect(() => readStagedGeoThumbnails(f.root, f.objects)).toThrow(
      'image SHA mismatch'
    );
  });
  it('rejects asset keys outside the configured dataset before reading them', () => {
    const f = fixture();
    f.manifest.assets[0]!.key = '../../outside.webp';
    f.objects.set(f.manifestKey, Buffer.from(JSON.stringify(f.manifest)));
    expect(() => readStagedGeoThumbnails(f.root, f.objects)).toThrow(
      'unreviewed fingerprint'
    );
  });
  it('rejects extra objects instead of extracting arbitrary transfer paths', () => {
    const f = fixture();
    f.objects.set('../../outside', Buffer.from('extra'));
    expect(() => readStagedGeoThumbnails(f.root, f.objects)).toThrow(
      'Unexpected transfer objects'
    );
  });
  it('rejects a changed source identity even if image bytes are unchanged', () => {
    const f = fixture();
    f.manifest.metadata.sourceUrl = 'https://example.com/other-source';
    f.objects.set(f.manifestKey, Buffer.from(JSON.stringify(f.manifest)));
    expect(() => readStagedGeoThumbnails(f.root, f.objects)).toThrow(
      'unreviewed fingerprint'
    );
  });
});
