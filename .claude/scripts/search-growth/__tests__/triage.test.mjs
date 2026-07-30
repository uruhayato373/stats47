/**
 * triage.mjs のテスト — 週次トリアージ最大3件・人間承認 guard (WIP≤5 / 週2件)・lifecycle 引き継ぎ。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectTriage,
  applyApproval,
  applyDismiss,
  carryOverStatuses,
  wipCount,
  CANDIDATE_CATEGORY,
  TRIAGE_MAX,
  WIP_LIMIT,
  WEEKLY_APPROVAL_MAX,
} from "../lib/triage.mjs";

const NOW = "2026-07-28T00:00:00Z"; // 2026-W31

function cand(id, type, score, { status = "pending", freshness = "fresh", ...rest } = {}) {
  return {
    id,
    url: `/${id}`,
    type,
    score,
    status,
    freshness,
    evidence: [],
    limitations: [],
    baselinePeriod: { start: "2026-06-26", end: "2026-07-23" },
    ...rest,
  };
}

test("selectTriage: 区分ごとに score 最大 1 件・最大 3 件・決定的", () => {
  const list = [
    cand("a", "server-risk", 0.9),
    cand("b", "soft-404-risk", 0.8),
    cand("c", "ctr-opportunity", 0.7),
    cand("d", "striking-distance", 0.95),
    cand("e", "measurement-gap", 0.1),
  ];
  const t = selectTriage(list);
  assert.equal(t.shortlist.length, 3);
  assert.deepEqual(
    t.shortlist.map((c) => [c.category, c.id]),
    [["technical", "a"], ["content", "d"], ["measurement", "e"]],
  );
  assert.ok(t.shortlist.length <= TRIAGE_MAX);
});

test("selectTriage: freshness=missing は insufficient として除外・区分不在の穴埋めをしない", () => {
  const list = [
    cand("a", "server-risk", 0.9, { freshness: "missing" }),
    cand("b", "ctr-opportunity", 0.7),
    cand("c", "query-gap", 0.6),
  ];
  const t = selectTriage(list);
  // technical は missing で除外され、content 2 件から 1 件だけ (穴埋めで 2 件にしない)
  assert.deepEqual(t.shortlist.map((c) => c.id), ["b"]);
  assert.equal(t.excluded.insufficient, 1);
});

test("selectTriage: WIP 状態を可視化する", () => {
  const list = [
    cand("a", "server-risk", 0.9, { status: "approved" }),
    cand("b", "ctr-opportunity", 0.7, { status: "in-progress" }),
    cand("c", "query-gap", 0.6),
  ];
  const t = selectTriage(list);
  assert.equal(t.wip, 2);
  assert.equal(t.wipBlocked, false);
  assert.equal(wipCount(list), 2);
});

test("applyApproval: pending を approved にし週を記録する", () => {
  const list = [cand("a", "server-risk", 0.9)];
  const { candidates, approved } = applyApproval(list, "a", { now: NOW });
  assert.equal(approved.status, "approved");
  assert.equal(approved.approvedWeek, "2026-W31");
  assert.equal(candidates[0].status, "approved");
  assert.equal(list[0].status, "pending", "immutable (元配列を変えない)");
});

test("applyApproval: WIP 上限 5 で拒否する", () => {
  const list = [
    ...Array.from({ length: WIP_LIMIT }, (_, i) => cand(`w${i}`, "server-risk", 0.5, { status: i % 2 ? "approved" : "in-progress" })),
    cand("new", "ctr-opportunity", 0.9),
  ];
  assert.throws(() => applyApproval(list, "new", { now: NOW }), /WIP limit/);
});

test("applyApproval: 週の承認上限 2 で拒否する", () => {
  const list = [
    cand("a", "server-risk", 0.9, { status: "approved", approvedWeek: "2026-W31" }),
    cand("b", "ctr-opportunity", 0.8, { status: "approved", approvedWeek: "2026-W31" }),
    cand("c", "query-gap", 0.7),
  ];
  assert.equal(WEEKLY_APPROVAL_MAX, 2);
  assert.throws(() => applyApproval(list, "c", { now: NOW }), /weekly approval limit/);
  // 別週なら承認できる (WIP は 2 で上限内)
  const otherWeek = applyApproval(list, "c", { now: "2026-08-04T00:00:00Z" });
  assert.equal(otherWeek.approved.approvedWeek, "2026-W32");
});

test("applyApproval: freshness=missing / 非 pending は拒否する", () => {
  assert.throws(
    () => applyApproval([cand("a", "server-risk", 0.9, { freshness: "missing" })], "a", { now: NOW }),
    /insufficient-data/,
  );
  assert.throws(
    () => applyApproval([cand("a", "server-risk", 0.9, { status: "approved" })], "a", { now: NOW }),
    /not pending/,
  );
});

test("applyDismiss: 理由付きで dismissed にする", () => {
  const { candidates, dismissed } = applyDismiss([cand("a", "ctr-opportunity", 0.5)], "a", {
    reason: "past effect/none と同型",
    now: NOW,
  });
  assert.equal(dismissed.status, "dismissed");
  assert.equal(candidates[0].dismissReason, "past effect/none と同型");
});

test("carryOverStatuses: 再構築で承認状態を引き継ぎ、消えた WIP を carry forward する", () => {
  const prev = [
    cand("a", "server-risk", 0.9, { status: "approved", approvedAt: NOW, approvedWeek: "2026-W31" }),
    cand("b", "ctr-opportunity", 0.7, { status: "dismissed", dismissedAt: NOW, dismissReason: "x" }),
    cand("gone", "query-gap", 0.6, { status: "in-progress" }),
    cand("gone-dismissed", "mobile-gap", 0.5, { status: "dismissed" }),
  ];
  const rebuilt = [
    cand("a", "server-risk", 0.85), // 再検出 (pending で再構築される)
    cand("b", "ctr-opportunity", 0.75),
    cand("new", "measurement-gap", 0.4),
  ];
  const merged = carryOverStatuses(rebuilt, prev);
  const byId = new Map(merged.map((c) => [c.id, c]));
  assert.equal(byId.get("a").status, "approved");
  assert.equal(byId.get("a").approvedWeek, "2026-W31");
  assert.equal(byId.get("a").score, 0.85, "score は新しい観測を使う");
  assert.equal(byId.get("b").status, "dismissed");
  assert.equal(byId.get("new").status, "pending");
  // 消えた WIP は carry forward、消えた dismissed は落とす
  assert.equal(byId.get("gone").carriedForward, true);
  assert.match(byId.get("gone").limitations.join(" "), /carry forward/);
  assert.equal(byId.has("gone-dismissed"), false);
});

test("CANDIDATE_CATEGORY: 全 candidate type が 3 区分に写像される", () => {
  const cats = new Set(Object.values(CANDIDATE_CATEGORY));
  assert.deepEqual([...cats].sort(), ["content", "measurement", "technical"]);
});
