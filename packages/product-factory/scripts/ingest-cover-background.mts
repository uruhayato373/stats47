#!/usr/bin/env -S npx tsx
/**
 * Codex built-in imagegen で生成した「文字なし」の Kindle 表紙背景を正規化して取り込む。
 *
 * 画像生成は意味判断、ここでは bookId・寸法・形式だけを決定的に保証する。
 * タイトル・著者は `src/channels/kindle/cover.ts` が実テキストとして重ねる。
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/ingest-cover-background.mts \
 *     --book K-S1-01 --input /absolute/path/to/generated.png
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { BOOK_BY_ID } from "../src/channels/kindle/book-catalog";

const HERE = dirname(fileURLToPath(import.meta.url));
const PF_ROOT = resolve(HERE, "..");
const W = 1600;
const H = 2560;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const bookId = arg("book");
  const input = arg("input");
  if (!bookId || !input) throw new Error("--book と --input は必須");
  if (!BOOK_BY_ID.has(bookId)) throw new Error(`未知の bookId: ${bookId}`);

  const inputPath = resolve(input);
  if (!existsSync(inputPath)) throw new Error(`入力画像が無い: ${inputPath}`);

  const outputPath = resolve(
    PF_ROOT,
    "src/channels/kindle/assets/cover-backgrounds",
    `${bookId}.jpg`,
  );
  mkdirSync(dirname(outputPath), { recursive: true });

  await sharp(inputPath)
    .resize(W, H, { fit: "cover", position: "centre" })
    .flatten({ background: "#071426" })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  if (meta.format !== "jpeg" || meta.width !== W || meta.height !== H) {
    throw new Error(
      `正規化後の形式が不正: ${meta.format ?? "unknown"} ${meta.width ?? 0}x${meta.height ?? 0}`,
    );
  }
  console.log(`✅ ${bookId}: ${outputPath} (${meta.width}x${meta.height} JPEG)`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
