// 本文の列の線の格子の検査 (LINE-GRID-COLUMN-01)。判定は lib/line-grid-probe.mjs の 1 か所で、
// 週次の page-quality (line_grid_issues) と npm run ui-theme:line-grid が共有する。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

import { evaluateLineGridIssues } from "../lib/line-grid-probe.mjs";
import { UI_METRIC_KEYS } from "../lib/ui-report.ts";
import { lineGridFixGuide } from "../lib/ui-findings.ts";
import { browserPages } from "../templates.ts";
import { evaluateResult } from "../lib/thresholds.ts";
import { probeUi } from "../lib/ui-probe.ts";

// 実物と同じく、本文の列 (shell-main を含む格子) は本文とレールを並べる外側の格子の中にある
const column = (cells) =>
  `<body style="margin:0"><div class="relative"><div data-slot="panel-grid"><div data-slot="panel-grid">
     <div data-slot="shell-main" style="display:contents"></div>${cells}
   </div></div></div></body>`;
const card = (text) => `<div data-slot="card"><p>${text}</p></div>`;

async function withPage(t, html, fn) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    t.skip(`chromium を起動できない環境 (npx playwright install chromium が必要): ${e.message.split("\n")[0]}`);
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
    await page.setContent(html);
    await fn(page);
  } finally {
    await browser.close();
  }
}

test("格子の直下に並んだパネルは違反に数えない", async (t) => {
  await withPage(t, column(card("人口") + card("面積")), async (page) => {
    assert.deepEqual(await evaluateLineGridIssues(page), { issues: [] });
  });
});

test("パネルを空けて並べただけの包み (検索結果が実際にそうだった) は outside-grid として数える", async (t) => {
  const spaced = `<div class="results" style="display:flex;flex-direction:column;gap:16px">${card("結果 A")}${card("結果 B")}</div>`;
  await withPage(t, column(spaced), async (page) => {
    const { issues } = await evaluateLineGridIssues(page);
    assert.equal(issues.length, 2, JSON.stringify(issues));
    assert.ok(issues.every((i) => i.startsWith("outside-grid")));
  });
});

test("子が 1 つだけの包みを辿って格子に着くパネルと、パネルの中の部品は数えない", async (t) => {
  const wrapped = `<div><div>${card("包まれたパネル")}</div></div>`;
  const nested = `<div data-slot="card"><div data-slot="card">状態表示</div></div>`;
  await withPage(t, column(wrapped + nested), async (page) => {
    assert.deepEqual(await evaluateLineGridIssues(page), { issues: [] });
  });
});

test("パネルを含むセルが文章・見出しも直に持つと mixed-cell として数える", async (t) => {
  const mixed = `<section><h2>見出し</h2><div data-slot="panel-grid">${card("パネル")}</div><p>注記の文章</p></section>`;
  await withPage(t, column(mixed + card("別のパネル")), async (page) => {
    const { issues } = await evaluateLineGridIssues(page);
    assert.equal(issues.length, 1, JSON.stringify(issues));
    assert.match(issues[0], /^mixed-cell .*:: h2,p$/);
  });
});

test("見えないパネルは数えず、本文の列の格子が無い画面は対象外 (違反 0 件) にする", async (t) => {
  const hidden = `<div style="display:none">${card("非表示")}</div>`;
  await withPage(t, column(card("人口") + hidden), async (page) => {
    assert.deepEqual(await evaluateLineGridIssues(page), { issues: [] });
  });
  await withPage(t, `<body><div class="relative">${card("格子の外")}</div></body>`, async (page) => {
    assert.deepEqual(await evaluateLineGridIssues(page), { noColumn: true, issues: [] });
  });
});

test("週次のブラウザ検査 (probeUi) が line_grid_issues を件数で返し、違反の場所を ui_findings に出す", async (t) => {
  const spaced = `<div style="display:flex;flex-direction:column;gap:16px">${card("結果 A")}${card("結果 B")}</div>`;
  await withPage(t, column(spaced), async (page) => {
    const res = await probeUi(page);
    assert.equal(res.line_grid_issues, 2);
    assert.equal(res.ui_findings.filter((f) => f.startsWith("line_grid: outside-grid")).length, 2);
  });
});

test("週次の配線: 指標が UI 指摘キューの対象で、予算が 0 件の warning として登録され、超えた画面が違反になる", () => {
  assert.ok(UI_METRIC_KEYS.includes("line_grid_issues"));
  const budgets = JSON.parse(readFileSync(new URL("../../../skills/analytics/performance-improvement/page-quality-budgets.json", import.meta.url), "utf8")).budgets;
  const budget = budgets.find((b) => b.metric_key === "line_grid_issues");
  assert.ok(budget, "page-quality-budgets.json に line_grid_issues の予算が無い");
  assert.equal(budget.page_type, "all");
  assert.equal(budget.threshold, 0);
  assert.equal(budget.severity, "warning");
  const result = {
    url: "https://stats47.jp/search?q=x",
    path: "/search",
    template: "other",
    http_status: 200,
    fetched_at: "2026-11-14T00:00:00.000Z",
    expected_redirect_or_gone: false,
    error: null,
    metrics: { line_grid_issues: 3 },
    jsonld_type_counts: {},
    jsonld_errors: [],
  };
  const violations = evaluateResult(result, budgets, () => null);
  assert.deepEqual(violations.map((v) => [v.metric_key, v.actual, v.severity]), [["line_grid_issues", 3, "warning"]]);
});

test("手元の検査 (npm run ui-theme:line-grid) の既定の画面は、週次が見るページと同じ一覧を使い、検索・固定ページを含む", () => {
  const script = readFileSync(new URL("../../../../.claude/scripts/ui/check-line-grid.mjs", import.meta.url), "utf8");
  assert.match(script, /browserPages\(\)/, "既定の一覧を手書きに戻すと週次と食い違う");
  assert.match(script, /line-grid-probe\.mjs/, "判定を手元の検査に複製しない");
  const urls = browserPages().map((p) => p.url);
  for (const url of ["/search?q=%E4%BA%BA%E5%8F%A3", "/privacy", "/terms", "/ranking", "/geo/compare"]) {
    assert.ok(urls.includes(url), `週次のブラウザ検査に ${url} が無い`);
  }
});

test("UI 指摘のカードに、線の格子の直し方 (パネルの並べ方を直す) が載る", () => {
  const f = { metric_key: "line_grid_issues", key: "machine|https://stats47.jp/search|line_grid_issues" };
  assert.match(lineGridFixGuide([f]).join("\n"), /PanelGrid/);
  assert.deepEqual(lineGridFixGuide([{ metric_key: "clipped_text", key: "machine|u|clipped_text" }]), []);
});
