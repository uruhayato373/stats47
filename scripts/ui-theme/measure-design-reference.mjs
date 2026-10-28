// 使い方: node scripts/ui-theme/measure-design-reference.mjs <outDir> [--links|--measure] [baseUrl] [pages.json]
// 見本の画面一覧は assets/design-reference/shadcndashboard/<日付>/pages.json、stats47 は assets/design-reference/stats47-baseline/<日付>/pages.json
// 見本サイト (demos.shadcndashboard.dev) の各画面を開き、shadcn 部品 (data-slot) ごとの計算後スタイルを集計し、全体スクショを撮る。
// --links はサイドバーのリンク一覧だけを出す
import { chromium } from "../../node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";

// 第 3・4 引数で実測先と画面の一覧を差し替えられる (stats47 を同じ方法で測るため)
const [, , outDir, flag, baseArg, pagesArg] = process.argv;
const BASE = baseArg || "https://demos.shadcndashboard.dev";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

if (flag === "--links") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 120000 });
  const links = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")))]);
  console.log(links.join("\n"));
  await browser.close();
  process.exit(0);
}

const PAGES = JSON.parse(fs.readFileSync(path.resolve(pagesArg || "assets/design-reference/shadcndashboard/2026-10-28/pages.json"), "utf8"));
const WIDTHS = [1440, 390];

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "reduce" });
  for (const { name, url } of PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(1500);
      const data = await page.evaluate(() => {
        const px = (v) => Math.round(parseFloat(v) * 10) / 10;
        const boxOf = (e) => {
          const r = e.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height) };
        };
        const styleOf = (e) => {
          const cs = getComputedStyle(e);
          return {
            font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`,
            color: cs.color,
            bg: cs.backgroundColor,
            pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px).join(" "),
            gap: `${cs.rowGap} ${cs.columnGap}`,
            border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px).join(" ") + " " + cs.borderTopStyle,
            borderColor: cs.borderBottomColor,
            radius: cs.borderTopLeftRadius,
            shadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 60),
            display: cs.display,
          };
        };
        // data-slot ごとに値の出現数を数える
        const slots = {};
        for (const e of document.querySelectorAll("[data-slot]")) {
          const slot = e.getAttribute("data-slot");
          const s = { ...styleOf(e), ...boxOf(e) };
          const key = JSON.stringify({ font: s.font, pad: s.pad, gap: s.gap, border: s.border, radius: s.radius, h: ["card-header", "card-footer", "table-head", "table-cell", "button", "badge", "input", "tabs-list"].includes(slot) ? s.h : undefined });
          slots[slot] ??= { count: 0, variants: {} };
          slots[slot].count++;
          slots[slot].variants[key] = (slots[slot].variants[key] || 0) + 1;
        }
        // 見出し・本文の文字
        const text = {};
        for (const sel of ["h1", "h2", "h3", "h4", "p", "body"]) {
          const e = document.querySelector(sel);
          if (e) text[sel] = { ...styleOf(e), sample: e.textContent.trim().slice(0, 30), fontFamily: getComputedStyle(e).fontFamily.slice(0, 80) };
        }
        // 点線などの区切りの帯
        const dividers = [];
        for (const e of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          if (r.height > 0 && r.height <= 24 && r.width > 200 && (cs.backgroundImage !== "none" || /dashed|dotted/.test(cs.borderTopStyle + cs.borderBottomStyle))) {
            dividers.push({ cls: (e.className?.toString() || "").slice(0, 160), h: Math.round(r.height), w: Math.round(r.width), bgImage: cs.backgroundImage.slice(0, 120), border: cs.borderTopStyle + "/" + cs.borderBottomStyle });
          }
          if (dividers.length > 6) break;
        }
        // 本文の外枠 (サイドバーの隣) と、カードを並べる格子
        const inset = document.querySelector("[data-slot=sidebar-inset]") || document.querySelector("main");
        const mainEl = inset?.querySelector("main") || inset;
        const grids = [];
        for (const e of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(e);
          if (cs.display !== "grid") continue;
          const cards = [...e.children].filter((c) => c.matches("[data-slot=card]") || c.querySelector(":scope > [data-slot=card]"));
          if (cards.length >= 2) grids.push({ cls: (e.className?.toString() || "").slice(0, 200), cols: cs.gridTemplateColumns.slice(0, 80), gap: `${cs.rowGap} ${cs.columnGap}`, border: styleOf(e).border, children: e.children.length });
          if (grids.length > 8) break;
        }
        return {
          title: document.title,
          inset: inset && { ...styleOf(inset), ...boxOf(inset), cls: (inset.className?.toString() || "").slice(0, 200) },
          main: mainEl && { ...styleOf(mainEl), cls: (mainEl.className?.toString() || "").slice(0, 200) },
          text,
          dividers,
          grids,
          slots,
          cssVars: Object.fromEntries(["--radius", "--border", "--muted-foreground", "--foreground", "--background", "--card", "--muted", "--primary"].map((v) => [v, getComputedStyle(document.documentElement).getPropertyValue(v).trim()])),
        };
      });
      fs.writeFileSync(path.join(outDir, `${name}-${width}.json`), JSON.stringify(data, null, 2));
      await page.screenshot({ path: path.join(outDir, `${name}-${width}.png`), fullPage: true, timeout: 120000 });
      console.log("OK", name, width, Object.keys(data.slots).length);
    } catch (e) {
      console.log("NG", name, width, String(e).slice(0, 140));
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
