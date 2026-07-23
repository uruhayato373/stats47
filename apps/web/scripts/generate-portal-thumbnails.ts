/**
 * ポータル注目ランキングカードの AI 背景画像を事前生成する (§12.7-12.11)。
 *
 * - AI は背景/質感/象徴モチーフ**のみ**生成する (文字/数値/地図/県名/ロゴ/UI は含めない)。
 *   タイトル・値・県名・年度・出典・地図は既存の決定的 renderer が合成する (このスクリプト外)。
 * - 生成物は **ローカル `.local/portal-thumbnails/` のみ** に書く (R2/commit しない)。配信は
 *   実験判定 + deploy 解禁後に別途 (§11.2 / §22)。
 * - 失敗/未承認は決定的 visual (tileMapSvg → top3 → number) へ fallback する (画面/build は成立)。
 *
 * 使い方 (repo root から):
 *   GEMINI_API_KEY=... npx tsx apps/web/scripts/generate-portal-thumbnails.ts --limit 1
 *   npx tsx apps/web/scripts/generate-portal-thumbnails.ts --keys annual-clear-days,agricultural-output
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PORTAL_THUMBNAIL_ASPECT,
  PORTAL_THUMBNAIL_CATALOG,
  PORTAL_THUMBNAIL_MODEL,
  PORTAL_THUMBNAIL_PIXELS,
  PORTAL_THUMBNAIL_PROMPT_VERSION,
  PORTAL_THUMBNAIL_USE_CASE,
  buildPortalThumbnailPrompt,
  type PortalThumbnailAssetMeta,
  type PortalThumbnailEntry,
} from "./data/portal-thumbnail-catalog";
import { generateBackgroundImage } from "./lib/gemini-image-client";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_DIR = resolve(PROJECT_ROOT, ".local/portal-thumbnails");

function parseArgs(argv: string[]): { keys?: string[]; limit: number } {
  let keys: string[] | undefined;
  let limit = 1;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--keys" && argv[i + 1]) keys = argv[++i].split(",").map((s) => s.trim());
    else if (argv[i] === "--limit" && argv[i + 1]) limit = Math.max(1, Number(argv[++i]) || 1);
  }
  return { keys, limit };
}

function extFor(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "img";
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY 未設定 → 生成不可。決定的 visual へ fallback (画面/build は成立)。");
    process.exit(2);
  }
  const { keys, limit } = parseArgs(process.argv.slice(2));
  const selected: PortalThumbnailEntry[] = keys
    ? PORTAL_THUMBNAIL_CATALOG.filter((e) => keys.includes(e.rankingKey))
    : PORTAL_THUMBNAIL_CATALOG.slice(0, limit);

  if (selected.length === 0) {
    console.error("対象なし (--keys / --limit を確認)");
    process.exit(1);
  }
  const generatedAt = new Date().toISOString();
  let ok = 0;
  for (const entry of selected) {
    const prompt = buildPortalThumbnailPrompt(entry);
    const dir = resolve(OUT_DIR, entry.rankingKey);
    mkdirSync(dir, { recursive: true });
    try {
      const res = await generateBackgroundImage({ prompt, apiKey, model: PORTAL_THUMBNAIL_MODEL });
      const ext = extFor(res.mimeType);
      const imgPath = resolve(dir, `background.${ext}`);
      writeFileSync(imgPath, res.buffer);
      const meta: PortalThumbnailAssetMeta = {
        assetId: `portal-thumb-${entry.rankingKey}`,
        rankingKey: entry.rankingKey,
        promptTemplateId: PORTAL_THUMBNAIL_USE_CASE,
        promptVersion: PORTAL_THUMBNAIL_PROMPT_VERSION,
        prompt,
        generator: "gemini-image-client",
        model: PORTAL_THUMBNAIL_MODEL,
        generatedAt,
        aspectRatio: PORTAL_THUMBNAIL_ASPECT,
        pixelWidth: PORTAL_THUMBNAIL_PIXELS.width,
        pixelHeight: PORTAL_THUMBNAIL_PIXELS.height,
        reviewStatus: "pending",
        rights: "AI-generated background (Gemini). Review required before use.",
        sourceAssetKey: `.local/portal-thumbnails/${entry.rankingKey}/background.${ext}`,
        compositeRendererVersion: "unwired-v1",
      };
      writeFileSync(resolve(dir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
      ok++;
      console.log(`✓ ${entry.rankingKey}: ${imgPath} (${res.buffer.length} bytes, ${res.attempts} attempt)`);
    } catch (e) {
      console.error(`✗ ${entry.rankingKey}: 生成失敗 (${e instanceof Error ? e.message : String(e)}) → 決定的 visual へ fallback`);
    }
  }
  console.log(`\n生成 ${ok}/${selected.length}。配信は R2/commit せず local のみ (§11.2/§22)。`);
  process.exit(ok > 0 ? 0 : 1);
}

void main();
