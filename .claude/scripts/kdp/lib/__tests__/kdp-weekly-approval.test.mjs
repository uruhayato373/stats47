import assert from "node:assert/strict";
import test from "node:test";
import { validateWeeklyApproval } from "../kdp-weekly-approval.mjs";

const decision = {
  schemaVersion: 2,
  week: "2026-W47",
  status: "ready-for-owner-approval",
  candidate: { id: "K-S3-01" },
  eligibleCandidateIds: ["K-S3-01", "K-S4-01"],
  approvalRequired: true,
};

test("検証済みの本なら、先頭の候補でなくても 1 冊ずつ承認できる", () => {
  for (const id of ["K-S3-01", "K-S4-01"]) {
    const result = validateWeeklyApproval(decision, { week: "2026-W47", id, ownerApproved: id, commit: true });
    assert.equal(result.ok, true, id);
  }
});

test("週次計画への記載だけではオーナー承認にならない", () => {
  const result = validateWeeklyApproval(decision, { week: "2026-W47", id: "K-S4-01", ownerApproved: null, commit: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" / "), /owner-approved/);
});

test("[mutation] 検証済みの候補に無い本は止める", () => {
  const result = validateWeeklyApproval(decision, { week: "2026-W47", id: "K-S2-05", ownerApproved: "K-S2-05", commit: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" / "), /検証済みの候補に無い: K-S2-05/);
});

test("[mutation] 旧形式 (schemaVersion 1) の判定では公開しない", () => {
  const result = validateWeeklyApproval({ ...decision, schemaVersion: 1 }, { week: "2026-W47", id: "K-S3-01", ownerApproved: "K-S3-01", commit: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" / "), /ゲートが不正/);
});
