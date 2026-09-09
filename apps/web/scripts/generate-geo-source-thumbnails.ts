/** Run from repo root. Default: local staging only. --plan probes R2 and emits the
 * shared publisher's exact plan; it never uploads. --ids limits a review batch. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';
import { readPrefectureFeatures } from '@stats47/visualization/server';
import sharp from 'sharp';
import { feature } from 'topojson-client';

import {
  parseGeoSourceCatalog,
  parseGeoSourceItem,
} from '../src/features/geo-analysis/lib/geo-source-catalog';
import {
  GEO_SOURCE_THUMBNAILS,
  GEO_THUMBNAIL_SIZES,
  geoThumbnailKey,
} from '../src/features/geo-analysis/lib/geo-source-thumbnail';

import { GEO_THUMBNAIL_GENERATOR_SPEC as spec } from './data/image-generator-registry';
import {
  featureExtent,
  renderGeoSourceThumbnail,
} from './lib/geo-source-thumbnail-render';
import {
  buildImageGenerationManifest,
  calculateRendererHash,
  compareImageGenerationManifest,
  createImageGenerationPlan,
  createImageGenerationPublishPlan,
  serializeImageGenerationManifest,
  sha256,
} from './lib/image-generation-manifest';
import { createImageGenerationInspector } from './lib/image-generation-r2-inspector';

import type {
  ImageGenerationManifest,
  ImageGenerationPublishPlan,
} from '@stats47/types';
import type { Feature, FeatureCollection } from 'geojson';
import type { GeometryObject, Topology } from 'topojson-specification';

const root = process.cwd();
const stageRoot = '.local/image-staging/geo-thumbnails';
const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(file, 'utf8'));
const arg = (name: string) => process.argv[process.argv.indexOf(name) + 1];
const requested = process.argv.includes('--ids')
  ? arg('--ids').split(',')
  : null;
const makePlan = process.argv.includes('--plan');
const publicBase =
  process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const stagePath = (key: string) => join(root, stageRoot, key);
const save = (file: string, content: string | Buffer) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

async function inputBytes(key: string) {
  const local = join(root, '.local/r2', key);
  if (existsSync(local)) return readFileSync(local);
  // Optional explicit offline input root is recorded through each input's SHA.
  if (process.argv.includes('--input-cache')) {
    const cache = join(arg('--input-cache'), key);
    if (existsSync(cache)) return readFileSync(cache);
  }
  const response = await fetch(`${publicBase}/${key}`, {
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const planPath = join(
    root,
    '.local/image-generation-publish-plan-geo-thumbnails.json'
  );
  save(
    planPath,
    JSON.stringify({
      localOnly: true,
      reason: 'Generation or remote inspection has not completed.',
    })
  );
  const catalog = parseGeoSourceCatalog(
    readJson(join(root, '.local/r2/app/geo/layers/items.json'))
  );
  if (!catalog) throw new Error('Valid local source catalog required');
  const ids = requested ?? catalog.items.map((item) => item.dataId);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !catalog.items.some((item) => item.dataId === id))
  )
    throw new Error('Unknown or duplicate source IDs');
  const rendererHash = calculateRendererHash(root, spec.rendererSources);
  const context = readPrefectureFeatures();
  const inspector = makePlan
    ? createImageGenerationInspector(publicBase)
    : null;
  const publishItems: Parameters<
    typeof createImageGenerationPublishPlan
  >[0]['items'] = [];
  const progress: Record<string, unknown> = {};
  let generated = 0;
  for (const id of ids) {
    const config = GEO_SOURCE_THUMBNAILS[id];
    const meta = GIS_DATASETS_BY_ID.get(id);
    const item = parseGeoSourceItem(
      readJson(join(root, `.local/r2/app/geo/datasets/${id}/item.json`))
    );
    if (
      !config ||
      !meta ||
      !item ||
      item.version !== config.version ||
      config.version !== meta.latestVersion ||
      getKsjLicensePolicy(meta.license).sourcePublication !==
        'public-r2-eligible'
    )
      throw new Error(`${id}: version/license mismatch`);
    const features: Feature[] = [];
    const inputs: { key: string; sha256: string; bytes: number }[] = [];
    for (const file of config.files) {
      const key = `gis/mlit-ksj/${id}/${config.version}/${file}`;
      if (!item.assets.some((asset) => asset.key === key))
        throw new Error(`${id}: unlisted source ${key}`);
      const bytes = await inputBytes(key);
      inputs.push({ key, sha256: sha256(bytes), bytes: bytes.length });
      const json = JSON.parse(
        (bytes[0] === 31 && bytes[1] === 139
          ? gunzipSync(bytes)
          : bytes
        ).toString()
      ) as Topology | FeatureCollection;
      const records =
        json.type === 'Topology'
          ? Object.values(json.objects).flatMap((object) => {
              const converted = feature(json, object as GeometryObject);
              return converted.type === 'FeatureCollection'
                ? converted.features
                : [converted];
            })
          : json.features;
      for (const record of records) if (record.geometry) features.push(record);
    }
    const selected = config.propertyFilter
      ? features.filter((f) =>
          config.propertyFilter!.values.includes(
            String(f.properties?.[config.propertyFilter!.key])
          )
        )
      : features;
    const extent = config.extent ?? featureExtent(selected);
    const manifestKey = `app/geo/datasets/${id}/thumbnails/${config.version}/manifest.json`;
    const assets = Object.entries(GEO_THUMBNAIL_SIZES).map(
      ([variant, size]) => ({
        key: geoThumbnailKey(
          id,
          config.version,
          variant as keyof typeof GEO_THUMBNAIL_SIZES
        ),
        variant,
        contentType: 'image/webp' as const,
        ...size,
      })
    );
    const metadata = {
      dataId: id,
      version: config.version,
      name: meta.name,
      sourceUrl: item.sourceUrl,
      sourceAcquiredAt: null,
      verifiedAt: new Date().toISOString(),
      processing:
        'stats47: geographic excerpt, north-up Mercator, no feature sampling; illustrative map, not a full inventory',
      context: {
        source: 'https://geoshape.ex.nii.ac.jp/',
        year: 2023,
        license: 'CC-BY-SA-4.0',
        usedInCalculation: false,
      },
      label: config.label,
      framing: config.framing,
      extent,
      inputFeatures: features.length,
      selection: {
        propertyFilter: config.propertyFilter ?? null,
        features: selected.length,
      },
      inputs,
    };
    const plan = createImageGenerationPlan({
      generator: spec.generator,
      entityId: id,
      manifestKey,
      rendererHash,
      input: {
        config,
        inputs,
        sourceUrl: item.sourceUrl,
        license: meta.license,
      },
      assets,
    });
    const remote = inspector ? await inspector.inspect(plan) : null;
    if (remote?.reason === 'probe-error')
      throw new Error(`${id}: remote inspection failed; no publish plan`);
    const priorPath = stagePath(manifestKey);
    let manifest = existsSync(priorPath)
      ? (readJson(priorPath) as ImageGenerationManifest<unknown>)
      : null;
    const current =
      compareImageGenerationManifest(manifest, plan).isCurrent &&
      manifest?.assets.every(
        (asset) =>
          existsSync(stagePath(asset.key)) &&
          sha256(readFileSync(stagePath(asset.key))) === asset.sha256
      );
    if (!current) {
      const files = new Map<string, string>();
      for (const asset of assets) {
        const rendered = renderGeoSourceThumbnail({
          dataId: id,
          features: selected,
          context,
          extent,
          ...asset,
          mesh: meta.geometryType === 'mesh',
        });
        const bytes = await sharp(Buffer.from(rendered.svg))
          .webp({ quality: 84 })
          .toBuffer();
        save(stagePath(asset.key), bytes);
        files.set(asset.key, stagePath(asset.key));
      }
      manifest = buildImageGenerationManifest({
        plan,
        assetFiles: files,
        metadata,
      });
      save(priorPath, serializeImageGenerationManifest(manifest));
      generated++;
    }
    if (!manifest) throw new Error(`${id}: missing manifest`);
    if (remote && !remote.isCurrent)
      publishItems.push({
        plan,
        manifest,
        expectedRemoteFingerprint: remote.remoteFingerprint,
        expectedRemoteManifestSha256: remote.remoteManifestSha256,
      });
    progress[id] = {
      fingerprint: plan.fingerprint,
      manifestKey,
      extent,
      files: manifest.assets.length,
      bytes: manifest.assets.reduce((sum, a) => sum + a.bytes, 0),
      status: 'generated-local',
      productionVerified: false,
    };
    console.log(
      `${id}: ${current ? 'current' : 'generated'} ${features.length} features, ${manifest.assets.length} images`
    );
  }
  // A local-only run cannot accidentally yield an uploadable plan with invented remote state.
  const publishPlan: ImageGenerationPublishPlan | null = makePlan
    ? createImageGenerationPublishPlan({
        generator: spec.generator,
        stageRoot,
        items: publishItems,
      })
    : null;
  save(
    planPath,
    JSON.stringify(
      publishPlan ?? {
        localOnly: true,
        reason: 'Run with --plan to inspect remote state before publishing.',
      },
      null,
      2
    )
  );
  const statePath = join(root, '.claude/state/geo/source-thumbnails.json');
  const previous = existsSync(statePath)
    ? (readJson(statePath) as { items: Record<string, unknown> })
    : { items: {} };
  save(
    statePath,
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        rendererHash,
        items: { ...previous.items, ...progress },
      },
      null,
      2
    ) + '\n'
  );
  console.log(
    `${ids.length} datasets checked; ${generated} regenerated. Local staging: ${stageRoot}`
  );
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
