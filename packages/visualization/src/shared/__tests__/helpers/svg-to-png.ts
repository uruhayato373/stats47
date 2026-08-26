import sharp from "sharp";
import { prepareSvgForDeterministicRender } from "./render-test-contract";

/**
 * SVG 文字列を PNG バッファに変換する
 */
export async function svgToPng(
  svg: string,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(Buffer.from(prepareSvgForDeterministicRender(svg)))
    .resize(width, height)
    .png()
    .toBuffer();
}
