import assert from "node:assert/strict";
import test from "node:test";

import {
  checkRequiredTerms,
  deriveContractResult,
  extractPageSignals,
  isCleanCanonicalUrl,
  verifyLandingContract,
} from "../buzz-map-contract-core.mjs";

const NOW = "2026-07-17T00:00:00.000Z";

function allTrueInput(overrides = {}) {
  return {
    liveStatus: 200,
    canonicalOk: true,
    notIndexable: true,
    hasRequiredTerms: true,
    hasRequiredMetricKeys: true,
    yearUnitMatch: true,
    ...overrides,
  };
}

// --- deriveContractResult ---------------------------------------------------

test("deriveContractResult: 全 pass → 'pass' で reasons 空", () => {
  const { result, reasons } = deriveContractResult(allTrueInput());
  assert.equal(result, "pass");
  assert.deepEqual(reasons, []);
});

test("deriveContractResult: liveStatus=null → 'pending'", () => {
  const { result, reasons } = deriveContractResult(
    allTrueInput({ liveStatus: null }),
  );
  assert.equal(result, "pending");
  assert.ok(reasons.length >= 1);
});

test("deriveContractResult: 1 項目 false → 'fail' + 該当 reason", () => {
  const { result, reasons } = deriveContractResult(
    allTrueInput({ hasRequiredTerms: false }),
  );
  assert.equal(result, "fail");
  assert.ok(reasons.some((r) => r.includes("required terms")));
});

test("deriveContractResult: liveStatus=404 → 'fail'", () => {
  const { result, reasons } = deriveContractResult(
    allTrueInput({ liveStatus: 404 }),
  );
  assert.equal(result, "fail");
  assert.ok(reasons.some((r) => r.includes("404")));
});

// --- isCleanCanonicalUrl ----------------------------------------------------

test("isCleanCanonicalUrl: UTM 付き → false", () => {
  assert.equal(
    isCleanCanonicalUrl(
      "https://stats47.jp/blog/vacant-house-crisis?utm_source=x&utm_medium=social",
    ),
    false,
  );
});

test("isCleanCanonicalUrl: クエリ無し https stats47.jp → true", () => {
  assert.equal(
    isCleanCanonicalUrl("https://stats47.jp/ranking/vacant-house-rate"),
    true,
  );
});

test("isCleanCanonicalUrl: http → false", () => {
  assert.equal(
    isCleanCanonicalUrl("http://stats47.jp/ranking/vacant-house-rate"),
    false,
  );
});

test("isCleanCanonicalUrl: 別ドメイン / 空 → false", () => {
  assert.equal(isCleanCanonicalUrl("https://example.com/x"), false);
  assert.equal(isCleanCanonicalUrl(""), false);
  assert.equal(isCleanCanonicalUrl(null), false);
});

// --- extractPageSignals -----------------------------------------------------

test("extractPageSignals: noindex meta を検出", () => {
  const html = `<html><head><meta name="robots" content="noindex, follow"></head><body><h1>x</h1></body></html>`;
  const s = extractPageSignals(html);
  assert.equal(s.isNoindex, true);
});

test("extractPageSignals: title を抽出", () => {
  const html = `<html><head><title>空き家率ランキング｜stats47</title></head><body></body></html>`;
  const s = extractPageSignals(html);
  assert.equal(s.title, "空き家率ランキング｜stats47");
  assert.equal(s.isNoindex, false);
});

test("extractPageSignals: 最初の h1 を抽出 + 本文テキスト", () => {
  const html = `<html><body><h1>空き家率の<span>都道府県</span>ランキング</h1><p>和歌山が1位です。</p><script>ignore()</script></body></html>`;
  const s = extractPageSignals(html);
  assert.equal(s.h1, "空き家率の都道府県ランキング");
  assert.ok(s.bodyText.includes("和歌山が1位です。"));
  assert.ok(!s.bodyText.includes("ignore"));
});

// --- checkRequiredTerms -----------------------------------------------------

test("checkRequiredTerms: 全部ある → ok", () => {
  const signals = {
    title: "空き家率ランキング",
    h1: "都道府県別",
    bodyText: "和歌山が1位、2023年のデータ",
  };
  const r = checkRequiredTerms(signals, ["空き家率", "和歌山", "2023"]);
  assert.equal(r.ok, true);
  assert.deepEqual(r.missing, []);
});

test("checkRequiredTerms: 一部欠落 → missing 列挙", () => {
  const signals = { title: "空き家率ランキング", h1: "", bodyText: "和歌山が1位" };
  const r = checkRequiredTerms(signals, ["空き家率", "東京", "沖縄"]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["東京", "沖縄"]);
});

// --- verifyLandingContract (fetchImpl モック・実ネットワーク非依存) ----------

function mockFetch(status, html) {
  return async (_url) => ({
    status,
    text: async () => html,
  });
}

test("verifyLandingContract: 200 + 整合 HTML → pass", async () => {
  const html = `<html><head><title>空き家率ランキング｜stats47</title></head>
    <body><h1>空き家率の都道府県ランキング</h1>
    <p>和歌山が1位。2023年。<a href="/ranking/vacant-house-rate">詳細</a></p></body></html>`;
  const contract = await verifyLandingContract(
    {
      ideaId: "vacant-housing-muni",
      canonicalUrl: "https://stats47.jp/ranking/vacant-house-rate",
      promise: "空き家率が一番高い県は？",
      requiredMetricKeys: ["vacant-house-rate"],
      requiredYear: "2023",
      requiredTerms: ["空き家率", "和歌山"],
    },
    { fetchImpl: mockFetch(200, html), nowIso: () => NOW },
  );
  assert.equal(contract.result, "pass");
  assert.deepEqual(contract.reasons, []);
  assert.equal(contract.liveStatus, 200);
  assert.equal(contract.verifiedAt, NOW);
});

test("verifyLandingContract: 404 → fail", async () => {
  const contract = await verifyLandingContract(
    {
      ideaId: "vacant-housing-muni",
      canonicalUrl: "https://stats47.jp/ranking/missing-key",
      promise: "x",
      requiredMetricKeys: ["missing-key"],
      requiredTerms: [],
    },
    { fetchImpl: mockFetch(404, ""), nowIso: () => NOW },
  );
  assert.equal(contract.result, "fail");
  assert.ok(contract.reasons.some((r) => r.includes("404")));
  assert.equal(contract.liveStatus, 404);
});

test("verifyLandingContract: primaryUrl=null → pending", async () => {
  let called = false;
  const contract = await verifyLandingContract(
    {
      ideaId: "no-landing",
      canonicalUrl: null,
      promise: "x",
      requiredMetricKeys: [],
      requiredTerms: [],
    },
    {
      fetchImpl: async () => {
        called = true;
        return { status: 200, text: async () => "" };
      },
      nowIso: () => NOW,
    },
  );
  assert.equal(contract.result, "pending");
  assert.deepEqual(contract.reasons, ["no primary landing URL"]);
  assert.equal(contract.liveStatus, null);
  assert.equal(contract.verifiedAt, null);
  assert.equal(called, false, "fetch は呼ばれてはならない");
});

test("verifyLandingContract: 200 だが requiredTerms 欠落 → fail + missing 詳細", async () => {
  const html = `<html><head><title>別のページ</title></head><body><h1>無関係</h1></body></html>`;
  const contract = await verifyLandingContract(
    {
      ideaId: "mismatch",
      canonicalUrl: "https://stats47.jp/ranking/vacant-house-rate",
      promise: "空き家率が一番高い県は？",
      requiredMetricKeys: [],
      requiredTerms: ["空き家率", "和歌山"],
    },
    { fetchImpl: mockFetch(200, html), nowIso: () => NOW },
  );
  assert.equal(contract.result, "fail");
  assert.ok(contract.reasons.some((r) => r.includes("空き家率")));
});
