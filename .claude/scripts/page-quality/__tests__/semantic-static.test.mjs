// 表示の意味の検査 (SITE-DISPLAY-SEMANTICS-AUDIT-01 層 2・層 3)。
import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

import { adShopKey, analyzeHtml } from "../lib/measure-static.ts";
import { applyTitleChanges, UI_METRIC_KEYS } from "../lib/ui-report.ts";
import { evaluateTypography, SMALL_TEXT_PX } from "../lib/ui-probe.ts";
import { observeFindings, planUiCards, syncFindings } from "../lib/ui-findings.ts";

const BASE = "https://stats47.jp/areas/13000";

test("画面に出た内部用語 (保存則など) を数え、script・RSC payload の中は数えない", () => {
  const html = `<html><body>
    <p>洪水の面積は保存則で検算しました。</p>
    <script>self.__next_f.push(["SSOT rankingKey 保存則"])</script>
    <p>SSOTS や TODOS のような別の語は数えない</p>
  </body></html>`;
  const a = analyzeHtml(html, BASE);
  assert.equal(a.internal_jargon_terms, 1);
  assert.deepEqual(a.semantic_findings, ["internal_jargon: 保存則 ×1"]);
});

test("同じページで % と ％ が混ざったときだけ単位記号の揺れとして数える", () => {
  const mixed = `<html><body><p>高齢化率 29.1%</p><p>年少人口割合 11.2％</p><p>持ち家率 60.1％</p></body></html>`;
  const halfOnly = `<html><body><p>29.1%</p><p>11.2 %</p></body></html>`;
  assert.equal(analyzeHtml(mixed, BASE).unit_symbol_mixing, 1);
  assert.equal(analyzeHtml(halfOnly, BASE).unit_symbol_mixing, 0);
});

test("値の描画失敗 (NaN / undefined / [object Object]) を数え、英単語の一部は数えない", () => {
  const html = `<html><body><p>人口 NaN 人</p><p>undefined位</p><p>[object Object]</p><p>Nanaimo undefinedness</p><p>記事のコード例 <code>return NaN</code></p><pre>let d = Infinity;</pre></body></html>`;
  assert.equal(analyzeHtml(html, BASE).abnormal_value_strings, 3);
});

test("同じ店の別リンクの広告を数え、同じ href の重複 (ad_duplicate_count の担当) は数えない", () => {
  const html = `<html><body>
    <a rel="sponsored" href="https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5YZ75">バナー</a>
    <a rel="sponsored" href="https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5Z6WX">テキスト</a>
    <a rel="sponsored" href="https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75">別の店</a>
    <a rel="sponsored" href="https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75">別の店 (同じ href)</a>
  </body></html>`;
  const a = analyzeHtml(html, BASE);
  assert.equal(a.same_shop_ad_duplicates, 1);
  assert.equal(a.ad_duplicate_count, 1);
});

test("店の判定は ASP ごとの案件 ID (A8 の 2 番目の token・もしも p_id・楽天は遷移先の店)", () => {
  assert.equal(adShopKey("https://px.a8.net/svt/ejp?a8mat=AAA+BBB+CCC+DDD"), "a8:BBB");
  assert.equal(adShopKey("https://af.moshimo.com/af/c/click?a_id=1&p_id=54&pc_id=2"), "moshimo:54");
  assert.equal(
    adShopKey(`https://hb.afl.rakuten.co.jp/hgc/x/?pc=${encodeURIComponent("https://item.rakuten.co.jp/shopa/item1/")}`),
    "rakuten:shopa",
  );
  assert.equal(adShopKey("https://example.com/"), null);
});

test("<title> の前回からの変化を title_changed にし、前回に無い URL は測らない", () => {
  const current = [
    { url: "https://stats47.jp/areas/13000", page_title: "東京都 | 1位 588 件", metrics: {} },
    { url: "https://stats47.jp/areas/01000", page_title: "北海道", metrics: {} },
    { url: "https://stats47.jp/new", page_title: "新規", metrics: {} },
  ];
  const previous = {
    results: [
      { url: "https://stats47.jp/areas/13000", page_title: "東京都 | 耕地放棄面積" },
      { url: "https://stats47.jp/areas/01000", page_title: "北海道" },
    ],
  };
  assert.equal(applyTitleChanges(current, previous), 1);
  assert.equal(current[0].metrics.title_changed, 1);
  assert.equal(current[1].metrics.title_changed, 0);
  assert.equal(current[2].metrics.title_changed, undefined);
  assert.equal(applyTitleChanges(current, null), 0);
});

test("表示の意味の指標は UI 指摘キューへ流す対象に入っている", () => {
  for (const key of [
    "internal_jargon_terms",
    "unit_symbol_mixing",
    "abnormal_value_strings",
    "same_shop_ad_duplicates",
    "title_changed",
    "small_text_count",
    "mobile_page_height",
  ]) {
    assert.ok(UI_METRIC_KEYS.includes(key), key);
  }
});

test("表示の意味の違反は UI 指摘キューに machine の指摘として入り、カードに定義単位の直し方が載る", () => {
  const violation = {
    url: "https://stats47.jp/areas/13000",
    template: "prefecture-detail",
    metric_key: "internal_jargon_terms",
    comparison: "absolute",
    operator: "<=",
    threshold: 0,
    actual: 2,
    previous: null,
    severity: "warning",
  };
  const observed = observeFindings({ violations: [violation, { ...violation, metric_key: "html_bytes" }] }, []);
  assert.deepEqual(observed.map((f) => f.key), ["machine|https://stats47.jp/areas/13000|internal_jargon_terms"]);
  const { queue } = syncFindings([], observed, {
    today: "2026-10-04",
    auditAt: "2026-10-04T00:00:00Z",
    mainDeployedAt: null,
    openCardIds: [],
    agentReviewed: false,
  });
  assert.equal(queue[0].status, "pending");
  const [card] = planUiCards({ queue, openIds: [], today: "2026-10-04", screenshotBaseUrl: "https://storage.stats47.jp" });
  assert.match(card.markdown, /表示の意味 \(定義単位で直す\)/);
});

test("11px 未満の見える文字を数え、SVG 内・非表示・sr-only は数えない。ページ高さも返す", async () => {
  assert.equal(SMALL_TEXT_PX, 11);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
    await page.setContent(`<html><body style="margin:0">
      <p style="font-size:16px">本文</p>
      <span style="font-size:10px">出典: 総務省</span>
      <small style="font-size:9px">2023年</small>
      <span style="font-size:11px">11px ちょうどは数えない</span>
      <svg width="100" height="40"><text x="0" y="20" style="font-size:8px">軸</text></svg>
      <span style="font-size:8px;display:none">非表示</span>
      <span style="font-size:8px;position:absolute;width:1px;height:1px;overflow:hidden">読み上げ用</span>
      <div style="height:3000px"></div>
    </body></html>`);
    const t = await evaluateTypography(page);
    assert.equal(t.small_text_count, 2);
    assert.ok(t.page_height >= 3000, `page_height=${t.page_height}`);
  } finally {
    await browser.close();
  }
});
