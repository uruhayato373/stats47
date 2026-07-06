#!/usr/bin/env tsx
/**
 * ブログ記事サムネイル・OGP PNG 一括生成 (Satori + sharp) — ローカル FS (.local/r2) 版
 *
 * ⚠️ 本スクリプトは .local/r2 (ローカル FS) を読み書きする旧経路。
 *    cloud R2 へ直接 push したい場合は
 *    `generate-blog-thumbnails-cloud.ts` を使う (完全DBレスの正経路)。
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

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildElement,
  deriveOgpFromFrontmatter,
  loadFonts,
  parseFrontmatter,
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
  // 既定は .local/r2 (CI の publish-blog では通常ディレクトリ)。テスト/別経路用に BLOG_DIR で上書き可。
  const blogDir = process.env.BLOG_DIR ?? join(projectRoot, ".local/r2/app/blog");

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

    // ogp.json があればそれを使う。無ければ article.md の frontmatter から導出
    // (公開フローで ogp.json 未作成の記事も thumbnail を生成できるようにする)。
    let ogpData: OgpData | null = null;
    if (existsSync(ogpJson)) {
      const { title, subtitle } = JSON.parse(readFileSync(ogpJson, "utf-8")) as OgpData;
      ogpData = { title, subtitle: subtitle ?? null };
    } else {
      const articlePath = join(dir, "article.md");
      if (existsSync(articlePath)) {
        ogpData = deriveOgpFromFrontmatter(
          parseFrontmatter(readFileSync(articlePath, "utf-8")),
        );
      }
    }
    if (!ogpData) {
      skipped++;
      continue;
    }

    if (!force && existsSync(lightOut) && existsSync(darkOut) && existsSync(ogpPng)) {
      skipped++;
      continue;
    }

    // 導出した場合は ogp.json も書き出して push 対象に含める
    if (!existsSync(ogpJson)) {
      mkdirSync(ogpDir, { recursive: true });
      writeFileSync(ogpJson, JSON.stringify(ogpData, null, 2) + "\n", "utf-8");
    }

    const data: OgpData = {
      title: ogpData.title,
      subtitle: ogpData.subtitle ?? null,
      date: "",
      category: "BLOG",
    };

    process.stdout.write(`  ${slug} ... `);

    await renderToWebP(buildElement(data, false, { background: true }), fonts, lightOut);
    await renderToWebP(buildElement(data, true, { background: true }), fonts, darkOut);
    mkdirSync(ogpDir, { recursive: true });
    await renderToPng(buildElement(data, false, { background: true }), fonts, ogpPng);

    console.log("ok");
    generated++;
  }

  console.log(`\n完了: ${generated} 件生成、${skipped} 件スキップ`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
