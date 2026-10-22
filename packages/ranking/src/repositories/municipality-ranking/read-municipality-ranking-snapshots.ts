import 'server-only';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import {
  municipalityRankingAiContentKeyPath,
  parseMunicipalityAiContentSnapshot,
} from '../../municipalities/municipality-ai-content';
import {
  municipalityRankingItemKeyPath,
  municipalityRankingValuesKeyPath,
} from '../../types/municipality-snapshot';
import {
  parseMunicipalityRankingItemSnapshot,
  parseMunicipalityRankingValuesSnapshot,
} from '../schemas/municipality-ranking.schemas';

import type { MunicipalityAiContentSnapshot } from '../../municipalities/municipality-ai-content';
import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../../types/municipality-snapshot';

export async function readMunicipalityRankingItem(
  rankingKey: string
): Promise<MunicipalityRankingItemSnapshot | null> {
  const value = await fetchFromR2AsJson<unknown>(
    municipalityRankingItemKeyPath(rankingKey)
  );
  return value ? parseMunicipalityRankingItemSnapshot(value) : null;
}

export async function readMunicipalityRankingValues(
  rankingKey: string
): Promise<MunicipalityRankingValuesSnapshot | null> {
  const value = await fetchFromR2AsJson<unknown>(
    municipalityRankingValuesKeyPath(rankingKey)
  );
  return value ? parseMunicipalityRankingValuesSnapshot(value) : null;
}

/** 解説 (MUNI-AI-CONTENT-01)。まだ書いていない指標は null。 */
export async function readMunicipalityRankingAiContent(
  rankingKey: string
): Promise<MunicipalityAiContentSnapshot | null> {
  const value = await fetchFromR2AsJson<unknown>(
    municipalityRankingAiContentKeyPath(rankingKey)
  );
  return value ? parseMunicipalityAiContentSnapshot(value) : null;
}
