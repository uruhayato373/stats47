import { lookupArea } from '@stats47/area';
import { TOURISM_SEASONALITY_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';


/** A monthly series has its own R2 object; ranking yearCode stays annual. */
export const TOURISM_SEASONALITY_SNAPSHOT_KEY =
  TOURISM_SEASONALITY_SOURCE.r2Key;

const MONTHS_PER_YEAR = 12;
const PREFECTURE_COUNT = 47;
const PREFECTURE_CODE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;
const MONTH_PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

const monthlyPointShape = {
  period: z.string().regex(MONTH_PERIOD),
  value: z.number().finite().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
  missingReason: z.string().trim().min(1).optional(),
};

function hasExplicitMissingReason(
  point: { value: number | null; missingReason?: string }
) {
  return point.value === null
    ? Boolean(point.missingReason)
    : point.missingReason === undefined;
}

const monthlyPointSchema = z.object(monthlyPointShape).refine(
  hasExplicitMissingReason,
  { message: '欠測はnullと理由、観測された0は数値0で記録する' }
);

const prefecturePointSchema = z.object({
  ...monthlyPointShape,
  areaCode: z.string().regex(PREFECTURE_CODE),
  areaName: z.string().min(1),
}).refine(hasExplicitMissingReason, {
  message: '欠測はnullと理由、観測された0は数値0で記録する',
});

const definition = TOURISM_SEASONALITY_SOURCE;

export const tourismSeasonalitySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  seriesKey: z.literal(definition.seriesKey),
  year: z.literal(definition.year),
  unit: z.literal(definition.unit),
  releaseStatus: z.literal(definition.releaseStatus),
  generatedAt: z.string().datetime(),
  source: z.object({
    title: z.literal(definition.source.title),
    url: z.literal(definition.source.url),
    sha256: z.literal(definition.source.sha256),
  }),
  rows: z.array(prefecturePointSchema).length(PREFECTURE_COUNT * MONTHS_PER_YEAR),
  /** Null means the source did not publish a national series; never derive it here. */
  national: z.array(monthlyPointSchema).length(MONTHS_PER_YEAR).nullable(),
}).superRefine((snapshot, context) => {
  const expectedPeriods = new Set(
    Array.from({ length: MONTHS_PER_YEAR }, (_, index) =>
      `${snapshot.year}-${String(index + 1).padStart(2, '0')}`
    )
  );
  const periodsByArea = new Map<string, Set<string>>();
  snapshot.rows.forEach((row, index) => {
    const periods = periodsByArea.get(row.areaCode) ?? new Set<string>();
    if (
      !expectedPeriods.has(row.period) ||
      periods.has(row.period) ||
      lookupArea(row.areaCode)?.areaName !== row.areaName
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rows', index],
        message: '対象年の年月・都道府県名・県月の一意性を確認する',
      });
    }
    periods.add(row.period);
    periodsByArea.set(row.areaCode, periods);
  });
  if (
    periodsByArea.size !== PREFECTURE_COUNT ||
    [...periodsByArea.values()].some((periods) => periods.size !== MONTHS_PER_YEAR)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rows'],
      message: '47都道府県それぞれの12か月を必要とする',
    });
  }
  if (snapshot.national) {
    const periods = snapshot.national.map((point) => point.period);
    if (
      new Set(periods).size !== MONTHS_PER_YEAR ||
      periods.some((period) => !expectedPeriods.has(period))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['national'],
        message: '公式全国系列は対象年の12か月を一意に記録する',
      });
    }
  }
});

export type TourismSeasonalitySnapshot = z.infer<typeof tourismSeasonalitySnapshotSchema>;
export type TourismMonthlyPoint = z.infer<typeof monthlyPointSchema>;

export function parseTourismSeasonalitySnapshot(value: unknown) {
  const parsed = tourismSeasonalitySnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
