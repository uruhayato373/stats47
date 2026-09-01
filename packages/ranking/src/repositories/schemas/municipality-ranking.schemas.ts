import { z } from 'zod';

import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../../types/municipality-snapshot';

export const MunicipalityRankingItemSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().min(1),
  rankingKey: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  description: z.string(),
  unit: z.string(),
  latestYear: z.object({
    yearCode: z.string().min(1),
    yearName: z.string().min(1),
  }),
  entityPolicyKey: z.string().min(1),
  entityCount: z.number().int().positive(),
  valueCount: z.number().int().nonnegative(),
  excludedEntityCount: z.number().int().nonnegative(),
  source: z.object({ name: z.string().min(1), url: z.string().url() }),
});

export const MunicipalityRankingValuesSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().min(1),
  rankingKey: z.string().min(1),
  yearCode: z.string().min(1),
  yearName: z.string().min(1),
  unit: z.string(),
  count: z.number().int().nonnegative(),
  values: z.array(
    z.object({
      areaCode: z.string().regex(/^\d{5}$/),
      areaName: z.string().min(1),
      prefectureCode: z.string().regex(/^\d{2}000$/),
      value: z.number().finite(),
      rank: z.number().int().positive(),
    })
  ),
});

export function parseMunicipalityRankingItemSnapshot(
  value: unknown
): MunicipalityRankingItemSnapshot {
  return MunicipalityRankingItemSnapshotSchema.parse(value);
}

export function parseMunicipalityRankingValuesSnapshot(
  value: unknown
): MunicipalityRankingValuesSnapshot {
  const parsed = MunicipalityRankingValuesSnapshotSchema.parse(value);
  if (parsed.count !== parsed.values.length) {
    throw new Error('municipality ranking count does not match values length');
  }
  return parsed;
}
