// AD-LAYOUT-WEEKLY-CAPTURE-01: 広告の配置の撮影 (capture-ad-layout.ts) が本番を開くとき、自動の閲覧が
// AdSense の表示・GA4 の計測・アフィリエイトの表示に混ざらないよう、広告・計測の通信を出さないことを固定する。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  AD_TRAFFIC_CONTEXT_OPTIONS,
  classifyAdTraffic,
  createAdTrafficTally,
  formatAdTrafficSummary,
  installAdTrafficBlock,
  requiresAdTrafficBlock,
  summarizeAdTraffic,
} from "../lib/ad-traffic-block.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// ── 止める通信の判定 ─────────────────────────────────────────────────────────

test("AdSense・GA4・アフィリエイトの通信を種類つきで判定する", () => {
  const cases = [
    ["https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1", "adsense"],
    ["https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-1", "adsense"],
    ["https://ep1.adtrafficquality.google/getconfig/sodar", "adsense"],
    ["https://www.google.com/pagead/1p-user-list/1/", "adsense"],
    ["https://www.googletagmanager.com/gtag/js?id=G-TEST", "analytics"],
    ["https://region1.google-analytics.com/g/collect?v=2&en=page_view", "analytics"],
    ["https://analytics.google.com/g/collect?v=2", "analytics"],
    ["https://www.google.co.jp/ads/ga-audiences?v=1", "adsense"],
    ["https://statics.a8.net/a8link/a8linkmgr.js", "affiliate"],
    ["https://www19.a8.net/0.gif?a8mat=XXXX", "affiliate"],
    ["https://px.a8.net/svt/ejp?a8mat=XXXX", "affiliate"],
    ["https://i.moshimo.com/af/i/impression?a_id=1", "affiliate"],
    ["https://t.afi-b.com/lead/abc/def/ghi", "affiliate"],
    ["https://ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=1&pid=2", "affiliate"],
    ["https://hbb.afl.rakuten.co.jp/hgb/abc/?pc=x", "affiliate"],
  ];
  for (const [url, kind] of cases) assert.equal(classifyAdTraffic(url), kind, url);
});

test("自分のサイト・画像の置き場・フォントは止めない", () => {
  const passed = [
    "https://stats47.jp/ranking/total-population",
    "https://stats47.jp/_next/static/chunks/main.js",
    "https://storage.stats47.jp/app/ranking/item.json",
    "https://fonts.gstatic.com/s/notosansjp/v1/a.woff2",
    "https://www.google.com/maps/embed?pb=1",
    // host の途中に同じ文字列を含むだけの別の host は止めない (末尾一致で判定する)
    "https://a8.net.example.com/x.gif",
    "https://nota8.net/x.gif",
    "data:image/png;base64,AAAA",
    "blob:https://stats47.jp/0000",
    "これは URL ではない",
  ];
  for (const url of passed) assert.equal(classifyAdTraffic(url), null, url);
});

test("URL オブジェクトでも判定する (Playwright の route は URL を渡す)", () => {
  assert.equal(classifyAdTraffic(new URL("https://www.googletagmanager.com/gtag/js")), "analytics");
});

// ── 止めるかどうか (本番は必ず止める) ─────────────────────────────────────────

test("手元の開発サーバー以外は必ず止める", () => {
  assert.equal(requiresAdTrafficBlock("https://stats47.jp"), true);
  assert.equal(requiresAdTrafficBlock("https://develop.stats47.pages.dev"), true);
  // 読めない URL は止める側に倒す
  assert.equal(requiresAdTrafficBlock("stats47.jp"), true);
  // 名前に localhost を含むだけの外の host は手元ではない
  assert.equal(requiresAdTrafficBlock("https://localhost.example.com"), true);
});

test("手元の開発サーバーは、頼まれない限り止めない (代わりの広告の画像を写すため)", () => {
  for (const url of ["http://localhost:3000", "http://127.0.0.1:3113", "http://[::1]:3000", "http://web.localhost:3000"]) {
    assert.equal(requiresAdTrafficBlock(url), false, url);
  }
});

// ── 差し込み (ブラウザを使わない確認) ────────────────────────────────────────

function fakeContext() {
  const listeners = new Map();
  const routes = [];
  return {
    routes,
    async route(matcher, handler) {
      routes.push({ matcher, handler });
    },
    on(event, handler) {
      listeners.set(event, [...(listeners.get(event) ?? []), handler]);
    },
    emit(event, payload) {
      for (const handler of listeners.get(event) ?? []) handler(payload);
    },
    /** ブラウザが要求を出したときの動き: route に当たれば handler を呼び、当たらなければ通す */
    async request(url) {
      this.emit("request", { url: () => url });
      const hit = routes.find((r) => r.matcher(new URL(url)));
      if (!hit) {
        this.emit("response", { url: () => url });
        return "passed";
      }
      let outcome = "pending";
      await hit.handler({
        request: () => ({ url: () => url }),
        abort: async (code) => {
          outcome = `aborted:${code}`;
        },
        continue: async () => {
          outcome = "continued";
        },
      });
      return outcome;
    },
  };
}

test("広告・計測の要求は中断し、種類ごとに数える。自分のサイトと他の外部の host は通す", async () => {
  const context = fakeContext();
  const tally = createAdTrafficTally("https://stats47.jp");
  await installAdTrafficBlock(context, tally);

  assert.equal(await context.request("https://stats47.jp/"), "passed");
  assert.equal(await context.request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"), "aborted:blockedbyclient");
  assert.equal(await context.request("https://googleads.g.doubleclick.net/pagead/ads"), "aborted:blockedbyclient");
  assert.equal(await context.request("https://www.googletagmanager.com/gtag/js?id=G-TEST"), "aborted:blockedbyclient");
  assert.equal(await context.request("https://www19.a8.net/0.gif"), "aborted:blockedbyclient");
  assert.equal(await context.request("https://storage.stats47.jp/app/x.json"), "passed");
  assert.equal(await context.request("https://storage.stats47.jp/app/y.json"), "passed");

  const summary = summarizeAdTraffic(tally);
  assert.deepEqual(summary.blocked, { adsense: 2, analytics: 1, affiliate: 1 });
  assert.equal(summary.blockedTotal, 4);
  assert.deepEqual(summary.leaked, []);
  // 一覧に無い外部の host は、止める一覧の漏れを人が読めるように残す (自分のサイトは数えない)
  assert.deepEqual(summary.passedThirdPartyHosts, { "storage.stats47.jp": 2 });
});

test("止めるはずの通信に応答が返ったら、通ったものとして記録する", async () => {
  const context = fakeContext();
  const tally = createAdTrafficTally("https://stats47.jp");
  await installAdTrafficBlock(context, tally);

  // route を通らずに届いた応答 (Service Worker 経由など) を模す
  context.emit("response", { url: () => "https://region1.google-analytics.com/g/collect?v=2" });

  const summary = summarizeAdTraffic(tally);
  assert.deepEqual(summary.leaked, ["https://region1.google-analytics.com/g/collect?v=2"]);
  assert.match(formatAdTrafficSummary(tally), /通った 1 件/);
});

test("まとめの 1 行は止めた件数・通った件数・一覧に無い外部の host を書く", async () => {
  const context = fakeContext();
  const tally = createAdTrafficTally("https://stats47.jp");
  await installAdTrafficBlock(context, tally);
  await context.request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
  await context.request("https://fonts.gstatic.com/s/a.woff2");

  const line = formatAdTrafficSummary(tally);
  assert.match(line, /止めた 1 件/);
  assert.match(line, /通った 0 件/);
  assert.match(line, /fonts\.gstatic\.com/);
});

test("Service Worker 経由の通信は route を通らないので、context の設定で止める", () => {
  assert.deepEqual(AD_TRAFFIC_CONTEXT_OPTIONS, { serviceWorkers: "block" });
});

// ── 撮影のスクリプトの配線 ────────────────────────────────────────────────────

test("撮影のスクリプトは、ページを開く前に通信の遮断を差し込み、外す引数を持たない", () => {
  const source = readFileSync(join(HERE, "..", "capture-ad-layout.ts"), "utf8");
  // 止めるかどうかは接続先で決める (本番は必ず止める)
  assert.match(source, /requiresAdTrafficBlock\(/);
  const install = source.indexOf("installAdTrafficBlock(context");
  const newPage = source.indexOf("context.newPage()");
  assert.ok(install > 0, "installAdTrafficBlock(context, …) を呼んでいない");
  assert.ok(install < newPage, "context.newPage() より前に差し込む (最初の要求から止めるため)");
  assert.match(source, /AD_TRAFFIC_CONTEXT_OPTIONS/);
  // 本番で遮断を外す引数を作らない (作れば使われる)
  assert.doesNotMatch(source, /--(?:no-block|allow-ad|skip-block|unblock)/);
});

// ── 実際のブラウザでの確認 (届いた要求をサーバー側で数える) ──────────────────────
// すべての host を手元のサーバーへ向けるので、遮断が効いていなくても外へは出ない。

const PAGE_HOST = "stats47.test";
const AD_URLS = [
  "http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0",
  "http://www.googletagmanager.com/gtag/js?id=G-TEST",
  "http://www19.a8.net/0.gif?a8mat=TEST",
];
const BEACON_URL = "http://region1.google-analytics.com/g/collect?v=2&en=page_view";
const FETCH_URL = "http://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-0";
const PAGE_HTML = `<!doctype html><html><body><h1>page</h1>
<script async src="${AD_URLS[0]}"></script>
<script async src="${AD_URLS[1]}"></script>
<img src="${AD_URLS[2]}" width="1" height="1">
<img src="http://images.example.test/photo.png" width="10" height="10">
<script>
  navigator.sendBeacon(${JSON.stringify(BEACON_URL)}, "x");
  fetch(${JSON.stringify(FETCH_URL)}, { mode: "no-cors" }).catch(() => {});
</script></body></html>`;

async function visitWithServer(chromium, { block }) {
  const hits = [];
  const server = createServer((req, res) => {
    const host = (req.headers.host ?? "").replace(/:\d+$/, "");
    hits.push(`${host}${req.url}`);
    if (host === PAGE_HOST && req.url === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(PAGE_HTML);
      return;
    }
    res.writeHead(200, { "content-type": "text/plain", "access-control-allow-origin": "*" });
    res.end("ok");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const browser = await chromium.launch({ headless: true, args: [`--host-resolver-rules=MAP * 127.0.0.1:${port}`] });
  try {
    const baseUrl = `http://${PAGE_HOST}`;
    const tally = createAdTrafficTally(baseUrl);
    const context = await browser.newContext(block ? AD_TRAFFIC_CONTEXT_OPTIONS : {});
    if (block) await installAdTrafficBlock(context, tally);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "load" });
    await page.waitForTimeout(500);
    await context.close();
    const adHits = hits.filter((hit) => classifyAdTraffic(`http://${hit}`) !== null);
    return { hits, adHits, tally };
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

test("PR の workflow は、このテストを走らせる job で先に Chromium を入れる", () => {
  // 入れないと下の実ブラウザの確認が CI で毎回 skip になり、遮断が壊れても緑のまま (CI-TOOLING-FOLLOWUP-03)
  const workflow = readFileSync(join(HERE, "..", "..", "..", "..", ".github", "workflows", "pr-quality-check.yml"), "utf8");
  const run = workflow.indexOf("node --test .claude/scripts/ads/__tests__/*.test.mjs");
  assert.ok(run > 0, "pr-quality-check.yml で ads のテストを走らせる step を見つけられない");
  const jobHeader = [...workflow.slice(0, run).matchAll(/\n  ([a-z][a-z0-9-]*):\n/g)].pop();
  assert.ok(jobHeader, "ads のテストを走らせる job を見つけられない");
  const job = workflow.slice(jobHeader.index, run);
  assert.match(job, /npx playwright install (?:--with-deps )?chromium/, `${jobHeader[1]} の job が Chromium を入れていない`);
});

test("実際のブラウザで、遮断を差し込むと広告・計測の要求がサーバーに 1 件も届かない", async (t) => {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
    const probe = await chromium.launch({ headless: true });
    await probe.close();
  } catch (error) {
    // CI は Chromium を入れてから走らせるので、起動できないのは配線の壊れ。skip にせず落とす
    if (process.env.CI) throw error;
    t.skip(`Chromium を起動できない環境なので飛ばす: ${String(error.message).split("\n")[0]}`);
    return;
  }

  // 遮断なし: この確認が広告・計測の要求を数えられることを先に示す (0 件が「数えていない」ではないこと)
  const open = await visitWithServer(chromium, { block: false });
  assert.equal(open.adHits.length, AD_URLS.length + 2, `遮断なしで届いた広告・計測の要求: ${open.adHits.join(", ")}`);

  const blocked = await visitWithServer(chromium, { block: true });
  assert.deepEqual(blocked.adHits, []);
  // ページ自身と、一覧に無い外部の画像は届く (止めすぎていない)
  assert.ok(blocked.hits.includes(`${PAGE_HOST}/`));
  assert.ok(blocked.hits.includes("images.example.test/photo.png"));
  const summary = summarizeAdTraffic(blocked.tally);
  assert.deepEqual(summary.blocked, { adsense: 2, analytics: 2, affiliate: 1 });
  assert.deepEqual(summary.leaked, []);
  assert.deepEqual(summary.passedThirdPartyHosts, { "images.example.test": 1 });
});
