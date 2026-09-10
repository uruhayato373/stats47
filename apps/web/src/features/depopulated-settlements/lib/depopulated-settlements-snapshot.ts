import { DEPOPULATED_SETTLEMENTS_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const definition = DEPOPULATED_SETTLEMENTS_SOURCE;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const row = z
  .object({
    blockCode: z.string().regex(/^(00|0[1-9]|10)$/),
    blockName: z.string().min(1),
    total: count.positive(),
    categories: z
      .array(z.object({ key: z.string(), count }).strict())
      .length(7),
    age65ShareUnder50: count,
    age65Share50plus: count,
    age65Share100: count,
  })
  .strict()
  .superRefine((value, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    const name =
      value.blockCode === '00'
        ? '全国'
        : definition.blocks.find((block) => block.blockCode === value.blockCode)
            ?.blockName;
    if (value.blockName !== name) issue('公式地方ブロック名とコードを照合する');
    if (
      value.categories.some(
        (category, i) => category.key !== definition.categories[i]?.key
      )
    )
      issue('無回答を含む7排他区分と順序を固定する');
    if (
      value.categories.reduce((sum, category) => sum + category.count, 0) !==
      value.total
    )
      issue('7区分の計は対象集落総数に一致する');
    if (
      value.categories
        .slice(0, 4)
        .reduce((sum, category) => sum + category.count, 0) !==
      value.age65ShareUnder50
    )
      issue('50%未満は先頭4区分の再掲');
    if (
      value.categories
        .slice(4, 6)
        .reduce((sum, category) => sum + category.count, 0) !==
      value.age65Share50plus
    )
      issue('50%以上は2区分の再掲');
    if (value.age65Share100 > (value.categories[5]?.count ?? -1))
      issue('100%は70%以上の内数');
  });

export const depopulatedSettlementsSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    seriesKey: z.literal('depopulated-settlements'),
    period: z.literal(definition.period),
    unit: z.literal(definition.unit),
    geography: z.literal(definition.geography),
    universeId: z.literal(definition.universeId),
    generatedAt: z.string().datetime(),
    source: z
      .object({
        title: z.literal(definition.title),
        url: z.literal(definition.url),
        sha256: z.literal(definition.sha256),
        pdfPage: z.literal(definition.pdfPage),
        mappingPdfPage: z.literal(definition.mappingPdfPage),
      })
      .strict(),
    rows: z.array(row).length(10),
    national: row,
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (
      snapshot.rows.some(
        (row, i) => row.blockCode !== definition.blocks[i]?.blockCode
      )
    )
      issue('全国と区別した公式10ブロックを順序通り一度ずつ保持する');
    if (snapshot.national.blockCode !== '00') issue('全国行を分離する');
    for (const key of [
      'total',
      'age65ShareUnder50',
      'age65Share50plus',
      'age65Share100',
    ] as const) {
      if (
        snapshot.rows.reduce((sum, row) => sum + row[key], 0) !==
        snapshot.national[key]
      )
        issue('10ブロック合計は全国公表値に一致する');
      if (snapshot.national[key] !== definition.nationalPins[key])
        issue('2024年の全国公表値を固定する');
    }
    if (
      [...snapshot.rows, snapshot.national].some(
        (row) => row.categories.length !== 7
      )
    )
      return;
    for (let i = 0; i < definition.categories.length; i++) {
      if (
        snapshot.rows.reduce((sum, row) => sum + row.categories[i].count, 0) !==
        snapshot.national.categories[i].count
      )
        issue('区分ごとに10ブロックと全国を照合する');
      if (
        snapshot.national.categories[i].count !==
        definition.nationalPins[definition.categories[i].key]
      )
        issue('無回答を含む全国の7区分を固定する');
    }
  });

export type DepopulatedSettlementsSnapshot = z.infer<
  typeof depopulatedSettlementsSnapshotSchema
>;

export function parseDepopulatedSettlementsSnapshot(
  raw: unknown
): DepopulatedSettlementsSnapshot | null {
  const result = depopulatedSettlementsSnapshotSchema.safeParse(raw);
  return result.success ? result.data : null;
}
