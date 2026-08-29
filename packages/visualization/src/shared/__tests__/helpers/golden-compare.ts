import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import sharp from "sharp";
import { expect } from "vitest";
import { svgToPng } from "./svg-to-png";

const GOLDEN_DIR = resolve(__dirname, "../__golden__");
const ARTIFACT_DIR = resolve(process.env.RENDER_ARTIFACT_DIR ?? "/tmp/stats47-render-artifacts");
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

  // Sharp/librsvg は Linux で SVG 内の WOFF2 を解決せず日本語が欠落する。
  // SVG は pinned TTF を直接渡せる resvg で描画し、OS font fallback を完全に無効化する。
  // PNG 入力だけは従来どおり Sharp で正規化する。
  const source = actualBuffer.toString("utf8");
  const actualPngBuffer = source.startsWith("<svg")
    ? await svgToPng(source, width, height)
    : await sharp(actualBuffer).resize(width, height).png().toBuffer();
  
  // ゴールデン作成・更新モード
  if (UPDATE_GOLDEN || !existsSync(goldenPath)) {
    writeFileSync(goldenPath, actualPngBuffer);
    console.log(`Golden image updated: ${goldenPath}`);
    return;
  }

  // 比較
  const goldenPng = PNG.sync.read(readFileSync(goldenPath));
  const actualPng = PNG.sync.read(actualPngBuffer);
  
  if (!existsSync(ARTIFACT_DIR)) mkdirSync(ARTIFACT_DIR, { recursive: true });
  const actualPath = resolve(ARTIFACT_DIR, `${name}-actual.png`);
  const diffPath = resolve(ARTIFACT_DIR, `${name}-diff.png`);

  if (goldenPng.width !== width || goldenPng.height !== height) {
     // サイズが違う場合は強制的に失敗させデバッグ用ファイルを出力
     writeFileSync(actualPath, actualPngBuffer);
     throw new Error(`Dimension mismatch for ${name}: expected ${goldenPng.width}x${goldenPng.height}, got ${width}x${height}. Actual image: ${actualPath}`);
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
    writeFileSync(actualPath, actualPngBuffer);
    writeFileSync(diffPath, PNG.sync.write(diff));
  }

  expect(
    numDiffPixels,
    `Visual difference too large for ${name}: ${numDiffPixels}px diff. Actual: ${actualPath}, diff: ${diffPath}`,
  ).toBeLessThanOrEqual(maxDiffPixels);
}
