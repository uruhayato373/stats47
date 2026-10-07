#!/usr/bin/env node
/**
 * テーマページを実ブラウザで開き、カタログどおりに描画されているかを確かめてスクリーンショットを撮る。
 *
 * 使い方 (先に本番ビルドを起動しておく。dev サーバーより表示が本番に近い):
 *   npm run build --workspace=web && (cd apps/web && npx next start -p 3100)
 *   node .claude/scripts/themes/capture-theme-page.mjs <themeKey> [--base-url http://localhost:3100]
 *     [--widths 375,768,1024,1280,1440] [--shot-widths 375,1280] [--out <dir>]
 *
 * 幅ごとに次を確かめ、stdout に 1 行 1 JSON で出す。最後に summary.json と章ごとの画像を --out に置く。
 *   - HTTP 200 / 章がカタログの並び順どおり / カードの見出しが全部ある / 横はみ出し 0 / コンソールエラー 0
 *     (どれか崩れたら exit 1)
 *   - カタログの図の見出しが見当たらない (missingCharts) と、最後の章より後ろの見出し (afterLastChapter) は
 *     警告だけ。図は R2 の page-components から読まれるので、カタログを変えて R2 へ反映する前は
 *     外した図が最後の章の後ろに残り、足した図が出ない。exit コードにはしない。
 *
 * Chromium は Playwright の既定を使い、見つからなければ /opt/pw-browsers (cloud 環境) を探す。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { datasetDir } from "../../../config/datasets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const COOKIE_REJECT = "拒否";

function parseArgs(argv) {
  const args = { widths: [375, 768, 1024, 1280, 1440], shotWidths: [375, 1280], baseUrl: "http://localhost:3100" };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--base-url") args.baseUrl = rest.shift();
    else if (a === "--widths") args.widths = rest.shift().split(",").map(Number);
    else if (a === "--shot-widths") args.shotWidths = rest.shift().split(",").map(Number);
    else if (a === "--out") args.out = rest.shift();
    else if (!a.startsWith("--") && !args.themeKey) args.themeKey = a;
    else throw new Error(`不明な引数: ${a}`);
  }
  if (!args.themeKey) throw new Error("themeKey を指定する (例: local-economy)");
  args.out ??= path.join(ROOT, ".local/theme-qa", args.themeKey, new Date().toISOString().slice(0, 10));
  return args;
}

async function launchChromium() {
  try {
    return await chromium.launch();
  } catch (error) {
    const base = "/opt/pw-browsers";
    const found = existsSync(base)
      ? readdirSync(base)
          .filter((d) => d.startsWith("chromium-"))
          .map((d) => path.join(base, d, "chrome-linux/chrome"))
          .find((p) => existsSync(p))
      : undefined;
    if (!found) throw error;
    return chromium.launch({ executablePath: found });
  }
}

function slug(text) {
  return text.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalogFile = path.join(ROOT, datasetDir("themes.catalogs"), `${args.themeKey}.json`);
  const catalog = JSON.parse(readFileSync(catalogFile, "utf8"));
  const expected = {
    chapters: (catalog.sections ?? []).map((s) => s.title),
    cards: (catalog.metricGroups ?? []).map((g) => g.title),
    charts: catalog.charts.filter((c) => c.componentType !== "markdown-section").map((c) => c.title),
  };
  mkdirSync(args.out, { recursive: true });

  const browser = await launchChromium();
  const results = [];
  try {
    for (const width of args.widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 200));
      });
      page.on("pageerror", (e) => errors.push(`pageerror ${e.message.slice(0, 200)}`));
      const res = await page.goto(`${args.baseUrl}/themes/${args.themeKey}`, { waitUntil: "networkidle", timeout: 120000 });
      const reject = page.getByRole("button", { name: COOKIE_REJECT });
      if (await reject.count()) await reject.first().click();

      const observed = await page.evaluate(() => ({
        headings: [...document.querySelectorAll("main h2, main h3, main h4")].map((h) => h.textContent.trim()),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      const pos = expected.chapters.map((t) => observed.headings.indexOf(t));
      const last = pos.at(-1) ?? -1;
      const row = {
        width,
        status: res?.status() ?? null,
        chaptersInOrder: pos.every((p, i, a) => p >= 0 && (i === 0 || p > a[i - 1])),
        missingChapters: expected.chapters.filter((_, i) => pos[i] < 0),
        missingCards: expected.cards.filter((t) => !observed.headings.includes(t)),
        missingCharts: expected.charts.filter((t) => !observed.headings.includes(t)),
        afterLastChapter: last >= 0 ? observed.headings.slice(last + 1, last + 7) : [],
        overflow: observed.overflow,
        errors,
      };
      results.push(row);
      console.log(JSON.stringify(row));

      if (args.shotWidths.includes(width)) {
        await page.screenshot({ path: path.join(args.out, `full-${width}.png`), fullPage: true });
        for (const [i, title] of expected.chapters.entries()) {
          const h = page.locator("main h2, main h3").filter({ hasText: title }).first();
          if (!(await h.count())) continue;
          await h.scrollIntoViewIfNeeded();
          const box = await h.boundingBox();
          if (!box) continue;
          const y = box.y - 10 + (await page.evaluate(() => window.scrollY));
          await page.screenshot({
            path: path.join(args.out, `chapter-${i + 1}-${slug(title)}-${width}.png`),
            clip: { x: 0, y: Math.max(0, y), width, height: 1100 },
            fullPage: true,
          });
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter(
    (r) => r.status !== 200 || !r.chaptersInOrder || r.missingCards.length || r.overflow > 0 || r.errors.length,
  );
  const warned = results.filter((r) => r.missingCharts.length);
  writeFileSync(
    path.join(args.out, "summary.json"),
    `${JSON.stringify({ themeKey: args.themeKey, baseUrl: args.baseUrl, expected, results }, null, 2)}\n`,
  );
  console.error(
    `${failed.length ? "✗" : "✓"} ${args.themeKey}: ${results.length} 幅中 ${failed.length} 幅で崩れ` +
      (warned.length ? ` / ${warned.length} 幅でカタログの図が見当たらない (R2 未反映なら想定どおり)` : "") +
      ` → ${path.relative(ROOT, args.out)}`,
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
