/** Bounded Geo source publication. Stored gzip and decoded HTTP representations have separate hashes. */
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

import {
  publishExactR2Assets,
  type ExactAssetCandidate,
} from '@stats47/r2-storage/tooling';
import type { ImageObjectStore } from '../../../packages/r2-storage/src/image-pipeline';
import { GIS_DATASETS_BY_ID } from '../../../packages/gis/src/mlit-ksj/datasets';
import { getKsjLicensePolicy } from '../../../packages/gis/src/mlit-ksj/license-policy';
import { FLOOD_ARCHIVES } from '../../../packages/gis/src/geo-analysis/flood-inputs';
import { SOURCE_REPAIR_VERSIONS } from '../../../packages/gis/src/mlit-ksj/scripts/rebuild-source-page-data';

export const REPAIR_VERSIONS: Readonly<Record<string, string>> = {
  ...SOURCE_REPAIR_VERSIONS,
  A38: '20',
  A31b: '25',
};
export const CATALOG_KEY = 'app/geo/layers/items.json';
export const sha256 = (body: Buffer) =>
  createHash('sha256').update(body).digest('hex');
export const isGzip = (body: Buffer) => body[0] === 0x1f && body[1] === 0x8b;
export const decoded = (body: Buffer) =>
  isGzip(body) ? gunzipSync(body) : body;
const hashPattern = /^[a-f0-9]{64}$/;
const count = (value: number) => Number.isSafeInteger(value) && value >= 0;

export function parseRepairIds(value: string): string[] {
  if (value === 'all') return Object.keys(REPAIR_VERSIONS).sort();
  if (value === 'none') return [];
  const ids = value.split(',');
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !Object.hasOwn(REPAIR_VERSIONS, id))
  )
    throw Error(
      'Expected all, none, or unique IDs from the bounded repair set'
    );
  return ids.sort();
}

export function assertPublicDataset(dataId: string, version: string) {
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  if (
    !meta ||
    meta.latestVersion !== version ||
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    throw Error(`Edition/publication policy rejected: ${dataId}/${version}`);
  return meta;
}

export function assertSafeKey(key: string) {
  if (
    !/^[A-Za-z0-9._~/-]+$/.test(key) ||
    key.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw Error(`Unsafe exact key: ${key}`);
}

export type RepairOutput = {
  key: string;
  bytes: number;
  outputSha256: string;
  featureCount: number;
  sourceSha256?: string;
  sourceUrl?: string;
};
export type RepairManifest = {
  dataId: string;
  version: string;
  outputs: RepairOutput[];
  sourceUrl?: string;
  sourceSha256?: string;
  sourceCounts?: Record<string, number>;
  sourceFeatureCount?: number;
  sources?: {
    url: string;
    sha256: string;
    scope: string;
    datum: string;
    featureCount: number;
  }[];
};
const officialUrl = (url: string) => {
  const parsed = new URL(url);
  return (
    parsed.origin === 'https://nlftp.mlit.go.jp' &&
    parsed.pathname.startsWith('/ksj/gml/data/')
  );
};

export function validateRepairManifest(
  manifest: RepairManifest
): RepairOutput[] {
  const { dataId, version, outputs } = manifest;
  assertPublicDataset(dataId, version);
  if (
    dataId === 'A31b' ||
    REPAIR_VERSIONS[dataId] !== version ||
    !Array.isArray(outputs) ||
    !outputs.length
  )
    throw Error('Unexpected repair manifest');
  let expected: number;
  if (dataId === 'A38') {
    if (
      manifest.sourceSha256 !==
        '40a0be3688cd129dfd86fef7508e563b1f34259b5b37a521ebf7a01295013b5d' ||
      manifest.sourceUrl !==
        'https://nlftp.mlit.go.jp/ksj/gml/data/A38/A38-20/A38-20_GML.zip' ||
      manifest.sourceCounts?.['1'] !== 118119 ||
      manifest.sourceCounts?.['2'] !== 116365 ||
      manifest.sourceCounts?.['3'] !== 116037 ||
      outputs.length !== 141
    )
      throw Error('A38 pinned original / three-level conservation failed');
    expected = 118119 + 116365 + 116037;
    for (const level of [1, 2, 3]) {
      const rows = outputs.filter((o) => o.key.includes(`/A38-20_${level}.`));
      if (
        rows.length !== 47 ||
        rows.reduce((n, o) => n + o.featureCount, 0) !==
          manifest.sourceCounts[String(level)] ||
        Array.from({ length: 47 }, (_, i) =>
          String(i + 1).padStart(2, '0')
        ).some(
          (pref) =>
            !rows.some((o) => o.key.endsWith(`_${level}.${pref}.topojson`))
        )
      )
        throw Error('A38 prefecture/level coverage failed');
    }
  } else {
    const sources = manifest.sources;
    if (
      !sources?.length ||
      new Set(sources.map((s) => s.scope)).size !== sources.length ||
      sources.some(
        (s) =>
          !hashPattern.test(s.sha256) ||
          !officialUrl(s.url) ||
          !count(s.featureCount) ||
          !['jgd', 'tokyo'].includes(s.datum)
      )
    )
      throw Error('Original archive evidence is missing');
    expected = sources.reduce((n, source) => n + source.featureCount, 0);
    if (manifest.sourceFeatureCount !== expected)
      throw Error('Original total differs');
    for (const source of sources) {
      const rows = outputs.filter(
        (o) => o.sourceUrl === source.url && o.sourceSha256 === source.sha256
      );
      if (
        !rows.length ||
        rows.reduce((n, o) => n + o.featureCount, 0) !== source.featureCount
      )
        throw Error('Per-archive feature conservation failed');
    }
  }
  const prefix = `gis/mlit-ksj/${dataId}/${version}/`;
  for (const output of outputs) {
    assertSafeKey(output.key);
    if (
      !output.key.startsWith(prefix) ||
      !output.key.endsWith('.topojson') ||
      !hashPattern.test(output.outputSha256) ||
      !count(output.featureCount) ||
      !count(output.bytes) ||
      output.bytes === 0
    )
      throw Error(`Invalid repair output: ${output.key}`);
  }
  if (
    new Set(outputs.map((o) => o.key)).size !== outputs.length ||
    expected < 1 ||
    outputs.reduce((n, o) => n + o.featureCount, 0) !== expected
  )
    throw Error('Repair output uniqueness/conservation failed');
  return outputs;
}

export type FloodManifest = {
  dataId: string;
  version: string;
  sourceUrl: string;
  sourceCount: number;
  inputManifestSha256: string;
  sources: { key: string; sha256: string; recordCount: number }[];
  assets: {
    key: string;
    label: string;
    bytes: number;
    sha256: string;
    recordCount: number;
    sourceKey: string;
    sourceSha256: string;
  }[];
};
export function validateFloodManifest(manifest: FloodManifest): RepairOutput[] {
  assertPublicDataset(manifest.dataId, manifest.version);
  if (
    manifest.dataId !== 'A31b' ||
    manifest.version !== '25' ||
    manifest.sourceCount !== FLOOD_ARCHIVES.length ||
    !hashPattern.test(manifest.inputManifestSha256) ||
    manifest.sources?.length !== FLOOD_ARCHIVES.length ||
    !manifest.assets?.length ||
    new Set(manifest.sources.map((s) => s.key)).size !== FLOOD_ARCHIVES.length
  )
    throw Error('Incomplete flood evidence');
  for (const archive of FLOOD_ARCHIVES) {
    const source = manifest.sources.find((s) => s.key === archive.key);
    const assets = manifest.assets.filter((a) => a.sourceKey === archive.key);
    if (
      !source ||
      !hashPattern.test(source.sha256) ||
      !count(source.recordCount) ||
      assets.reduce((n, a) => n + a.recordCount, 0) !== source.recordCount ||
      assets.some(
        (a) =>
          a.sourceSha256 !== source.sha256 ||
          !a.key.startsWith(
            `gis/mlit-ksj/A31b/25/display/${archive.riverClass}/${archive.meshCode}/`
          )
      )
    )
      throw Error(`Flood archive conservation failed: ${archive.key}`);
  }
  const sourceKeys = new Set(manifest.sources.map((s) => s.key));
  for (const asset of manifest.assets) {
    assertSafeKey(asset.key);
    if (
      !asset.key.endsWith('.geojson') ||
      !sourceKeys.has(asset.sourceKey) ||
      !hashPattern.test(asset.sha256) ||
      !count(asset.bytes) ||
      !asset.bytes ||
      !count(asset.recordCount) ||
      !asset.recordCount
    )
      throw Error(`Invalid flood output: ${asset.key}`);
  }
  if (
    new Set(manifest.assets.map((a) => a.key)).size !== manifest.assets.length
  )
    throw Error('Duplicate flood output');
  return manifest.assets.map((a) => ({
    key: a.key,
    bytes: a.bytes,
    outputSha256: a.sha256,
    featureCount: a.recordCount,
  }));
}

export function validateLocalOutput(root: string, output: RepairOutput) {
  const candidate = candidateForGeoKey(root, output.key);
  const value = JSON.parse(decoded(candidate.body).toString('utf8'));
  const features =
    value.type === 'FeatureCollection'
      ? value.features?.length
      : value.type === 'Topology'
        ? Object.values(
            value.objects as Record<
              string,
              { type: string; geometries?: unknown[] }
            >
          ).reduce(
            (n, o) =>
              n +
              (o.type === 'GeometryCollection'
                ? (o.geometries?.length ?? 0)
                : 1),
            0
          )
        : -1;
  if (
    candidate.size !== output.bytes ||
    candidate.sha256 !== output.outputSha256 ||
    features !== output.featureCount ||
    JSON.stringify(
      value.type === 'Topology' ? value.objects : value.features
    ).includes('\ufffd')
  )
    throw Error(`Local source integrity failed: ${output.key}`);
}

export function publicationPhase(key: string) {
  if (key.startsWith('gis/mlit-ksj/')) return 0;
  if (key === CATALOG_KEY) return 3;
  if (key.endsWith('/item.json')) return 2;
  return 1;
}

export function candidateForGeoKey(
  root: string,
  key: string
): ExactAssetCandidate {
  assertSafeKey(key);
  const file = path.resolve(root, key);
  const realRoot = realpathSync(root);
  if (
    !file.startsWith(path.resolve(root) + path.sep) ||
    lstatSync(file).isSymbolicLink() ||
    !lstatSync(file).isFile() ||
    !realpathSync(file).startsWith(realRoot + path.sep)
  )
    throw Error('Unsafe staging file');
  const body = readFileSync(file);
  const gis = key.match(
    /^gis\/mlit-ksj\/([^/]+)\/([^/]+)\/.*\.(topojson|geojson)$/
  );
  if (gis) {
    assertPublicDataset(gis[1], gis[2]);
    if (REPAIR_VERSIONS[gis[1]] !== gis[2])
      throw Error('GIS key is outside repair scope');
    if (gis[1] === 'A31b' && !key.startsWith('gis/mlit-ksj/A31b/25/display/'))
      throw Error('Only flood view files can be published');
  } else if (
    key !== CATALOG_KEY &&
    !/^app\/geo\/datasets\/[A-Za-z0-9-]+\/(item|repair|manifest)\.json$/.test(
      key
    )
  ) {
    throw Error('Key is outside source publication scope');
  }
  // Existing rebuilders already gzip the local files. Never gzip a second time.
  const contentEncoding = isGzip(body) ? 'gzip' : null;
  const plain = decoded(body);
  if (isGzip(plain)) throw Error('Double gzip is forbidden');
  JSON.parse(plain.toString('utf8'));
  return {
    key,
    absolutePath: file,
    body,
    sha256: sha256(body),
    size: body.length,
    contentType: gis ? 'application/octet-stream' : 'application/json',
    contentEncoding,
  };
}

export type PlannedObject = {
  key: string;
  sha256: string;
  bytes: number;
  decodedSha256: string;
  decodedBytes: number;
  contentType: string;
  contentEncoding: string | null;
  beforeEtag: string | null;
};
export type GeoSourcePlan = {
  schemaVersion: 1;
  generatedAt: string;
  repairIds: string[];
  objects: PlannedObject[];
};

/** Bound memory and R2 requests; finish in-flight work before propagating a batch failure. */
export async function mapGeoSourceBatch<T, R>(
  items: readonly T[],
  work: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let offset = 0; offset < items.length; offset += 4) {
    const batch = await Promise.allSettled(
      items.slice(offset, offset + 4).map(work)
    );
    const failure = batch.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
    for (const result of batch)
      if (result.status === 'fulfilled') results.push(result.value);
  }
  return results;
}

export async function buildExactPlan(
  root: string,
  keys: string[],
  repairIds: string[],
  store: ImageObjectStore
): Promise<GeoSourcePlan> {
  if (!keys.length || new Set(keys).size !== keys.length)
    throw Error('Empty/duplicate exact key selection');
  const objects = await mapGeoSourceBatch(
    keys.sort(
      (a, b) => publicationPhase(a) - publicationPhase(b) || a.localeCompare(b)
    ),
    async (key): Promise<PlannedObject> => {
      const candidate = candidateForGeoKey(root, key);
      const before = await store.head(key);
      if (before && !before.etag) throw Error(`Missing original ETag: ${key}`);
      const body = decoded(candidate.body);
      return {
        key,
        sha256: candidate.sha256,
        bytes: candidate.size,
        decodedSha256: sha256(body),
        decodedBytes: body.length,
        contentType: candidate.contentType,
        contentEncoding: candidate.contentEncoding,
        beforeEtag: before?.etag ?? null,
      };
    }
  );
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repairIds,
    objects,
  };
}

export type Readback = {
  key: string;
  storedSha256: string;
  storedBytes: number;
  publicSha256: string;
  publicBytes: number;
  url: string;
  httpStatus: number;
};
export async function readbackObject(
  object: PlannedObject,
  store: ImageObjectStore,
  publicBase: string,
  canonical = false
): Promise<Readback> {
  const stored = await store.get(object.key);
  if (
    !stored ||
    sha256(stored.body) !== object.sha256 ||
    stored.body.length !== object.bytes ||
    (stored.contentEncoding ?? null) !== object.contentEncoding
  )
    throw Error(`S3 readback failed: ${object.key}`);
  const url = `${publicBase}/${object.key}${canonical ? '' : `?geo-source=${object.sha256}`}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok)
    throw Error(`Public readback HTTP ${response.status}: ${object.key}`);
  const publicBody = decoded(Buffer.from(await response.arrayBuffer()));
  if (
    sha256(publicBody) !== object.decodedSha256 ||
    publicBody.length !== object.decodedBytes
  )
    throw Error(`Public readback hash differs: ${object.key}`);
  return {
    key: object.key,
    storedSha256: object.sha256,
    storedBytes: stored.body.length,
    publicSha256: object.decodedSha256,
    publicBytes: publicBody.length,
    url,
    httpStatus: response.status,
  };
}

/** All keys are preflighted before the first PUT; catalog visibility follows verified GIS + items. */
export async function executeGeoSourcePlan(options: {
  root: string;
  plan: GeoSourcePlan;
  store: ImageObjectStore;
  publicBase: string;
  apply: boolean;
  onVerified?: (row: Readback) => void;
}) {
  const { root, plan, store, apply } = options;
  if (apply && process.env.CI !== 'true')
    throw Error('Geo source writes are CI-only');
  if (
    plan.schemaVersion !== 1 ||
    !plan.objects.length ||
    new Set(plan.objects.map((o) => o.key)).size !== plan.objects.length
  )
    throw Error('Invalid exact plan');
  const ids = new Set(
    parseRepairIds(plan.repairIds.length ? plan.repairIds.join(',') : 'none')
  );
  await mapGeoSourceBatch(plan.objects, async (object) => {
    const candidate = candidateForGeoKey(root, object.key);
    if (
      candidate.sha256 !== object.sha256 ||
      candidate.size !== object.bytes ||
      candidate.contentEncoding !== object.contentEncoding ||
      candidate.contentType !== object.contentType ||
      sha256(decoded(candidate.body)) !== object.decodedSha256 ||
      decoded(candidate.body).length !== object.decodedBytes
    )
      throw Error(`Staging changed since plan: ${object.key}`);
    if (object.key.startsWith('gis/') && !ids.has(object.key.split('/')[2]))
      throw Error('Unselected repair key');
    const remote = await store.head(object.key);
    if ((remote?.etag ?? null) !== object.beforeEtag)
      throw Error(`Remote changed since plan: ${object.key}`);
  });
  const summary = {
    candidates: plan.objects.length,
    changed: 0,
    uploaded: 0,
    skipped: 0,
    verified: 0,
  };
  for (const phase of [0, 1, 2, 3]) {
    const phaseObjects = plan.objects
      .filter((object) => publicationPhase(object.key) === phase)
      .sort((a, b) => a.key.localeCompare(b.key));
    await mapGeoSourceBatch(phaseObjects, async (object) => {
      const candidate = candidateForGeoKey(root, object.key);
      // The shared writer's conditional PUT is additionally pinned to this reviewed plan's ETag.
      const guarded: ImageObjectStore = {
        ...store,
        put: async (request) => {
          if (
            (request.ifMatch ?? null) !== object.beforeEtag ||
            (object.beforeEtag === null && request.ifNoneMatch !== '*')
          )
            throw Error(`Concurrent modification before PUT: ${object.key}`);
          return store.put(request);
        },
      };
      const result = await publishExactR2Assets({
        candidates: [candidate],
        store: guarded,
        dryRun: !apply,
      });
      summary.changed += result.changed;
      summary.uploaded += result.uploaded;
      summary.skipped += result.skipped;
      if (apply) {
        const row = await readbackObject(object, store, options.publicBase);
        options.onVerified?.(row);
        summary.verified++;
      }
    });
  }
  return summary;
}
