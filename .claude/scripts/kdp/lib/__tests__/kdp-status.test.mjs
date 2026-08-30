import assert from "node:assert/strict";
import test from "node:test";

import { mergeKdpOperationalState, normalizeKdpStatus } from "../kdp-status.mjs";

test("KDPの日本語statusを運用状態へ正規化する", () => {
  assert.equal(normalizeKdpStatus("下書き"), "draft");
  assert.equal(normalizeKdpStatus("レビュー中"), "in_review");
  assert.equal(normalizeKdpStatus("変更内容をレビュー中"), "in_review");
  assert.equal(normalizeKdpStatus("販売中"), "live");
  assert.equal(normalizeKdpStatus("不明"), "unknown");
});

test("販売開始日を初回live確認時だけ記録する", () => {
  const next = mergeKdpOperationalState(
    { id: "K-S1-01", status: "listed", asin: null },
    { status: "販売中", asin: "B012345678" },
    "2026-08-30T01:02:03.000Z",
  );
  assert.equal(next.kdpStatus, "live");
  assert.equal(next.asin, "B012345678");
  assert.equal(next.salesStartedAt, "2026-08-30");
});
