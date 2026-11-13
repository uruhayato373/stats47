import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderFilePreview, type FilePreview } from '@/lib/template-file-preview';
import { CHART_THEMES } from '../../../remotion/src/features/data-cards/chart-theme';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';

const columns: FilePreview['columns'] = [
  { label: '自治体コード', align: 'start' }, { label: '都道府県', align: 'start' }, { label: '自治体名', align: 'start' },
  { label: '年', align: 'end' }, { label: '値', align: 'end' }, { label: '単位', align: 'start' }, { label: '注記', align: 'start' },
];
const row = (year: string, value: string, note = '', flagged = false) => ({ cells: ['23211', '愛知県', '豊田市', year, value, '百万円', note], flagged });
const preview: FilePreview = {
  title: 'CSVの中身（豊田市の行の一部）',
  meta: 'manufacturing-shipment-amount_municipalities_utf8.csv · 全75,636行',
  source: 'e-Stat 社会・人口統計体系',
  columns,
  rows: [row('1997', '8345394'), row('1998', '', '元データ記号 -（データが得られないもの）', true), { gap: true }, row('2023', '20527151')],
};

describe('file-preview type', () => {
  it('writes every cell verbatim, marks the skipped rows and the flagged row, in one 4:5 image per theme', async () => {
    const svg = renderFilePreview(preview);
    expect(svg).toContain('data-image-template="file-preview"');
    for (const cell of ['23211', '8345394', '20527151']) expect(svg).toContain(`>${cell}</text>`);
    // The note wraps inside its column, but the whole text is kept on the row.
    expect(svg).toContain('data-note="元データ記号 -（データが得られないもの）"');
    expect(svg).not.toContain('8,345,394');
    expect(svg.match(/data-gap="true"/g)).toHaveLength(1);
    expect(svg.match(/data-flagged="true"/g)).toHaveLength(1);
    expect(() => assertMinimalChartCopy(svg)).not.toThrow();
    for (const theme of Object.values(CHART_THEMES)) {
      const png = await sharp(Buffer.from(renderFilePreview(preview, theme))).png().toBuffer();
      expect(await sharp(png).metadata()).toMatchObject({ width: 1080, height: 1350 });
    }
  });

  it('escapes cells as XML', () => {
    expect(renderFilePreview({ ...preview, rows: [row('2023', '1', 'a<b & c')] })).toContain('a&lt;b &amp; c');
  });

  it('refuses rows that do not match the columns, too many rows, a note longer than two lines, and fixed columns that leave no room', () => {
    expect(() => renderFilePreview({ ...preview, rows: [{ cells: ['x'] }] })).toThrow();
    expect(() => renderFilePreview({ ...preview, rows: Array.from({ length: 40 }, () => row('2023', '1')) })).toThrow();
    expect(() => renderFilePreview({ ...preview, rows: [row('2023', '1', 'あ'.repeat(80))] })).toThrow();
    expect(() => renderFilePreview({ ...preview, rows: [{ cells: ['あ'.repeat(40), '', '', '', '', '', ''] }] })).toThrow();
  });
});
