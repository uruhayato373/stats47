import { lookupArea } from '@stats47/area';
import { NUTRITION_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const definition = NUTRITION_SOURCE;
const point = z.object({
  areaCode: z.string().regex(/^(00|0[1-9]|[1-3][0-9]|4[0-7])000$/),
  areaName: z.string().min(1),
  metricKey: z.string(),
  mean: z.number().finite().nonnegative(),
  lower95: z.number().finite().nonnegative(),
  upper95: z.number().finite().nonnegative(),
  sampleSize: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  period: z.literal(definition.period),
  ageAdjustment: z.literal(definition.ageAdjustment),
  source: z.object({
    title: z.string().min(1),
    url: z.literal(definition.url),
    sha256: z.literal(definition.sha256),
    table: z.string(),
    pdfPage: z.number().int().positive(),
  }),
}).superRefine((row, ctx) => {
  const metric = definition.metrics.find(m => m.key === row.metricKey);
  if (!metric || row.source.table !== metric.table || row.source.pdfPage !== metric.pdfPage) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '指標と原表を固定する' });
  }
  if (!(row.lower95 <= row.mean && row.mean <= row.upper95)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '平均と信頼区間の大小関係を確認する' });
  }
  const expectedName = row.areaCode === '00000' ? '全国' : lookupArea(row.areaCode)?.areaName;
  if (row.areaName !== expectedName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '地域コードと県名を照合する' });
  }
});

export const nutritionSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  rows: z.array(point).length(47 * 4),
  national: z.array(point).length(4),
  notes: z.array(z.string().min(1)).min(1),
}).superRefine((snapshot, ctx) => {
  const keys = new Set<string>();
  for (const row of [...snapshot.rows, ...snapshot.national]) {
    const key = `${row.areaCode}/${row.metricKey}`;
    if (keys.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: '県と指標の重複を拒否する' });
    keys.add(key);
  }
  if (snapshot.rows.some(row => row.areaCode === '00000') || snapshot.national.some(row => row.areaCode !== '00000')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '公式全国行と47県の行を分離する' });
  }
  for (const national of snapshot.national) {
    const rows = snapshot.rows.filter(row => row.metricKey === national.metricKey);
    if (rows.length !== 47 || rows.reduce((sum, row) => sum + row.sampleSize, 0) !== national.sampleSize) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '47県の集計人数を公式全国行と照合する' });
    }
  }
});

export type NutritionSnapshot = z.infer<typeof nutritionSnapshotSchema>;

export function parseNutritionSnapshot(raw: unknown) {
  const parsed = nutritionSnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
