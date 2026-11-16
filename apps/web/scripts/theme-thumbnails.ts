/**
 * テーマのサムネイルの依頼文の出力・元画像の加工・状況の確認 (経路の正本は
 * config/image-generation-routes.json の theme-thumbnail。カタログは data/theme-thumbnail-catalog.ts)。
 *
 *   npx tsx apps/web/scripts/theme-thumbnails.ts prompt --key healthcare   # Codex に渡す依頼文と保存先
 *   npx tsx apps/web/scripts/theme-thumbnails.ts ingest --key healthcare --from <Codex の PNG>  # → 元画像 JPEG
 *   npx tsx apps/web/scripts/theme-thumbnails.ts process --key healthcare  # 元画像 → 640×360 WebP
 *   npx tsx apps/web/scripts/theme-thumbnails.ts process --all             # 元PNGがあるテーマをすべて
 *   npx tsx apps/web/scripts/theme-thumbnails.ts status                    # 元画像・配信画像の有無
 *
 * 流れ: prompt の依頼文で Codex の built-in imagegen が 3:2 (1536×1024) を 1 枚描く → ingest で元画像
 * `assets/themes/thumbnails/<key>.jpg` にする → process が中央で 16:9 に切り出して配信画像にする → 目視。
 */

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import sharp from 'sharp';

import {
  THEME_THUMBNAIL_SUBJECTS,
  type ThemeThumbnailKey,
  buildThemeThumbnailPrompt,
  getThemeThumbnailOutput,
  getThemeThumbnailSource,
  isThemeThumbnailKey,
} from './data/theme-thumbnail-catalog';

const PROJECT_ROOT = resolve(process.cwd());
/** 配信画像の寸法 (ブログカード・利用意図カードと同じ 16:9) */
const OUTPUT_WIDTH = 640;
const OUTPUT_HEIGHT = 360;
/** 元画像の JPEG 品質 (1536×1024 で 1MB の repo 上限に収まり、再加工に耐える値) */
const SOURCE_JPEG_QUALITY = 88;

const ALL_KEYS = Object.keys(THEME_THUMBNAIL_SUBJECTS) as ThemeThumbnailKey[];

function parseKeys(): ThemeThumbnailKey[] {
  if (process.argv.includes('--all')) return ALL_KEYS;
  const index = process.argv.indexOf('--key');
  const key = index >= 0 ? process.argv[index + 1] : undefined;
  if (key && isThemeThumbnailKey(key)) return [key];
  throw new Error(`--all か --key <テーマのキー> を指定してください。キー: ${ALL_KEYS.join(', ')}`);
}

function printPrompts(keys: ThemeThumbnailKey[]): void {
  for (const key of keys) {
    console.log(`\n===== ${key} (${THEME_THUMBNAIL_SUBJECTS[key].name}) =====`);
    console.log(`save to: ${getThemeThumbnailSource(key)}  (3:2 / 1536x1024 PNG)`);
    console.log('---');
    console.log(buildThemeThumbnailPrompt(key));
  }
}

async function processImage(key: ThemeThumbnailKey): Promise<void> {
  const source = resolve(PROJECT_ROOT, getThemeThumbnailSource(key));
  const output = resolve(PROJECT_ROOT, getThemeThumbnailOutput(key));
  await mkdir(dirname(output), { recursive: true });
  // 構図の指示で主題を中央に寄せてあるので、中央で 16:9 に切り出す
  await sharp(source)
    .resize({ width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT, fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(output);
  console.log(`${key}: ${getThemeThumbnailSource(key)} -> ${getThemeThumbnailOutput(key)}`);
}

/** Codex の PNG (2〜3MB) を 1MB 未満の JPEG の元画像にする (寸法は変えない) */
async function ingestImage(key: ThemeThumbnailKey, from: string): Promise<void> {
  const source = resolve(PROJECT_ROOT, getThemeThumbnailSource(key));
  await mkdir(dirname(source), { recursive: true });
  await sharp(resolve(from)).jpeg({ quality: SOURCE_JPEG_QUALITY, mozjpeg: true }).toFile(source);
  console.log(`${key}: ${from} -> ${getThemeThumbnailSource(key)}`);
}

function parseFrom(): string {
  const index = process.argv.indexOf('--from');
  const from = index >= 0 ? process.argv[index + 1] : undefined;
  if (from && existsSync(from)) return from;
  throw new Error('--from <Codex が生成した PNG のパス> を指定してください');
}

async function processImages(keys: ThemeThumbnailKey[]): Promise<void> {
  const missing = keys.filter((key) => !existsSync(resolve(PROJECT_ROOT, getThemeThumbnailSource(key))));
  // 1 件指定で元画像が無いのは指定の誤りなので止める。--all は元画像のあるものだけを加工する
  if (keys.length === 1 && missing.length === 1) {
    throw new Error(`元画像がありません: ${getThemeThumbnailSource(keys[0])}`);
  }
  for (const key of keys) {
    if (missing.includes(key)) continue;
    await processImage(key);
  }
  if (missing.length > 0) console.log(`元画像の無いテーマ ${missing.length} 件は加工していません`);
}

function printStatus(): void {
  let sources = 0;
  let outputs = 0;
  for (const key of ALL_KEYS) {
    const hasSource = existsSync(resolve(PROJECT_ROOT, getThemeThumbnailSource(key)));
    const hasOutput = existsSync(resolve(PROJECT_ROOT, getThemeThumbnailOutput(key)));
    if (hasSource) sources += 1;
    if (hasOutput) outputs += 1;
    console.log(`${hasSource ? '元' : '－'} ${hasOutput ? '配' : '－'}  ${key}`);
  }
  console.log(`\n元画像 ${sources} / ${ALL_KEYS.length}、配信画像 ${outputs} / ${ALL_KEYS.length}`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === 'prompt') return printPrompts(parseKeys());
  if (command === 'ingest') {
    const [key] = parseKeys();
    if (process.argv.includes('--all')) throw new Error('ingest は --key で 1 件ずつ指定してください');
    return ingestImage(key, parseFrom());
  }
  if (command === 'process') return processImages(parseKeys());
  if (command === 'status') return printStatus();
  throw new Error('usage: prompt|process (--key <key> | --all) / ingest --key <key> --from <png> / status');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
