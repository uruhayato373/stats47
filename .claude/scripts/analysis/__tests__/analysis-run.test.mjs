import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_ROUNDS, draftBlockers, nextStep } from "../analysis-run-core.mjs";

const done = {
  frame: true, wantsResearch: false, research: false, plan: true, script: true, summaryFresh: true,
  ledgerReady: true, ledgerErrors: [], refutationFresh: true, brokenClaims: [], article: true, articleSha: "a",
  gateBlockers: [], firstReview: { articleSha: "a", verdict: "PASS", findings: [] },
  finalReview: { articleSha: "a", verdict: "PASS", findings: [] }, rounds: { ledger: 0, author: 0, draft: 0 },
};
const step = (over) => nextStep({ ...done, ...over });

test("すべて揃えば完了する", () => assert.equal(step({}).step, "done"));

test("工程は前から順に進む", () => {
  assert.equal(step({ frame: false }).step, "frame");
  assert.equal(step({ plan: false }).step, "plan");
  assert.equal(step({ script: false }).step, "author");
  assert.equal(step({ summaryFresh: false }).step, "analyze");
  assert.equal(step({ refutationFresh: false }).step, "refute");
  assert.equal(step({ article: false }).step, "draft");
  assert.equal(step({ firstReview: undefined }).step, "review");
});

test("NotebookLM は頼まれたときだけ呼ぶ", () => {
  assert.equal(step({ wantsResearch: true }).step, "research");
  assert.equal(step({ wantsResearch: true, research: true }).step, "done");
});

test("崩れた主張は結論の書き直しへ戻し、下書きへ進まない", () => {
  const next = step({ brokenClaims: ["全体の3割: 上の段は17%"] });
  assert.equal(next.step, "author");
  assert.deepEqual(next.findings, ["全体の3割: 上の段は17%"]);
});

test("やり直しは回数で止まり、人へ渡す", () => {
  assert.equal(step({ brokenClaims: ["x"], rounds: { ledger: 0, author: MAX_ROUNDS, draft: 0 } }).stop, "needs-owner");
  assert.equal(step({ ledgerReady: false, rounds: { ledger: MAX_ROUNDS, author: 0, draft: 0 } }).stop, "needs-owner");
  assert.equal(step({ gateBlockers: ["x"], rounds: { ledger: 0, author: 0, draft: MAX_ROUNDS } }).stop, "needs-owner");
});

test("台帳の修正は反証の修正の回数を使わない", () => {
  assert.equal(step({ brokenClaims: ["x"], rounds: { ledger: MAX_ROUNDS, author: 0, draft: 0 } }).step, "author");
});

test("本文が変わると 1 次審査からやり直す", () => assert.equal(step({ articleSha: "b" }).step, "review"));

test("1 次審査の REVISE は指摘を下書きへ渡す", () => {
  const findings = [{ severity: "MAJOR", text: "言い過ぎ" }];
  const next = step({ firstReview: { articleSha: "a", verdict: "REVISE", findings } });
  assert.equal(next.step, "draft");
  assert.deepEqual(next.findings, findings);
});

test("最終審査は Claude の 1 回に残し、実行役は呼ばずに止まる", () => {
  assert.equal(step({ finalReview: null }).stop, "needs-final-review");
  assert.equal(step({ finalReview: { articleSha: "old", verdict: "PASS" } }).stop, "needs-final-review");
});

test("審査と反証の指摘は下書きの直しへ渡さない", () => {
  assert.deepEqual(draftBlockers(["analysis:M: 審査が PASS していない", "analysis:M: 反証の記録が無い", "表は禁止"]), ["表は禁止"]);
});
