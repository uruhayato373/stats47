import { describe, expect, it } from 'vitest';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { resolveNumericDomain } from '../../../../packages/types/src/metric-presentation';
import { renderTrendLine, trendSampleRows, TREND_SAMPLE_METRIC } from '@/lib/template-trend-line';

const values = [26.3,27.7,27.3,26.3,28.8,29.4,26.2,27.7,29.2,28.2,28.6,28.1,28.3,28.9,30.2,26.7,31.4,30.9];
function fixture() {
  return { metricKey: 'engel-coefficient', entityKind: 'prefecture',
    meta: { rowCount: 18, areaCount: 1, yearRange: ['2007','2024'], generatedAt: '2026-10-20' },
    rows: values.map((value,i) => ({ areaCode: '23000', areaName: '愛知県', yearCode: String(2007+i), yearName: `${2007+i}年`, unit: '％', value: value as number | null })),
  };
}
describe('real annual-series portrait line sample', () => {
  it('keeps all 18 observations in chronological order and identifies the actual survey city', () => {
    const input = fixture(); input.rows.reverse();
    expect(trendSampleRows(input).map((r) => r.value)).toEqual(values);
    const svg = renderTrendLine(input);
    for (const text of ['width="1080"', 'height="1350"', '名古屋市', '二人以上の世帯', '2007–2024年', '単位：％', '出典：家計調査', '26.3', '30.9', 'data-points="18"']) expect(svg).toContain(text);
    expect(svg).not.toContain('全国平均');
    expect(svg.match(/<circle /g)).toHaveLength(18);
    expect(svg.match(/出典：/g)).toHaveLength(1);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
  });
  it.each(['missing', 'duplicate', 'null', 'unit', 'metric', 'entity', 'area'] as const)('rejects %s instead of connecting or fabricating data', (issue) => {
    const input = fixture();
    if (issue === 'missing') input.rows.splice(5,1);
    if (issue === 'duplicate') input.rows[5].yearCode = input.rows[4].yearCode;
    if (issue === 'null') input.rows[5].value = null;
    if (issue === 'unit') input.rows[5].unit = '円';
    if (issue === 'metric') input.metricKey = 'other';
    if (issue === 'entity') input.entityKind = 'city';
    if (issue === 'area') input.rows[5].areaCode = '13000';
    expect(() => renderTrendLine(input)).toThrow();
  });
  it('uses the metric trend domain rather than the bar or map domain', () => {
    const domain = resolveNumericDomain(values, TREND_SAMPLE_METRIC.visualization.trendDomain)!;
    const svg = renderTrendLine(fixture());
    expect(svg).toContain(`data-domain-min="${domain[0]}"`);
    expect(svg).toContain(`data-domain-max="${domain[1]}"`);
    const fixed = { ...TREND_SAMPLE_METRIC.visualization, trendDomain: { mode: 'fixed', min: 20, max: 35 } as const };
    expect(renderTrendLine(fixture(), fixed)).toContain('data-domain-min="20" data-domain-max="35"');
    expect(() => renderTrendLine(fixture(), { ...fixed, trendDomain: { mode: 'fixed', min: 27, max: 30 } })).toThrow('表示範囲');
  });
});
