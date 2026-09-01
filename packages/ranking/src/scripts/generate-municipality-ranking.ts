#!/usr/bin/env tsx
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMunicipalityEntityPolicy } from '@stats47/area';
import { getMetricConfig } from '@stats47/data-configs';
import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  getMunicipalityMetricAvailability,
} from '@stats47/data-configs/geo-scope';

import { buildMunicipalityRankingSnapshots } from '../municipalities/build-municipality-snapshots';
import {
  municipalityRankingItemKeyPath,
  municipalityRankingValuesKeyPath,
} from '../types/municipality-snapshot';

import type { MunicipalityStatsRow } from '../municipalities/build-municipality-snapshots';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const MAX_VALUES_BYTES = 512 * 1024;

interface StatsPayload {
  metricKey: string;
  entityKind: string;
  rows: MunicipalityStatsRow[];
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function writeSnapshot(
  root: string,
  key: string,
  body: string
): Promise<void> {
  const target = path.join(root, ...key.split('/'));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body, 'utf8');
}

async function generateForKey(
  rankingKey: string,
  r2Base: string,
  outputRoot: string
): Promise<void> {
  if (!KNOWN_MUNICIPALITY_RANKING_KEYS.has(rankingKey)) {
    throw new Error(`municipality ranking is not published: ${rankingKey}`);
  }

  const metric = getMetricConfig(rankingKey);
  const availability = getMunicipalityMetricAvailability(rankingKey);
  if (!metric || !metric.entities.includes('city')) {
    throw new Error(`active city MetricConfig not found: ${rankingKey}`);
  }
  if (availability.status !== 'published') {
    throw new Error(`municipality ranking is not published: ${rankingKey}`);
  }
  if (
    !('displayName' in metric.source) ||
    !('url' in metric.source) ||
    typeof metric.source.displayName !== 'string' ||
    typeof metric.source.url !== 'string' ||
    !metric.source.displayName ||
    !metric.source.url
  ) {
    throw new Error(
      `municipality ranking source metadata is incomplete: ${rankingKey}`
    );
  }

  const response = await fetch(
    `${r2Base}/app/stats/${encodeURIComponent(rankingKey)}/cities.json`
  );
  if (!response.ok) {
    throw new Error(`cities source fetch failed: ${response.status}`);
  }
  const payload = (await response.json()) as StatsPayload;
  if (payload.metricKey !== rankingKey || payload.entityKind !== 'city') {
    throw new Error(
      `cities source identity mismatch: ${payload.metricKey}/${payload.entityKind}`
    );
  }

  const snapshots = buildMunicipalityRankingSnapshots({
    metric: {
      key: metric.key,
      title: metric.title,
      description: metric.description,
      unit: metric.unit,
      source: {
        displayName: metric.source.displayName,
        url: metric.source.url,
      },
      valuePolicy: availability.valuePolicy,
    },
    rows: payload.rows,
    entityPolicy: buildMunicipalityEntityPolicy(),
    generatedAt: new Date().toISOString(),
  });

  const itemBody = JSON.stringify(snapshots.item);
  const valuesBody = JSON.stringify(snapshots.values);
  if (Buffer.byteLength(valuesBody) > MAX_VALUES_BYTES) {
    throw new Error(
      `municipality values payload exceeds ${MAX_VALUES_BYTES} bytes: ${Buffer.byteLength(valuesBody)}`
    );
  }

  await writeSnapshot(
    outputRoot,
    municipalityRankingItemKeyPath(rankingKey),
    itemBody
  );
  await writeSnapshot(
    outputRoot,
    municipalityRankingValuesKeyPath(rankingKey),
    valuesBody
  );

  console.log(
    JSON.stringify(
      {
        rankingKey,
        outputRoot,
        yearCode: snapshots.values.yearCode,
        entityCount: snapshots.item.entityCount,
        valueCount: snapshots.item.valueCount,
        excludedEntityCount: snapshots.item.excludedEntityCount,
        itemBytes: Buffer.byteLength(itemBody),
        valuesBytes: Buffer.byteLength(valuesBody),
      },
      null,
      2
    )
  );
}

async function main(): Promise<void> {
  const r2Base = (
    argValue('--source-base') ??
    process.env.R2_PUBLIC_FETCH_URL ??
    'http://127.0.0.1:4777'
  ).replace(/\/$/, '');
  const outputRoot = path.resolve(
    argValue('--output-root') ?? path.join(REPO_ROOT, '.local', 'r2')
  );

  // --all-published: 公開済み全 key を生成 (sync-snapshots の municipality-ranking task 用)。
  // 1 key でも失敗したら exit≠0 (部分成功で push させない)。
  const keys = process.argv.includes('--all-published')
    ? [...KNOWN_MUNICIPALITY_RANKING_KEYS].sort()
    : [argValue('--key') ?? 'elderly-population-ratio'];
  for (const rankingKey of keys) {
    await generateForKey(rankingKey, r2Base, outputRoot);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
