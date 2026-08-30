#!/usr/bin/env tsx

import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  mkdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

import { OPEN_DATASETS } from '@stats47/data-configs';
import {
  assertR2WriteAllowed,
  createS3ImageObjectStoreFromEnv,
  listFromR2,
  publishExactR2Assets,
  resolveExactAssetCandidates,
} from '@stats47/r2-storage/tooling';
import { parse } from 'csv-parse/sync';
import { config } from 'dotenv';
import unzipper from 'unzipper';

import { convertGeoJsonToTopoJson, saveTopoJson } from '../converter';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../..'
);
config({ path: path.join(PROJECT_ROOT, '.env.local'), quiet: true });

const VERSION = '2026-06-01';
const LANDING_PAGE =
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/newpage_43373.html';

type CsvRow = Record<string, string>;

async function sha256File(file: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

async function download(url: string, destination: string): Promise<void> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'stats47-open-data-pipeline/1.0' },
  });
  if (!response.ok || !response.body) {
    throw new Error(`MHLW ZIP取得失敗: ${response.status} ${url}`);
  }
  mkdirSync(path.dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(destination));
}

async function publishKey(key: string): Promise<void> {
  const store = createS3ImageObjectStoreFromEnv();
  if (!store) throw new Error('R2 S3認証情報がありません');
  await publishExactR2Assets({
    candidates: resolveExactAssetCandidates(PROJECT_ROOT, {
      keys: [key],
      prefix: null,
      extensions: [],
    }),
    store,
    dryRun: false,
  });
}

async function csvFromZip(zipPath: string): Promise<Buffer> {
  const archive = await unzipper.Open.file(zipPath);
  const csv = archive.files.find((entry: { path: string }) =>
    entry.path.toLowerCase().endsWith('.csv')
  );
  if (!csv) throw new Error(`CSVがZIP内にありません: ${zipPath}`);
  return csv.buffer();
}

function toGeoJson(rows: CsvRow[], datasetId: string) {
  const seen = new Set<string>();
  let invalidCoordinates = 0;
  let duplicates = 0;
  const features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: Record<string, string>;
  }> = [];
  for (const row of rows) {
    const latitude = Number(row['所在地座標（緯度）']);
    const longitude = Number(row['所在地座標（経度）']);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < 20 ||
      latitude > 47 ||
      longitude < 122 ||
      longitude > 154
    ) {
      invalidCoordinates += 1;
      continue;
    }
    const id = row.ID?.trim();
    if (!id) {
      invalidCoordinates += 1;
      continue;
    }
    if (seen.has(id)) {
      duplicates += 1;
      continue;
    }
    seen.add(id);
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: {
        id,
        facilityType: datasetId,
        name: row['正式名称'] ?? '',
        nameKana: row['正式名称（フリガナ）'] ?? '',
        prefectureCode: row['都道府県コード'] ?? '',
        municipalityCode: row['市区町村コード'] ?? '',
        address: row['所在地'] ?? '',
        website: row['案内用ホームページアドレス'] ?? '',
      },
    });
  }
  return {
    geojson: { type: 'FeatureCollection' as const, features },
    invalidCoordinates,
    duplicates,
  };
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const datasets = OPEN_DATASETS.filter(
    (dataset) => dataset.sourceId === 'mhlw-medical-info' && dataset.downloadUrl
  );
  if (datasets.length !== 5) throw new Error(`MHLW GIS対象は5件である必要があります: ${datasets.length}`);
  assertR2WriteAllowed({ op: 'acquire MHLW medical GIS', dryRun: !apply });
  console.log(`MHLW GIS datasets=${datasets.length} version=${VERSION} mode=${apply ? 'apply' : 'dry-run'}`);
  if (!apply) return;

  if (process.env.NODE_ENV === 'development') process.env.NODE_ENV = 'production';
  const remoteKeys = new Set(await listFromR2('gis/open-data/'));
  let acquired = 0;
  let skipped = 0;
  for (const dataset of datasets) {
    const prefix = `gis/open-data/${dataset.id}/${VERSION}`;
    const manifestKey = `${prefix}/manifest.json`;
    if (remoteKeys.has(manifestKey)) {
      skipped += 1;
      continue;
    }
    const sourceKey = `${prefix}/source.zip`;
    const topologyKey = `${prefix}/facilities.topojson`;
    const sourcePath = path.join(PROJECT_ROOT, '.local/r2', sourceKey);
    const topologyPath = path.join(PROJECT_ROOT, '.local/r2', topologyKey);
    const manifestPath = path.join(PROJECT_ROOT, '.local/r2', manifestKey);
    const temporaryGeoJson = path.join('/tmp', `stats47-${dataset.id}-${VERSION}.geojson`);

    try {
      await download(dataset.downloadUrl!, sourcePath);
      const sourceSha256 = await sha256File(sourcePath);
      const csv = await csvFromZip(sourcePath);
      const rows = parse(csv, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as CsvRow[];
      const { geojson, invalidCoordinates, duplicates } = toGeoJson(rows, dataset.id);
      writeFileSync(temporaryGeoJson, JSON.stringify(geojson), 'utf8');
      const { topology, featureCount } = convertGeoJsonToTopoJson(
        temporaryGeoJson,
        dataset.id,
        { quantize: 1e6, simplifyQuantile: 0 }
      );
      const uncompressedTopologyBytes = saveTopoJson(topology, topologyPath);

      await publishKey(sourceKey);
      await publishKey(topologyKey);
      const manifest = {
        schemaVersion: 1,
        datasetId: dataset.id,
        datasetName: dataset.name,
        version: VERSION,
        sourcePageUrl: LANDING_PAGE,
        sourceArchiveUrl: dataset.downloadUrl,
        sourceArchiveSha256: sourceSha256,
        sourceArchiveBytes: statSync(sourcePath).size,
        license: dataset.license,
        coordinateReferenceSystem: 'EPSG:4326',
        sourceRows: rows.length,
        featureCount,
        invalidCoordinateRows: invalidCoordinates,
        duplicateIds: duplicates,
        outputKey: topologyKey,
        uncompressedTopologyBytes,
        acquiredAt: new Date().toISOString(),
      };
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
      await publishKey(manifestKey);
      acquired += 1;
      console.log(`${dataset.id}: rows=${rows.length} features=${featureCount} invalid=${invalidCoordinates}`);
    } finally {
      for (const file of [temporaryGeoJson, topologyPath, manifestPath, sourcePath]) {
        try {
          unlinkSync(file);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      }
    }
  }
  console.log(`PASS acquired=${acquired} skipped=${skipped}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
