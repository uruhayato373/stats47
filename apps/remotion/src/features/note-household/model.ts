import { z } from 'zod';

export const CATEGORY_NAMES = ['食料', '住居', '光熱・水道', '家具・家事用品', '被服及び履物', '保健医療', '交通・通信', '教育', '教養娯楽', 'その他の消費支出'] as const;
export const HOUSEHOLD_LAYOUT_VERSION = 'note-household-v3';
export const HOUSEHOLD_NOTE_VERSION = 'note-household-body-v3';
export const HOUSEHOLD_CANVAS = { width: 1080, height: 1350 } as const;
export const SLIDES = ['note', 'x', 'cover', 'categories-1', 'categories-2', 'source'] as const;
export type Slide = typeof SLIDES[number];
export const householdInputSchema = z.object({
  sourceArticle: z.object({ key: z.string().startsWith('a-kakei-'), url: z.string().url(), manifestSha256: z.string().regex(/^[a-f0-9]{64}$/) }),
  chartData: z.object({
    _meta: z.object({ cityName: z.string().min(1), prefName: z.string().min(1), year: z.number().int(), household: z.literal('二人以上の世帯'), source: z.literal('総務省統計局 家計調査'), reference: z.literal('47都道府県庁所在市の単純平均 = 1.00 (家計調査の全国値ではない)') }).passthrough(),
    categoryBreakdown: z.array(z.object({ catName: z.string(), ratio: z.number().finite().positive() })).length(10).refine(rows => rows.every((r, i) => r.catName === CATEGORY_NAMES[i]), '家計支出の10分類の名称・順序を維持してください'),
  }).passthrough(),
}).passthrough();
export type HouseholdInput = z.infer<typeof householdInputSchema>;
export interface HouseholdNoteProps { input?: HouseholdInput; slide?: Slide; focus?: string[] }
export function rowsForSlide(input: HouseholdInput, slide: Slide) {
  const rows = input.chartData.categoryBreakdown;
  return slide === 'categories-1' ? rows.slice(0, 5) : slide === 'categories-2' ? rows.slice(5) : rows;
}
export function domainMax(input: HouseholdInput) {
  return Math.max(1.5, Math.ceil(Math.max(...input.chartData.categoryBreakdown.map(r => r.ratio)) * 2) / 2);
}
export function barGeometry(ratio: number, max: number, left: number, width: number) {
  if (!Number.isFinite(ratio) || ratio <= 0 || max < Math.max(1, ratio)) throw Error('棒の尺度が入力と一致しません');
  const baseline = left + width / max, value = left + width * ratio / max;
  return { baseline, x: Math.min(baseline, value), width: Math.abs(value - baseline) };
}
