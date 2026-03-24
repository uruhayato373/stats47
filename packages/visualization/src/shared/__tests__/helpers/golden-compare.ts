import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import sharp from "sharp";
import { expect } from "vitest";

const GOLDEN_DIR = resolve(__dirname, "../__golden__");
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "true";

/**
 * PNG バッファをゴールデン画像と比較する。
 * ゴールデンが存在しない or UPDATE_GOLDEN=true の場合はゴールデンを書き出す。
 */
export async function compareWithGolden(
  name: string,
  actualBuffer: Buffer,
  width: number,
  height: number,
  maxDiffPixels = 500, // jsdom との差異を考慮して少し広めに設定
): Promise<void> {
  if (!existsSync(GOLDEN_DIR)) mkdirSync(GOLDEN_DIR, { recursive: true });
  const goldenPath = resolve(GOLDEN_DIR, `${name}.png`);

  // 実際のバッファを PNG に変換（SVG が渡された場合も考慮）
  const actualPngBuffer = await sharp(actualBuffer).resize(width, height).png().toBuffer();
  
  // ゴールデン作成・更新モード
  if (UPDATE_GOLDEN || !existsSync(goldenPath)) {
    writeFileSync(goldenPath, actualPngBuffer);
    console.log(`Golden image updated: ${goldenPath}`);
    return;
  }

  // 比較
  const goldenPng = PNG.sync.read(readFileSync(goldenPath));
  const actualPng = PNG.sync.read(actualPngBuffer);
  
  if (goldenPng.width !== width || goldenPng.height !== height) {
     // サイズが違う場合は強制的に失敗させデバッグ用ファイルを出力
     writeFileSync(resolve(GOLDEN_DIR, `${name}-actual.png`), actualBuffer);
     throw new Error(`Dimension mismatch for ${name}: expected ${goldenPng.width}x${goldenPng.height}, got ${width}x${height}`);
  }

  const diff = new PNG({ width, height });
  const numDiffPixels = pixelmatch(
    goldenPng.data,
    actualPng.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 },
  );

  // 差分超過時はデバッグ用ファイルを出力
  if (numDiffPixels > maxDiffPixels) {
    writeFileSync(resolve(GOLDEN_DIR, `${name}-actual.png`), actualBuffer);
    writeFileSync(resolve(GOLDEN_DIR, `${name}-diff.png`), PNG.sync.write(diff));
  }

  expect(numDiffPixels, `Visual difference too large for ${name}: ${numDiffPixels}px diff`).toBeLessThanOrEqual(maxDiffPixels);
}
