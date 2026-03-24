#!/usr/bin/env tsx
/**
 * ブログ用画像アセット (OGP & Thumbnails) 一括生成
 *
 * .local/r2/blog/ 配下の各記事ディレクトリにある ogp/ogp.json を読み込み、
 * 以下の 3 種類のアセットを生成する：
 * 1. OGP (ogp.png) - Editorial, LightMode, Watermark ON
 * 2. Thumbnail Light (thumbnail-light.webp) - Editorial, LightMode, Watermark OFF
 * 3. Thumbnail Dark (thumbnail-dark.webp) - Editorial, DarkMode, Watermark OFF
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

const COMP_OGP = "BlogOgp-Editorial";
const COMP_THUMB = "BlogThumbnail";

// ---------------------------------------------------------
// データ読み込み
// ---------------------------------------------------------

interface BlogAssetTarget {
  slug: string;
  title: string;
  subtitle?: string;
  ogpTitle?: string;
  ogpSubtitle?: string;
}

async function loadTargets(): Promise<BlogAssetTarget[]> {
  const dirs = await fs.readdir(BLOG_ROOT);
  const targets: BlogAssetTarget[] = [];

  for (const slug of dirs) {
    const dirPath = path.join(BLOG_ROOT, slug);
    const stat = await fs.stat(dirPath).catch(() => null);
    if (!stat || !stat.isDirectory()) continue;

    const ogpJsonPath = path.join(dirPath, "ogp", "ogp.json");
    try {
      const raw = await fs.readFile(ogpJsonPath, "utf8");
      const json = JSON.parse(raw);
      targets.push({
        slug,
        title: json.title,
        subtitle: json.subtitle,
        ogpTitle: json.ogpTitle,
        ogpSubtitle: json.ogpSubtitle,
      });
    } catch {
      // ogp.json なしはスキップ
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
        alias: { ...(config.resolve?.alias ?? {}), "@": srcPath },
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
  console.log("Blog Assets Unified Generator (OGP & WebP Thumbnails)");
  console.log("====================================================\n");

  const targets = await loadTargets();
  console.log(`Found ${targets.length} articles\n`);

  if (targets.length === 0) {
    console.log("No targets found.");
    process.exit(0);
  }

  const bundleUrl = await getBundleUrl();
  const browser = await openBrowser("chrome");
  console.log("Browser opened\n");

  let successCount = 0;
  let failCount = 0;

  try {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      console.log(`[${i + 1}/${targets.length}] 🎨 ${target.slug}`);

      const outputDir = path.join(BLOG_ROOT, target.slug);
      
      const commonProps = {
        title: target.title,
        subtitle: target.subtitle,
        ogpTitle: target.ogpTitle,
        ogpSubtitle: target.ogpSubtitle,
        showGuides: false,
      };

      // 1. OGP (PNG, Light, Watermark ON)
      const ogpProps = { ...commonProps, theme: "light" as const, hideWatermark: false };
      const ogpPath = path.join(outputDir, "ogp.png");

      // 2. Thumbnail Light (WebP, Light, Watermark OFF)
      const thumbLightProps = { ...commonProps, theme: "light" as const, hideWatermark: true };
      const thumbLightPath = path.join(outputDir, "thumbnail-light.webp");

      // 3. Thumbnail Dark (WebP, Dark, Watermark OFF)
      const thumbDarkProps = { ...commonProps, theme: "dark" as const, hideWatermark: true };
      const thumbDarkPath = path.join(outputDir, "thumbnail-dark.webp");

      try {
        // Render OGP
        const compOgp = await selectComposition({ serveUrl: bundleUrl, id: COMP_OGP, inputProps: ogpProps, puppeteerInstance: browser });
        await renderStill({ serveUrl: bundleUrl, composition: compOgp, output: ogpPath, inputProps: ogpProps, imageFormat: "png", puppeteerInstance: browser });
        console.log(`   ✅ ogp.png`);

        // Render Thumb Light
        const compThumbL = await selectComposition({ serveUrl: bundleUrl, id: COMP_THUMB, inputProps: thumbLightProps, puppeteerInstance: browser });
        await renderStill({ serveUrl: bundleUrl, composition: compThumbL, output: thumbLightPath, inputProps: thumbLightProps, imageFormat: "webp", puppeteerInstance: browser });
        console.log(`   ✅ thumbnail-light.webp`);

        // Render Thumb Dark
        const compThumbD = await selectComposition({ serveUrl: bundleUrl, id: COMP_THUMB, inputProps: thumbDarkProps, puppeteerInstance: browser });
        await renderStill({ serveUrl: bundleUrl, composition: compThumbD, output: thumbDarkPath, inputProps: thumbDarkProps, imageFormat: "webp", puppeteerInstance: browser });
        console.log(`   ✅ thumbnail-dark.webp`);

        successCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`   ❌ Failed: ${msg}`);
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
