import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

import { analyzeHtml } from "../lib/measure-static.ts";
import { checkImages } from "../lib/check-images.ts";
import { evaluateLayoutIssues } from "../lib/ui-probe.ts";

const BASE = "https://stats47.jp/blog/sample";

test("空の見出しを数え、読み込み中の仮枠・alt・aria-label 付きは数えない", () => {
  const html = `<html><body>
    <h2>本文の見出し</h2>
    <h3></h3>
    <h3> <span></span> </h3>
    <h3><div class="animate-pulse h-5 w-40"></div></h3>
    <h2><img src="/images/logo.svg" alt="stats47"></h2>
    <h2 aria-label="ランキング"></h2>
  </body></html>`;
  assert.equal(analyzeHtml(html, BASE).empty_headings, 2);
});

test("画像確認の対象は自サイトと R2 の <img> だけで、ASP の計測画像・_next・data URI・代替のある <source> は含めない", () => {
  const html = `<html><body>
    <img src="https://storage.stats47.jp/app/blog/sample/data/map.svg">
    <picture><source media="(max-width: 639px)" srcset="https://storage.stats47.jp/app/blog/sample/data/map-mobile.svg 1x"><img src="/images/hero.png"></picture>
    <img src="https://www10.a8.net/0.gif?a8mat=xxx">
    <img src="https://thumbnail.image.rakuten.co.jp/x.jpg">
    <img src="/_next/image?url=%2Fimages%2Fa.png&w=640&q=75">
    <img src="data:image/png;base64,AAAA">
    <img src="https://storage.stats47.jp/app/blog/sample/data/map.svg#frag">
  </body></html>`;
  assert.deepEqual(analyzeHtml(html, BASE).image_urls.sort(), [
    "https://stats47.jp/images/hero.png",
    "https://storage.stats47.jp/app/blog/sample/data/map.svg",
  ]);
});

test("代替表示のある特産品画像の欠落は degraded_images に分け、壊れた画像には数えない", async () => {
  const results = [
    {
      url: "a",
      path: "/areas/07000",
      metrics: {},
      image_urls: [
        "https://storage.stats47.jp/app/areas/07000/specialty/nameko.webp",
        "https://storage.stats47.jp/app/areas/07000/ogp/ogp.png",
      ],
    },
  ];
  await checkImages(results, { probe: async () => ({ ok: false, status: 404 }) });
  assert.equal(results[0].metrics.broken_images, 1);
  assert.equal(results[0].metrics.degraded_images, 1);
  assert.deepEqual(results[0].ui_findings, [
    "broken_image: https://storage.stats47.jp/app/areas/07000/ogp/ogp.png (HTTP 404)",
    "degraded_image: https://storage.stats47.jp/app/areas/07000/specialty/nameko.webp (HTTP 404)",
  ]);
});

test("画像切れはページごとに数え、通信失敗は壊れた画像に数えない", async () => {
  const results = [
    { url: "a", path: "/a", metrics: {}, image_urls: ["https://x/ok.svg", "https://x/404.svg", "https://x/net.svg"] },
    { url: "b", path: "/b", metrics: {}, image_urls: ["https://x/ok.svg"] },
  ];
  const probed = [];
  const probe = async (url) => {
    probed.push(url);
    if (url.endsWith("404.svg")) return { ok: false, status: 404 };
    if (url.endsWith("net.svg")) return { ok: null, reason: "ECONNRESET" };
    return { ok: true };
  };
  const summary = await checkImages(results, { probe });
  assert.deepEqual(summary, { checked: 3, broken: 1, unverified: 1 });
  assert.equal(probed.length, 3, "同じ画像を 2 回確認しない");
  assert.equal(results[0].metrics.broken_images, 1);
  assert.deepEqual(results[0].ui_findings, ["broken_image: https://x/404.svg (HTTP 404)"]);
  assert.equal(results[1].metrics.broken_images, 0);
  assert.equal(results[0].image_urls, undefined, "検査の入力はスナップショットに残さない");
});

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

test("文字が枠からはみ出して切れている要素を検出し、ellipsis と line-clamp は意図した省略として除外する", async (t) => {
  const long = "とても長い都道府県ランキングの見出しがカードの幅を超えてしまう例です".repeat(2);
  await withPage(
    t,
    `<body style="margin:0">
      <div id="cut" style="width:120px;height:20px;overflow:hidden;white-space:nowrap">${long}</div>
      <div style="width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${long}</div>
      <div style="width:120px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${long}</div>
      <div style="width:400px;overflow:hidden">短い文</div>
      <div style="width:120px;height:80px;overflow:hidden"><span>地図</span><div style="width:600px;height:300px"></div></div>
    </body>`,
    async (page) => {
      const { clipped } = await evaluateLayoutIssues(page);
      assert.equal(clipped.length, 1, JSON.stringify(clipped));
      assert.match(clipped[0], /^div/);
    }
  );
});

test("タップできる要素の重なりを検出し、入れ子と離れた要素は数えない", async (t) => {
  await withPage(
    t,
    `<body style="margin:0;position:relative">
      <a href="/a" style="position:absolute;left:0;top:0;width:100px;height:48px;display:block">A</a>
      <button style="position:absolute;left:40px;top:10px;width:100px;height:48px">B</button>
      <a href="/c" style="position:absolute;left:0;top:200px;width:100px;height:48px;display:block">C<button style="width:40px;height:40px">in</button></a>
      <a href="/d" style="position:absolute;left:200px;top:300px;width:100px;height:48px;display:block">D</a>
      <p style="position:absolute;left:0;top:400px;width:150px;font-size:16px;line-height:24px">出典は<a href="/e">国土数値情報をNIIが加工</a> <a href="/f">CC BY-SA 4.0</a>です</p>
      <div style="position:fixed;left:0;top:0;width:412px;height:60px"><button style="width:100px;height:48px">同意する</button></div>
      <div style="position:absolute;left:0;top:500px;height:0;overflow:hidden"><a href="/g" style="display:block;width:100px;height:48px">G</a></div>
      <a href="/h" style="position:absolute;left:0;top:500px;width:100px;height:48px;display:block">H</a>
      <details style="position:absolute;left:0;top:600px"><summary>カテゴリ</summary><a href="/i" style="display:block;width:100px;height:48px">I</a></details>
      <a href="/j" style="position:absolute;left:0;top:620px;width:100px;height:48px;display:block">J</a>
    </body>`,
    async (page) => {
      // 本番の検査はこの前に全リンクの位置を測る (small_tap_targets)。閉じた <details> の中身は
      // 位置を一度問い合わせるまで大きさ 0 なので、同じ順序にしないと除外の有無を検証できない。
      await page.evaluate(() => {
        for (const el of document.querySelectorAll("a, button")) el.getBoundingClientRect();
      });
      const { overlaps } = await evaluateLayoutIssues(page);
      assert.equal(overlaps.length, 1, JSON.stringify(overlaps));
      assert.match(overlaps[0], /"A".*⇄.*"B"/);
    }
  );
});
