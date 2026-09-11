import { lookupArea } from '@stats47/area';
import { FREIGHT_OD_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const source = FREIGHT_OD_SOURCE;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const areaCode = z.string().regex(/^(0[1-9]|[1-3][0-9]|4[0-7])000$/);
const margin = z.object({ areaCode, value: count }).strict();
export const freightOdSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    period: z.literal(source.period),
    commodity: z.literal('総貨物'),
    generatedAt: z.string().datetime(),
    source: z
      .object({
        title: z.literal(source.title),
        url: z.literal(source.url),
        files: z
          .array(
            z
              .object({
                filename: z.string(),
                url: z.string().url(),
                sha256: z.string(),
              })
              .strict()
          )
          .length(source.files.length),
      })
      .strict(),
    prefectures: z
      .array(z.object({ areaCode, areaName: z.string() }).strict())
      .length(47),
    modes: z
      .array(
        z
          .object({
            mode: z.enum(['rail', 'sea', 'road', 'air']),
            label: z.string(),
            unit: z.string(),
            periodType: z.enum(['fiscal', 'calendar']),
            officialNationalTotal: count,
            od: z
              .array(
                z
                  .object({
                    originAreaCode: areaCode,
                    destinationAreaCode: areaCode,
                    value: count,
                  })
                  .strict()
              )
              .length(47 * 47),
            originTotals: z.array(margin).length(47),
            destinationTotals: z.array(margin).length(47),
          })
          .strict()
      )
      .length(4),
    notes: z.array(z.string()),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (JSON.stringify(snapshot.source.files) !== JSON.stringify(source.files))
      fail('原典URL・SHA・順序が一致しない');
    if (JSON.stringify(snapshot.notes) !== JSON.stringify(source.notes))
      fail('対象・単位・丸め注記が欠落');
    const codes = snapshot.prefectures.map((row) => row.areaCode);
    if (
      new Set(codes).size !== 47 ||
      snapshot.prefectures.some(
        (row) => lookupArea(row.areaCode)?.areaName !== row.areaName
      )
    )
      fail('47県の一意な名称・コードが必要');
    for (const [index, mode] of snapshot.modes.entries()) {
      const expected = source.modes[index];
      if (
        !expected ||
        mode.mode !== expected.mode ||
        mode.label !== expected.label ||
        mode.unit !== expected.unit ||
        mode.periodType !== expected.periodType ||
        mode.officialNationalTotal !== expected.officialNationalTotal
      ) {
        fail('輸送機関・単位・期間・全国値が一致しない');
        continue;
      }
      const origins = new Map(codes.map((code) => [code, 0]));
      const destinations = new Map(codes.map((code) => [code, 0]));
      const seen = new Set<string>();
      for (const point of mode.od) {
        const key = `${point.originAreaCode}:${point.destinationAreaCode}`;
        if (
          seen.has(key) ||
          !origins.has(point.originAreaCode) ||
          !destinations.has(point.destinationAreaCode)
        )
          fail('発地着地の重複・対象外地域');
        seen.add(key);
        origins.set(
          point.originAreaCode,
          (origins.get(point.originAreaCode) ?? 0) + point.value
        );
        destinations.set(
          point.destinationAreaCode,
          (destinations.get(point.destinationAreaCode) ?? 0) + point.value
        );
      }
      for (const [points, computed] of [
        [mode.originTotals, origins],
        [mode.destinationTotals, destinations],
      ] as const) {
        if (
          new Set(points.map((point) => point.areaCode)).size !== 47 ||
          points.some((point) => computed.get(point.areaCode) !== point.value)
        )
          fail('OD行列と発着県別合計が一致しない');
      }
      const total = mode.od.reduce((sum, point) => sum + point.value, 0);
      if (
        total - mode.officialNationalTotal !==
        expected.nationalRoundingDifference
      )
        fail('全国保存則と原表の丸め差が一致しない');
    }
  });
export type FreightOdSnapshot = z.infer<typeof freightOdSnapshotSchema>;
export function parseFreightOdSnapshot(raw: unknown): FreightOdSnapshot | null {
  const result = freightOdSnapshotSchema.safeParse(raw);
  return result.success ? result.data : null;
}
/** 1輸送機関・1方向に固定した相手県比較。自県内輸送も保持する。 */
export function selectFreightPartners(
  snapshot: FreightOdSnapshot,
  modeKey: FreightOdSnapshot['modes'][number]['mode'],
  selectedAreaCode: string,
  direction: 'outbound' | 'inbound'
) {
  const mode = snapshot.modes.find((item) => item.mode === modeKey);
  if (
    !mode ||
    !snapshot.prefectures.some((area) => area.areaCode === selectedAreaCode)
  )
    return null;
  const rows = mode.od
    .filter((point) =>
      direction === 'outbound'
        ? point.originAreaCode === selectedAreaCode
        : point.destinationAreaCode === selectedAreaCode
    )
    .map((point) => ({
      areaCode:
        direction === 'outbound'
          ? point.destinationAreaCode
          : point.originAreaCode,
      value: point.value,
    }))
    .sort((a, b) => b.value - a.value || a.areaCode.localeCompare(b.areaCode));
  return {
    unit: mode.unit,
    periodType: mode.periodType,
    rows,
    total: rows.reduce((sum, point) => sum + point.value, 0),
  };
}
