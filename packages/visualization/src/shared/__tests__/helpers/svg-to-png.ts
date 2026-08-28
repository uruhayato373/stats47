import { Resvg } from "@resvg/resvg-js";
import {
  deterministicRenderFontFiles,
  prepareSvgForDeterministicRender,
} from "./render-test-contract";

/**
 * SVG 文字列を PNG バッファに変換する
 */
export async function svgToPng(
  svg: string,
  width: number,
  height: number
): Promise<Buffer> {
  const rendered = new Resvg(prepareSvgForDeterministicRender(svg), {
    fitTo: { mode: "width", value: width },
    font: {
      fontFiles: deterministicRenderFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: "Noto Sans JP",
      sansSerifFamily: "Noto Sans JP",
      serifFamily: "Noto Sans JP",
    },
    languages: ["ja"],
    shapeRendering: 2,
    textRendering: 2,
  }).render();
  if (rendered.width !== width || rendered.height !== height) {
    throw new Error(
      `deterministic SVG render size mismatch: ${rendered.width}x${rendered.height}, expected ${width}x${height}`,
    );
  }
  return rendered.asPng();
}
