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

/** The first y the chart body may use, below the header lines actually drawn. */
export const sampleBodyTop = (hasNote: boolean) => (hasNote ? 272 : 226);

export function sampleFrame(options: {
  title: string; titleSize?: number; meta: string; note?: string; source: string;
  body: string; ariaLabel?: string; attributes?: string; theme?: ChartTheme;
}) {
  const { title, titleSize = 72, meta, note, source, body, ariaLabel = title, attributes = '', theme = LIGHT_THEME } = options;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SAMPLE_FRAME.width}" height="${SAMPLE_FRAME.height}" viewBox="0 0 ${SAMPLE_FRAME.width} ${SAMPLE_FRAME.height}" role="img" aria-label="${escapeXml(ariaLabel)}" data-theme="${theme.name}"${attributes ? ' ' + attributes : ''}>
    <rect width="${SAMPLE_FRAME.width}" height="${SAMPLE_FRAME.height}" fill="${theme.paper}"/>
    <g font-family="${FONT}" fill="${theme.ink}">
      <text x="${SAMPLE_FRAME.left}" y="${TITLE_Y}" font-size="${titleSize}" font-weight="700">${escapeXml(title)}</text>
      <text x="${SAMPLE_FRAME.left}" y="${META_Y}" font-size="32" fill="${theme.muted}">${escapeXml(meta)}</text>
      ${note ? `<text x="${SAMPLE_FRAME.left}" y="${NOTE_Y}" font-size="28" fill="${theme.muted}">${escapeXml(note)}</text>` : ''}
      ${body}
      <text x="${SAMPLE_FRAME.left}" y="1310" font-size="26" fill="${theme.muted}">出典：${escapeXml(source)}</text>
    </g></svg>`;
}
