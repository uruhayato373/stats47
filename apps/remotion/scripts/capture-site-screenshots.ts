#!/usr/bin/env npx tsx
/**
 * stats47 サイト紹介動画用スクリーンショット取得
 *
 * Usage:
 *   npx tsx apps/remotion/scripts/capture-site-screenshots.ts
 *
 * 前提:
 *   - playwright がインストール済み (npx playwright install chromium)
 *   - stats47.jp が公開中、またはローカル dev サーバーが起動中
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE_URL = process.env.BASE_URL || "https://stats47.jp";
const OUT_DIR = path.resolve(__dirname, "../public/images/site-intro");

interface ScreenCapture {
  name: string;
  url: string;
  /** ページ読み込み後の追加待機時間 (ms) */
  waitMs?: number;
  /** スクロール位置 (px) */
  scrollY?: number;
  /** ビューポート幅 */
  width?: number;
}

const CAPTURES: ScreenCapture[] = [
  // 1. トップページ
  { name: "01-top", url: "/", waitMs: 2000 },
  // 2. ランキング一覧
  { name: "02-ranking-list", url: "/ranking", waitMs: 1500 },
  // 3. ランキング詳細（人気指標）
  { name: "03-ranking-detail", url: "/ranking/total-population", waitMs: 2000 },
  // 4. ランキング詳細 - 地図部分
  { name: "04-ranking-map", url: "/ranking/total-population", waitMs: 2000, scrollY: 400 },
  // 5. 地域プロファイル
  { name: "05-area-profile", url: "/areas/13000", waitMs: 2000 },
  // 6. 地域プロファイル - チャートセクション
  { name: "06-area-charts", url: "/areas/13000", waitMs: 2000, scrollY: 600 },
  // 7. 相関分析
  { name: "07-correlation", url: "/correlation", waitMs: 2000 },
  // 8. 地域比較
  { name: "08-compare", url: "/compare", waitMs: 2000 },
  // 9. ブログ記事一覧
  { name: "09-blog", url: "/blog", waitMs: 1500 },
  // 10. 検索ページ
  { name: "10-search", url: "/search", waitMs: 1500 },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "ja-JP",
    deviceScaleFactor: 2,
  });

  for (const capture of CAPTURES) {
    const page = await context.newPage();
    const url = `${BASE_URL}${capture.url}`;

    console.log(`Capturing: ${capture.name} (${url})`);

    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 });

      if (capture.waitMs) {
        await page.waitForTimeout(capture.waitMs);
      }

      if (capture.scrollY) {
        await page.evaluate((y) => window.scrollTo(0, y), capture.scrollY);
        await page.waitForTimeout(500);
      }

      const outPath = path.join(OUT_DIR, `${capture.name}.png`);
      await page.screenshot({ path: outPath, type: "png" });
      console.log(`  → ${outPath}`);
    } catch (error) {
      console.error(`  FAILED: ${capture.name}`, error);
    }

    await page.close();
  }

  await browser.close();
  console.log(`\nDone: ${CAPTURES.length} screenshots saved to ${OUT_DIR}`);
}

main().catch(console.error);
