import sharp from "sharp";

/**
 * SVG 文字列を PNG バッファに変換する
 */
export async function svgToPng(
  svg: string,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toBuffer();
}
