#!/usr/bin/env tsx
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMunicipalityEntityPolicy } from '@stats47/area';
import { getMetricConfig, resolveMetricSource } from '@stats47/data-configs';
import { carryTimestamp, readPublishedSnapshot } from '@stats47/r2-storage/tooling';
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

const FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

/** 4xx など、取り直しても結果が変わらない失敗。再試行しない */
class PermanentFetchError extends Error {}

/**
 * `cities.json` を取る。接続の失敗 (Node の fetch の "fetch failed" 等) と 5xx だけを間隔を空けて再試行する。
 *
 * --all-published は 200 件超の key を 1 本ずつ取るので、1 回の瞬断でタスク全体が落ちる
 * (2026-10-08 の data-refresh run 37693107860 で 144 件目の次が "fetch failed"、直後に取り直すと 200 だった。
 *  DATA-REFRESH-MUNI-FETCH-RETRY-01)。4xx は元データが無い・URL が違うなので、すぐ失敗にする。
 */
export async function fetchCitiesPayload(
  url: string,
  deps: {
    fetchImpl?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
  } = {}
): Promise<unknown> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const sleep =
    deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetchImpl(url);
      if (response.ok) return await response.json();
      const error = new Error(`cities source fetch failed: ${response.status}`);
      if (response.status < 500) throw new PermanentFetchError(error.message);
      lastError = error;
    } catch (error) {
      if (error instanceof PermanentFetchError) throw error;
      lastError = error;
    }
    if (attempt < FETCH_ATTEMPTS - 1) await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
  throw lastError;
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

/**
 * published 集合内で title が衝突する key → 表示用 subtitle。
 * 衝突しない title に「総数」等のノイズ subtitle を付けないため、衝突時だけ返す。
 * 衝突しているのに subtitle が無い/注釈(※)しか無い場合は throw
 * (同一 <title> のページを 2 枚作らない — fail-closed)。
 */
function buildSubtitleForCollisions(): Map<string, string> {
  const titleCount = new Map<string, number>();
  for (const key of KNOWN_MUNICIPALITY_RANKING_KEYS) {
    const title = getMetricConfig(key)?.title;
    if (title) titleCount.set(title, (titleCount.get(title) ?? 0) + 1);
  }
  const result = new Map<string, string>();
  for (const key of KNOWN_MUNICIPALITY_RANKING_KEYS) {
    const metric = getMetricConfig(key);
    if (!metric || (titleCount.get(metric.title) ?? 0) <= 1) continue;
    const subtitle = metric.subtitle?.trim();
    if (!subtitle || subtitle.startsWith('※')) {
      throw new Error(
        `title collision without distinguishing subtitle: ${key} (${metric.title})`
      );
    }
    result.set(key, subtitle);
  }
  return result;
}

async function generateForKey(
  rankingKey: string,
  r2Base: string,
  outputRoot: string,
  subtitleByKey: ReadonlyMap<string, string>
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
  const source = resolveMetricSource(metric, 'city');
  if (
    !('displayName' in source) ||
    !('url' in source) ||
    typeof source.displayName !== 'string' ||
    typeof source.url !== 'string' ||
    !source.displayName ||
    !source.url
  ) {
    throw new Error(
      `municipality ranking source metadata is incomplete: ${rankingKey}`
    );
  }

  const payload = (await fetchCitiesPayload(
    `${r2Base}/app/stats/${encodeURIComponent(rankingKey)}/cities.json`
  )) as StatsPayload;
  if (payload.metricKey !== rankingKey || payload.entityKind !== 'city') {
    throw new Error(
      `cities source identity mismatch: ${payload.metricKey}/${payload.entityKind}`
    );
  }

  // item と values の中身が前回配信した版と同じなら generatedAt を引き継ぎ、同じバイト列にする
  // (生成時刻を毎回入れると差分反映が全件を送る。stable-snapshot.ts)
  const [previousItem, previousValues] = await Promise.all([
    readPublishedSnapshot<{ generatedAt?: string }>(municipalityRankingItemKeyPath(rankingKey), r2Base),
    readPublishedSnapshot<{ generatedAt?: string }>(municipalityRankingValuesKeyPath(rankingKey), r2Base),
  ]);
  // 型の絞り込みは closure の中に持ち越されないので、検査済みの値を先に取り出す
  const sourceDisplayName = source.displayName;
  const sourceUrl = source.url;
  const build = (generatedAt: string) => buildMunicipalityRankingSnapshots({
    metric: {
      key: metric.key,
      title: metric.title,
      subtitle: subtitleByKey.get(rankingKey) ?? null,
      description: metric.description,
      unit: metric.unit,
      visualization: metric.visualization,
      source: {
        displayName: sourceDisplayName,
        url: sourceUrl,
      },
      valuePolicy: availability.valuePolicy,
    },
    rows: payload.rows,
    entityPolicy: buildMunicipalityEntityPolicy(),
    generatedAt,
  });
  const { value: snapshots } = carryTimestamp(
    (generatedAt) => {
      const built = build(generatedAt);
      return { item: built.item, values: built.values };
    },
    previousItem && previousValues
      ? { value: { item: previousItem, values: previousValues }, timestamp: previousItem.generatedAt }
      : null,
    new Date().toISOString()
  );

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
  const subtitleByKey = buildSubtitleForCollisions();
  for (const rankingKey of keys) {
    await generateForKey(rankingKey, r2Base, outputRoot, subtitleByKey);
  }
}

// 直接実行時のみ main を走らせる (fetchCitiesPayload を import してテストできるようにするため)
if (process.argv[1]?.includes('generate-municipality-ranking')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
