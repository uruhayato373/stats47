import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyInspectionObservations,
  getObserveAfterFixEntries,
  normalizeQueueUrl,
  RESOLVED_BY_INSPECTION,
  summarizeCoverageQueue,
} from "../lib/coverage-queue-state.mjs";

const entry = (overrides) => ({
  action: "observe-after-fix",
  status: "pending",
  verdict: "live-misflagged",
  gsc_category: "crawled-not-indexed",
  ...overrides,
});

test("done化したactionを分類総数には残し、pending集計から除外する", () => {
  const summary = summarizeCoverageQueue([
    entry({}),
    entry({ action: "fix-5xx", status: "done", verdict: "still-5xx" }),
    entry({ action: "none", status: "resolved-by-design", verdict: "now-gone" }),
  ]);

  assert.equal(summary.tracked_urls, 3);
  assert.equal(summary.pending_actionable, 1);
  assert.deepEqual(summary.by_action, {
    "observe-after-fix": 1,
    "fix-5xx": 1,
    none: 1,
  });
  assert.deepEqual(summary.pending_by_action, { "observe-after-fix": 1 });
});

test("観測CSV対象はpendingまたはin-progressだけに限定する", () => {
  const queue = [
    entry({ status: "pending" }),
    entry({ status: "in-progress" }),
    entry({ status: "done" }),
    entry({ action: "content-check", status: "pending" }),
  ];

  assert.equal(getObserveAfterFixEntries(queue).length, 2);
});

test("URL Inspection で登録済みになった actionable URL を done にし、件数を数える", () => {
  const queue = [
    entry({ url: "https://stats47.jp/ranking/a" }),
    entry({ url: "https://stats47.jp/ranking/b", status: "in-progress", action: "content-check" }),
    entry({ url: "https://stats47.jp/ranking/c" }),
    entry({ url: "https://stats47.jp/ranking/d", action: "none", status: "resolved-by-design" }),
  ];
  const observations = new Map([
    ["https://stats47.jp/ranking/a", { date: "2026-09-24", verdict: "PASS", coverageState: "送信して登録されました" }],
    ["https://stats47.jp/ranking/b", { date: "2026-09-24", verdict: "PASS", coverageState: "送信して登録されました" }],
    ["https://stats47.jp/ranking/c", { date: "2026-09-24", verdict: "NEUTRAL", coverageState: "検出 - インデックス未登録" }],
    ["https://stats47.jp/ranking/d", { date: "2026-09-24", verdict: "PASS", coverageState: "送信して登録されました" }],
  ]);

  const result = applyInspectionObservations(queue, observations);

  assert.deepEqual(result, { observed: 3, indexed: 2, reopened: 0 });
  assert.deepEqual(queue.map((e) => e.status), ["done", "done", "pending", "resolved-by-design"]);
  assert.equal(queue[0].resolved_at, "2026-09-24");
  assert.equal(queue[2].inspection.coverage_state, "検出 - インデックス未登録");
  assert.equal(queue[3].inspection, undefined);
  assert.equal(summarizeCoverageQueue(queue).indexed_by_inspection, 2);
});

test("自動で done にした URL だけを、再び未登録と観測したら pending に戻す", () => {
  const queue = [
    entry({ url: "https://stats47.jp/a", status: "done", resolved_by: RESOLVED_BY_INSPECTION, resolved_at: "2026-09-20" }),
    entry({ url: "https://stats47.jp/b", status: "done", resolved_by: null, wave_id: "2026-09-07-coverage" }),
  ];
  const observations = new Map([
    ["https://stats47.jp/a", { date: "2026-09-24", verdict: "NEUTRAL", coverageState: "クロール済み - インデックス未登録" }],
    ["https://stats47.jp/b", { date: "2026-09-24", verdict: "NEUTRAL", coverageState: "クロール済み - インデックス未登録" }],
  ]);

  const result = applyInspectionObservations(queue, observations);

  assert.equal(result.reopened, 1);
  assert.equal(queue[0].status, "pending");
  assert.equal(queue[0].resolved_at, null);
  assert.equal(queue[1].status, "done", "人が付けた done は観測で覆さない");
});

test("fragment 付きの URL も同じ URL として照合する", () => {
  assert.equal(normalizeQueueUrl("https://stats47.jp/blog/x#s1"), "https://stats47.jp/blog/x");
  assert.equal(normalizeQueueUrl("not-a-url"), null);
});
