#!/usr/bin/env tsx
import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  getMunicipalityMetricAvailability,
} from '@stats47/data-configs/geo-scope';

import {
  parseMunicipalityRankingItemSnapshot,
  parseMunicipalityRankingValuesSnapshot,
} from '../repositories/schemas/municipality-ranking.schemas';
import {
  municipalityRankingItemKeyPath,
  municipalityRankingValuesKeyPath,
} from '../types/municipality-snapshot';

const DEFAULT_BASE_URL = 'https://storage.stats47.jp';

async function fetchJson(baseUrl: string, key: string): Promise<unknown> {
  const response = await fetch(`${baseUrl}/${key}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`published snapshot fetch failed: ${response.status} ${key}`);
  }
  return response.json();
}

async function verifyKey(baseUrl: string, rankingKey: string): Promise<void> {
  const [itemValue, valuesValue] = await Promise.all([
    fetchJson(baseUrl, municipalityRankingItemKeyPath(rankingKey)),
    fetchJson(baseUrl, municipalityRankingValuesKeyPath(rankingKey)),
  ]);
  const item = parseMunicipalityRankingItemSnapshot(itemValue);
  const values = parseMunicipalityRankingValuesSnapshot(valuesValue);
  const availability = getMunicipalityMetricAvailability(rankingKey);
  if (availability.status !== 'published') {
    throw new Error(`municipality ranking is not published in catalog: ${rankingKey}`);
  }

  if (item.rankingKey !== rankingKey || values.rankingKey !== rankingKey) {
    throw new Error(`published snapshot identity mismatch: ${rankingKey}`);
  }
  if (
    item.valueCount !== values.count ||
    item.latestYear.yearCode !== values.yearCode ||
    item.unit !== values.unit
  ) {
    throw new Error(`published item/values mismatch: ${rankingKey}`);
  }

  const seen = new Set<string>();
  for (const value of values.values) {
    if (seen.has(value.areaCode)) {
      throw new Error(`duplicate published municipality: ${rankingKey}/${value.areaCode}`);
    }
    seen.add(value.areaCode);
    if (
      availability.valuePolicy?.minExclusive !== undefined &&
      value.value <= availability.valuePolicy.minExclusive
    ) {
      throw new Error(`published value violates minExclusive: ${rankingKey}/${value.areaCode}`);
    }
    if (
      availability.valuePolicy?.minInclusive !== undefined &&
      value.value < availability.valuePolicy.minInclusive
    ) {
      throw new Error(`published value violates minInclusive: ${rankingKey}/${value.areaCode}`);
    }
    if (
      availability.valuePolicy?.maxInclusive !== undefined &&
      value.value > availability.valuePolicy.maxInclusive
    ) {
      throw new Error(`published value violates maxInclusive: ${rankingKey}/${value.areaCode}`);
    }
  }

  console.log(
    `✅ ${rankingKey}: ${values.count} municipalities / ${values.yearName} / ${values.unit}`
  );
}

async function main(): Promise<void> {
  const baseUrl = (
    process.env.R2_PUBLIC_FETCH_URL ?? DEFAULT_BASE_URL
  ).replace(/\/$/, '');
  for (const rankingKey of [...KNOWN_MUNICIPALITY_RANKING_KEYS].sort()) {
    await verifyKey(baseUrl, rankingKey);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
