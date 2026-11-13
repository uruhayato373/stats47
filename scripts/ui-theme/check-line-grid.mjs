// 使い方: node --import tsx scripts/ui-theme/check-line-grid.mjs <baseUrl> [pages.json] [width]
// 線の格子 (PanelGrid・docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」) を、描いた画面で検査する。
// 判定の本体は .claude/scripts/page-quality/lib/line-grid-probe.mjs の 1 か所で、週次の page-quality (line_grid_issues) と共有する。
// 1 件でも違反があれば終了コード 1 にする。本番ビルドを手元で起動して流す (例: http://127.0.0.1:3200)。
// 画面の一覧の既定は週次の page-quality が検査するページ (templates.ts の browserPages。代表URL + データの型の違い) と同じで、
// 手元の検査と週次の検査で対象が食い違わない (LINE-GRID-COLUMN-01)。
import { chromium } from "../../node_modules/playwright/index.mjs";
import fs from "node:fs";

import { evaluateLineGridIssues } from "../../.claude/scripts/page-quality/lib/line-grid-probe.mjs";
import { browserPages } from "../../.claude/scripts/page-quality/templates.ts";

const DEFAULT_PAGES = browserPages().map(({ key, url }) => ({ name: key, url }));

const [, , base, pagesFile, width = "1440"] = process.argv;
if (!base) {
  console.error("使い方: node --import tsx scripts/ui-theme/check-line-grid.mjs <baseUrl> [pages.json] [width]");
  process.exit(2);
}
const pages = pagesFile ? JSON.parse(fs.readFileSync(pagesFile, "utf8")) : DEFAULT_PAGES;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 } });
let total = 0;
for (const { name, url } of pages) {
  await page.goto(base + url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  const res = await evaluateLineGridIssues(page);
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
