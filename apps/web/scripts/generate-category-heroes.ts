/**
 * カテゴリ page hero 画像を Gemini API で一括生成する (ローカル出力のみ・R2/本番非公開)。
 *
 *   # dry-run (API を叩かない。件数 / 最大費用 / キー有無を表示)
 *   npx tsx apps/web/scripts/generate-category-heroes.ts
 *   # 本番生成 (Gemini 呼び出し → docs/assets の PNG + public/images の webp)
 *   npx tsx apps/web/scripts/generate-category-heroes.ts --apply [--only population,tourism] [--force] [--budget-usd 1]
 *
 * - プロンプトは apps/web/scripts/data/category-hero-catalog.ts (SSOT) から決定的に生成 (文字なし)。
 * - economy は theme:local-economy の画像を共有するため既定で除外。
 * - API キーは .env.local の GEMINI_API_KEY を使用。値は絶対に表示・保存・コミットしない (有無だけ report)。
 * - R2 書き込み・外部公開・本番デプロイは一切しない (ローカルファイルのみ)。
 *
 * 正典: .claude/rules/ogp-image-standards.md §5.6 / カタログ: apps/web/scripts/data/category-hero-catalog.ts
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import dotenv from "dotenv";
import sharp from "sharp";

import {
  OGP_MODEL,
  OGP_PRICE_PER_IMAGE_USD,
} from "./data/blog-ogp-visual-catalog";
import {
  CATEGORY_HERO_SUBJECTS,
  buildCategoryHeroPrompt,
} from "./data/category-hero-catalog";
import { generateBackgroundImage } from "./lib/gemini-image-client";

dotenv.config({ path: ".env.local" });

const PROJECT_ROOT = resolve(__dirname, "../../..");
const ASSETS_DIR = resolve(PROJECT_ROOT, "docs/assets");
const PUBLIC_IMAGES_DIR = resolve(PROJECT_ROOT, "apps/web/public/images");

/** economy は local-economy 画像を共有するため生成対象外。 */
const EXCLUDED = new Set(["economy"]);

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");
const budgetUsd = Number(argValue("--budget-usd") ?? "1");
const only = argValue("--only")?.split(",").map((s) => s.trim()).filter(Boolean);

const targets = Object.keys(CATEGORY_HERO_SUBJECTS).filter(
  (k) => !EXCLUDED.has(k) && (!only || only.includes(k)),
);

const keyPresent = Boolean(process.env.GEMINI_API_KEY);
const maxCost = targets.length * OGP_PRICE_PER_IMAGE_USD;

console.log(`model: ${OGP_MODEL}`);
console.log(`GEMINI_API_KEY present: ${keyPresent ? "yes" : "no"}`);
console.log(`targets (${targets.length}): ${targets.join(", ")}`);
console.log(`max cost: $${maxCost.toFixed(3)} (${targets.length} × $${OGP_PRICE_PER_IMAGE_USD})`);
console.log(`budget cap: $${budgetUsd.toFixed(2)}`);
console.log(`output: docs/assets/category-<key>-hero.jpg + apps/web/public/images/category-<key>-hero.webp`);

if (!apply) {
  console.log("\n[dry-run] --apply を付けると生成します (API 課金あり)。");
  process.exit(0);
}

if (!keyPresent) {
  console.error("GEMINI_API_KEY がありません (.env.local)。中止します。");
  process.exit(1);
}

async function main() {
  mkdirSync(ASSETS_DIR, { recursive: true });
  mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });

  let spent = 0;
  const results: { key: string; status: string }[] = [];

  for (const key of targets) {
    const jpgPath = resolve(ASSETS_DIR, `category-${key}-hero.jpg`);
    const webpPath = resolve(PUBLIC_IMAGES_DIR, `category-${key}-hero.webp`);

    if (!force && existsSync(webpPath)) {
      results.push({ key, status: "skip (exists)" });
      console.log(`- ${key}: skip (webp exists)`);
      continue;
    }
    if (spent + OGP_PRICE_PER_IMAGE_USD > budgetUsd) {
      results.push({ key, status: "skip (budget)" });
      console.log(`- ${key}: skip (budget $${budgetUsd} reached)`);
      continue;
    }

    try {
      const { buffer } = await generateBackgroundImage({
        prompt: buildCategoryHeroPrompt(key),
        apiKey: process.env.GEMINI_API_KEY as string,
      });
      spent += OGP_PRICE_PER_IMAGE_USD;
      // 元画像アーカイブは JPEG q90 (Gemini の生 PNG は 1.2-1.9MB で repo hygiene の 1MB 上限超過のため)
      await sharp(buffer).jpeg({ quality: 90 }).toFile(jpgPath);
      const info = await sharp(buffer)
        .resize({ width: 1536, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(webpPath);
      results.push({ key, status: `ok ${info.width}x${info.height}` });
      console.log(`- ${key}: ok → ${webpPath} (${Math.round((info.size ?? 0) / 1024)} KB)`);
    } catch (e) {
      // 分類のみ (キー・本文は出さない)。
      const msg = e instanceof Error ? e.message : "unknown";
      results.push({ key, status: `FAIL ${msg}` });
      console.log(`- ${key}: FAIL ${msg}`);
    }
  }

  const ok = results.filter((r) => r.status.startsWith("ok")).length;
  console.log(`\ndone: ${ok}/${targets.length} generated, spent ~$${spent.toFixed(3)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
