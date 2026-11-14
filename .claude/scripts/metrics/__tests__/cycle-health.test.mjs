// CYCLE-HEALTH-01 (2026-09-26): サイクルが止まった段を週次 Issue で見えるようにする信号
import { test } from "node:test";
import assert from "node:assert/strict";

import { findStalePlanIds, parseMustRatio, summarizeCards, summarizeDetectors, summarizeMust } from "../lib/cycle-health.mjs";

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
  const { cardsDueWithin, parseAnnual, parseBacklog } = createRequire(import.meta.url)("../../lib/backlog-lib.cjs");
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
    yearResults: { a: { key: "a", verdict: "extend-candidate" }, b: { key: "b", verdict: "extend-candidate" }, c: { key: "c", verdict: "confirmed-single-year" } },
    yearByDesign: { b: { note: "定義替え" } },
    gscQueue: [{ action: "fix-5xx", status: "pending" }, { action: "observe-after-fix", status: "pending" }],
    openIds: ["GSC-COV-5XX-20260920"],
  });
  assert.deepEqual([year.pending, year.open, year.stalled], [1, false, true]);
  assert.deepEqual([gsc.pending, gsc.open, gsc.stalled], [1, true, false]);
});
