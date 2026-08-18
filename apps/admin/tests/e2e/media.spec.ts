import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * /media/[...path] route の Range 配信検証 + sns ページ内 video の seek 確認。
 * ローカル mp4 (.local/r2/sns 配下) を探索し、実測ベースで Range を検証する。
 * mp4 が見つからない場合は PNG (通常の画像候補) で Range 検証に切り替える。
 */

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const LOCAL_SNS_DIR = path.join(PROJECT_ROOT, ".local/r2/sns");

function findFirstFile(dir: string, matcher: RegExp): string | null {
  if (!fs.existsSync(dir)) return null;
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (matcher.test(entry.name)) {
        return full;
      }
    }
  }
  return null;
}

test.describe("/media Range 配信", () => {
  const mp4Path = findFirstFile(LOCAL_SNS_DIR, /\.mp4$/i);
  const pngPath = mp4Path ? null : findFirstFile(LOCAL_SNS_DIR, /\.png$/i);
  const samplePath = mp4Path ?? pngPath;

  test("Range: bytes=0-99 で 206 + content-range が返る", async ({ request }) => {
    test.skip(!samplePath, `ローカル素材 (.local/r2/sns) が見つからないためスキップ: ${LOCAL_SNS_DIR}`);
    const rel = path.relative(LOCAL_SNS_DIR, samplePath!);
    const res = await request.get(`/media/${rel}`, {
      headers: { Range: "bytes=0-99" },
    });
    expect(res.status()).toBe(206);
    expect(res.headers()["content-range"]).toMatch(/^bytes 0-99\/\d+$/);
    const body = await res.body();
    expect(body.length).toBe(100);
  });

  test("範囲外 Range は 416 を返す", async ({ request }) => {
    test.skip(!samplePath, `ローカル素材 (.local/r2/sns) が見つからないためスキップ: ${LOCAL_SNS_DIR}`);
    const rel = path.relative(LOCAL_SNS_DIR, samplePath!);
    const size = fs.statSync(samplePath!).size;
    const res = await request.get(`/media/${rel}`, {
      headers: { Range: `bytes=${size + 1000}-${size + 2000}` },
    });
    expect(res.status()).toBe(416);
    expect(res.headers()["content-range"]).toMatch(new RegExp(`bytes \\*/${size}`));
  });

  test("report: 使用した素材の種別", async () => {
    if (mp4Path) {
      console.log(`[media.spec] mp4 で Range 検証: ${mp4Path}`);
    } else if (pngPath) {
      console.log(`[media.spec] mp4 が見つからず PNG で Range 検証に切替: ${pngPath}`);
    } else {
      console.log(`[media.spec] ローカル素材が全く見つからず Range 検証をスキップした`);
    }
  });
});

test.describe("/sns ページ内 video の seek", () => {
  test("ローカル mp4 を持つ投稿カードで video.currentTime を設定できる", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");

    // ローカル mp4 を持つことが分かっている post (bcr-births-1995-2023, id=580) を検索で絞り込む
    await page.getByPlaceholder("content_key / caption 検索").fill("bcr-births-1995-2023");
    await page.waitForTimeout(200);

    const video = page.locator("video").first();
    const hasVideo = (await video.count()) > 0;
    test.skip(!hasVideo, "sns ページ内に video 要素を持つカードが見つからずスキップ");

    await expect(video).toBeVisible();
    // メタデータ読み込みを待ってから seek
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 1) return resolve();
        el.addEventListener("loadedmetadata", () => resolve(), { once: true });
      });
    });
    const duration = await video.evaluate((el: HTMLVideoElement) => el.duration);
    expect(duration).toBeGreaterThan(0);

    const target = Math.min(1, duration / 2);
    await video.evaluate((el: HTMLVideoElement, t: number) => {
      el.currentTime = t;
    }, target);
    await page.waitForTimeout(200);
    const current = await video.evaluate((el: HTMLVideoElement) => el.currentTime);
    expect(current).toBeGreaterThan(0);
  });
});
