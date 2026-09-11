import { lookupArea } from '@stats47/area';
import { MEDICAL_WORKFORCE_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const source = MEDICAL_WORKFORCE_SOURCE;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const areaSchema = z
  .object({
    areaCode: z.string().regex(/^(00|0[1-9]|[1-3][0-9]|4[0-7])000$/),
    areaName: z.string().min(1),
    totalPhysicians: count.refine((value) => value > 0),
    ages: z
      .array(z.object({ ageGroup: z.string(), physicians: count }).strict())
      .length(source.ageGroups.length),
    specialties: z
      .array(z.object({ specialty: z.string(), physicians: count }).strict())
      .length(source.specialties.length),
  })
  .strict();

export const medicalWorkforceSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    period: z.literal(source.period),
    unit: z.literal('人'),
    generatedAt: z.string().datetime(),
    population: z.literal(source.population),
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
                sha256: z.string().regex(/^[a-f0-9]{64}$/),
              })
              .strict()
          )
          .length(source.files.length),
      })
      .strict(),
    areas: z.array(areaSchema).length(47),
    national: areaSchema,
    notes: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const reject = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    const files = snapshot.source.files;
    if (
      new Set(files.map((file) => file.filename)).size !== source.files.length
    )
      reject('原表ファイルの重複・欠落');
    for (const expected of source.files) {
      const actual = files.find((file) => file.filename === expected.filename);
      if (actual?.url !== expected.url || actual?.sha256 !== expected.sha256)
        reject('原表のURL・SHAを固定する');
    }
    if (
      snapshot.national.areaCode !== '00000' ||
      snapshot.areas.some((row) => row.areaCode === '00000') ||
      new Set(snapshot.areas.map((row) => row.areaCode)).size !== 47
    )
      reject('全国と47県の一意な構成を確認する');
    if (snapshot.national.totalPhysicians !== source.nationalPhysicians)
      reject('2024年末の公式医療施設従事医師総数と一致しない');
    for (const row of [...snapshot.areas, snapshot.national]) {
      const expectedName =
        row.areaCode === '00000' ? '全国' : lookupArea(row.areaCode)?.areaName;
      if (row.areaName !== expectedName) reject('地域コードと県名の不一致');
      if (
        row.ages.some(
          (point, index) => point.ageGroup !== source.ageGroups[index]
        )
      )
        reject('14年齢階級の重複・欠落・順序変更');
      if (
        row.specialties.some(
          (point, index) => point.specialty !== source.specialties[index]
        )
      )
        reject('不詳を含む45診療科の重複・欠落・順序変更');
      if (
        row.ages.reduce((sum, point) => sum + point.physicians, 0) !==
        row.totalPhysicians
      )
        reject('年齢別人数と同年医師総数が一致しない');
      if (
        row.specialties.reduce((sum, point) => sum + point.physicians, 0) !==
        row.totalPhysicians
      )
        reject('主たる診療科別人数と同年医師総数が一致しない');
    }
    if (
      snapshot.areas.reduce((sum, row) => sum + row.totalPhysicians, 0) !==
      snapshot.national.totalPhysicians
    )
      reject('47県と公式全国の医師総数が一致しない');
    for (const [index, point] of snapshot.national.ages.entries()) {
      if (
        snapshot.areas.reduce(
          (sum, row) => sum + (row.ages[index]?.physicians ?? NaN),
          0
        ) !== point.physicians
      )
        reject('年齢階級ごとの47県合計と全国が一致しない');
    }
    for (const [index, point] of snapshot.national.specialties.entries()) {
      if (
        snapshot.areas.reduce(
          (sum, row) => sum + (row.specialties[index]?.physicians ?? NaN),
          0
        ) !== point.physicians
      )
        reject('診療科ごとの47県合計と全国が一致しない');
    }
  });

export type MedicalWorkforceSnapshot = z.infer<
  typeof medicalWorkforceSnapshotSchema
>;
export type MedicalWorkforceArea = MedicalWorkforceSnapshot['national'];

export function parseMedicalWorkforceSnapshot(raw: unknown) {
  const parsed = medicalWorkforceSnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function selectMedicalWorkforceArea(
  snapshot: MedicalWorkforceSnapshot,
  areaCode: string | null
) {
  return areaCode === null
    ? snapshot.national
    : (snapshot.areas.find((area) => area.areaCode === areaCode) ?? null);
}
