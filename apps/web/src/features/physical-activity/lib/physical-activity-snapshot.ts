import { lookupArea } from '@stats47/area';
import { PHYSICAL_ACTIVITY_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const definition = PHYSICAL_ACTIVITY_SOURCE;
const point = z
  .object({
    areaCode: z.string().regex(/^(00|0[1-9]|[1-3][0-9]|4[0-7])000$/),
    areaName: z.string().min(1),
    metricKey: z.string(),
    mean: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    lower95: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    upper95: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    sampleSize: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    period: z.literal(definition.period),
    ageAdjustment: z.literal(definition.ageAdjustment),
    source: z
      .object({
        title: z.literal(definition.title),
        url: z.literal(definition.url),
        sha256: z.literal(definition.sha256),
        table: z.literal('第69表'),
        pdfPage: z.literal(5),
      })
      .strict(),
  })
  .strict()
  .superRefine((row, ctx) => {
    const metric = definition.metrics.find((m) => m.key === row.metricKey);
    if (!metric)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '歩数の2指標を固定する',
      });
    if (!(row.lower95 <= row.mean && row.mean <= row.upper95)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '平均と95%信頼区間を照合する',
      });
    }
    const expectedName =
      row.areaCode === '00000' ? '全国' : lookupArea(row.areaCode)?.areaName;
    if (row.areaName !== expectedName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '地域コードと県名を照合する',
      });
    }
    if (row.areaCode === '00000' && metric) {
      const n = metric.national;
      if (
        row.mean !== n.mean ||
        row.lower95 !== n.lower95 ||
        row.upper95 !== n.upper95 ||
        row.sampleSize !== n.sampleSize
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '公式全国の平均・CI・集計人数を固定する',
        });
      }
    }
  });

export const physicalActivitySnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    rows: z.array(point).length(94),
    national: z.array(point).length(2),
    notes: z.array(z.string().min(1)),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    if (
      snapshot.notes.length !== definition.notes.length ||
      snapshot.notes.some((v, i) => v !== definition.notes[i])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '調査対象・能登除外・標本誤差の注記を保持する',
      });
    }
    const keys = new Set<string>();
    for (const row of [...snapshot.rows, ...snapshot.national]) {
      const key = `${row.areaCode}/${row.metricKey}`;
      if (keys.has(key))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '県と指標の重複を拒否する',
        });
      keys.add(key);
    }
    if (
      snapshot.rows.some((row) => row.areaCode === '00000') ||
      snapshot.national.some((row) => row.areaCode !== '00000')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '公式全国と47県の行を分離する',
      });
    }
    for (const metric of definition.metrics) {
      const rows = snapshot.rows.filter((row) => row.metricKey === metric.key);
      const national = snapshot.national.filter(
        (row) => row.metricKey === metric.key
      );
      if (
        rows.length !== 47 ||
        national.length !== 1 ||
        rows.reduce((sum, row) => sum + row.sampleSize, 0) !==
          metric.national.sampleSize
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '2指標各47県と集計人数の全国計を検証する',
        });
      }
    }
  });

export type PhysicalActivitySnapshot = z.infer<
  typeof physicalActivitySnapshotSchema
>;

export function parsePhysicalActivitySnapshot(
  raw: unknown
): PhysicalActivitySnapshot | null {
  const parsed = physicalActivitySnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
