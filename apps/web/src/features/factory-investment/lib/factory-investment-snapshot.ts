import { lookupArea } from '@stats47/area';
import { FACTORY_INVESTMENT_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const source = FACTORY_INVESTMENT_SOURCE;
const point = z
  .object({
    areaCode: z.string().regex(/^(0[1-9]|[1-3][0-9]|4[0-7])000$/),
    areaName: z.string(),
    value: z.number().finite().nonnegative().nullable(),
    status: z.enum(['published', 'suppressed']),
  })
  .strict()
  .superRefine((row, ctx) => {
    const suppressed = (source.suppressedCodes as readonly string[]).includes(
      row.areaCode
    );
    if (
      row.areaName !== lookupArea(row.areaCode)?.areaName ||
      (suppressed
        ? row.status !== 'suppressed' || row.value !== null
        : row.status !== 'published' || row.value === null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '県名と原表の秘匿状態を保持する',
      });
    }
  });
export const factoryInvestmentSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    period: z.literal(source.period),
    unit: z.literal(source.unit),
    source: z
      .object({
        title: z.literal(source.title),
        url: z.literal(source.url),
        sha256: z.literal(source.sha256),
      })
      .strict(),
    national: z.literal(source.national),
    rows: z.array(point).length(47),
    notes: z.array(z.string()),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    if (
      new Set(snapshot.rows.map((row) => row.areaCode)).size !== 47 ||
      JSON.stringify(snapshot.notes) !== JSON.stringify(source.notes)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '47県と対象・秘匿注記を保持する',
      });
    }
  });
export type FactoryInvestmentSnapshot = z.infer<
  typeof factoryInvestmentSnapshotSchema
>;
export function parseFactoryInvestmentSnapshot(
  raw: unknown
): FactoryInvestmentSnapshot | null {
  const parsed = factoryInvestmentSnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
