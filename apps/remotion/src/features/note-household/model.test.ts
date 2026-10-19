import { describe, expect, it } from 'vitest';
import { CATEGORY_NAMES, HOUSEHOLD_CANVAS, householdInputSchema, rowsForSlide, domainMax, barGeometry } from './model';

const source = { sourceArticle: { key: 'a-kakei-aichi', url: 'https://note.com/stats47/n/nda72a0bed2c4', manifestSha256: 'a'.repeat(64) }, chartData: { _meta: { cityName: '名古屋市', prefName: '愛知県', year: 2024, household: '二人以上の世帯', source: '総務省統計局 家計調査', reference: '47都道府県庁所在市の単純平均 = 1.00 (家計調査の全国値ではない)' }, categoryBreakdown: CATEGORY_NAMES.map((catName, i) => ({ catName, ratio: 0.5 + i * 0.1 })) } };
describe('note household fixed-input layouts', () => {
  it('keeps all ten categories exactly once across the two Instagram comparison pages', () => {
    const input = householdInputSchema.parse(source);
    expect([...rowsForSlide(input, 'categories-1'), ...rowsForSlide(input, 'categories-2')]).toEqual(rowsForSlide(input, 'x'));
    expect(rowsForSlide(input, 'note')).toEqual(rowsForSlide(input, 'x'));
    expect(HOUSEHOLD_CANVAS).toEqual({ width: 1080, height: 1350 });
    expect(domainMax(input)).toBe(1.5);
  });
  it('rejects missing categories, reordered data and a national-average substitution', () => {
    expect(householdInputSchema.safeParse({ ...source, chartData: { ...source.chartData, categoryBreakdown: source.chartData.categoryBreakdown.slice(1) } }).success).toBe(false);
    expect(householdInputSchema.safeParse({ ...source, chartData: { ...source.chartData, categoryBreakdown: [...source.chartData.categoryBreakdown].reverse() } }).success).toBe(false);
    expect(householdInputSchema.safeParse({ ...source, chartData: { ...source.chartData, _meta: { ...source.chartData._meta, reference: '全国平均 = 1.00' } } }).success).toBe(false);
  });
  it('draws below-average ratios left of one and above-average ratios right of one using one scale', () => {
    const low = barGeometry(0.64, 1.5, 0, 900), high = barGeometry(1.26, 1.5, 0, 900);
    expect(low.x + low.width).toBeCloseTo(low.baseline);
    expect(high.x).toBeCloseTo(high.baseline);
    expect(low.baseline).toBe(high.baseline);
    expect(low.width / high.width).toBeCloseTo((1 - 0.64) / (1.26 - 1));
    expect(() => barGeometry(1.6, 1.5, 0, 900)).toThrow();
  });
});
