import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_ROUNDS, buildWriterPacket, draftBlockers, nextStep, reviewMode } from "../analysis-run-core.mjs";

const done = {
  frame: true, wantsResearch: false, research: false, plan: true, script: true, summaryFresh: true,
  ledgerReady: true, ledgerErrors: [], refutationFresh: true, brokenClaims: [], article: true, articleSha: "a",
  wantsInventory: false, inventory: false, wantsFigurePlan: false, figurePlanFresh: true, figuresRendered: true, writer: "claude", weakClaims: [], rewrite: false, rewritten: false,
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
  assert.equal(step({ article: false }).step, "packet");
  assert.equal(step({ article: false, writer: "codex" }).step, "draft");
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
  assert.equal(next.step, "packet");
  assert.deepEqual(next.findings, findings);
});

test("最終審査は Claude の 1 回に残し、実行役は呼ばずに止まる", () => {
  assert.equal(step({ finalReview: null }).stop, "needs-final-review");
  assert.equal(step({ finalReview: { articleSha: "old", verdict: "PASS" } }).stop, "needs-final-review");
});

test("審査と反証の指摘は下書きの直しへ渡さない", () => {
  assert.deepEqual(draftBlockers(["analysis:M: 審査が PASS していない", "analysis:M: 反証の記録が無い", "表は禁止"]), ["表は禁止"]);
});

test("データ棚卸しは計画の前、図の割り当ては反証の後で書く前に行う", () => {
  assert.equal(step({ wantsInventory: true, inventory: false, plan: false }).step, "inventory");
  assert.equal(step({ wantsFigurePlan: true, figurePlanFresh: false, article: false }).step, "figures");
  assert.equal(step({ wantsFigurePlan: true, figurePlanFresh: false, refutationFresh: false }).step, "refute");
});

test("2 回目以降の 1 次審査は前回の指摘の確認に絞る", () => {
  assert.equal(reviewMode([]).mode, "full");
  const findings = [{ severity: "MAJOR", text: "副題が強い" }];
  assert.deepEqual(reviewMode([{ findings }]), { mode: "verify", previous: findings });
});

test("書き手の小包は主張・図・数値の出どころだけを渡し、データを渡さない", () => {
  const packet = buildWriterPacket({
    question: "規模か生産性か", terms: "規模・生産性", articlePath: "contents/blog/x/article.md", summaryPath: "contents/blog/x/data/analysis-summary.json",
    analysis: { finding: "規模が過半", claims: [{ text: "上位でも規模が過半", value: "steps.2", interval: "iv.2", above: 50 }], caveats: ["名目値"], article: { chars: "18000-20000" } },
    figures: [{ id: "figure:a", title: "段ごとの差", reads: "上の段でも規模", chart: { name: "gap-steps-bars", alt: "段" } }],
    reason: "初稿", unmatchedNumbers: ["52.8%"],
  });
  assert.match(packet, /C1: 上位でも規模が過半/);
  assert.match(packet, /data\/gap-steps-bars\.svg/);
  assert.match(packet, /52\.8%/);
  assert.doesNotMatch(packet, /frame\.json/);
});

test("weak の主張は結論の台帳へ 1 回だけ戻し、そのあとは進む", () => {
  assert.equal(step({ weakClaims: ["x: 言い換え"] }).step, "author");
  assert.equal(step({ weakClaims: ["x: 言い換え"], rounds: { ledger: 0, author: 1, draft: 0 } }).step, "done");
});

test("図の割り当てと描画を分け、描画の失敗で割り当てをやり直さない", () => {
  assert.equal(step({ wantsFigurePlan: true, figurePlanFresh: true, figuresRendered: false }).step, "render");
});

test("公開版を広げるときは、品質ゲートより先に改稿の小包を出す", () => {
  const next = step({ rewrite: true, rewritten: false, gateBlockers: ["字数"] });
  assert.equal(next.step, "packet");
  assert.equal(next.reason, "改稿");
  assert.equal(step({ rewrite: true, rewritten: true }).step, "done");
});
