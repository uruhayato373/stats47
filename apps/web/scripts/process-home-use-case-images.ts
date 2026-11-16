/**
 * imagegen の単色背景PNGを、カード上部の 16:9 画像枠 (ブログカードと同じ枠) 用のWebPへ決定的に変換する。
 * 背景を抜いたあと絵の部分だけを切り出し、上下左右に同じ割合の余白を付けて 16:9 の中央に置き、明るい地に焼き込む
 * (2026-11-16。元画像は絵が右下に寄っていて、そのまま枠に入れると余白が大きすぎた)。
 *
 *   npx tsx apps/web/scripts/process-home-use-case-images.ts --all
 *   npx tsx apps/web/scripts/process-home-use-case-images.ts --only migration
 */

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import sharp from 'sharp';

import {
  HOME_USE_CASE_IMAGE_SUBJECTS,
  type HomeUseCaseImageId,
  getHomeUseCaseImageOutput,
  getHomeUseCaseImageSource,
} from './data/home-use-case-image-catalog';

const PROJECT_ROOT = resolve(process.cwd());
/** 出力の寸法 (ブログカードの枠と同じ 16:9) */
const OUTPUT_WIDTH = 640;
const OUTPUT_HEIGHT = 360;
/** 絵の周りに残す余白 (出力の高さに対する割合。上下左右で同じ px) */
const MARGIN_RATIO = 0.08;
/**
 * 地の色。ライト表示の枠の地 (`--muted` = rgb(245,245,245)) と同じ色を画像に焼き込む。ブログの写真と同じく
 * ダーク表示でも暗くしない (暗い地では紺色の線が沈んで読めなかった。2026-11-16 に実画面で確認)
 */
const BACKGROUND = { r: 245, g: 245, b: 245, alpha: 1 };
const TRANSPARENT_DISTANCE = 20;
const OPAQUE_DISTANCE = 100;

function parseIds(): HomeUseCaseImageId[] {
  const ids = Object.keys(HOME_USE_CASE_IMAGE_SUBJECTS) as HomeUseCaseImageId[];
  if (process.argv.includes('--all')) return ids;

  const onlyIndex = process.argv.indexOf('--only');
  const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined;
  if (only && ids.includes(only as HomeUseCaseImageId)) {
    return [only as HomeUseCaseImageId];
  }

  throw new Error(`usage: --all | --only <${ids.join('|')}>`);
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function removeMagentaBackground(data: Buffer): Buffer {
  const output = Buffer.from(data);

  for (let index = 0; index < output.length; index += 4) {
    const red = output[index] ?? 0;
    const green = output[index + 1] ?? 0;
    const blue = output[index + 2] ?? 0;
    const distance = Math.max(255 - red, green, 255 - blue);
    const ratio =
      (distance - TRANSPARENT_DISTANCE) /
      (OPAQUE_DISTANCE - TRANSPARENT_DISTANCE);
    const alpha = Math.round(255 * smoothstep(ratio));

    output[index + 3] = Math.min(output[index + 3] ?? 255, alpha);

    if (alpha < 252) {
      const nonKeyAnchor = green;
      output[index] = Math.min(red, nonKeyAnchor);
      output[index + 2] = Math.min(blue, nonKeyAnchor);
    }
  }

  return output;
}

/** 絵の画素とみなす不透明度の下限 (0-255)。背景を抜いた縁の薄いノイズを範囲に入れない */
const CONTENT_ALPHA = 128;

function findContentBox(
  data: Buffer,
  width: number,
  height: number
): { left: number; top: number; width: number; height: number } {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) <= CONTENT_ALPHA) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < 0) throw new Error('絵の画素が見つかりません (背景の透過に失敗)');
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function processImage(id: HomeUseCaseImageId): Promise<void> {
  const source = resolve(PROJECT_ROOT, getHomeUseCaseImageSource(id));
  const output = resolve(PROJECT_ROOT, getHomeUseCaseImageOutput(id));
  const metadata = await sharp(source).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`画像寸法を取得できません: ${source}`);
  }

  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const transparent = removeMagentaBackground(data);
  // 透過になった周りを落とし、絵の部分だけにする。sharp の trim は背景を抜いたあとの薄いノイズまで絵に数えるので、
  // 不透明度が CONTENT_ALPHA を超える画素の範囲を自分で測る
  const box = findContentBox(transparent, info.width, info.height);
  const trimmed = await sharp(transparent, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(box)
    .png()
    .toBuffer();

  const margin = Math.round(OUTPUT_HEIGHT * MARGIN_RATIO);
  const fitted = await sharp(trimmed)
    .resize({
      width: OUTPUT_WIDTH - margin * 2,
      height: OUTPUT_HEIGHT - margin * 2,
      fit: 'inside',
    })
    .toBuffer({ resolveWithObject: true });

  const padX = OUTPUT_WIDTH - fitted.info.width;
  const padY = OUTPUT_HEIGHT - fitted.info.height;
  await mkdir(dirname(output), { recursive: true });
  // sharp は 1 つのパイプラインの中で flatten を extend より先に実行するので、余白を足してから別の段で地を焼き込む
  const placed = await sharp(fitted.data)
    .extend({
      left: Math.floor(padX / 2),
      right: Math.ceil(padX / 2),
      top: Math.floor(padY / 2),
      bottom: Math.ceil(padY / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp(placed)
    .flatten({ background: BACKGROUND })
    .webp({ quality: 82 })
    .toFile(output);

  console.log(`${id}: ${getHomeUseCaseImageSource(id)} -> ${getHomeUseCaseImageOutput(id)}`);
}

async function main(): Promise<void> {
  for (const id of parseIds()) {
    await processImage(id);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
