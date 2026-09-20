import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getObserveAfterFixEntries,
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
