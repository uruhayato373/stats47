#!/usr/bin/env tsx

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchFromR2,
  fetchFromR2AsJson,
  listFromR2WithSize,
} from '@stats47/r2-storage/tooling';
import { config } from 'dotenv';

import { GIS_DATASETS_BY_ID } from '../datasets';
import {
  discoverOfficialKsjArchiveAlternatives,
  discoverOfficialKsjArchives,
  type KsjOfficialArchive,
} from '../official-download-discovery';
import {
  EXPECTED_PUBLIC_ACQUISITION_COUNT,
  PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS,
  UNREGISTERED_KSJ_OFFICIAL_POLICY,
} from '../official-policy';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../..'
);
config({ path: path.join(PROJECT_ROOT, '.env.local'), quiet: true });

type ManifestFile = {
  key: string;
  featureCount: number;
  uncompressedBytes: number;
};

type PublicKsjManifest = {
  schemaVersion: number;
  datasetId: string;
  datasetName: string;
  version: string;
  scope: string;
  sourcePageUrl: string;
  sourceArchiveUrl: string;
  sourceArchiveFilename: string;
  sourceArchiveBytes: number;
  sourceArchiveSha256: string;
  sourceFormat: string;
  sourceDatum: string;
  outputDatum: string;
  attribution: string;
  files: ManifestFile[];
  acquiredAt: string;
};

type AuditTarget = {
  dataId: string;
  archive: KsjOfficialArchive;
  manifestKey: string;
};

async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  operation: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await operation(values[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker())
  );
  return results;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function validateManifest(options: {
  target: AuditTarget;
  sourceArchive: KsjOfficialArchive;
  manifest: PublicKsjManifest;
  allKeys: Set<string>;
  sizes: Map<string, number>;
}): string[] {
  const { target, sourceArchive, manifest, allKeys, sizes } = options;
  const { dataId, archive, manifestKey } = target;
  const dataset = GIS_DATASETS_BY_ID.get(dataId);
  const prefix = manifestKey.slice(0, -'/manifest.json'.length);
  const errors: string[] = [];
  const mismatch = (field: string, actual: unknown, expected: unknown): void => {
    if (actual !== expected) {
      errors.push(`${manifestKey}: ${field} expected=${String(expected)} actual=${String(actual)}`);
    }
  };

  mismatch('schemaVersion', manifest.schemaVersion, 1);
  mismatch('datasetId', manifest.datasetId, dataId);
  mismatch('datasetName', manifest.datasetName, dataset?.name);
  mismatch('version', manifest.version, archive.version);
  mismatch('scope', manifest.scope, archive.scope);
  mismatch('sourcePageUrl', manifest.sourcePageUrl, dataset?.sourcePageUrl);
  mismatch('sourceArchiveUrl', manifest.sourceArchiveUrl, sourceArchive.url);
  mismatch('sourceArchiveFilename', manifest.sourceArchiveFilename, sourceArchive.filename);
  mismatch('sourceArchiveBytes', manifest.sourceArchiveBytes, sourceArchive.sizeBytes);
  mismatch('sourceFormat', manifest.sourceFormat, sourceArchive.format);
  mismatch('sourceDatum', manifest.sourceDatum, sourceArchive.datum);
  mismatch('outputDatum', manifest.outputDatum, 'WGS84');
  mismatch('attribution', manifest.attribution, '国土交通省国土数値情報ダウンロードサイト');

  if (!/^[a-f0-9]{64}$/.test(manifest.sourceArchiveSha256 ?? '')) {
    errors.push(`${manifestKey}: sourceArchiveSha256が不正です`);
  }
  if (!Number.isFinite(Date.parse(manifest.acquiredAt ?? ''))) {
    errors.push(`${manifestKey}: acquiredAtが不正です`);
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    errors.push(`${manifestKey}: filesが空です`);
    return errors;
  }

  const declaredKeys = new Set<string>();
  for (const file of manifest.files) {
    if (
      typeof file?.key !== 'string' ||
      !file.key.startsWith(`${prefix}/`) ||
      !file.key.endsWith('.topojson')
    ) {
      errors.push(`${manifestKey}: 不正な出力key ${String(file?.key)}`);
      continue;
    }
    if (declaredKeys.has(file.key)) errors.push(`${manifestKey}: 出力keyが重複 ${file.key}`);
    declaredKeys.add(file.key);
    if (!isPositiveInteger(file.featureCount)) {
      errors.push(`${manifestKey}: featureCountが不正 ${file.key}`);
    }
    if (!isPositiveInteger(file.uncompressedBytes)) {
      errors.push(`${manifestKey}: uncompressedBytesが不正 ${file.key}`);
    }
    if (!allKeys.has(file.key) || (sizes.get(file.key) ?? 0) <= 0) {
      errors.push(`${manifestKey}: R2出力が存在しないか空です ${file.key}`);
    }
  }

  const actualScopeKeys = [...allKeys].filter((key) => key.startsWith(`${prefix}/`));
  const expectedScopeKeys = new Set([manifestKey, ...declaredKeys]);
  for (const key of actualScopeKeys) {
    if (!expectedScopeKeys.has(key)) errors.push(`${manifestKey}: 未宣言のR2 object ${key}`);
  }
  for (const key of expectedScopeKeys) {
    if (!allKeys.has(key)) errors.push(`${manifestKey}: R2 object欠落 ${key}`);
  }
  return errors;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'development') process.env.NODE_ENV = 'production';
  const dataIds = [...UNREGISTERED_KSJ_OFFICIAL_POLICY]
    .filter(([, policy]) => policy.decision === 'acquire')
    .map(([dataId]) => dataId)
    .sort();
  if (dataIds.length !== EXPECTED_PUBLIC_ACQUISITION_COUNT) {
    throw new Error(`公開取得対象数が不正です: ${dataIds.length}`);
  }

  const archiveGroups = await mapConcurrent(dataIds, 6, async (dataId) => {
    const dataset = GIS_DATASETS_BY_ID.get(dataId);
    if (!dataset?.sourcePageUrl) throw new Error(`登録メタが不完全です: ${dataId}`);
    const archives = await discoverOfficialKsjArchives({
      dataId,
      sourcePageUrl: dataset.sourcePageUrl,
    });
    const expected = PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.get(dataId);
    if (archives.length !== expected) {
      throw new Error(`公式アーカイブ数が不一致: ${dataId} expected=${expected} actual=${archives.length}`);
    }
    return { dataId, archives };
  });
  const targets: AuditTarget[] = archiveGroups.flatMap(({ dataId, archives }) =>
    archives.map((archive) => ({
      dataId,
      archive,
      manifestKey: `gis/mlit-ksj/${dataId}/${archive.version}/${archive.scope}/manifest.json`,
    }))
  );

  const listed = await listFromR2WithSize('gis/mlit-ksj/');
  const allKeys = new Set(listed.map(({ key }) => key));
  const sizes = new Map(listed.map(({ key, size }) => [key, size]));
  const expectedManifestKeys = new Set(targets.map(({ manifestKey }) => manifestKey));
  const errors: string[] = [];
  for (const dataId of dataIds) {
    const datasetPrefix = `gis/mlit-ksj/${dataId}/`;
    for (const key of allKeys) {
      if (
        key.startsWith(datasetPrefix) &&
        key.endsWith('/manifest.json') &&
        !expectedManifestKeys.has(key)
      ) {
        errors.push(`公式対象外のmanifestがあります: ${key}`);
      }
    }
  }

  const manifests = await mapConcurrent(targets, 12, async (target) => {
    const manifest = await fetchFromR2AsJson<PublicKsjManifest>(target.manifestKey);
    if (!manifest) return { target, manifest: null, errors: [`manifest欠落: ${target.manifestKey}`] };
    let sourceArchive = target.archive;
    if (manifest.sourceArchiveUrl !== target.archive.url) {
      const dataset = GIS_DATASETS_BY_ID.get(target.dataId);
      const alternatives = await discoverOfficialKsjArchiveAlternatives({
        dataId: target.dataId,
        sourcePageUrl: dataset?.sourcePageUrl ?? '',
        archive: target.archive,
      });
      const fallback = alternatives.find(
        (candidate) => candidate.url === manifest.sourceArchiveUrl
      );
      if (!fallback) {
        return {
          target,
          manifest,
          errors: [`公式配布にないfallback sourceです: ${target.manifestKey}`],
        };
      }
      sourceArchive = fallback;
    }
    return {
      target,
      manifest,
      errors: validateManifest({ target, sourceArchive, manifest, allKeys, sizes }),
    };
  });
  for (const result of manifests) errors.push(...result.errors);

  const samples = dataIds.flatMap((dataId) => {
    const candidates = manifests.filter(
      (result) => result.target.dataId === dataId && result.manifest
    );
    const files = candidates.flatMap((result) => result.manifest?.files ?? []);
    return files.length === 0
      ? []
      : [files.reduce((smallest, file) =>
          (sizes.get(file.key) ?? Number.MAX_SAFE_INTEGER) <
          (sizes.get(smallest.key) ?? Number.MAX_SAFE_INTEGER)
            ? file
            : smallest
        )];
  });
  await mapConcurrent(samples, 4, async ({ key }) => {
    const payload = await fetchFromR2(key);
    if (!payload) {
      errors.push(`代表Topologyを取得できません: ${key}`);
      return;
    }
    try {
      const topology = JSON.parse(payload.toString('utf8')) as {
        type?: unknown;
        objects?: unknown;
      };
      if (
        topology.type !== 'Topology' ||
        !topology.objects ||
        typeof topology.objects !== 'object' ||
        Object.keys(topology.objects).length === 0
      ) {
        errors.push(`代表Topologyの構造が不正です: ${key}`);
      }
    } catch {
      errors.push(`代表TopologyがJSONではありません: ${key}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`R2完全性監査 FAIL (${errors.length})\n${errors.slice(0, 100).join('\n')}`);
  }
  const totalFeatures = manifests.reduce(
    (sum, result) => sum + (result.manifest?.files ?? []).reduce(
      (fileSum, file) => fileSum + file.featureCount,
      0
    ),
    0
  );
  console.log(
    `PASS datasets=${dataIds.length} manifests=${manifests.length} topologySamples=${samples.length} features=${totalFeatures}`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
