#!/usr/bin/env tsx
/**
 * ブログ OGP 一括生成
 *
 * .local/r2/blog/ 配下の各記事ディレクトリにある ogp/ogp.json を読み込み、
 * BlogOgp コンポジションで OGP 画像を一括生成する。
 * ライトテーマのみ出力。
 *
 * 出力先: .local/r2/blog/{slug}/ogp/ogp.png
 *
 * 実行: npm run pipeline:blog-ogp --workspace remotion
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
const COMPOSITION_ID = "BlogOgp";

// ---------------------------------------------------------
// ブログ OGP データ読み込み
// ---------------------------------------------------------

interface BlogOgpTarget {
  slug: string;
  title: string;
  subtitle?: string;
}

async function loadBlogOgpTargets(): Promise<BlogOgpTarget[]> {
  const dirs = await fs.readdir(BLOG_ROOT);
  const targets: BlogOgpTarget[] = [];

  for (const slug of dirs) {
    const dirPath = path.join(BLOG_ROOT, slug);
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) continue;

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
      console.log(`  Skip: ${slug} (ogp/ogp.json not found)`);
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
  console.log("BlogOgp Batch Generator");
  console.log("=======================\n");

  console.log("Loading blog OGP targets...");
  const targets = await loadBlogOgpTargets();
  console.log(`Found ${targets.length} articles with ogp.json\n`);

  if (targets.length === 0) {
    console.log("No targets found.");
    process.exit(1);
  }

  const bundleUrl = await getBundleUrl();

  let successCount = 0;
  let failCount = 0;
  const browserExecutable = process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await openBrowser("chrome", {
    browserExecutable,
  });
  console.log("Chrome opened\n");

  try {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      console.log(
        `[${i + 1}/${targets.length}] ${target.slug}`
      );

      const outputDir = path.join(BLOG_ROOT, target.slug, "ogp");
      await fs.mkdir(outputDir, { recursive: true });

      const inputProps = {
        theme: "light" as const,
        title: target.title,
        subtitle: target.subtitle,
        showGuides: false,
      };
      const outputPath = path.join(outputDir, "ogp.png");

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
          imageFormat: "png",
          puppeteerInstance: browser,
        });

        console.log(`  Done: ogp.png`);
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
