import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import { PNG } from "pngjs";

import type { ScreenshotRecord } from "../types";
import { resolveDispatcher } from "./http-dispatcher";

/** R2 上の保存先。`<date>/` に週ごとの版、`latest/` に最新版を置き、翌週の比較元にする。 */
export const SCREENSHOT_PREFIX = "state/page-quality/screenshots";

export type ScreenshotDevice = ScreenshotRecord["device"];

const DEVICES: Record<
  ScreenshotDevice,
  { viewport: { width: number; height: number }; isMobile: boolean; maxHeight: number; maxTiles: number }
> = {
  mobile: { viewport: { width: 412, height: 915 }, isMobile: true, maxHeight: 6000, maxTiles: 4 },
  desktop: { viewport: { width: 1280, height: 900 }, isMobile: false, maxHeight: 4000, maxTiles: 3 },
};

/** agent 用の切り出しの置き場。CI ジョブ内だけで使い、R2 には上げない。 */
export const TILE_DIR = ".local/ci/page-quality/tiles";

/** 縦長のスクショを画面 1 枚分の高さで上から切り出す (最大 maxTiles 枚)。 */
export function sliceIntoTiles(png: Buffer, tileHeight: number, maxTiles: number): Buffer[] {
  const img = PNG.sync.read(png);
  const tiles: Buffer[] = [];
  for (let top = 0; top < img.height && tiles.length < maxTiles; top += tileHeight) {
    const height = Math.min(tileHeight, img.height - top);
    const tile = new PNG({ width: img.width, height });
    img.data.copy(tile.data, 0, top * img.width * 4, (top + height) * img.width * 4);
    tiles.push(PNG.sync.write(tile));
  }
  return tiles;
}

export interface VisualDiff {
  /** 重なる範囲で色が変わった画素の割合と、高さの違いの割合の大きい方。 */
  changeRatio: number;
  diffPng: Buffer;
}

/**
 * 2 枚の PNG の差を 0〜1 で返す。幅・高さが違うときは重なる範囲だけを画素比較し、
 * 高さの違い自体も変化として数える (ページが伸び縮みしたことは見た目の大きな変化)。
 */
export function compareScreenshots(current: Buffer, previous: Buffer): VisualDiff {
  const a = PNG.sync.read(current);
  const b = PNG.sync.read(previous);
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const crop = (img: PNG): Buffer => {
    const out = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) img.data.copy(out, y * width * 4, y * img.width * 4, y * img.width * 4 + width * 4);
    return out;
  };
  const diff = new PNG({ width, height });
  const changed = pixelmatch(crop(a), crop(b), diff.data, width, height, { threshold: 0.1 });
  const pixelRatio = width * height === 0 ? 1 : changed / (width * height);
  const heightRatio = Math.abs(a.height - b.height) / Math.max(a.height, b.height, 1);
  return { changeRatio: Number(Math.max(pixelRatio, heightRatio).toFixed(4)), diffPng: PNG.sync.write(diff) };
}

async function fetchPrevious(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
      dispatcher: resolveDispatcher(url),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export interface ScreenshotSession {
  capture(url: string, template: string): Promise<ScreenshotRecord[]>;
  close(): Promise<void>;
}

/**
 * 代表URLをスマホ幅と PC 幅で撮影し、R2 へ push する stage (`.local/r2/state/page-quality/screenshots/`) に
 * `<date>/` と `latest/` の 2 か所へ書く。比較元の先週分は push 前の R2 `latest/` を公開 URL から読む。
 */
export async function createScreenshotSession(options: {
  date: string;
  stageRoot?: string;
  publicBaseUrl?: string;
}): Promise<ScreenshotSession> {
  const stageRoot = options.stageRoot ?? join(".local/r2", SCREENSHOT_PREFIX);
  const publicBaseUrl = options.publicBaseUrl ?? process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
  const browser = await chromium.launch({ headless: true });

  const write = (path: string, data: Buffer) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, data);
  };

  return {
    async capture(url, template) {
      const records: ScreenshotRecord[] = [];
      for (const device of Object.keys(DEVICES) as ScreenshotDevice[]) {
        const spec = DEVICES[device];
        const context = await browser.newContext({
          viewport: spec.viewport,
          isMobile: spec.isMobile,
          hasTouch: spec.isMobile,
          deviceScaleFactor: 1,
        });
        try {
          const page = await context.newPage();
          await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
          await page.evaluate("document.fonts.ready.then(() => true)").catch(() => undefined);
          await page.waitForTimeout(800);
          const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
          const png = await page.screenshot({
            fullPage: true,
            clip: { x: 0, y: 0, width: spec.viewport.width, height: Math.min(fullHeight, spec.maxHeight) },
          });
          const name = `${template}-${device}.png`;
          const localPath = join(stageRoot, options.date, name);
          write(localPath, png);
          write(join(stageRoot, "latest", name), png);

          const previous = await fetchPrevious(`${publicBaseUrl}/${SCREENSHOT_PREFIX}/latest/${name}`);
          let changeRatio: number | null = null;
          let previousHeight: number | null = null;
          if (previous) {
            const diff = compareScreenshots(png, previous);
            changeRatio = diff.changeRatio;
            previousHeight = PNG.sync.read(previous).height;
            write(join(stageRoot, options.date, `${template}-${device}.diff.png`), diff.diffPng);
          }
          const tilePaths = sliceIntoTiles(png, spec.viewport.height, spec.maxTiles).map((tile, i) => {
            const tilePath = join(TILE_DIR, `${template}-${device}-${i + 1}.png`);
            write(tilePath, tile);
            return tilePath;
          });
          const { height, width } = PNG.sync.read(png);
          records.push({
            device,
            key: `${SCREENSHOT_PREFIX}/${options.date}/${name}`,
            localPath,
            width,
            height,
            changeRatio,
            previousHeight,
            tilePaths,
          });
        } finally {
          await context.close();
        }
      }
      return records;
    },
    close: () => browser.close(),
  };
}
