#!/usr/bin/env tsx
/**
 * ブログ用軽量サムネイル (WebP) 一括生成
 *
 * .local/r2/blog/ 配下の各記事ディレクトリにある ogp/ogp.json を読み込み、
 * BlogThumbnail コンポジションで軽量な WebP 画像を一括生成する。
 * ウォーターマークなし。
 *
 * 出力先: .local/r2/blog/{slug}/thumbnail.webp
 */

import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// 設定
// ---------------------------------------------------------

const MONOREPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const BLOG_ROOT = path.join(MONOREPO_ROOT, ".local", "r2", "blog");
const COMPOSITION_ID = "BlogThumbnail";

// ---------------------------------------------------------
// ブログ OGP データ読み込み
// ---------------------------------------------------------

interface BlogThumbnailTarget {
  slug: string;
  title: string;
  subtitle?: string;
}

async function loadBlogThumbnailTargets(): Promise<BlogThumbnailTarget[]> {
  const dirs = await fs.readdir(BLOG_ROOT);
  const targets: BlogThumbnailTarget[] = [];

  for (const slug of dirs) {
    const dirPath = path.join(BLOG_ROOT, slug);
    const stat = await fs.stat(dirPath).catch(() => null);
    if (!stat || !stat.isDirectory()) continue;

    const ogpJsonPath = path.join(dirPath, "ogp", "ogp.json");
    try {
      const raw = await fs.readFile(ogpJsonPath, "utf8");
      const json = JSON.parse(raw) as { title: string; subtitle?: string };
      targets.push({
        slug,
        title: json.title,
        subtitle: json.subtitle,
      });
    } catch {
      // ogp.json がない場合はスキップ
    }
  }

  return targets;
}

// ---------------------------------------------------------
// Remotion バンドル
// ---------------------------------------------------------

let cachedBundleUrl: string | null = null;

async function getBundleUrl(): Promise<string> {
  if (cachedBundleUrl) return cachedBundleUrl;

  console.log("Bundling Remotion project...");
  const projectRoot = path.resolve(__dirname, "..", "..");
  const srcPath = path.join(projectRoot, "src");
  cachedBundleUrl = await bundle({
    entryPoint: path.join(projectRoot, "src", "index.ts"),
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          "@": srcPath,
        },
      },
    }),
  });
  console.log("Bundle completed\n");
  return cachedBundleUrl;
}

// ---------------------------------------------------------
// メイン
// ---------------------------------------------------------

async function main() {
  console.log("BlogThumbnail Batch Generator (WebP)");
  console.log("====================================\n");

  console.log("Loading targets...");
  const targets = await loadBlogThumbnailTargets();
  console.log(`Found ${targets.length} articles with ogp.json\n`);

  if (targets.length === 0) {
    console.log("No targets found.");
    process.exit(0);
  }

  const bundleUrl = await getBundleUrl();

  let successCount = 0;
  let failCount = 0;
  
  // NOTE: macOS 環境などを想定し、デフォルトの実行パスに依存するように（あるいはパス指定を削除）
  const browser = await openBrowser("chrome"); 
  console.log("Browser opened\n");

  try {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      console.log(
        `[${i + 1}/${targets.length}] ${target.slug}`
      );

      const outputDir = path.join(BLOG_ROOT, target.slug);
      const inputProps = {
        theme: "light" as const,
        title: target.title,
        subtitle: target.subtitle,
        hideWatermark: true,
        showGuides: false,
      };
      const outputPath = path.join(outputDir, "thumbnail.webp");

      try {
        const composition = await selectComposition({
          serveUrl: bundleUrl,
          id: COMPOSITION_ID,
          inputProps,
          puppeteerInstance: browser,
        });

        await renderStill({
          serveUrl: bundleUrl,
          composition,
          output: outputPath,
          inputProps,
          imageFormat: "webp", // WebP 指定
          puppeteerInstance: browser,
        });

        console.log(`  Done: thumbnail.webp`);
        successCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  Failed: ${msg}`);
        failCount++;
      }
    }
  } finally {
    await browser.close({ silent: true });
  }

  console.log("\n\nSummary");
  console.log("=======");
  console.log(`Articles: ${targets.length}`);
  console.log(`Success:  ${successCount}`);
  console.log(`Failed:   ${failCount}`);
  console.log("\nBatch rendering completed!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
