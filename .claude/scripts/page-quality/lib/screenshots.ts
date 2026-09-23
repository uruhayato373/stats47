import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import sharp from "sharp";

import type { ScreenshotRecord } from "../types";
import { resolveDispatcher } from "./http-dispatcher";
import { evaluateLayoutIssues } from "./ui-probe";

/** R2 上の保存先。`latest/` は全幅の最新版 (翌週の比較元)、`<date>/` は agent が確認した幅の履歴。 */
export const SCREENSHOT_PREFIX = "state/page-quality/screenshots";

/** agent 用の切り出しの置き場。CI ジョブ内だけで使い、R2 には上げない。 */
export const TILE_DIR = ".local/ci/page-quality/tiles";

export interface ViewportSpec {
  id: string;
  width: number;
  height: number;
  touch: boolean;
  maxHeight: number;
  /** true の幅だけ agent が確認し、日付つきの履歴を残す (量と費用を抑えるため 3 幅)。 */
  review: boolean;
  maxTiles: number;
}

/**
 * サイトの表示が切り替わる幅ごとに 1 つずつ (tailwind.config.ts の sm 640 / md 768 / lg 1024 / xl 1280 /
 * 2xl 1700 と、LeftRailLayout が左サイドバーを出す 992)。境界ちょうどの幅で撮り、切り替わった直後の崩れを拾う。
 */
export const VIEWPORTS: ViewportSpec[] = [
  { id: "mobile-390", width: 390, height: 844, touch: true, maxHeight: 6000, review: true, maxTiles: 4 },
  { id: "sm-640", width: 640, height: 960, touch: true, maxHeight: 6000, review: false, maxTiles: 0 },
  { id: "tablet-768", width: 768, height: 1024, touch: true, maxHeight: 5000, review: true, maxTiles: 3 },
  { id: "rail-992", width: 992, height: 900, touch: false, maxHeight: 4000, review: false, maxTiles: 0 },
  { id: "laptop-1024", width: 1024, height: 768, touch: false, maxHeight: 4000, review: false, maxTiles: 0 },
  { id: "desktop-1440", width: 1440, height: 900, touch: false, maxHeight: 4000, review: true, maxTiles: 3 },
  { id: "wide-1920", width: 1920, height: 1080, touch: false, maxHeight: 4000, review: false, maxTiles: 0 },
];

export const REVIEW_VIEWPORT_IDS = VIEWPORTS.filter((v) => v.review).map((v) => v.id);

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

/**
 * 412px の代表URL検査が見ない幅 (390 を除く) で見つかった崩れの件数と指摘。
 * 390 は 412 とほぼ同じ表示なので重複して数えない。
 */
export function responsiveFindings(records: ScreenshotRecord[]): { count: number; findings: string[] } {
  const findings: string[] = [];
  let count = 0;
  for (const r of records) {
    if (r.device === "mobile-390") continue;
    if (r.horizontalScroll) {
      count += 1;
      findings.push(`responsive@${r.device}: 横スクロールが出る`);
    }
    for (const c of r.clipped ?? []) {
      count += 1;
      findings.push(`responsive@${r.device} clipped_text: ${c}`);
    }
    for (const o of r.overlaps ?? []) {
      count += 1;
      findings.push(`responsive@${r.device} overlapping_tap_target: ${o}`);
    }
  }
  return { count, findings };
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
  /** 幅ごとに撮影する。失敗した幅は records に入れず failures に理由を返す (他の幅は捨てない)。 */
  capture(url: string, template: string): Promise<{ records: ScreenshotRecord[]; failures: string[] }>;
  close(): Promise<void>;
}

/**
 * 代表URLを全幅で撮影し、R2 へ push する stage (`.local/r2/state/page-quality/screenshots/`) に書く。
 * `latest/<template>-<幅>.png` は全幅 (比較元)、`<date>/<template>-<幅>.webp` は agent が確認する幅だけ
 * (履歴の容量を抑える)。比較元の先週分は push 前の R2 `latest/` を公開 URL から読む。
 * 各幅でタップ要素の重なり・文字の切れ・横スクロールも測る (代表URLの 412px 検査が見ない幅の崩れを拾う)。
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
      const failures: string[] = [];
      for (const spec of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: spec.width, height: spec.height },
          isMobile: spec.touch,
          hasTouch: spec.touch,
          deviceScaleFactor: 1,
        });
        try {
          const page = await context.newPage();
          // ホームは通信が止まらず networkidle を待つと 45 秒で時間切れになった (2026-09-23 実測)。
          // 読み込み完了までは必須、通信の落ち着きは 10 秒で打ち切る。
          await page.goto(url, { waitUntil: "load", timeout: 45_000 });
          await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
          await page.evaluate("document.fonts.ready.then(() => true)").catch(() => undefined);
          await page.waitForTimeout(800);
          const horizontalScroll = await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
          );
          // 閉じた <details> の中身は位置を問い合わせるまで大きさ 0 なので、先に全リンクを測る (ui-probe と同じ条件)。
          await page.evaluate(() => {
            for (const el of Array.from(document.querySelectorAll("a, button"))) el.getBoundingClientRect();
          });
          const layout = await evaluateLayoutIssues(page).catch(() => ({ clipped: [] as string[], overlaps: [] as string[] }));
          const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
          const png = await page.screenshot({
            fullPage: true,
            clip: { x: 0, y: 0, width: spec.width, height: Math.min(fullHeight, spec.maxHeight) },
          });

          const name = `${template}-${spec.id}`;
          const localPath = join(".local/ci/page-quality/shots", `${name}.png`);
          write(localPath, png);
          write(join(stageRoot, "latest", `${name}.png`), png);
          let key = `${SCREENSHOT_PREFIX}/latest/${name}.png`;
          if (spec.review) {
            key = `${SCREENSHOT_PREFIX}/${options.date}/${name}.webp`;
            write(join(stageRoot, options.date, `${name}.webp`), await sharp(png).webp({ quality: 80 }).toBuffer());
          }

          const previous = await fetchPrevious(`${publicBaseUrl}/${SCREENSHOT_PREFIX}/latest/${name}.png`);
          let changeRatio: number | null = null;
          let previousHeight: number | null = null;
          if (previous) {
            const diff = compareScreenshots(png, previous);
            changeRatio = diff.changeRatio;
            previousHeight = PNG.sync.read(previous).height;
            write(join(".local/ci/page-quality/diffs", `${name}.png`), diff.diffPng);
          }
          const tilePaths = sliceIntoTiles(png, spec.height, spec.maxTiles).map((tile, i) => {
            const tilePath = join(TILE_DIR, `${name}-${i + 1}.png`);
            write(tilePath, tile);
            return tilePath;
          });
          const { height, width } = PNG.sync.read(png);
          records.push({
            device: spec.id,
            key,
            localPath,
            width,
            height,
            changeRatio,
            previousHeight,
            tilePaths,
            horizontalScroll,
            clipped: layout.clipped,
            overlaps: layout.overlaps,
          });
        } catch (e) {
          failures.push(`screenshot_failed@${spec.id}: ${(e as Error).message.split("\n")[0]}`);
        } finally {
          await context.close();
        }
      }
      return { records, failures };
    },
    close: () => browser.close(),
  };
}
