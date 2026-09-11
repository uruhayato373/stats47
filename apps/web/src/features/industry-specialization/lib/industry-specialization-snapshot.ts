import { lookupArea } from '@stats47/area';
import { INDUSTRY_SPECIALIZATION_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const source = INDUSTRY_SPECIALIZATION_SOURCE;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const industry = z.object({
  industryCode: z.string().regex(/^[A-R]$/),
  industryName: z.string().min(1),
  employees: count,
  sharePercent: z.number().finite().min(0).max(100),
  nationalSharePercent: z.number().finite().positive().max(100),
  locationQuotient: z.number().finite().nonnegative(),
});
const area = z.object({
  areaCode: z.string().regex(/^(00|0[1-9]|[1-3][0-9]|4[0-7])000$/),
  areaName: z.string().min(1),
  totalEmployees: count.refine((value) => value > 0),
  unclassifiedEmployees: count,
  industries: z.array(industry).length(18),
});

export const industrySpecializationSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    period: z.literal(source.period),
    generatedAt: z.string().datetime(),
    source: z.object({
      title: z.literal(source.title),
      url: z.literal(source.url),
      sha256: z.literal(source.sha256),
    }),
    population: z.literal(source.population),
    industryClassification: z.literal(source.industryClassification),
    denominator: z.literal(source.denominator),
    formula: z.literal(source.formula),
    areas: z.array(area).length(47),
    national: area,
    notes: z.array(z.string().min(1)).min(1),
  })
  .superRefine((snapshot, ctx) => {
    const reject = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    const equal = (a: number, b: number) => Math.abs(a - b) <= 1e-9;
    if (
      snapshot.national.areaCode !== '00000' ||
      snapshot.areas.some((row) => row.areaCode === '00000') ||
      new Set(snapshot.areas.map((row) => row.areaCode)).size !== 47
    )
      reject('全国と47県の一意な構成を確認する');
    const national = new Map(
      snapshot.national.industries.map((row) => [row.industryCode, row])
    );
    for (const row of [...snapshot.areas, snapshot.national]) {
      if (
        row.areaName !==
        (row.areaCode === '00000' ? '全国' : lookupArea(row.areaCode)?.areaName)
      )
        reject('地域コードと県名の不一致');
      if (
        new Set(row.industries.map((point) => point.industryCode)).size !== 18
      )
        reject('産業内訳の重複・欠落');
      if (
        row.industries.reduce(
          (sum, point) => sum + point.employees,
          row.unclassifiedEmployees
        ) !== row.totalEmployees
      )
        reject('分類残差を含めて全産業従業者数を保存する');
      for (const point of row.industries) {
        const reference = national.get(point.industryCode);
        if (!reference || point.industryName !== reference.industryName) {
          reject('全国と県の産業分類の不一致');
          continue;
        }
        const nationalShare =
          (reference.employees / snapshot.national.totalEmployees) * 100;
        const share = (point.employees / row.totalEmployees) * 100;
        if (
          !(nationalShare > 0) ||
          !equal(point.sharePercent, share) ||
          !equal(point.nationalSharePercent, nationalShare) ||
          !equal(point.locationQuotient, share / nationalShare)
        )
          reject('同一分母で構成割合と特化係数を再計算する');
      }
    }
    for (const key of ['totalEmployees', 'unclassifiedEmployees'] as const) {
      if (
        snapshot.areas.reduce((sum, row) => sum + row[key], 0) !==
        snapshot.national[key]
      )
        reject('47県と全国の人数が一致しない');
    }
    for (const point of snapshot.national.industries) {
      if (
        snapshot.areas.reduce(
          (sum, row) =>
            sum +
            (row.industries.find(
              (ind) => ind.industryCode === point.industryCode
            )?.employees ?? 0),
          0
        ) !== point.employees
      )
        reject('産業別従業者数の全国合計が一致しない');
    }
  });

export type IndustrySpecializationSnapshot = z.infer<
  typeof industrySpecializationSnapshotSchema
>;

export function parseIndustrySpecializationSnapshot(raw: unknown) {
  const parsed = industrySpecializationSnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
