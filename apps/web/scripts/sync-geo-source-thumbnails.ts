/** Transfer reviewed thumbnails without putting image bytes in git. Run at repo root. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';
import { createS3ImageObjectStoreFromEnv } from '@stats47/r2-storage/image-pipeline';
import { z } from 'zod';

import {
  GEO_SOURCE_THUMBNAILS,
  GEO_THUMBNAIL_SIZES,
  geoThumbnailKey,
} from '../src/features/geo-analysis/lib/geo-source-thumbnail';

import {
  compareImageGenerationManifest,
  createImageGenerationPlan,
  createImageGenerationPublishPlan,
  sha256,
} from './lib/image-generation-manifest';
import { inspectR2ImageGeneration } from './lib/image-generation-r2-inspector';

import type { ImageGenerationManifest } from '@stats47/types';

const stageRoot = '.local/image-staging/geo-thumbnails';
const planPath = '.local/image-generation-publish-plan-geo-thumbnails.json';
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const stateSchema = z.object({
  rendererHash: hash,
  items: z.record(
    z.string(),
    z.object({ fingerprint: hash, manifestKey: z.string() })
  ),
});
const metadataSchema = z.object({
  sourceUrl: z.string().url(),
  inputs: z.array(
    z.object({
      key: z.string(),
      sha256: hash,
      bytes: z.number().int().positive(),
    })
  ),
});
const transferSchema = z.object({
  kind: z.literal('stats47-geo-thumbnail-transfer'),
  objects: z
    .array(z.object({ key: z.string(), sha256: hash, base64: z.string() }))
    .max(150),
});
const save = (path: string, bytes: string | Buffer) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
};

/** Validate against reviewed git state and current config, never arbitrary transfer keys. */
export function readStagedGeoThumbnails(
  root: string,
  transferred?: Map<string, Buffer>
) {
  const state = stateSchema.parse(
    JSON.parse(
      readFileSync(
        join(root, '.claude/state/geo/source-thumbnails.json'),
        'utf8'
      )
    )
  );
  const read = (key: string) => {
    if (!transferred) return readFileSync(join(root, stageRoot, key));
    const bytes = transferred.get(key);
    if (!bytes) throw new Error('Missing transfer object: ' + key);
    return bytes;
  };
  const objects = new Map<string, Buffer>();
  const bundles = Object.entries(GEO_SOURCE_THUMBNAILS).map(
    ([dataId, config]) => {
      const meta = GIS_DATASETS_BY_ID.get(dataId);
      const manifestKey =
        'app/geo/datasets/' +
        dataId +
        '/thumbnails/' +
        config.version +
        '/manifest.json';
      if (
        !meta ||
        meta.latestVersion !== config.version ||
        getKsjLicensePolicy(meta.license).sourcePublication !==
          'public-r2-eligible' ||
        state.items[dataId]?.manifestKey !== manifestKey
      )
        throw new Error(dataId + ': scope mismatch');
      const bytes = read(manifestKey);
      const manifest = JSON.parse(
        bytes.toString('utf8')
      ) as ImageGenerationManifest<unknown>;
      const metadata = metadataSchema.parse(manifest.metadata);
      if (
        metadata.inputs.length !== config.files.length ||
        metadata.inputs.some(
          (input, i) =>
            input.key !==
            'gis/mlit-ksj/' +
              dataId +
              '/' +
              config.version +
              '/' +
              config.files[i]
        )
      )
        throw new Error(dataId + ': source keys changed');
      const plan = createImageGenerationPlan({
        generator: 'geo-source-thumbnail',
        entityId: dataId,
        manifestKey,
        // Pin the renderer used on the generating PC; CI transfers those reviewed bytes.
        rendererHash: state.rendererHash,
        input: {
          config,
          inputs: metadata.inputs,
          sourceUrl: metadata.sourceUrl,
          license: meta.license,
        },
        assets: Object.entries(GEO_THUMBNAIL_SIZES).map(([variant, size]) => ({
          key: geoThumbnailKey(
            dataId,
            config.version,
            variant as keyof typeof GEO_THUMBNAIL_SIZES
          ),
          variant,
          contentType: 'image/webp' as const,
          ...size,
        })),
      });
      if (
        !compareImageGenerationManifest(manifest, plan).isCurrent ||
        plan.fingerprint !== state.items[dataId]?.fingerprint
      )
        throw new Error(dataId + ': unreviewed fingerprint');
      objects.set(manifestKey, bytes);
      for (const asset of manifest.assets) {
        const image = read(asset.key);
        if (image.length !== asset.bytes || sha256(image) !== asset.sha256)
          throw new Error(asset.key + ': image SHA mismatch');
        objects.set(asset.key, image);
      }
      return { plan, manifest };
    }
  );
  if (transferred && transferred.size !== objects.size)
    throw new Error('Unexpected transfer objects');
  return { bundles, objects };
}

async function main() {
  const root = process.cwd();
  const [mode, file] = process.argv.slice(2);
  if (
    !['--export', '--import', '--plan', '--verify', '--validate'].includes(
      mode ?? ''
    )
  )
    throw new Error(
      'Use --export <file>, --import <file>, --plan, --verify or --validate'
    );
  let transferred: Map<string, Buffer> | undefined;
  if (mode === '--import') {
    if (!file) throw new Error('Transfer file required');
    const input = readFileSync(file);
    if (input.length > 20_000_000) throw new Error('Transfer too large');
    const transfer = transferSchema.parse(JSON.parse(input.toString('utf8')));
    transferred = new Map(
      transfer.objects.map((object) => {
        const bytes = Buffer.from(object.base64, 'base64');
        if (sha256(bytes) !== object.sha256)
          throw new Error(object.key + ': transfer SHA mismatch');
        return [object.key, bytes];
      })
    );
    if (transferred.size !== transfer.objects.length)
      throw new Error('Duplicate transfer keys');
  }
  const { bundles, objects } = readStagedGeoThumbnails(root, transferred);
  if (mode === '--export') {
    if (!file) throw new Error('Transfer file required');
    save(
      file,
      JSON.stringify({
        kind: 'stats47-geo-thumbnail-transfer',
        objects: [...objects].map(([key, bytes]) => ({
          key,
          sha256: sha256(bytes),
          base64: bytes.toString('base64'),
        })),
      })
    );
  } else if (mode === '--import') {
    // Every key and hash was checked before any file is written.
    for (const [key, bytes] of objects) save(join(root, stageRoot, key), bytes);
  } else if (mode === '--plan' || mode === '--verify') {
    if (mode === '--plan')
      save(
        join(root, planPath),
        JSON.stringify({ localOnly: true, reason: 'Inspection incomplete' })
      );
    const store = createS3ImageObjectStoreFromEnv();
    if (!store) throw new Error('Authenticated R2 S3 credentials required');
    const items: Parameters<
      typeof createImageGenerationPublishPlan
    >[0]['items'] = [];
    for (const { plan, manifest } of bundles) {
      const remote = await inspectR2ImageGeneration(plan, store);
      if (remote.reason === 'probe-error')
        throw new Error(plan.entityId + ': R2 probe failed');
      if (mode === '--verify' && !remote.isCurrent)
        throw new Error(plan.entityId + ': remote ' + remote.reason);
      if (!remote.isCurrent)
        items.push({
          plan,
          manifest,
          expectedRemoteFingerprint: remote.remoteFingerprint,
          expectedRemoteManifestSha256: remote.remoteManifestSha256,
        });
    }
    if (mode === '--plan') {
      save(
        join(root, planPath),
        JSON.stringify(
          createImageGenerationPublishPlan({
            generator: 'geo-source-thumbnail',
            stageRoot,
            items,
          }),
          null,
          2
        )
      );
      console.log('Changed bundles: ' + items.length);
    } else {
      const verified = [];
      for (const [key, local] of objects) {
        const expectedSha = sha256(local);
        const remote = await store.get(key);
        if (!remote || sha256(remote.body) !== expectedSha)
          throw new Error(key + ': R2 bytes differ');
        const response = await fetch(
          'https://storage.stats47.jp/' + key + '?verify=' + expectedSha,
          { signal: AbortSignal.timeout(30000) }
        );
        if (
          !response.ok ||
          sha256(Buffer.from(await response.arrayBuffer())) !== expectedSha
        )
          throw new Error(
            key + ': public bytes differ (HTTP ' + response.status + ')'
          );
        verified.push({ key, sha256: expectedSha, bytes: local.length });
      }
      save(
        join(root, '.claude/state/geo/source-thumbnails-publication.json'),
        JSON.stringify(
          {
            schemaVersion: 1,
            verifiedAt: new Date().toISOString(),
            workflowRun: process.env.GITHUB_RUN_ID
              ? 'https://github.com/' +
                process.env.GITHUB_REPOSITORY +
                '/actions/runs/' +
                process.env.GITHUB_RUN_ID
              : null,
            datasets: bundles.length,
            images: verified.filter((item) => item.key.endsWith('.webp'))
              .length,
            verification:
              'authenticated S3 GET and public HTTPS GET; SHA256 matches local bytes for every image and manifest',
            sourcePagesProductionVerified: false,
            objects: verified,
          },
          null,
          2
        ) + '\n'
      );
    }
  }
  console.log(
    mode +
      ': ' +
      bundles.length +
      ' datasets / ' +
      objects.size +
      ' objects validated'
  );
}

if (
  process.argv[1]
    ?.replaceAll('\\', '/')
    .endsWith('/sync-geo-source-thumbnails.ts')
) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
