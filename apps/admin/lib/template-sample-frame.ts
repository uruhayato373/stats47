import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';

/**
 * One 4:5 frame shared by every statistical sample: title, one condition line, an optional
 * definition line, the chart body and a short source. No publisher name (chart-image-copy.md).
 */
export const SAMPLE_FRAME = {
  width: 1080, height: 1350, left: 64, right: 1016,
  bodyBottom: 1262,
} as const;
export const escapeXml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
// Same stack as the tile renderer; Hiragino for Apple devices viewing the SVG in a browser.
const FONT = "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,sans-serif";
const TITLE_Y = 120;
const META_Y = 184;
const NOTE_Y = 230;

/** Rough drawn width of a label: full width for Japanese, about 0.58 for Latin and digits. */
export const textWidth = (text: string, size: number) => [...text].reduce((sum, c) => sum + (c.charCodeAt(0) < 0x2e80 ? size * 0.58 : size), 0);
const TITLE_MIN_SIZE = 36;
/** The largest title size that fits the frame, down to the smallest size still read as a title. */
export function fitTitleSize(title: string, largest = 72) {
  const width = SAMPLE_FRAME.right - SAMPLE_FRAME.left;
  return Math.max(TITLE_MIN_SIZE, Math.min(largest, Math.floor(largest * width / textWidth(title, largest))));
}

const LINE_MIN_SIZE = 24;
/** A condition line's size: its usual size, smaller only when the line would run off the frame. */
const fitLine = (line: string, size: number) => Math.max(LINE_MIN_SIZE, Math.min(size, Math.floor(size * (SAMPLE_FRAME.right - SAMPLE_FRAME.left) / textWidth(line, size))));

/** The first y the chart body may use, below the header lines actually drawn. */
export const sampleBodyTop = (hasNote: boolean) => (hasNote ? 272 : 226);

export function sampleFrame(options: {
  title: string; titleSize?: number; meta: string; note?: string; source: string;
  body: string; ariaLabel?: string; attributes?: string; theme?: ChartTheme;
}) {
  const { title, titleSize = fitTitleSize(title), meta, note, source, body, ariaLabel = title, attributes = '', theme = LIGHT_THEME } = options;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SAMPLE_FRAME.width}" height="${SAMPLE_FRAME.height}" viewBox="0 0 ${SAMPLE_FRAME.width} ${SAMPLE_FRAME.height}" role="img" aria-label="${escapeXml(ariaLabel)}" data-theme="${theme.name}"${attributes ? ' ' + attributes : ''}>
    <rect width="${SAMPLE_FRAME.width}" height="${SAMPLE_FRAME.height}" fill="${theme.paper}"/>
    <g font-family="${FONT}" fill="${theme.ink}">
      <text x="${SAMPLE_FRAME.left}" y="${TITLE_Y}" font-size="${titleSize}" font-weight="700">${escapeXml(title)}</text>
      <text x="${SAMPLE_FRAME.left}" y="${META_Y}" font-size="${fitLine(meta, 32)}" fill="${theme.muted}">${escapeXml(meta)}</text>
      ${note ? `<text x="${SAMPLE_FRAME.left}" y="${NOTE_Y}" font-size="${fitLine(note, 28)}" fill="${theme.muted}">${escapeXml(note)}</text>` : ''}
      ${body}
      ${source ? `<text x="${SAMPLE_FRAME.left}" y="1310" font-size="26" fill="${theme.muted}">出典：${escapeXml(source)}</text>` : ''}
    </g></svg>`;
}
