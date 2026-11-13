import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

/**
 * The file-preview type (image-templates.json `file-preview`): rows of a delivered data file as they are,
 * to show a buyer the columns, the row shape and how blanks are annotated. Cells are written verbatim
 * (no rounding or reformatting), rows the author skipped are one gap row, and a row with a note can be
 * flagged so the note column is noticed. Not a ranking table: there are no ranks and no bars.
 * The last column is the file's free-text column (a note); it wraps inside its width instead of being cut.
 */
export interface FilePreview {
  title: string;
  /** The file name and its size, e.g. 「…_utf8.csv · 全75,636行」. */
  meta: string;
  note?: string;
  source: string;
  columns: { label: string; align: 'start' | 'end' }[];
  rows: ({ cells: string[]; flagged?: boolean } | { gap: true })[];
  ariaLabel?: string;
}

const FONT_MAX = 26;
const FONT_MIN = 20;
const CELL_PAD = 12;
const LINE_GAP = 1.45;
const MAX_LINES = 2;
/** The narrowest the free-text column may become before the font shrinks. */
const LAST_MIN_WIDTH = 220;

/** Greedy wrap by drawn width; characters are the unit, so Japanese text breaks anywhere. */
function wrap(text: string, width: number, size: number) {
  const lines: string[] = [];
  let line = '';
  for (const c of text) {
    if (line && textWidth(line + c, size) > width) { lines.push(line); line = c; } else line += c;
  }
  return [...lines, line];
}

export function renderFilePreview(preview: FilePreview, theme: ChartTheme = LIGHT_THEME) {
  const { columns, rows } = preview;
  const dataRows = rows.filter((row): row is { cells: string[]; flagged?: boolean } => !('gap' in row));
  if (!columns.length || !dataRows.length) throw Error('ファイルの中身には列と行が要ります。');
  if (dataRows.some((row) => row.cells.length !== columns.length)) throw Error('列の数と合わない行があります。');
  const frameWidth = SAMPLE_FRAME.right - SAMPLE_FRAME.left;
  const last = columns.length - 1;
  // Fixed columns hold their widest cell; the font shrinks until the free-text column keeps a usable width.
  const fixedAt = (size: number) => columns.slice(0, last).map((column, c) =>
    Math.max(textWidth(column.label, size), ...dataRows.map((row) => textWidth(row.cells[c], size))) + CELL_PAD * 2);
  const lastAt = (size: number) => frameWidth - fixedAt(size).reduce((s, w) => s + w, 0);
  const notesFit = (size: number) => dataRows.every((row) => wrap(row.cells[last], lastAt(size) - CELL_PAD * 2, size).length <= MAX_LINES);
  let size = FONT_MAX;
  while (size > FONT_MIN && (lastAt(size) < LAST_MIN_WIDTH || !notesFit(size))) size -= 1;
  const fixed = fixedAt(size);
  const lastWidth = frameWidth - fixed.reduce((s, w) => s + w, 0);
  if (lastWidth < Math.max(LAST_MIN_WIDTH, textWidth(columns[last].label, size) + CELL_PAD * 2)) throw Error('列が枠に収まりません。列を減らすか値を短くしてください。');
  const lineHeight = size * LINE_GAP;
  const rowHeight = (lines: number) => Math.round(lineHeight * lines + size * 0.9);
  const laid = rows.map((row) => {
    if ('gap' in row) return { row, lines: [] as string[], height: rowHeight(1) };
    const lines = row.cells[last] ? wrap(row.cells[last], lastWidth - CELL_PAD * 2, size) : [''];
    if (lines.length > MAX_LINES) throw Error(`注記が長すぎます (${MAX_LINES}行まで): ${row.cells[last]}`);
    return { row, lines, height: rowHeight(lines.length) };
  });
  const top = sampleBodyTop(Boolean(preview.note)) + 16;
  const headerHeight = rowHeight(1);
  const bottom = top + headerHeight + laid.reduce((s, r) => s + r.height, 0);
  if (bottom > SAMPLE_FRAME.bodyBottom) throw Error('行が多すぎて枠に収まりません。');
  const xs = [...fixed, lastWidth].reduce<number[]>((acc, w, i) => [...acc, acc[i] + w], [SAMPLE_FRAME.left]);
  const cellX = (c: number) => (columns[c].align === 'end' ? xs[c + 1] - CELL_PAD : xs[c] + CELL_PAD);
  const anchor = (c: number) => (columns[c].align === 'end' ? 'end' : 'start');
  const firstBaseline = (y: number) => y + size * 0.45 + lineHeight * 0.75;
  const header = `<rect x="${SAMPLE_FRAME.left}" y="${top}" width="${frameWidth}" height="${headerHeight}" fill="${theme.wash}"/>` +
    columns.map((column, c) => `<text x="${cellX(c)}" y="${firstBaseline(top).toFixed(1)}" text-anchor="${anchor(c)}" font-size="${size}" font-weight="700">${escapeXml(column.label)}</text>`).join('');
  let y = top + headerHeight;
  const rules = [top, y];
  const body = laid.map(({ row, lines, height }, r) => {
    const rowTop = y;
    y += height;
    rules.push(y);
    if ('gap' in row) return `<text data-gap="true" x="${SAMPLE_FRAME.left + frameWidth / 2}" y="${firstBaseline(rowTop).toFixed(1)}" text-anchor="middle" font-size="${size}" fill="${theme.muted}">…</text>`;
    const wash = row.flagged ? `<rect x="${SAMPLE_FRAME.left}" y="${rowTop}" width="${frameWidth}" height="${height}" fill="${theme.wash}" opacity="0.6"/>` : '';
    const fixedCells = row.cells.slice(0, last).map((cell, c) => `<text x="${cellX(c)}" y="${firstBaseline(rowTop).toFixed(1)}" text-anchor="${anchor(c)}" font-size="${size}">${escapeXml(cell)}</text>`).join('');
    const note = lines.filter(Boolean).map((line, i) => `<text x="${cellX(last)}" y="${(firstBaseline(rowTop) + i * lineHeight).toFixed(1)}" font-size="${size}">${escapeXml(line)}</text>`).join('');
    return `<g data-row="${r}"${row.flagged ? ' data-flagged="true"' : ''} data-note="${escapeXml(row.cells[last])}">${wash}${fixedCells}${note}</g>`;
  }).join('');
  const grid = rules.map((ry) => `<line x1="${SAMPLE_FRAME.left}" x2="${SAMPLE_FRAME.right}" y1="${ry}" y2="${ry}" stroke="${theme.line}" stroke-width="2"/>`).join('') +
    xs.map((x) => `<line x1="${x}" x2="${x}" y1="${top}" y2="${bottom}" stroke="${theme.line}" stroke-width="2"/>`).join('');
  return sampleFrame({
    title: preview.title, titleSize: fitTitleSize(preview.title, 64), meta: preview.meta, note: preview.note, source: preview.source,
    ariaLabel: preview.ariaLabel, attributes: `data-image-template="file-preview" data-columns="${columns.length}"`,
    body: header + body + grid, theme,
  });
}
