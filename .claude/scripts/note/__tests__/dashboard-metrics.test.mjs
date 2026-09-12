import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { extractDashboardDom, collectDashboardPages } from "../lib/dashboard-dom.mjs";
import { buildDashboardSnapshot, buildCoverMetricsReport, coverMetricsCsv, parseCount, defaultPeriod, validatePeriod } from "../lib/dashboard-metrics.mjs";

const now = "2026-09-12T02:00:00Z";
const period = { start: "2026-08-15", end: "2026-09-11" };
function fixture() {
  return { now, period,
    catalog: { account: "stats47", articles: [{ key: "article-1", noteUrl: "https://note.com/stats47/n/na1", vertical: "stats47-note", series: "A", isPaid: false }] },
    raw: { account: "stats47", timeZone: "Asia/Tokyo", url: "https://note.com/dashboard?period=CUSTOM&date=2026-08-15&to=2026-09-11",
      periodText: "2026/8/15〜2026/9/11", periodLabel: "カスタム", articleAggregatedAt: "2026/9/12 05:45 集計", summaryAggregatedAt: "2026/9/12 05:45 集計",
      tableCount: 1, selectedTab: "記事", hasMore: false, paginationComplete: true, pages: 1,
      headers: ["タイトル", "インプレッション", "ページビュー", "スキ", "コメント", "売上"],
      rows: [{ url: "https://note.com/stats47/n/na1", title: "統計記事", statusText: "公開中", publishedText: "2026年1月1日", cells: ["統計記事", "1,438", "270", "4", "-", "2,980円"] }],
      summary: { インプレッション: "1,438", ページビュー: "270", スキ: "4", コメント: "-", 売上: "5,960" },
    } };
}
function covers() {
  return { account: "stats47", completedAt: now, coverage: { complete: true }, articles: [{ noteKey: "na1", cover: { status: "missing", url: null } }] };
}
test("桁区切りを全桁読み、ハイフン0と不明な値を区別する", () => {
  assert.equal(parseCount("1,438"), 1438); assert.equal(parseCount("-"), 0); assert.equal(parseCount("2,980 円"), 2980);
  for (const value of [null, undefined, "", "1,43", "1.2万", "1.5", "NaN", "-1", "9007199254740992"]) assert.throws(() => parseCount(value));
});
test("昨日までの28日をJSTで決め、未確定日・未計測期間を拒否する", () => {
  assert.deepEqual(defaultPeriod("2026-09-11T16:00:00Z"), period);
  for (const p of [{ start: "2026-08-15", end: "2026-09-12" }, { start: "2026-02-30", end: "2026-09-11" }, { start: "2021-04-30", end: "2026-09-11" }]) assert.throws(() => validatePeriod(p, now));
});
test("新指標を旧viewsへ別名保存せず、売上は記事単位で合算する", () => {
  const s = buildDashboardSnapshot(fixture());
  assert.equal(s.status, "pass"); assert.equal(s.coverage.complete, true);
  assert.equal(s.articles[0].impressions, 1438); assert.equal(s.articles[0].pageViews, 270);
  assert.equal(s.totals.salesJpy, 2980); assert.equal(s.dashboardTotals.salesJpy, 5960);
  assert.equal(Object.hasOwn(s.articles[0], "views"), false);
});
test("列が並び替わってもヘッダー名で対応する", () => {
  const f = fixture();
  [f.raw.headers[1], f.raw.headers[2]] = [f.raw.headers[2], f.raw.headers[1]];
  [f.raw.rows[0].cells[1], f.raw.rows[0].cells[2]] = [f.raw.rows[0].cells[2], f.raw.rows[0].cells[1]];
  const s = buildDashboardSnapshot(f); assert.equal(s.status, "pass"); assert.equal(s.articles[0].pageViews, 270);
});
for (const [name, mutate] of [
  ["別アカウント", f => { f.raw.account = "other"; }],
  ["別アカウント記事", f => { f.raw.rows[0].url = "https://note.com/other/n/na1"; }],
  ["タイムゾーン不一致", f => { f.raw.timeZone = "UTC"; }],
  ["画面の期間不一致", f => { f.raw.periodText = "2026/8/16〜2026/9/12"; }],
  ["URLの期間不一致", f => { f.raw.url = f.raw.url.replace("2026-08-15", "2026-08-16"); }],
  ["古い集計時刻", f => { f.raw.articleAggregatedAt = "2026/9/11 05:45 集計"; }],
  ["未取得ページ", f => { f.raw.hasMore = true; }],
  ["終端未確認", f => { f.raw.paginationComplete = false; }],
  ["重複記事", f => { f.raw.rows.push(structuredClone(f.raw.rows[0])); }],
  ["重複列", f => { f.raw.headers[2] = "インプレッション"; }],
  ["旧ビュー列", f => { f.raw.headers[2] = "ビュー"; }],
  ["空の数値セル", f => { f.raw.rows[0].cells[2] = ""; }],
  ["合計不一致", f => { f.raw.summary.ページビュー = "500"; }],
  ["取得0件", f => { f.raw.rows = []; }],
  ["不明な公開状態", f => { f.raw.rows[0].statusText = "不明"; }],
]) test(`${name}を成功扱いしない`, () => {
  const f = fixture(); mutate(f); const s = buildDashboardSnapshot(f);
  assert.equal(s.status, "incomplete"); assert.equal(s.coverage.complete, false); assert.ok(s.issues.length);
});
test("カタログ未登録と一覧欠落をそれぞれ検知する", () => {
  const f = fixture(); f.catalog.articles[0].noteUrl = "https://note.com/stats47/n/na2";
  const s = buildDashboardSnapshot(f);
  assert.deepEqual(s.issues.map(i => i.code), ["published_not_in_catalog", "catalog_article_missing"]);
});
test("期間途中の新規記事を全期間の比較候補にしない", () => {
  const f = fixture(); f.raw.rows[0].publishedText = "2026年9月6日";
  const s = buildDashboardSnapshot(f); assert.equal(s.status, "pass"); assert.equal(s.articles[0].fullPeriodExposure, false);
  const r = buildCoverMetricsReport(s, covers(), now); assert.equal(r.articles[0].baselineEligible, false);
});
test("カバー状態を突合してもCTRを作らず、未設定を修正対象にする", () => {
  const r = buildCoverMetricsReport(buildDashboardSnapshot(fixture()), covers(), now);
  assert.equal(r.status, "pass"); assert.equal(r.ctr, null); assert.equal(r.summary.remediation, 1);
  assert.equal(r.articles[0].lane, "remediation");
});
test("古いカバー監査・未知のカバー・不完全な計測を隠さない", () => {
  const s = buildDashboardSnapshot(fixture()); const c = covers();
  c.completedAt = "2026-09-01T00:00:00Z"; assert.equal(buildCoverMetricsReport(s, c, now).status, "incomplete");
  c.completedAt = now; c.articles[0].cover.status = "unknown"; assert.equal(buildCoverMetricsReport(s, c, now).status, "incomplete");
  s.status = "incomplete"; assert.equal(buildCoverMetricsReport(s, covers(), now).status, "incomplete");
});
test("期間内の欠落行を0にせず、合計一致した記事だけを棚卸しに利用する", () => {
  const f = fixture(); const c = covers();
  f.catalog.articles.push({ key: "article-2", noteUrl: "https://note.com/stats47/n/na2" });
  c.articles.push({ noteKey: "na2", noteUrl: "https://note.com/stats47/n/na2", title: "欠測記事", cover: { status: "configured" } });
  const r = buildCoverMetricsReport(buildDashboardSnapshot(f), c, now);
  assert.equal(r.status, "incomplete"); assert.equal(r.summary.metricsObserved, 1); assert.equal(r.summary.metricsMissing, 1);
  assert.equal(r.articles[0].baselineEligible, true);
  const missing = r.articles.find(a => a.noteId === "na2");
  assert.equal(missing.impressions, null); assert.equal(missing.pageViews, null); assert.equal(missing.baselineEligible, false);
  f.raw.summary.ページビュー = "500";
  assert.deepEqual(buildCoverMetricsReport(buildDashboardSnapshot(f), c, now).articles, []);
});
test("未知のカバーと重複監査は比較候補にしない", () => {
  const s = buildDashboardSnapshot(fixture()); const c = covers();
  c.articles[0].cover.status = "unknown";
  assert.equal(buildCoverMetricsReport(s, c, now).articles[0].baselineEligible, false);
  c.articles.push(c.articles[0]); assert.deepEqual(buildCoverMetricsReport(s, c, now).articles, []);
});
test("CSVは欠測空欄と実測0を保持し、式や引用符を無害化する", () => {
  const r = buildCoverMetricsReport(buildDashboardSnapshot(fixture()), covers(), now);
  r.articles[0].title = '=SUM(1,2) "test"'; r.articles[0].pageViews = null;
  const csv = coverMetricsCsv(r);
  assert.ok(csv.includes('"\'=SUM(1,2) ""test"""'));
  assert.ok(csv.includes('"1438","","4","0","2980"'));
});
test("DOMはグラフ用tableを除外し、記事一覧と円付き売上を読む", () => {
  const html = `<section><button aria-label="期間選択">カスタム</button><p>2026/8/15〜2026/9/11</p>
    ${["インプレッション", "ページビュー", "スキ", "コメント", "売上"].map(label => `<div><div><p>${label}</p></div><div><p>${label === "売上" ? "-" : "1,438"}</p>${label === "売上" ? "<p>円</p>" : ""}</div></div>`).join("")}
    <table><thead><th>項目</th><th>インプレッション</th></thead><tbody><tr><td>1</td></tr></tbody></table>
    <p>2026/9/12 05:45 集計</p><div role="tab" aria-selected="true">記事</div><p data-testid="last-aggregated-at">2026/9/12 05:45 集計</p>
    <table aria-label="記事一覧"><thead><tr>${fixture().raw.headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody><tr>
    <td><a href="https://note.com/stats47/n/na1">記事</a><span><span>公開中</span><span>2026年1月1日</span></span></td><td>1,438</td><td>270</td><td>4</td><td>-</td><td>-</td></tr></tbody></table><button>もっとみる</button></section>`;
  const dom = new JSDOM(html, { url: fixture().raw.url, runScripts: "outside-only" });
  const raw = dom.window.eval(`(${extractDashboardDom.toString()})()`);
  assert.equal(raw.tableCount, 1); assert.equal(raw.rows.length, 1); assert.equal(raw.rows[0].statusText, "公開中");
  assert.equal(raw.summary.売上, "-"); assert.equal(raw.articleAggregatedAt, "2026/9/12 05:45 集計"); assert.equal(raw.hasMore, true);
  dom.window.close();
});

test("もっとみるが一瞬消えた後も全ページを取り切る", async () => {
  const state = (count, hasMore) => ({ rows: Array(count).fill({}), hasMore });
  const settled = [state(40, true), state(41, false)];
  const loaded = [state(40, false), state(41, false)];
  const result = await collectDashboardPages({ initial: state(20, true), settle: async () => {},
    read: async () => settled.shift(), loadMore: async () => loaded.shift() });
  assert.equal(result.rows.length, 41); assert.equal(result.pages, 3); assert.equal(result.paginationComplete, true);
});
test("ページ数上限と増えない一覧は終端扱いしない", async () => {
  const initial = { rows: [{}], hasMore: true };
  await assert.rejects(collectDashboardPages({ initial, maxPages: 1 }), /pagination_limit/);
  await assert.rejects(collectDashboardPages({ initial, loadMore: async () => initial }), /pagination_no_progress/);
});
