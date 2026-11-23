// CYCLE-HEALTH-01 (2026-09-26): サイクルが止まった段を週次 Issue で見えるようにする信号
import { test } from "node:test";
import assert from "node:assert/strict";

import { findStalePlanIds, formatCycleHealth, parseMustRatio, summarizeCards, summarizeDetectors, summarizeMust } from "../lib/cycle-health.mjs";

test("Must の達成数は太字あり・なしの両方の書式から取る", () => {
  assert.deepEqual(parseMustRatio("Must **0/3**、Should 1/3"), { done: 0, planned: 3 });
  assert.deepEqual(parseMustRatio("計画 Must 1/3 完了"), { done: 1, planned: 3 });
  assert.equal(parseMustRatio("Must の記載なし"), null);
});

test("連続未達は新しい週から数え、達成した週か記載の無い週で止まる", () => {
  const r = (done, planned) => ({ done, planned });
  const s = summarizeMust([
    { week: "W38", ratio: r(0, 3) }, { week: "W37", ratio: r(1, 3) }, { week: "W36", ratio: r(2, 2) }, { week: "W35", ratio: r(0, 2) },
  ]);
  assert.equal(s.latest.week, "W38");
  assert.equal(s.missStreak, 2);
  assert.equal(s.needsSplit, true);
  assert.equal(summarizeMust([{ week: "W38", ratio: r(3, 3) }]).needsSplit, false);
});

test("分類漏れと期日超過を数える (期日当日は超過にしない)", () => {
  const s = summarizeCards([
    { id: "A-01", lane: "計測", kind: "改善", due: "2026-09-25" },
    { id: "B-01", lane: null, kind: "改善", due: "2026-09-26" },
    { id: "C-01", lane: "UI", kind: null, due: null },
  ], "2026-09-26");
  assert.deepEqual(s.unclassified, ["B-01", "C-01"]);
  assert.deepEqual(s.overdue, ["A-01"]);
});

test("期日超過の数え方は計画が期日で引く cardsDueWithin と同じ (読めない日付は数えない)", async () => {
  const { createRequire } = await import("node:module");
  const { cardsDueWithin, parseAnnual, parseBacklog } = createRequire(import.meta.url)("../../management/backlog-lib.cjs");
  const backlogText = [
    "## 🔴 高",
    "### [A-01] 超過",
    "タグ: [収益化] [期日:2026-09-25]",
    "### [B-01] 日付として読めない",
    "タグ: [収益化] [期日:2026-02-30]",
    "### [C-01] 当日",
    "タグ: [収益化] [期日:2026-09-26]",
  ].join("\n");
  const annualText = "## 2026-09\n\n### [D-01] 年間計画の超過\nタグ: [収益化] [期日:2026-09-01]";
  const cards = [...parseBacklog(backlogText), ...parseAnnual(annualText)];
  const shared = cardsDueWithin({ backlogText, annualText, from: "2026-09-26", to: "2026-09-26" }).overdue.map((c) => c.id);
  assert.deepEqual(summarizeCards(cards, "2026-09-26").overdue, shared);
  assert.deepEqual(shared, ["D-01", "A-01"]);
});

test("計画が参照する完了済み ID は、台帳にまだ残っていれば数えない", () => {
  const plan = "`AFF-MEASURE-RECOVER-01` と `NAV-CLICK-COVERAGE-01` と `DATA-ESTAT-FETCH-01`";
  const completed = new Set(["AFF-MEASURE-RECOVER-01", "NAV-CLICK-COVERAGE-01"]);
  const live = new Set(["NAV-CLICK-COVERAGE-01", "DATA-ESTAT-FETCH-01"]);
  assert.deepEqual(findStalePlanIds(plan, completed, live), ["AFF-MEASURE-RECOVER-01"]);
});

test("残件があるのにカードが開いていない検出器を、起票が止まっているとして出す", () => {
  const [year, gsc] = summarizeDetectors({
    // 取得失敗・台帳なしは次の週次で取り直すので数えず、人が判断する分類だけを残件にする
    yearSummary: { notInEstat: 1, truncated: 0, duplicateRows: 0, inheritedExclusions: 0, fetchError: 3, noLedger: 2, clean: 10 },
    gscQueue: [{ action: "fix-5xx", status: "pending" }, { action: "observe-after-fix", status: "pending" }],
    openIds: ["GSC-COV-5XX-20260920"],
  });
  assert.deepEqual([year.pending, year.open, year.stalled], [1, false, true]);
  assert.deepEqual([gsc.pending, gsc.open, gsc.stalled], [1, true, false]);
});

test("週次 Issue の表に起票 → 完了の行を出し、目安を超えたら警告する", () => {
  const base = {
    detectors: [],
    cards: { total: 0, unclassified: [], overdue: [] },
    must: { latest: null, missStreak: 0, needsSplit: false },
    stalePlanIds: [],
    review: null,
    discipline: null,
  };
  const over = formatCycleHealth({ ...base, flow: { week: "2026-W46", filed: 5, closed: 3, total: 250, target: 200, overTarget: true } });
  assert.match(over, /\| 起票 → 完了 \| .* \| 2026-W46 の起票 5 枚・閉じた 3 枚 \/ backlog 250 枚 \(目安 200 枚を 50 枚超過 ⚠️/);
  const within = formatCycleHealth({ ...base, flow: { week: "2026-W46", filed: 5, closed: 3, total: 150, target: 200, overTarget: false } });
  assert.match(within, /backlog 150 枚 \(目安 200 枚以内\)/);
  assert.match(formatCycleHealth({ ...base, flow: null }), /\| 起票 → 完了 \| .* \| 未計測 \|/);
});

test("振り返り → 起票の行は、申し送りの振り分け済みと ID に結ばれた件数を実数で出す", async () => {
  const { handoffSummary } = await import("../../management/review-cadence.mjs");
  const item = (routes, problem = null) => ({ text: "x", routes, problem });
  const handoff = [item(["CYCLE-HEALTH-01"]), item(["EXP-007"]), item(["#42"]), item(["定常"]), item(["見送り"]), item([], "unrouted"), item(["NOPE-99"], "unknown-id:NOPE-99")];
  const result = { reviews: { weekly: [{ period: "2026-W47", inContract: true, routed: 5, handoff }] } };
  const summary = handoffSummary(result, "weekly");
  assert.deepEqual(summary, { period: "2026-W47", inContract: true, routed: 5, linked: 3, total: 7 });
  const base = { detectors: [], cards: { total: 0, unclassified: [], overdue: [] }, must: { latest: null, missStreak: 0, needsSplit: false }, stalePlanIds: [], discipline: null, flow: null };
  const row = formatCycleHealth({ ...base, review: { handoff: summary, contractErrors: 0 } });
  assert.match(row, /\| 振り返り → 起票 \| .* \| 2026-W47: 振り分け済み 5 \/ 7 件 \(うちカード ID・EXP・Issue に結ばれた 3 件、定常・見送り 2 件\) ⚠️/);
  assert.match(formatCycleHealth({ ...base, review: { handoff: { ...summary, inContract: false }, contractErrors: 0 } }), /契約の開始 .* より前のため未検査/);
  assert.match(formatCycleHealth({ ...base, review: { handoff: null, contractErrors: 0 } }), /\| 振り返り → 起票 \| .* \| 未計測 \|/);
  assert.equal(handoffSummary({ reviews: { weekly: [] } }, "weekly"), null);
});
