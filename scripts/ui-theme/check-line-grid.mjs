// 使い方: node scripts/ui-theme/check-line-grid.mjs <baseUrl> [pages.json] [width]
// 線の格子 (PanelGrid・docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」) を、描いた画面で検査する。
// 本文の列 (div[data-slot=shell-main] を含む格子) の中で次を数え、1 件でもあれば終了コード 1 にする。
// - outside-grid: パネルが格子の外にある (パネル自身の線が残り、隣と線を共有しない)
// - mixed-cell: パネルを含むセルが文章・見出しも直に持つ (パネルを含むセルは余白を持たないので、文章が線に接する)
// 静的な検査 (design-system:check の panels-in-line-grid) は書き方を止め、こちらは描いた結果を見る。
// 本番ビルドを手元で起動して流す (例: http://127.0.0.1:3200)。画面の一覧の既定はルートの種類ごとに 1 URL。
import { chromium } from "../../node_modules/playwright/index.mjs";
import fs from "node:fs";

const DEFAULT_PAGES = [
  { name: "ranking", url: "/ranking" },
  { name: "areas", url: "/areas" },
  { name: "themes", url: "/themes" },
  { name: "geo", url: "/geo" },
  { name: "geo/*", url: "/geo/compare" },
  { name: "geo/*/*", url: "/geo/layers/population-mesh" },
  { name: "geo/*/#/*", url: "/geo/population-land-price/47/overlap" },
  { name: "about", url: "/about" },
  { name: "products", url: "/products" },
  { name: "products/*", url: "/products/data-p-01" },
  { name: "privacy", url: "/privacy" },
  { name: "terms", url: "/terms" },
  { name: "themes/*", url: "/themes/population-dynamics" },
  { name: "areas/#", url: "/areas/01000" },
  { name: "areas/#/*", url: "/areas/01000/population-dynamics" },
  { name: "ranking/*", url: "/ranking/abandoned-cultivated-land-area" },
  { name: "blog", url: "/blog" },
  { name: "blog/*", url: "/blog/livable-prefecture-composite-ranking" },
  { name: "category/*", url: "/category/landweather" },
  { name: "survey", url: "/survey" },
  { name: "survey/*", url: "/survey/academic-achievement-survey" },
  { name: "tag/*", url: "/tag/%E5%AE%B6%E8%A8%88%E8%AA%BF%E6%9F%BB" },
  { name: "areas/#/*/#", url: "/areas/01000/cities/01100" },
  { name: "japan", url: "/japan" },
  { name: "japan/*", url: "/japan/education-culture" },
  { name: "municipalities", url: "/municipalities" },
  { name: "municipalities/*/*", url: "/municipalities/themes/aging-society" },
];

const [, , base, pagesFile, width = "1440"] = process.argv;
if (!base) {
  console.error("使い方: node scripts/ui-theme/check-line-grid.mjs <baseUrl> [pages.json] [width]");
  process.exit(2);
}
const pages = pagesFile ? JSON.parse(fs.readFileSync(pagesFile, "utf8")) : DEFAULT_PAGES;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 } });
let total = 0;
for (const { name, url } of pages) {
  await page.goto(base + url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  const res = await page.evaluate(() => {
    const root = document.querySelector("body > div.relative") ?? document.body;
    const column = root.querySelector("[data-slot=shell-main]")?.closest("[data-slot=panel-grid]");
    if (!column) return { noColumn: true, issues: [] };
    const outer = column.parentElement?.closest("[data-slot=panel-grid]") ?? column;
    const issues = [];
    const label = (el) => `${el.tagName.toLowerCase()}.${(el.getAttribute("class") ?? "").slice(0, 60)} | ${(el.innerText ?? "").replace(/\s+/g, " ").slice(0, 30)}`;
    const visible = (el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed";
    // (1) 本文の列の中で格子の外にあるパネル
    for (const card of outer.querySelectorAll("[data-slot=card]")) {
      if (!visible(card)) continue;
      const parent = card.parentElement;
      if (parent?.closest("[data-slot=card]")) continue; // パネルの中の部品 (状態表示など)
      // 格子 (rail-stack は格子の中で線を共有する) の直下、または「子が 1 つだけの包み」を辿って格子に着けば可
      let el = card;
      let ok = false;
      while (el.parentElement) {
        const p = el.parentElement;
        if (p.matches("[data-slot=panel-grid],[data-slot=rail-stack]")) { ok = true; break; }
        if ([...p.children].filter(visible).length !== 1) break;
        el = p;
      }
      if (ok) continue;
      issues.push(`outside-grid  ${label(card)}`);
    }
    // (2) パネルを含むセルが、パネル以外の要素も直に持つ
    for (const grid of outer.querySelectorAll("[data-slot=panel-grid]")) {
      for (const cell of grid.children) {
        if (!visible(cell) || cell.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=section-divider],[data-slot=rail-stack]")) continue;
        if (!cell.querySelector("[data-slot=card]")) continue;
        // 子が 1 つだけの包みは中へ辿る
        let box = cell;
        while ([...box.children].filter(visible).length === 1 && !box.firstElementChild.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=rail-stack]")) box = [...box.children].filter(visible)[0];
        const loose = [...box.children].filter((c) => visible(c) && !c.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=rail-stack]") && (c.innerText ?? "").trim());
        if (loose.length) issues.push(`mixed-cell    ${label(cell)} :: ${loose.map((c) => c.tagName.toLowerCase()).join(",")}`);
      }
    }
    return { issues };
  });
  if (res.noColumn) {
    console.log(`\n## ${name} ${url}\n  (本文の列の格子なし)`);
    continue;
  }
  total += res.issues.length;
  console.log(`\n## ${name} ${url} — ${res.issues.length}`);
  for (const i of res.issues) console.log(`  ${i}`);
}
console.log(`\n線の格子の違反 ${total} 件 (${pages.length} 画面・${width}px)`);
await browser.close();
if (total > 0) process.exit(1);
