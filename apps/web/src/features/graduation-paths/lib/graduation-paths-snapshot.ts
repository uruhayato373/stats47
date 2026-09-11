import { lookupArea } from '@stats47/area';
import { GRADUATION_PATHS_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const definition = GRADUATION_PATHS_SOURCE;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const category = z.object({ key: z.string(), count }).strict();
const row = z
  .object({
    areaCode: z.string().regex(/^(00|0[1-9]|[1-3][0-9]|4[0-7])000$/),
    areaName: z.string().min(1),
    total: count.positive(),
    categories: z.array(category).length(definition.categories.length),
    overlapEmployed: count,
    officialEmployed: count,
  })
  .strict()
  .superRefine((value, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    const name =
      value.areaCode === '00000'
        ? '全国'
        : lookupArea(value.areaCode)?.areaName;
    if (value.areaName !== name)
      issue('地域コードと学校所在地の県名を照合する');
    if (
      value.categories.some(
        (category, i) => category.key !== definition.categories[i]?.key
      )
    )
      issue('排他的な進路8区分と順序を固定する');
    if (
      value.categories.reduce((sum, category) => sum + category.count, 0) !==
      value.total
    )
      issue('進路8区分の計は卒業者総数と一致する');
    if (
      value.overlapEmployed >
      value.categories
        .slice(0, 4)
        .reduce((sum, category) => sum + category.count, 0)
    )
      issue('進学中の就職者は進学者の内数');
    if (value.officialEmployed > value.total) issue('就職者は卒業者の内数');
  });

export const graduationPathsSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    seriesKey: z.literal('graduation-paths'),
    period: z.literal(definition.period),
    unit: z.literal('人'),
    releaseStatus: z.literal('final'),
    generatedAt: z.string().datetime(),
    source: z
      .object({
        title: z.literal(definition.title),
        url: z.literal(definition.url),
        sha256: z.literal(definition.sha256),
      })
      .strict(),
    rows: z.array(row).length(47),
    national: row,
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (
      new Set(snapshot.rows.map((row) => row.areaCode)).size !== 47 ||
      snapshot.rows.some((row) => row.areaCode === '00000')
    )
      issue('47県を一意に保持する');
    if (snapshot.national.areaCode !== '00000')
      issue('全国公式行と県別行を分離する');
    for (const key of [
      'total',
      'overlapEmployed',
      'officialEmployed',
    ] as const) {
      if (
        snapshot.rows.reduce((sum, row) => sum + row[key], 0) !==
        snapshot.national[key]
      )
        issue('47県合計と全国公式値を照合する');
    }
    if (
      [...snapshot.rows, snapshot.national].some(
        (row) => row.categories.length !== definition.categories.length
      )
    )
      return;
    for (let i = 0; i < definition.categories.length; i++) {
      if (
        snapshot.rows.reduce(
          (sum, row) => sum + row.categories[i]!.count,
          0
        ) !== snapshot.national.categories[i]!.count
      )
        issue('進路区分別に47県合計と全国を照合する');
    }
    if (
      snapshot.national.total !== 929157 ||
      snapshot.national.overlapEmployed !== 112 ||
      snapshot.national.officialEmployed !== 127501 ||
      snapshot.national.categories[7]!.count !== 37
    )
      issue('2025年3月卒業の公式母集団を固定する');
  });

export type GraduationPathsSnapshot = z.infer<
  typeof graduationPathsSnapshotSchema
>;

export function parseGraduationPathsSnapshot(
  raw: unknown
): GraduationPathsSnapshot | null {
  const result = graduationPathsSnapshotSchema.safeParse(raw);
  return result.success ? result.data : null;
}
