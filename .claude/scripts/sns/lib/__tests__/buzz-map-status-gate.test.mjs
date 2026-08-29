/**
 * buzz-map status machine (upsert / merged 継承) + postable predicate + batch selection のテスト。
 * status / draft gate / batch。
 * 実行: node --test .claude/scripts/sns/lib/__tests__/buzz-map-status-gate.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  STATUS_ORDER,
  isProgressStatus,
  upsertStatus,
  resolveMergedStatus,
  isPostable,
  isEligibleForBatch,
  selectBatch,
} from "../buzz-map-router-core.mjs";

// ── upsertStatus: 後段状態を巻き戻さない ─────────────────────────────

test("STATUS_ORDER は candidate から measured への一本道", () => {
  assert.equal(STATUS_ORDER[0], "candidate");
  assert.equal(STATUS_ORDER[STATUS_ORDER.length - 1], "measured");
  assert.ok(STATUS_ORDER.indexOf("draft") > STATUS_ORDER.indexOf("generated"));
});

test("isProgressStatus: 進行 status は true / 分岐状態は false", () => {
  assert.equal(isProgressStatus("generated"), true);
  assert.equal(isProgressStatus("draft"), true);
  assert.equal(isProgressStatus("blocked"), false);
  assert.equal(isProgressStatus("needs-content"), false);
});

test("upsertStatus: prev 無しは next", () => {
  assert.equal(upsertStatus(null, "candidate"), "candidate");
  assert.equal(upsertStatus(undefined, "generated"), "generated");
});

test("upsertStatus: 両方進行 status は後段を維持 (max)", () => {
  assert.equal(upsertStatus("generated", "candidate"), "generated"); // 巻き戻さない
  assert.equal(upsertStatus("candidate", "generated"), "generated"); // 前進
  assert.equal(upsertStatus("draft", "generated"), "draft"); // draft > generated
  assert.equal(upsertStatus("generated", "draft"), "draft"); // draft へ前進
});

test("upsertStatus: 進行 status を分岐状態で巻き戻さない", () => {
  assert.equal(upsertStatus("generated", "blocked"), "generated");
  assert.equal(upsertStatus("spec", "needs-content"), "spec");
});

test("upsertStatus: 分岐 → 進行は昇格 / 分岐 → 分岐は next", () => {
  assert.equal(upsertStatus("blocked", "generated"), "generated");
  assert.equal(upsertStatus("needs-content", "blocked"), "blocked");
});

// ── resolveMergedStatus: machine 後段 + posts.json draft の合流 ──

test("resolveMergedStatus: machine generated を max 継承", () => {
  assert.equal(resolveMergedStatus("candidate", ["generated"], null), "generated");
  assert.equal(resolveMergedStatus("candidate", ["candidate", "generated"], null), "generated");
});

test("resolveMergedStatus: posts.json draft が generated より勝つ", () => {
  assert.equal(resolveMergedStatus("candidate", ["generated"], "draft"), "draft");
});

test("resolveMergedStatus: 前回の後段 status を巻き戻さない", () => {
  assert.equal(resolveMergedStatus("posted", ["generated"], "draft"), "posted");
});

test("resolveMergedStatus: 何も無ければ candidate", () => {
  assert.equal(resolveMergedStatus(undefined, [], null), "candidate");
});

// ── postable predicate ────────────────────────────────────────────────

function fullFacts(overrides = {}) {
  return {
    commercialUse: "allowed",
    sensitivity: "low",
    specGenerated: true,
    renderChecked: true,
    r2Ok: true,
    landingContractPass: true,
    landingLive: true,
    captionComplete: true,
    noDuplicate: true,
    attributionComplete: true,
    ...overrides,
  };
}

test("isPostable: 全条件充足で postable=true / reasons 空", () => {
  const r = isPostable(fullFacts());
  assert.equal(r.postable, true);
  assert.deepEqual(r.reasons, []);
});

test("isPostable: commercialUse != allowed で不可", () => {
  const r = isPostable(fullFacts({ commercialUse: "review-required" }));
  assert.equal(r.postable, false);
  assert.ok(r.reasons.some((x) => x.includes("commercialUse")));
});

test("isPostable: sensitivity high で不可", () => {
  assert.equal(isPostable(fullFacts({ sensitivity: "high" })).postable, false);
});

test("isPostable: landing 未 live / contract fail / R2 不在で不可 (それぞれ理由)", () => {
  assert.equal(isPostable(fullFacts({ landingLive: false })).postable, false);
  assert.equal(isPostable(fullFacts({ landingContractPass: false })).postable, false);
  assert.equal(isPostable(fullFacts({ r2Ok: false })).postable, false);
});

test("isPostable: content_key 重複で不可", () => {
  const r = isPostable(fullFacts({ noDuplicate: false }));
  assert.equal(r.postable, false);
  assert.ok(r.reasons.some((x) => x.includes("重複")));
});

test("isPostable: UTM/attribution 契約が不完全なら不可", () => {
  const r = isPostable(fullFacts({ attributionComplete: false }));
  assert.equal(r.postable, false);
  assert.ok(r.reasons.some((x) => x.includes("UTM/attribution")));
});

test("isPostable: 複数欠落は全て reasons に出る", () => {
  const r = isPostable(fullFacts({ specGenerated: false, captionComplete: false }));
  assert.equal(r.reasons.length, 2);
});

// ── batch selection ────────────────────────────────────────────────────

function entry(overrides = {}) {
  return {
    ideaId: "e",
    score: 50,
    eligible: true,
    landingStrategy: "existing-ranking",
    status: "candidate",
    ...overrides,
  };
}

test("isEligibleForBatch: eligible=false は除外", () => {
  assert.equal(isEligibleForBatch(entry({ eligible: false })), false);
});

test("isEligibleForBatch: landing blocked / 無しは除外", () => {
  assert.equal(isEligibleForBatch(entry({ landingStrategy: "blocked" })), false);
  assert.equal(isEligibleForBatch(entry({ landingStrategy: null })), false);
});

test("isEligibleForBatch: posted/measured/rejected は除外", () => {
  assert.equal(isEligibleForBatch(entry({ status: "posted" })), false);
  assert.equal(isEligibleForBatch(entry({ status: "rejected" })), false);
  assert.equal(isEligibleForBatch(entry({ status: "draft" })), true); // draft は投稿予備軍
});

test("selectBatch: eligible を score 降順で N 件", () => {
  const entries = [
    entry({ ideaId: "a", score: 30 }),
    entry({ ideaId: "b", score: 90 }),
    entry({ ideaId: "c", score: 60, eligible: false }), // 除外
    entry({ ideaId: "d", score: 70 }),
  ];
  const out = selectBatch(entries, 2);
  assert.deepEqual(
    out.map((e) => e.ideaId),
    ["b", "d"],
  );
});

test("selectBatch: N が在庫超過でも安全", () => {
  const out = selectBatch([entry({ ideaId: "a" })], 12);
  assert.equal(out.length, 1);
});
