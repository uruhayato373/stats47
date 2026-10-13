import { z } from 'zod';

export const CARD_KINDS = [
  'household-receipt',
  'area-atlas',
  'rank-routes',
  'tile-change',
] as const;
export const CARD_COMPOSITIONS = {
  'household-receipt': 'SNS-HouseholdReceipt',
  'area-atlas': 'SNS-AreaAtlas',
  'rank-routes': 'SNS-RankRoutes',
  'tile-change': 'SNS-TileChange',
} as const;
const text = z.string().min(1);
const amount = z.number().finite();
const base = {
  key: text,
  title: text.max(64),
  scope: text,
  canonicalPath: text,
  sources: z.array(z.object({ name: text, url: z.string().url() })).min(1),
  notes: z.array(text),
  metricKeys: z.array(text).min(1),
};
const cell = z.object({
  key: text,
  label: text,
  value: amount,
  unit: text,
  year: text,
});
export const dataCardSchema = z.discriminatedUnion('kind', [
  z.object({
    ...base,
    kind: z.literal('tile-change'),
    unit: text,
    beforeYear: text,
    afterYear: text,
    summary: text,
    rows: z.array(z.object({
      code: z.string().regex(/^\d{2}000$/),
      name: text,
      before: amount.positive(),
      after: amount.nonnegative(),
      change: amount,
    })).length(47),
  }),
  z.object({
    ...base,
    kind: z.literal('household-receipt'),
    areaName: text,
    period: text,
    rows: z.array(cell).length(10),
    total: amount.nonnegative(),
    difference: amount,
  }),
  z.object({
    ...base,
    kind: z.literal('area-atlas'),
    areaName: text,
    areaCode: text,
    shape: text,
    shapeNote: text,
    rows: z.array(cell).length(4),
  }),
  z.object({
    ...base,
    kind: z.literal('rank-routes'),
    unit: text,
    beforeYear: text,
    afterYear: text,
    population: z.literal(47),
    direction: z.enum(['ascending', 'descending']),
    routes: z
      .array(
        z.object({
          code: text,
          name: text,
          before: z.object({
            rank: z.number().int().min(1).max(47),
            value: amount,
          }),
          after: z.object({
            rank: z.number().int().min(1).max(47),
            value: amount,
          }),
        })
      )
      .min(2)
      .max(4),
  }),
]);
export type DataCard = z.infer<typeof dataCardSchema>;
export const dataCardPropsSchema = z.object({
  card: dataCardSchema.optional(),
  slide: z.enum(['cover', 'detail', 'source']).default('detail'),
});
export type DataCardProps = z.infer<typeof dataCardPropsSchema>;

/** Text positions may separate ties; the chart points always retain the original rank. */
export function rankLabelPositions(
  ranks: number[],
  y: (rank: number) => number
): number[] {
  const sorted = ranks
    .map((rank, index) => ({ index, y: y(rank) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++)
    sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + 65);
  if (sorted.length && sorted[sorted.length - 1].y > 550) {
    sorted[sorted.length - 1].y = 550;
    for (let i = sorted.length - 2; i >= 0; i--)
      sorted[i].y = Math.min(sorted[i].y, sorted[i + 1].y - 65);
  }
  return ranks.map((_, i) => sorted.find((row) => row.index === i)!.y);
}
