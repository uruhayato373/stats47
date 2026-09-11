import { lookupArea } from '@stats47/area';
import { WATER_QUALITY_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';
const source = WATER_QUALITY_SOURCE;
export const waterKinds = ['river', 'lake', 'sea'] as const;
const areaCode = z.string().regex(/^(0[1-9]|[1-3][0-9]|4[0-7])000$/);
const concentration = z.string().regex(/^<?\d+(\.\d+)?$/);
const thresholds: Record<string, Record<string, number>> = {
  river: { AA: 1, A: 2, B: 3, C: 5, D: 8, E: 10 },
  lake: { AA: 1, A: 3, B: 5, C: 8 },
  sea: { A: 2, B: 3, C: 8 },
};
const point = z
  .object({
    id: z.string(),
    kind: z.enum(waterKinds),
    page: z.number().int(),
    row: z.number().int().positive(),
    listingAreaCode: areaCode,
    relatedAreaCodes: z.array(areaCode).min(1).max(4),
    name: z.string().min(1),
    kana: z.string().min(1),
    class: z.enum(['AA', 'A', 'B', 'C', 'D', 'E']),
    limit: z.number().finite().positive(),
    value75: concentration,
    mean: concentration,
    compliant: z.boolean(),
  })
  .strict()
  .superRefine((r, ctx) => {
    const expectedKind =
      r.page >= 2 && r.page <= 34
        ? 'river'
        : r.page >= 35 && r.page <= 37
          ? 'lake'
          : r.page >= 38 && r.page <= 46
            ? 'sea'
            : null;
    const exception =
      r.id === source.anomaly.id &&
      r.listingAreaCode === source.anomaly.prefecture &&
      r.name === source.anomaly.name &&
      r.class === source.anomaly.classInAppendix &&
      r.limit === source.anomaly.limit;
    if (
      r.kind !== expectedKind ||
      r.id !==
        `${r.kind}-p${String(r.page).padStart(3, '0')}-r${String(r.row).padStart(3, '0')}` ||
      r.relatedAreaCodes[0] !== r.listingAreaCode ||
      new Set(r.relatedAreaCodes).size !== r.relatedAreaCodes.length ||
      (thresholds[r.kind]?.[r.class] !== r.limit && !exception) ||
      Number(r.value75.startsWith('<') ? r.value75.slice(1) : r.value75) <= r.limit !== r.compliant
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '原表のページ・県帰属・類型・判定を保持する',
      });
    }
  });
const national = z
  .object({
    total: z.number().int().positive(),
    compliant: z.number().int().nonnegative(),
  })
  .strict();
export const waterQualitySnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    period: z.literal(source.period),
    source: z
      .object({
        title: z.literal(source.title),
        url: z.literal(source.url),
        sha256: z.literal(source.sha256),
        mainUrl: z.literal(source.mainUrl),
        mainSha256: z.literal(source.mainSha256),
      })
      .strict(),
    national: z
      .object({ river: national, lake: national, sea: national })
      .strict(),
    prefectures: z
      .array(z.object({ areaCode, areaName: z.string() }).strict())
      .length(47),
    rows: z.array(point).length(3427),
    notes: z.array(z.string()),
  })
  .strict()
  .superRefine((s, ctx) => {
    const valid =
      JSON.stringify(s.notes) === JSON.stringify(source.notes) &&
      waterKinds.every(
        (k) =>
          s.rows.filter((r) => r.kind === k).length === source.rowCounts[k] &&
          s.national[k].total === source.national[k].total &&
          s.national[k].compliant === source.national[k].compliant
      ) &&
      new Set(s.rows.map((r) => r.id)).size === s.rows.length &&
      new Set(s.prefectures.map((p) => p.areaCode)).size === 47 &&
      s.prefectures.every(
        (p) =>
          lookupArea(p.areaCode)?.areaName === p.areaName &&
          s.rows.some(
            (r) => r.kind === 'river' && r.listingAreaCode === p.areaCode
          )
      ) &&
      s.rows.some(
        (r) =>
          r.id === source.anomaly.id &&
          r.class === source.anomaly.classInAppendix
      );
    if (!valid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '47県・原表全件・全国の独立集計・出典注記を保持する',
      });
  });
export type WaterQualitySnapshot = z.infer<typeof waterQualitySnapshotSchema>;
export function parseWaterQualitySnapshot(
  raw: unknown
): WaterQualitySnapshot | null {
  const result = waterQualitySnapshotSchema.safeParse(raw);
  return result.success ? result.data : null;
}
export function summarizeWaterRows(
  snapshot: WaterQualitySnapshot,
  area: string,
  kind: (typeof waterKinds)[number]
) {
  const rows = snapshot.rows.filter(
    (r) => r.listingAreaCode === area && r.kind === kind
  );
  const total = rows.length,
    compliant = rows.filter((r) => r.compliant).length;
  return {
    rows,
    total,
    compliant,
    rate: total ? (compliant / total) * 100 : null,
  };
}
