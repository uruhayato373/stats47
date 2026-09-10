import { fetchPrefectures } from '@stats47/area';
import { BRIDGE_INSPECTION_AGE_SOURCE as SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const names = new Map(fetchPrefectures().map((p) => [p.prefCode, p.prefName]));
const count = z.number().int().nonnegative().safe();
const bandKey = z.enum([
  '0-9',
  '10-19',
  '20-29',
  '30-39',
  '40-49',
  '50-plus',
  'unknown',
]);
const distribution = z
  .object({
    publishedCount: count,
    knownYearCount: count,
    unknownYearCount: count,
    bands: z.array(z.object({ key: bandKey, count }).strict()).length(7),
    cohorts: z.array(
      z
        .object({
          constructionFiscalYear: z
            .number()
            .int()
            .min(1)
            .max(Number(SOURCE.year)),
          count: count.positive(),
        })
        .strict()
    ),
    managerCounts: z
      .object({ mlit: count, highway: count, local: count })
      .strict(),
  })
  .strict();
const schema = z
  .object({
    schemaVersion: z.literal(1),
    profileKey: z.literal(SOURCE.profileKey),
    generatedAt: z.string().datetime({ offset: true }),
    year: z.literal(SOURCE.year),
    asOf: z.literal(SOURCE.asOf),
    unit: z.literal(SOURCE.unit),
    definition: z
      .object({
        population: z.literal(SOURCE.definition.population),
        ageMethod: z.literal(SOURCE.definition.ageMethod),
        unknownYear: z.literal(SOURCE.definition.unknownYear),
        geography: z.literal(SOURCE.definition.geography),
        nationalAggregation: z.literal(SOURCE.definition.nationalAggregation),
        duplicatePolicy: z.literal(SOURCE.definition.duplicatePolicy),
      })
      .strict(),
    sources: z
      .array(
        z
          .object({
            id: z.enum(['mlit', 'highway', 'local']),
            url: z.string().url(),
            sha256: z.string().regex(/^[a-f0-9]{64}$/),
          })
          .strict()
      )
      .length(3),
    national: distribution,
    areas: z
      .array(
        distribution.extend({
          areaCode: z.string().regex(/^(?:0[1-9]|[1-3][0-9]|4[0-7])000$/),
          areaName: z.string(),
        })
      )
      .length(47),
  })
  .strict()
  .superRefine((data, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (new Set(data.areas.map((a) => a.areaCode)).size !== 47)
      issue('Duplicate prefecture');
    for (const area of data.areas)
      if (names.get(area.areaCode) !== area.areaName)
        issue('Prefecture code/name mismatch');
    data.sources.forEach((s, index) => {
      const expected = SOURCE.sources[index];
      if (
        !expected ||
        s.id !== expected.id ||
        s.url !== expected.url ||
        s.sha256 !== expected.sha256
      )
        issue('Source identity/SHA mismatch');
    });
    for (const d of [data.national, ...data.areas]) {
      if (
        d.publishedCount !== d.knownYearCount + d.unknownYearCount ||
        d.publishedCount !==
          Object.values(d.managerCounts).reduce((a, n) => a + n, 0)
      )
        issue('Published row conservation failure');
      if (d.bands.some((b, i) => b.key !== SOURCE.bands[i]?.key))
        issue('Band order/identity mismatch');
      if (
        d.publishedCount !== d.bands.reduce((n, b) => n + b.count, 0) ||
        d.unknownYearCount !== d.bands.find((b) => b.key === 'unknown')?.count
      )
        issue('Unknown/band denominator mismatch');
      if (d.knownYearCount !== d.cohorts.reduce((n, c) => n + c.count, 0))
        issue('Known cohort conservation failure');
      if (
        d.cohorts.some(
          (c, i) =>
            i > 0 &&
            c.constructionFiscalYear <= d.cohorts[i - 1]!.constructionFiscalYear
        )
      )
        issue('Cohort duplicate/order mismatch');
      for (const band of SOURCE.bands) {
        if (band.minDifference === null) continue;
        const expected = d.cohorts
          .filter((c) => {
            const difference = Number(SOURCE.year) - c.constructionFiscalYear;
            return (
              difference >= band.minDifference &&
              (band.maxDifference === null || difference <= band.maxDifference)
            );
          })
          .reduce((n, c) => n + c.count, 0);
        if (d.bands.find((b) => b.key === band.key)?.count !== expected)
          issue('Construction fiscal year/band mismatch');
      }
    }
    for (const key of [
      'publishedCount',
      'knownYearCount',
      'unknownYearCount',
    ] as const) {
      if (data.national[key] !== data.areas.reduce((n, a) => n + a[key], 0))
        issue('National counts are not pooled');
    }
    for (const source of SOURCE.sources)
      if (
        data.national.managerCounts[source.id] !== source.expectedRows ||
        data.national.managerCounts[source.id] !==
          data.areas.reduce((n, a) => n + a.managerCounts[source.id], 0)
      )
        issue('Manager totals mismatch');
    for (const band of SOURCE.bands)
      if (
        data.national.bands.find((b) => b.key === band.key)?.count !==
        data.areas.reduce(
          (n, a) => n + (a.bands.find((b) => b.key === band.key)?.count ?? 0),
          0
        )
      )
        issue('National bands are not pooled');
    const nationalCohorts = new Map(
      data.national.cohorts.map((c) => [c.constructionFiscalYear, c.count])
    );
    const years = new Set([
      ...nationalCohorts.keys(),
      ...data.areas.flatMap((a) =>
        a.cohorts.map((c) => c.constructionFiscalYear)
      ),
    ]);
    for (const year of years)
      if (
        (nationalCohorts.get(year) ?? 0) !==
        data.areas.reduce(
          (n, a) =>
            n +
            (a.cohorts.find((c) => c.constructionFiscalYear === year)?.count ??
              0),
          0
        )
      )
        issue('National construction cohorts are not pooled');
    if (
      data.national.publishedCount !== SOURCE.expectedPublishedCount ||
      data.national.unknownYearCount !== SOURCE.expectedUnknownYearCount
    )
      issue('Pinned published population mismatch');
  });

export type BridgeInspectionAgeSnapshot = z.infer<typeof schema>;
export type BridgeInspectionAgeDistribution =
  BridgeInspectionAgeSnapshot['national'];
export function parseBridgeInspectionAgeSnapshot(
  value: unknown
): BridgeInspectionAgeSnapshot {
  return schema.parse(value);
}
