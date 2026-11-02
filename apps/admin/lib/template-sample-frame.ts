import { BRAND } from '../../web/src/features/ogp/brand';

/**
 * One 4:5 frame shared by every statistical sample: title, one condition line, an optional
 * definition line, the chart body and a short source. No publisher name (chart-image-copy.md).
 */
export const SAMPLE_FRAME = {
  width: 1080, height: 1350, left: 64, right: 1016,
  bodyBottom: 1262,
} as const;
export const escapeXml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
const FONT = 'Noto Sans JP, Yu Gothic, Meiryo, sans-serif';
const TITLE_Y = 120;
const META_Y = 184;
const NOTE_Y = 230;

/** The first y the chart body may use, below the header lines actually drawn. */
export const sampleBodyTop = (hasNote: boolean) => (hasNote ? 272 : 226);

export function sampleFrame(options: {
  title: string; titleSize?: number; meta: string; note?: string; source: string;
  body: string; ariaLabel?: string; attributes?: string;
}) {
  const { title, titleSize = 72, meta, note, source, body, ariaLabel = title, attributes = '' } = options;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SAMPLE_FRAME.width}" height="${SAMPLE_FRAME.height}" viewBox="0 0 ${SAMPLE_FRAME.width} ${SAMPLE_FRAME.height}" role="img" aria-label="${escapeXml(ariaLabel)}"${attributes ? ' ' + attributes : ''}>
    <rect width="${SAMPLE_FRAME.width}" height="${SAMPLE_FRAME.height}" fill="${BRAND.paper}"/>
    <g font-family="${FONT}" fill="${BRAND.ink}">
      <text x="${SAMPLE_FRAME.left}" y="${TITLE_Y}" font-size="${titleSize}" font-weight="700">${escapeXml(title)}</text>
      <text x="${SAMPLE_FRAME.left}" y="${META_Y}" font-size="32" fill="${BRAND.muted}">${escapeXml(meta)}</text>
      ${note ? `<text x="${SAMPLE_FRAME.left}" y="${NOTE_Y}" font-size="28" fill="${BRAND.muted}">${escapeXml(note)}</text>` : ''}
      ${body}
      <text x="${SAMPLE_FRAME.left}" y="1310" font-size="26" fill="${BRAND.muted}">出典：${escapeXml(source)}</text>
    </g></svg>`;
}
