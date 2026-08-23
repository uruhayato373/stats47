/**
 * imagegen の単色背景PNGを、カード右側用の透過WebPへ決定的に変換する。
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
const CROP_LEFT_RATIO = 0.38;
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

async function processImage(id: HomeUseCaseImageId): Promise<void> {
  const source = resolve(PROJECT_ROOT, getHomeUseCaseImageSource(id));
  const output = resolve(PROJECT_ROOT, getHomeUseCaseImageOutput(id));
  const metadata = await sharp(source).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`画像寸法を取得できません: ${source}`);
  }

  const left = Math.round(metadata.width * CROP_LEFT_RATIO);
  const width = metadata.width - left;
  const { data, info } = await sharp(source)
    .extract({ left, top: 0, width, height: metadata.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const transparent = removeMagentaBackground(data);
  await mkdir(dirname(output), { recursive: true });
  await sharp(transparent, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize({ height: 720, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 92 })
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
