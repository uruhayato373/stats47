import assert from "node:assert/strict";
import test from "node:test";
import { validateWeeklyApproval } from "../kdp-weekly-approval.mjs";

const decision = {
  schemaVersion: 1,
  week: "2026-W41",
  status: "ready-for-owner-approval",
  candidate: { id: "K-S4-01" },
  approvalRequired: true,
};

test("exact book approval and commit pass", () => {
  const result = validateWeeklyApproval(decision, {
    week: "2026-W41",
    id: "K-S4-01",
    ownerApproved: "K-S4-01",
    commit: true,
  });
  assert.equal(result.ok, true);
});

test("weekly plan alone never substitutes for owner approval", () => {
  const result = validateWeeklyApproval(decision, {
    week: "2026-W41",
    id: "K-S4-01",
    ownerApproved: null,
    commit: true,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" / "), /owner-approved/);
});

test("candidate mismatch fails closed", () => {
  const result = validateWeeklyApproval(decision, {
    week: "2026-W41",
    id: "K-S3-01",
    ownerApproved: "K-S3-01",
    commit: true,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" / "), /候補が不一致/);
});
