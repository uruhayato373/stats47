#!/usr/bin/env tsx
/**
 * ブログ記事サムネイル・OGP PNG 一括生成 (Satori + sharp) — ローカル FS (.local/r2) 版
 *
 * ⚠️ 本スクリプトは .local/r2 (SSD symlink) を読み書きする旧経路。
 *    SSD 非依存で cloud R2 へ直接 push したい場合は
 *    `generate-blog-thumbnails-cloud.ts` を使う (完全DBレス / SSD非依存の正経路)。
 *
 * Usage:
 *   npx tsx apps/web/scripts/generate-blog-thumbnails.ts
 *   npx tsx apps/web/scripts/generate-blog-thumbnails.ts --force
 *   npx tsx apps/web/scripts/generate-blog-thumbnails.ts --slug noodle-consumption-prefecture-character
 *
 * 出力: .local/r2/app/blog/{slug}/thumbnail-light.webp
 *       .local/r2/app/blog/{slug}/thumbnail-dark.webp
 *       .local/r2/app/blog/{slug}/ogp/ogp.png
 */

import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildElement,
  loadFonts,
  renderToPng,
  renderToWebP,
  type OgpData,
} from "./lib/blog-thumbnail-render";

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const slugIdx = args.indexOf("--slug");
  const slugFilter = slugIdx !== -1 ? args[slugIdx + 1] : null;

  const projectRoot = join(import.meta.dirname ?? __dirname, "../../..");
  const blogDir = join(projectRoot, ".local/r2/app/blog");

  console.log("フォントを読み込み中...");
  const fonts = loadFonts(projectRoot);
  console.log("フォント読み込み完了");

  const slugs = readdirSync(blogDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => !slugFilter || slug === slugFilter);

  let generated = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const dir = join(blogDir, slug);
    const ogpJson = join(dir, "ogp/ogp.json");
    const lightOut = join(dir, "thumbnail-light.webp");
    const darkOut = join(dir, "thumbnail-dark.webp");
    const ogpDir = join(dir, "ogp");
    const ogpPng = join(ogpDir, "ogp.png");

    if (!existsSync(ogpJson)) {
      skipped++;
      continue;
    }

    if (!force && existsSync(lightOut) && existsSync(darkOut) && existsSync(ogpPng)) {
      skipped++;
      continue;
    }

    const { title, subtitle } = JSON.parse(
      readFileSync(ogpJson, "utf-8"),
    ) as OgpData;
    const data: OgpData = { title, subtitle: subtitle ?? null, date: "", category: "BLOG" };

    process.stdout.write(`  ${slug} ... `);

    await renderToWebP(buildElement(data, false), fonts, lightOut);
    await renderToWebP(buildElement(data, true), fonts, darkOut);
    mkdirSync(ogpDir, { recursive: true });
    await renderToPng(buildElement(data, false), fonts, ogpPng);

    console.log("ok");
    generated++;
  }

  console.log(`\n完了: ${generated} 件生成、${skipped} 件スキップ`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
