/**
 * homepage 末尾「このサイトの主要ページ」セクション用プレビュー画像/動画の撮影スクリプト。
 *
 * 仕様: docs/01_技術設計/12_homepage-previews.md
 *
 * 使い方:
 *   npx tsx apps/web/scripts/capture-home-previews.ts \
 *     --base-url https://stats47.jp \
 *     --output /tmp/home-previews
 *
 *   # ローカル開発サーバ用
 *   npx tsx apps/web/scripts/capture-home-previews.ts \
 *     --base-url http://localhost:3000 \
 *     --output /tmp/home-previews-local
 *
 * 出力:
 *   {output}/ranking.avif         (800x450 AVIF, quality 60)
 *   {output}/ranking.webm         (800x450 WebM, ~3 秒)
 *   {output}/themes.avif
 *   {output}/themes.webm
 *   {output}/areas.avif
 *   {output}/blog.avif
 *   {output}/survey.avif
 *   {output}/search.avif
 *
 * 撮影後の R2 push は別途 wrangler r2 object put か diff-push-r2.ts で行う。
 */

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { chromium, type Page } from "playwright";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

interface CaptureTarget {
  key: string;
  pathOnSite: string;
  /** 動画録画するか (true の場合 .webm も出力) */
  recordVideo: boolean;
  /** 動画録画中の操作 (Playwright Page を受け取る) */
  videoAction?: (page: Page) => Promise<void>;
  /** ナビゲーション待機戦略。networkidle が厳しすぎるページは "domcontentloaded" にする */
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
}

const TARGETS: CaptureTarget[] = [
  {
    key: "ranking",
    pathOnSite: "/ranking",
    recordVideo: true,
    videoAction: async (page) => {
      await page.waitForTimeout(1500);
      // ランキング表をゆっくりスクロール
      await page.evaluate(async () => {
        const start = window.scrollY;
        const target = start + 600;
        const duration = 1500;
        const startTime = performance.now();
        return new Promise<void>((resolve) => {
          const step = (t: number) => {
            const elapsed = t - startTime;
            const progress = Math.min(elapsed / duration, 1);
            window.scrollTo(0, start + (target - start) * progress);
            if (progress < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
      });
    },
  },
  {
    key: "themes",
    pathOnSite: "/themes",
    recordVideo: true,
    videoAction: async (page) => {
      await page.waitForTimeout(1500);
      // テーマカードのホバー (動きを出すため)
      const card = page.locator("a[href^='/themes/']").first();
      if (await card.count()) {
        await card.hover();
      }
      await page.waitForTimeout(1500);
    },
  },
  { key: "areas", pathOnSite: "/areas", recordVideo: false },
  { key: "blog", pathOnSite: "/blog", recordVideo: false },
  // /survey は networkidle 到達に >4 分かかるため domcontentloaded に切替 (2026-05-27 検証)
  { key: "survey", pathOnSite: "/survey", recordVideo: false, waitUntil: "domcontentloaded" },
  { key: "search", pathOnSite: "/search?q=人口", recordVideo: false },
];

const VIEWPORT = { width: 1280, height: 720 } as const;
const OUTPUT_DIMS = { width: 800, height: 450 } as const;

function parseArgs() {
  const args = process.argv.slice(2);
  const out: { baseUrl: string; output: string } = {
    baseUrl: "https://stats47.jp",
    output: path.join(os.tmpdir(), "home-previews"),
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--base-url") out.baseUrl = args[++i] ?? out.baseUrl;
    else if (arg === "--output") out.output = args[++i] ?? out.output;
  }
  return out;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function captureScreenshot(
  baseUrl: string,
  target: CaptureTarget,
  outputDir: string,
) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const url = `${baseUrl}${target.pathOnSite}`;
    const waitUntil = target.waitUntil ?? "networkidle";
    console.log(`[screenshot] ${url} (waitUntil=${waitUntil})`);
    await page.goto(url, { waitUntil, timeout: 60000 });
    // 画像/フォント描画落ち着き待ち (domcontentloaded はネットワーク完了を待たないため長めに)
    await page.waitForTimeout(waitUntil === "networkidle" ? 1000 : 4000);
    const pngBuffer = await page.screenshot({ type: "png", fullPage: false });
    const outPath = path.join(outputDir, `${target.key}.avif`);
    await sharp(pngBuffer)
      .resize(OUTPUT_DIMS.width, OUTPUT_DIMS.height, { fit: "cover", position: "top" })
      .avif({ quality: 60, effort: 6 })
      .toFile(outPath);
    const stats = await fs.stat(outPath);
    console.log(`  → ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    await context.close();
  } finally {
    await browser.close();
  }
}

async function captureVideo(
  baseUrl: string,
  target: CaptureTarget,
  outputDir: string,
) {
  if (!target.recordVideo) return;
  const videoDir = await fs.mkdtemp(path.join(os.tmpdir(), "pw-video-"));
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      recordVideo: {
        dir: videoDir,
        size: VIEWPORT,
      },
    });
    const page = await context.newPage();
    const url = `${baseUrl}${target.pathOnSite}`;
    const waitUntil = target.waitUntil ?? "networkidle";
    console.log(`[video] ${url} (waitUntil=${waitUntil})`);
    await page.goto(url, { waitUntil, timeout: 60000 });
    if (target.videoAction) await target.videoAction(page);
    else await page.waitForTimeout(3000);
    await context.close();

    // 出力された webm を取り出して ffmpeg で縮小・3秒に切る
    const files = await fs.readdir(videoDir);
    const webmRaw = files.find((f) => f.endsWith(".webm"));
    if (!webmRaw) throw new Error("Playwright did not produce a webm");
    const rawPath = path.join(videoDir, webmRaw);
    const outPath = path.join(outputDir, `${target.key}.webm`);

    try {
      await execFileAsync("ffmpeg", [
        "-y",
        "-i", rawPath,
        "-t", "3",
        "-vf", `scale=${OUTPUT_DIMS.width}:${OUTPUT_DIMS.height}`,
        "-c:v", "libvpx-vp9",
        "-b:v", "300k",
        "-crf", "35",
        "-an",
        outPath,
      ]);
      const stats = await fs.stat(outPath);
      console.log(`  → ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.warn(`  [warn] ffmpeg failed, copying raw webm: ${(e as Error).message}`);
      await fs.copyFile(rawPath, outPath);
    }
  } finally {
    await browser.close();
    await fs.rm(videoDir, { recursive: true, force: true });
  }
}

async function main() {
  const { baseUrl, output } = parseArgs();
  await ensureDir(output);
  console.log(`base-url: ${baseUrl}`);
  console.log(`output: ${output}\n`);

  for (const target of TARGETS) {
    try {
      await captureScreenshot(baseUrl, target, output);
      if (target.recordVideo) await captureVideo(baseUrl, target, output);
    } catch (e) {
      console.error(`[error] ${target.key}: ${(e as Error).message}`);
    }
  }
  console.log("\n✓ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
