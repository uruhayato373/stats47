#!/usr/bin/env tsx

import { createHash } from 'node:crypto';
import {
  createReadStream,
  mkdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertR2WriteAllowed,
  createS3ImageObjectStoreFromEnv,
  deleteMultipleFromR2,
  fetchFromR2AsJson,
  listFromR2,
  publishExactR2Assets,
  resolveExactAssetCandidates,
} from '@stats47/r2-storage/tooling';
import { config } from 'dotenv';

import {
  convertGeoJsonFeatureCollectionToTopoJson,
  convertGeoJsonFilesToTopoJson,
  partitionByLimits,
  saveTopoJson,
} from '../converter';
import { GIS_DATASETS_BY_ID, type GisDatasetMeta } from '../datasets';
import { cleanupTempFiles, downloadZip, extractGeoJson } from '../downloader';
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
import {
  inspectPublishedScope,
  type PublishedScopeManifest,
} from '../published-scope';
import { getCodeConfig } from '../registry';
import type { KsjGeometryType, KsjSimplifyOptions } from '../types';
import { streamGeoJsonFeatureBatches } from '../stream-geojson';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../..'
);
config({ path: path.join(PROJECT_ROOT, '.env.local'), quiet: true });

const ATTRIBUTION = '国土交通省国土数値情報ダウンロードサイト';
const STREAMING_GEOJSON_THRESHOLD = 128 * 1024 * 1024;

function defaultSimplifyOptions(geometryType: KsjGeometryType): KsjSimplifyOptions {
  if (geometryType === 'point') return { quantize: 1e6, simplifyQuantile: 0 };
  if (geometryType === 'mesh') return { quantize: 1e4, simplifyQuantile: 0.02 };
  return { quantize: 1e5, simplifyQuantile: 0.01 };
}

function safeSegment(value: string): string {
  const result = value.replace(/[^A-Za-z0-9._~-]+/g, '-').replace(/^-|-$/g, '');
  if (!result || result === '.' || result === '..') {
    throw new Error(`安全なR2 path segmentにできません: ${value}`);
  }
  return result;
}

async function sha256File(file: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

async function publishLocalKey(key: string): Promise<void> {
  const store = createS3ImageObjectStoreFromEnv();
  if (!store) throw new Error('R2 S3認証情報がありません');
  const candidates = resolveExactAssetCandidates(PROJECT_ROOT, {
    keys: [key],
    prefix: null,
    extensions: [],
  });
  await publishExactR2Assets({ candidates, store, dryRun: false });
}

function targetIds(args: string[]): string[] {
  const index = args.indexOf('--data-id');
  const selected = index >= 0
    ? (args[index + 1] ?? '').split(',').map((value) => value.trim()).filter(Boolean)
    : [...UNREGISTERED_KSJ_OFFICIAL_POLICY]
        .filter(([, policy]) => policy.decision === 'acquire')
        .map(([dataId]) => dataId);
  const unique = [...new Set(selected)].sort();
  for (const dataId of unique) {
    if (UNREGISTERED_KSJ_OFFICIAL_POLICY.get(dataId)?.decision !== 'acquire') {
      throw new Error(`公開取得対象ではありません: ${dataId}`);
    }
  }
  return unique;
}

function argumentValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function processArchive(options: {
  dataset: GisDatasetMeta;
  archive: KsjOfficialArchive;
  remoteKeys: Set<string>;
}): Promise<'acquired' | 'skipped'> {
  const { dataset, archive, remoteKeys } = options;
  const scope = safeSegment(archive.scope);
  const prefix = `gis/mlit-ksj/${dataset.dataId}/${archive.version}/${scope}`;
  const manifestKey = `${prefix}/manifest.json`;
  let staleKeys = [...remoteKeys].filter((key) => key.startsWith(`${prefix}/`));
  if (remoteKeys.has(manifestKey)) {
    let manifest: PublishedScopeManifest | null;
    try {
      manifest = await fetchFromR2AsJson<PublishedScopeManifest>(manifestKey);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      manifest = null;
    }
    const inspection = inspectPublishedScope({
      prefix,
      manifestKey,
      manifest,
      remoteKeys,
    });
    if (inspection.action === 'skip') {
      if (inspection.staleKeys.length === 0) return 'skipped';
      const deletion = await deleteMultipleFromR2(inspection.staleKeys);
      if (
        deletion.errors.length > 0 ||
        deletion.deleted.length !== inspection.staleKeys.length
      ) {
        throw new Error(
          `manifest外objectの削除に失敗しました: ${prefix} deleted=${deletion.deleted.length}/${inspection.staleKeys.length}`
        );
      }
      for (const key of inspection.staleKeys) remoteKeys.delete(key);
      console.log(
        `  manifest外objectを整理: ${inspection.staleKeys.length} objects`
      );
      return 'skipped';
    }
    staleKeys = inspection.deleteKeys;
    console.log(`  scopeを再取得: ${inspection.reason}`);
  }

  if (staleKeys.length > 0) {
    const deletion = await deleteMultipleFromR2(staleKeys);
    if (deletion.errors.length > 0 || deletion.deleted.length !== staleKeys.length) {
      throw new Error(
        `未完了scopeの自己修復に失敗しました: ${prefix} deleted=${deletion.deleted.length}/${staleKeys.length}`
      );
    }
    for (const key of staleKeys) remoteKeys.delete(key);
    console.log(`  未完了scopeを自己修復: ${staleKeys.length} objects`);
  }

  const simplifyOptions =
    getCodeConfig(dataset.dataId)?.simplifyOptions ??
    defaultSimplifyOptions(dataset.geometryType);
  const localScopeDir = path.join(PROJECT_ROOT, '.local/r2', prefix);
  mkdirSync(localScopeDir, { recursive: true });

  async function acquireFromSource(sourceArchive: KsjOfficialArchive): Promise<{
    sourceArchive: KsjOfficialArchive;
    sourceArchiveSha256: string;
    outputFiles: Array<{ key: string; featureCount: number; uncompressedBytes: number }>;
  }> {
    const sourceZipPath = await downloadZip(
      sourceArchive.url,
      dataset.dataId,
      sourceArchive.version,
      scope
    );
    const sourceSha256 = await sha256File(sourceZipPath);
    const sourceOutputFiles: Array<{
      key: string;
      featureCount: number;
      uncompressedBytes: number;
    }> = [];
    try {
      const geojsonFiles = await extractGeoJson(sourceZipPath, '');
      const groups = partitionByLimits(
        geojsonFiles,
        (file) => statSync(file).size,
        { maxItems: 100, maxBytes: 25 * 1024 * 1024 }
      );
      const hasStreamingInput = geojsonFiles.some(
        (file) => statSync(file).size >= STREAMING_GEOJSON_THRESHOLD
      );
      let outputIndex = 0;
      const publishTopology = async (options: {
        topology: Parameters<typeof saveTopoJson>[0];
        featureCount: number;
      }): Promise<void> => {
        outputIndex += 1;
        const suffix = groups.length === 1 && !hasStreamingInput
          ? 'data.topojson'
          : `data-${String(outputIndex).padStart(3, '0')}.topojson`;
        const key = `${prefix}/${suffix}`;
        const localPath = path.join(PROJECT_ROOT, '.local/r2', key);
        const uncompressedBytes = saveTopoJson(options.topology, localPath);
        await publishLocalKey(key);
        unlinkSync(localPath);
        sourceOutputFiles.push({
          key,
          featureCount: options.featureCount,
          uncompressedBytes,
        });
        remoteKeys.add(key);
      };
      for (const group of groups) {
        if (
          group.length === 1 &&
          statSync(group[0]).size >= STREAMING_GEOJSON_THRESHOLD
        ) {
          console.log(
            `  巨大GeoJSONをstream分割: ${path.basename(group[0])} (${(
              statSync(group[0]).size / 1024 / 1024
            ).toFixed(1)}MB)`
          );
          for await (const features of streamGeoJsonFeatureBatches(group[0], {
            maxFeatures: 20_000,
            maxBytes: 24 * 1024 * 1024,
          })) {
            const converted = convertGeoJsonFeatureCollectionToTopoJson(
              { type: 'FeatureCollection', features },
              dataset.dataId,
              simplifyOptions,
              sourceArchive.datum
            );
            await publishTopology(converted);
          }
        } else {
          const converted = convertGeoJsonFilesToTopoJson(
            group,
            dataset.dataId,
            simplifyOptions,
            sourceArchive.datum
          );
          await publishTopology(converted);
        }
      }
      return {
        sourceArchive,
        sourceArchiveSha256: sourceSha256,
        outputFiles: sourceOutputFiles,
      };
    } catch (error) {
      const partialKeys = sourceOutputFiles.map(({ key }) => key);
      if (partialKeys.length > 0) {
        const deletion = await deleteMultipleFromR2(partialKeys);
        if (deletion.errors.length > 0 || deletion.deleted.length !== partialKeys.length) {
          throw new Error(
            `変換失敗後のpartial object削除に失敗: ${prefix} deleted=${deletion.deleted.length}/${partialKeys.length}; original=${error instanceof Error ? error.message : String(error)}`
          );
        }
        for (const key of partialKeys) remoteKeys.delete(key);
      }
      throw error;
    } finally {
      cleanupTempFiles(sourceZipPath);
    }
  }

  let acquired: Awaited<ReturnType<typeof acquireFromSource>>;
  try {
    acquired = await acquireFromSource(archive);
  } catch (error) {
    if (!(error instanceof SyntaxError) || archive.format !== 'geojson') throw error;
    const alternatives = await discoverOfficialKsjArchiveAlternatives({
      dataId: dataset.dataId,
      sourcePageUrl: dataset.sourcePageUrl ?? '',
      archive,
    });
    const shapefile = alternatives.find((candidate) => candidate.format === 'shp');
    if (!shapefile) throw error;
    console.warn(
      `  公式GeoJSONが不正なため同一版・scopeの公式SHPへ切替: ${shapefile.filename}`
    );
    acquired = await acquireFromSource(shapefile);
  }

  const sourceArchive = acquired.sourceArchive;
  const outputFiles = acquired.outputFiles;
  try {
    const manifest = {
      schemaVersion: 1,
      datasetId: dataset.dataId,
      datasetName: dataset.name,
      version: archive.version,
      scope,
      scopeLabel: archive.scopeLabel,
      geometryType: dataset.geometryType,
      sourcePageUrl: dataset.sourcePageUrl,
      sourceArchiveUrl: sourceArchive.url,
      sourceArchiveFilename: sourceArchive.filename,
      sourceArchiveBytes: sourceArchive.sizeBytes,
      sourceArchiveSha256: acquired.sourceArchiveSha256,
      sourceFormat: sourceArchive.format,
      preferredSourceArchiveUrl:
        sourceArchive.url === archive.url ? undefined : archive.url,
      sourceDatum: sourceArchive.datum,
      outputDatum: 'WGS84',
      coordinateTransform:
        sourceArchive.datum === 'tokyo' ? 'Tokyo Datum → WGS84 (proj4)' : 'none',
      license: dataset.license,
      attribution: ATTRIBUTION,
      simplifyOptions,
      files: outputFiles,
      acquiredAt: new Date().toISOString(),
    };
    const manifestPath = path.join(PROJECT_ROOT, '.local/r2', manifestKey);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await publishLocalKey(manifestKey);
    unlinkSync(manifestPath);
    remoteKeys.add(manifestKey);
    return 'acquired';
  } catch (error) {
    const outputKeys = outputFiles.map(({ key }) => key);
    const deletion = await deleteMultipleFromR2(outputKeys);
    for (const key of deletion.deleted) remoteKeys.delete(key);
    throw error;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const ids = targetIds(args);
  const scopeStart = argumentValue(args, '--scope-start');
  const scopeEnd = argumentValue(args, '--scope-end');
  if (ids.length === 0) throw new Error('取得対象が0件です');
  if ((scopeStart || scopeEnd) && ids.length !== 1) {
    throw new Error('scope rangeは単一の--data-idにだけ指定できます');
  }
  if (!args.includes('--data-id') && ids.length !== EXPECTED_PUBLIC_ACQUISITION_COUNT) {
    throw new Error(`全件取得対象は${EXPECTED_PUBLIC_ACQUISITION_COUNT}件である必要があります`);
  }
  assertR2WriteAllowed({ op: `acquire public KSJ (${ids.join(',')})`, dryRun: !apply });

  const plans: Array<{ dataset: GisDatasetMeta; archives: KsjOfficialArchive[] }> = [];
  for (const dataId of ids) {
    const dataset = GIS_DATASETS_BY_ID.get(dataId);
    if (!dataset?.sourcePageUrl) throw new Error(`登録メタが不完全です: ${dataId}`);
    const officialArchives = await discoverOfficialKsjArchives({
      dataId,
      sourcePageUrl: dataset.sourcePageUrl,
    });
    const expectedArchiveCount = PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.get(dataId);
    if (expectedArchiveCount === undefined || officialArchives.length !== expectedArchiveCount) {
      throw new Error(
        `公式アーカイブ数がSSOTと不一致です: ${dataId} expected=${expectedArchiveCount ?? 'undefined'} actual=${officialArchives.length}`
      );
    }
    if (new Set(officialArchives.map((archive) => archive.scope)).size !== officialArchives.length) {
      throw new Error(`R2 scopeが一意ではありません: ${dataId}`);
    }
    if (officialArchives[0]?.version !== dataset.latestVersion) {
      throw new Error(
        `latestVersionと公式manifestが不一致です: ${dataId} ${dataset.latestVersion} != ${officialArchives[0]?.version}`
      );
    }
    const archives = officialArchives.filter((archive) =>
      (!scopeStart || archive.scope.localeCompare(scopeStart) >= 0) &&
      (!scopeEnd || archive.scope.localeCompare(scopeEnd) <= 0)
    );
    if (archives.length === 0) {
      throw new Error(`scope rangeの取得対象が0件です: ${scopeStart ?? '*'}..${scopeEnd ?? '*'}`);
    }
    plans.push({ dataset, archives });
  }
  const archiveCount = plans.reduce((sum, plan) => sum + plan.archives.length, 0);
  const sourceBytes = plans.flatMap((plan) => plan.archives).reduce(
    (sum, archive) => sum + archive.sizeBytes,
    0
  );
  console.log(
    `取得計画 datasets=${plans.length} archives=${archiveCount} source=${(
      sourceBytes / 1024 / 1024 / 1024
    ).toFixed(2)}GiB mode=${apply ? 'apply' : 'dry-run'}`
  );
  if (!apply) return;

  if (process.env.NODE_ENV === 'development') process.env.NODE_ENV = 'production';
  const remoteKeys = new Set(await listFromR2('gis/mlit-ksj/'));
  let completed = 0;
  let skipped = 0;
  for (const plan of plans) {
    console.log(`\n=== ${plan.dataset.dataId} ${plan.dataset.name} (${plan.archives.length} archives) ===`);
    for (const archive of plan.archives) {
      const result = await processArchive({
        dataset: plan.dataset,
        archive,
        remoteKeys,
      });
      if (result === 'skipped') skipped += 1;
      else completed += 1;
      console.log(
        `取得進捗 ${completed + skipped}/${archiveCount} acquired=${completed} skipped=${skipped}`
      );
    }
  }
  console.log(`PASS datasets=${plans.length} archives=${archiveCount} acquired=${completed} skipped=${skipped}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
