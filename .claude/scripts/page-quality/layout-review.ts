/**
 * 広告の配置を目で確かめるための撮影 (2026-10-31)。ページ × 画面の幅 × 見せ方を撮り、管理画面の
 * 「レイアウト確認」(/quality/layout-review) で幅ごとに並べて見る。
 *
 * 右レールが本文の下に積まれる幅 (Shell の幅が 988px 未満) では、右レールの広告が本文末の広告と並んで
 * 集まる。その見せ方を 3 通り撮る:
 *   now  = 今のまま
 *   hide = 案 1: 積まれた右レールの広告を出さない
 *   row  = 案 2: 積まれた右レールの広告を、本文のセルと同じ全幅の行にする
 * hide / row は右レールが積まれていて、そこに広告がある幅だけ撮る (横に並ぶ幅では今のままと同じため)。
 * AdSense の代わりの表示は赤、PR のバナーは橙の枠で囲む。
 *
 * 前提: 広告の在庫を代わりの広告で満たした開発サーバー (`npm run dev:web:ad-preview`)。
 * 撮影はローカルにだけ置く (.local/layout-review/latest/。git にも R2 にも置かない)。
 *
 * Usage:
 *   npm run layout:review -- [--base-url http://localhost:3000] [--pages ranking,theme] [--widths 768,1024]
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { chromium, type Page } from "playwright";

import { VIEWPORTS } from "./lib/screenshots";

const OUT_DIR = resolve(__dirname, "../../../.local/layout-review/latest");

/** ページの種類ごとに代表 1 件 (広告の置き方は種類で決まる) */
const PAGES = [
  { id: "home", label: "ホーム", path: "/" },
  { id: "ranking", label: "ランキング", path: "/ranking/active-job-opening-ratio" },
  { id: "theme", label: "テーマ", path: "/themes/labor-wages" },
  { id: "blog", label: "ブログ", path: "/blog/prefecture-salary-gap-career" },
  { id: "category", label: "カテゴリ", path: "/category/laborwage" },
  { id: "survey", label: "調査", path: "/survey/kakei-chousa" },
  { id: "tag", label: "タグ", path: "/tag/賃金" },
  { id: "area", label: "都道府県", path: "/areas/13000" },
  { id: "city", label: "市区町村", path: "/areas/13000/cities/13101" },
] as const;

const SCENARIOS = ["now", "hide", "row"] as const;
type Scenario = (typeof SCENARIOS)[number];

/** 右レールが本文の横に並ぶ Shell の幅 (PageShell / ArticleShell の `@min-[988px]/shell`) */
const RAIL_SIDE_BY_SIDE_MIN = 988;
/** 撮影の高さの上限 (長いページの末尾まで撮るが、画像を際限なく大きくしない) */
const MAX_SHOT_HEIGHT = 16000;
const SETTLE_MS = 1500;

const MARK_CSS = `
[data-ad-placeholder]{outline:4px solid #dc2626 !important;outline-offset:-4px;background:rgba(220,38,38,.08) !important}
a[rel*="sponsored"] img{outline:4px solid #ea580c !important;outline-offset:-4px}
`;

interface ShotRecord {
  page: string;
  width: number;
  scenario: Scenario;
  file: string;
  height: number;
}

interface PageMeasure {
  page: string;
  width: number;
  shellWidth: number | null;
  railStacked: boolean;
  /** 本文の列の外 (右レール) にある広告の数 */
  railAds: number;
  /** 本文の列の中の広告の数 */
  bodyAds: number;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const list = (flag: string) => get(flag)?.split(",").map((s) => s.trim()).filter(Boolean);
  const pageIds = list("--pages");
  const widths = list("--widths")?.map(Number);
  const pages = pageIds ? PAGES.filter((p) => pageIds.includes(p.id)) : [...PAGES];
  const viewports = widths ? VIEWPORTS.filter((v) => widths.includes(v.width)) : [...VIEWPORTS];
  if (!pages.length) throw new Error(`--pages に一致するページがありません: ${pageIds?.join(",")}`);
  if (!viewports.length) throw new Error(`--widths に一致する幅がありません (${VIEWPORTS.map((v) => v.width).join(",")})`);
  return { baseUrl: get("--base-url") ?? "http://localhost:3000", pages, viewports, partial: Boolean(pageIds || widths) };
}

/** 遅延読み込みの部品を描かせるため、末尾まで送ってから先頭に戻す */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
}

async function measure(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector("body > div.relative") ?? document.body;
    const main = root.querySelector("[data-slot=shell-main]");
    const shell = main?.parentElement?.closest("[class*='@container/shell']") ?? null;
    const ads = Array.from(root.querySelectorAll("[data-ad-placeholder], a[rel*='sponsored']")).filter(
      (el) => el.getBoundingClientRect().height > 2,
    );
    const railAds = ads.filter((el) => main && !main.contains(el)).length;
    return {
      shellWidth: shell ? Math.round(shell.getBoundingClientRect().width) : null,
      railAds,
      bodyAds: ads.length - railAds,
    };
  });
}

/** 積まれた右レールの広告を、案 1 (出さない) か案 2 (全幅の行) の見せ方に変える。変えた数を返す */
async function applyScenario(page: Page, scenario: Exclude<Scenario, "now">) {
  return page.evaluate((mode) => {
    const root = document.querySelector("body > div.relative") ?? document.body;
    const main = root.querySelector("[data-slot=shell-main]");
    const ads = Array.from(root.querySelectorAll("[data-ad-placeholder], a[rel*='sponsored']")).filter(
      (el) => main && !main.contains(el) && el.getBoundingClientRect().height > 2,
    );
    const done = new Set<HTMLElement>();
    for (const ad of ads) {
      // 積まれた右レールの直下の子 (カード・バナーの包み) まで上る
      let el = ad as HTMLElement;
      while (el.parentElement && !/space-y-4|grid-cols-2/.test(String(el.parentElement.className))) el = el.parentElement;
      if (!el.parentElement || done.has(el)) continue;
      done.add(el);
      if (mode === "hide") {
        el.style.display = "none";
        continue;
      }
      Object.assign(el.style, {
        gridColumn: "1 / -1",
        border: "0",
        borderTop: "1px solid #e4e4e7",
        borderBottom: "1px solid #e4e4e7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
      });
    }
    return done.size;
  }, scenario);
}

async function main() {
  const opts = parseArgs();
  if (!opts.partial) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const shots: ShotRecord[] = [];
  const measures: PageMeasure[] = [];
  try {
    for (const target of opts.pages) {
      for (const viewport of opts.viewports) {
        for (const scenario of SCENARIOS) {
          const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
          try {
            await page.goto(new URL(encodeURI(target.path), opts.baseUrl).href, { waitUntil: "load", timeout: 180_000 });
            await scrollThrough(page);
            await page.waitForTimeout(SETTLE_MS);
            await page.addStyleTag({ content: MARK_CSS });
            const m = await measure(page);
            const railStacked = m.shellWidth !== null && m.shellWidth < RAIL_SIDE_BY_SIDE_MIN;
            if (scenario === "now") {
              measures.push({ page: target.id, width: viewport.width, railStacked, ...m });
            } else {
              // 横に並ぶ幅・右レールに広告が無いページでは、今のままと同じなので撮らない
              if (!railStacked || m.railAds === 0) break;
              await applyScenario(page, scenario);
              await page.waitForTimeout(300);
            }
            const height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), MAX_SHOT_HEIGHT);
            const file = `${target.id}-${viewport.width}-${scenario}.png`;
            await page.screenshot({ path: join(OUT_DIR, file), clip: { x: 0, y: 0, width: viewport.width, height }, fullPage: true });
            shots.push({ page: target.id, width: viewport.width, scenario, file, height });
            console.log(`${file} (${height}px, Shell ${m.shellWidth}px, 右レールの広告 ${m.railAds})`);
          } finally {
            await page.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: opts.baseUrl,
        pages: opts.pages.map(({ id, label, path }) => ({ id, label, path })),
        widths: opts.viewports.map((v) => v.width),
        scenarios: SCENARIOS,
        measures,
        shots,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`${shots.length} 枚 → ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
