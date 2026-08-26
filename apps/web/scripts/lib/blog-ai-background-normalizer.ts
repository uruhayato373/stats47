import sharp, { type OverlayOptions } from 'sharp';

export const BLOG_AI_BACKGROUND_WIDTH = 1200;
export const BLOG_AI_BACKGROUND_HEIGHT = 630;
export const BLOG_AI_BACKGROUND_CONTENT_TYPE = 'image/jpeg';

function leftScrimSvg(
  width: number,
  height: number,
  rgb: string,
  opacity: number
): Buffer {
  return Buffer.from(
    `<svg width="${width}" height="${height}"><defs>` +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">' +
      `<stop offset="0" stop-color="rgb(${rgb})" stop-opacity="${opacity}"/>` +
      `<stop offset="0.55" stop-color="rgb(${rgb})" stop-opacity="0"/>` +
      `</linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`
  );
}

/**
 * AI生成画像を、最終合成で再利用できる決定的な1200x630 JPEGへ正規化する。
 * 返り値をcache/R2のsource artifactとして保存し、dark版は同じbytesから導出する。
 */
export async function normalizeAiBackgroundBuffer(
  input: Buffer,
  dark: boolean
): Promise<Buffer> {
  const overlays: OverlayOptions[] = [];
  let pipeline = sharp(input).resize(
    BLOG_AI_BACKGROUND_WIDTH,
    BLOG_AI_BACKGROUND_HEIGHT,
    {
      fit: 'cover',
      position: 'centre',
    }
  );
  if (dark) {
    pipeline = pipeline.modulate({ brightness: 0.72, saturation: 0.75 });
    overlays.push({
      input: Buffer.from(
        `<svg width="${BLOG_AI_BACKGROUND_WIDTH}" height="${BLOG_AI_BACKGROUND_HEIGHT}">` +
          `<rect width="${BLOG_AI_BACKGROUND_WIDTH}" height="${BLOG_AI_BACKGROUND_HEIGHT}" ` +
          'fill="rgba(23,32,66,0.42)"/></svg>'
      ),
    });
    overlays.push({
      input: leftScrimSvg(
        BLOG_AI_BACKGROUND_WIDTH,
        BLOG_AI_BACKGROUND_HEIGHT,
        '15,23,42',
        0.7
      ),
    });
  } else {
    overlays.push({
      input: leftScrimSvg(
        BLOG_AI_BACKGROUND_WIDTH,
        BLOG_AI_BACKGROUND_HEIGHT,
        '255,255,255',
        0.72
      ),
    });
  }
  return pipeline.composite(overlays).jpeg({ quality: 88 }).toBuffer();
}

export async function normalizeAiBackground(
  input: Buffer,
  dark: boolean
): Promise<string> {
  const output = await normalizeAiBackgroundBuffer(input, dark);
  return `data:image/jpeg;base64,${output.toString('base64')}`;
}
