import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderRelationshipScatter, relationshipPoints } from '@/lib/template-relationship-scatter';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

// Synthetic values check the join and frame; live data stays in the SHA-verified R2 snapshots.
const payload = (metricKey: string, unit: string, valueAt: (i: number) => number, year = '2024') => ({
  metricKey, entityKind: 'prefecture',
  meta: { rowCount: 47, yearRange: [year, year], areaCount: 47, generatedAt: '2026-10-06T00:00:00.000Z' },
  rows: Array.from({ length: 47 }, (_, i) => ({
    areaCode: String(i + 1).padStart(2, '0') + '000', areaName: '県' + (i + 1),
    yearCode: year, yearName: year + '年', value: valueAt(i), unit,
  })),
});
const fixture = () => ({
  x: payload('average-temperature', '℃', (i) => 10 + i * 0.3),
  // Reverse order: the join must use prefecture codes, not row positions.
  y: { ...payload('kerosene-consumption-quantity', 'l', (i) => 600 - i * 12), rows: payload('kerosene-consumption-quantity', 'l', (i) => 600 - i * 12).rows.reverse() },
});

describe('relationship scatter basic form', () => {
  it('joins both snapshots by prefecture code into 47 points', () => {
    const points = relationshipPoints(fixture());
    expect(points).toHaveLength(47);
    expect(points.find((p) => p.code === '01000')).toMatchObject({ x: 10, y: 600 });
    expect(points.find((p) => p.code === '47000')).toMatchObject({ x: 10 + 46 * 0.3, y: 600 - 46 * 12 });
  });
  it('stops when a prefecture, year or unit is missing instead of plotting a partial set', () => {
    const input = fixture();
    expect(() => relationshipPoints({ ...input, y: { ...input.y, rows: input.y.rows.slice(1) } })).toThrow();
    expect(() => relationshipPoints({ ...input, x: payload('average-temperature', '℃', (i) => i, '2023') })).toThrow();
    expect(() => relationshipPoints({ ...input, y: payload('kerosene-consumption-quantity', 'kl', (i) => i) })).toThrow();
  });
  it('renders a 4:5 PNG with 47 points, the capital-city scope and minimal copy', async () => {
    const svg = renderRelationshipScatter(fixture());
    expect(svg.match(/<circle data-pref=/g)).toHaveLength(47);
    expect(svg).toContain('県庁所在市・二人以上世帯');
    expect(svg).toContain('灯油消費量（L）');
    expect(svg.match(/font-weight="700">県\d+<\/text>/g)?.length ?? 0).toBeLessThanOrEqual(2);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350, format: 'png' });
  });
});
