/**
 * candidate engine tests — 決定的ルールの検証。
 *   node --test .claude/scripts/search-growth/__tests__/candidate.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createObservation } from "../lib/contracts.mjs";
import { buildCandidates } from "../lib/scoring.mjs";

const PERIOD = { periodStart: "2026-07-13", periodEnd: "2026-07-19" };
function obs(source, metric, value, dims = {}, freshness = "fresh") {
  return createObservation({ source, metric, value, dimensions: dims, freshness, ...PERIOD });
}
function types(cands, url) {
  return cands.filter((c) => c.url === url).map((c) => c.type);
}

test("CTR: impressions が最低標本未満なら ctr-opportunity を出さない", () => {
  const url = "/ranking/low-sample";
  const cands = buildCandidates([
    obs("gsc", "impressions", 50, { page: url }),
    obs("gsc", "ctr", 0.001, { page: url }),
    obs("gsc", "position", 8, { page: url }),
  ]);
  assert.ok(!types(cands, url).includes("ctr-opportunity"), "標本不足なのに CTR candidate が出た");
});

test("CTR: 十分な impressions + 低 CTR で ctr-opportunity", () => {
  const url = "/ranking/ctr-op";
  const cands = buildCandidates([
    obs("gsc", "impressions", 1000, { page: url }),
    obs("gsc", "ctr", 0.005, { page: url }),
    obs("gsc", "position", 8, { page: url }),
  ]);
  const c = cands.find((x) => x.url === url && x.type === "ctr-opportunity");
  assert.ok(c, "ctr-opportunity が出ていない");
  assert.ok(c.evidence.length >= 3, "evidence が揃っていない");
  assert.ok(c.score > 0);
  // 過去 title rewrite の effect/none を踏まえ confidence は抑制されている
  assert.ok(c.scoreBreakdown.confidence < 0.6);
});

test("striking-distance: position 5〜15 + 需要ありで検出", () => {
  const url = "/ranking/striking";
  const cands = buildCandidates([
    obs("gsc", "impressions", 300, { page: url }),
    obs("gsc", "position", 8, { page: url }),
  ]);
  assert.ok(types(cands, url).includes("striking-distance"));
});

test("mobile-gap: mobile だけ CTR が悪いと検出", () => {
  const url = "/ranking/mobile";
  const cands = buildCandidates([
    obs("gsc", "impressions", 200, { page: url, device: "mobile" }),
    obs("gsc", "ctr", 0.01, { page: url, device: "mobile" }),
    obs("gsc", "ctr", 0.05, { page: url, device: "desktop" }),
  ]);
  assert.ok(types(cands, url).includes("mobile-gap"));
});

test("indexability-conflict: sitemap 掲載かつ noindex", () => {
  const url = "/ranking/conflict";
  const cands = buildCandidates([
    obs("static", "inSitemap", true, { page: url }),
    obs("static", "noindex", true, { page: url }),
  ]);
  assert.ok(types(cands, url).includes("indexability-conflict"));
});

test("soft-404-risk: thin 200", () => {
  const url = "/ranking/soft";
  const cands = buildCandidates([
    obs("http", "status", 200, { page: url }),
    obs("static", "coverageCategory", "soft-404", { page: url }),
  ]);
  assert.ok(types(cands, url).includes("soft-404-risk"));
});

test("crawled-not-indexed: 登録済みの Inspection は古い coverage category を上書き", () => {
  const url = "/ranking/indexed";
  const cands = buildCandidates([
    obs("inspection", "coverageState", "送信して登録されました", { page: url }),
    obs("http", "status", 200, { page: url }),
    obs("static", "coverageCategory", "crawled-not-indexed", { page: url }),
  ]);
  assert.ok(!types(cands, url).includes("crawled-not-indexed"));
});

test("canonical-drift: user と Google canonical 不一致", () => {
  const url = "/ranking/canon";
  const cands = buildCandidates([
    obs("inspection", "userCanonical", "https://stats47.jp/ranking/canon", { page: url }),
    obs("inspection", "googleCanonical", "https://stats47.jp/ranking/other", { page: url }),
  ]);
  assert.ok(types(cands, url).includes("canonical-drift"));
});

test("dedupe: 同一 URL・同一原因は 1 候補", () => {
  const url = "/ranking/dup";
  const base = [
    obs("gsc", "impressions", 300, { page: url }),
    obs("gsc", "position", 8, { page: url }),
  ];
  // 観測を重複して渡しても candidate は重複しない
  const cands = buildCandidates([...base, ...base]);
  const sd = cands.filter((c) => c.url === url && c.type === "striking-distance");
  assert.equal(sd.length, 1, "striking-distance が重複した");
});

test("past effect none/adverse は confidence を抑制する", () => {
  const url = "/ranking/past";
  const feed = [
    obs("gsc", "impressions", 1000, { page: url }),
    obs("gsc", "ctr", 0.005, { page: url }),
    obs("gsc", "position", 8, { page: url }),
  ];
  const base = buildCandidates(feed).find((c) => c.type === "ctr-opportunity");
  const adverse = buildCandidates(feed, { pastEffects: { [url]: "adverse" } }).find((c) => c.type === "ctr-opportunity");
  assert.ok(adverse.scoreBreakdown.confidence < base.scoreBreakdown.confidence);
  assert.ok(adverse.score < base.score);
  assert.ok(adverse.limitations.some((l) => /adverse/.test(l)));
});

test("決定的順序: 2 回実行で同一 id 順序", () => {
  const feed = [
    obs("gsc", "impressions", 1000, { page: "/a" }),
    obs("gsc", "ctr", 0.005, { page: "/a" }),
    obs("gsc", "position", 8, { page: "/a" }),
    obs("gsc", "impressions", 500, { page: "/b" }),
    obs("gsc", "position", 7, { page: "/b" }),
    obs("http", "status", 500, { page: "/c" }),
  ];
  const a = buildCandidates(feed).map((c) => c.id);
  const b = buildCandidates(feed).map((c) => c.id);
  assert.deepEqual(a, b);
});

test("missing を 0 と混同しない: CTR 欠損 → 候補なし / 需要あり → measurement-gap", () => {
  const url = "/ranking/missing";
  const cands = buildCandidates([
    obs("gsc", "impressions", 200, { page: url }), // ctr/position/ga4/psi/crux 無し
  ]);
  const t = types(cands, url);
  assert.ok(!t.includes("ctr-opportunity"), "欠損を 0 CTR として候補化してはいけない");
  assert.ok(t.includes("measurement-gap"), "需要ありでデータ欠損なら measurement-gap を出す");
  const mg = cands.find((c) => c.type === "measurement-gap");
  assert.match(mg.expectedMetric, /ga4:sessions/);
});

test("server-risk: 5xx を検出し externalActionFlag は false (read-only 提案)", () => {
  const url = "/ranking/5xx";
  const cands = buildCandidates([obs("http", "status", 503, { page: url })]);
  const c = cands.find((x) => x.type === "server-risk");
  assert.ok(c);
  assert.equal(c.externalActionFlag, false);
});

test("fresh live http:status が stale committed を上書き (server-risk 抑制)", () => {
  const url = "/ranking/override";
  // 同一 URL に stale 500 (coverage) と fresh 200 (live probe)。fresh が勝つので server-risk 不発。
  const cands = buildCandidates([
    obs("http", "status", 500, { page: url }, "stale"),
    obs("http", "status", 200, { page: url }, "fresh"),
  ]);
  assert.ok(!cands.some((c) => c.url === url && c.type === "server-risk"), "stale 500 が fresh 200 を上書きしてしまった");
  // 逆に fresh が 500 なら発火する
  const cands2 = buildCandidates([
    obs("http", "status", 200, { page: url }, "stale"),
    obs("http", "status", 500, { page: url }, "fresh"),
  ]);
  assert.ok(cands2.some((c) => c.url === url && c.type === "server-risk"));
});

test("indexability-conflict: live inSitemap + noindex", () => {
  const url = "/ranking/live-conflict";
  const cands = buildCandidates([
    obs("static", "inSitemap", true, { page: url }, "fresh"),
    obs("static", "noindex", true, { page: url }, "fresh"),
  ]);
  assert.ok(cands.some((c) => c.url === url && c.type === "indexability-conflict"));
});
