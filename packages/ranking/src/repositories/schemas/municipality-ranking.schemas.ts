import { z } from 'zod';
import { assertMetricPresentation } from '@stats47/types';

import type { CityDatabookSnapshot } from '../../types/city-databook';
import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../../types/municipality-snapshot';

export const MunicipalityRankingItemSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().min(1),
    rankingKey: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    distribution: z
      .array(
        z.object({
          x0: z.number(),
          x1: z.number(),
          count: z.number().int().nonnegative(),
          isOverflow: z.boolean(),
          isUnderflow: z.boolean(),
        })
      )
      .optional(),
    visualization: z.unknown().transform((value, ctx) => {
      try {
        assertMetricPresentation(value);
        return value;
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            error instanceof Error
              ? error.message
              : 'Invalid metric presentation',
        });
        return z.NEVER;
      }
    }),
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
  })
  .strict();

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

const CityDatabookMetricSchema = z
  .object({
    rankingKey: z.string().min(1),
    label: z.string().min(1),
    value: z.number().finite(),
    unit: z.string(),
    yearCode: z.string().regex(/^\d{4}$/),
    yearName: z.string().min(1),
    nationalRank: z.number().int().positive(),
    nationalCount: z.number().int().positive(),
    prefectureRank: z.number().int().positive(),
    prefectureCount: z.number().int().positive(),
    basis: z.enum(['rate', 'total', 'unknown']),
  })
  .strict();

const CityDatabookWardBreakdownSchema = z
  .object({
    wards: z.array(z.object({ areaCode: z.string().regex(/^\d{5}$/), areaName: z.string().min(1) }).strict()).min(1),
    metrics: z.record(
      z.string(),
      z
        .object({
          rankingKey: z.string().min(1),
          label: z.string().min(1),
          unit: z.string(),
          yearCode: z.string().regex(/^\d{4}$/),
          yearName: z.string().min(1),
          values: z
            .array(
              z
                .object({ areaCode: z.string().regex(/^\d{5}$/), value: z.number().finite(), cityRank: z.number().int().positive() })
                .strict()
            )
            .min(1),
        })
        .strict()
    ),
  })
  .strict();

export const CityDatabookSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    areaCode: z.string().regex(/^\d{5}$/),
    areaName: z.string().min(1),
    prefectureCode: z.string().regex(/^\d{2}000$/),
    headlineKeys: z.array(z.string().min(1)),
    previousPopulation: z
      .object({ value: z.number().finite(), yearCode: z.string().regex(/^\d{4}$/), yearName: z.string().min(1) })
      .strict()
      .nullable(),
    sections: z.array(
      z.object({ themeSlug: z.string().min(1), title: z.string().min(1), metricKeys: z.array(z.string().min(1)).min(1) }).strict()
    ),
    metrics: z.record(z.string(), CityDatabookMetricSchema),
    wardBreakdown: CityDatabookWardBreakdownSchema.optional(),
  })
  .strict();

/** 見出し・節が指す指標が metrics にあることまで確かめる (欠けたまま描画すると空の行が出る)。 */
export function parseCityDatabookSnapshot(value: unknown): CityDatabookSnapshot {
  const parsed = CityDatabookSnapshotSchema.parse(value);
  const referenced = [...parsed.headlineKeys, ...parsed.sections.flatMap((section) => section.metricKeys)];
  const missing = referenced.filter((key) => !parsed.metrics[key]);
  if (missing.length > 0) {
    throw new Error(`city databook references missing metrics: ${missing.join(', ')}`);
  }
  return parsed;
}
