/**
 * asp-operation-store のテスト — plan の保存・失効と journal の append/read。
 * 実 .local を汚さないよう、root を一時ディレクトリへ差し替えて動かす。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  writePlan,
  readPlan,
  expirePlan,
  appendJournal,
  readJournal,
  plansDir,
  journalPath,
} from "../lib/asp-operation-store.mjs";
import { buildPlan, buildJournalEvent, deriveOperationOutcome } from "../lib/asp-operation-core.mjs";

function withRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), "asp-ops-"));
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const PLAN_FIELDS = {
  action: "apply",
  asp: "moshimo",
  siteId: "638943",
  programId: "6154",
  programName: "テスト案件",
  formTargetCount: 1,
  applyLabel: "このメディアで提携申請する",
  confirmLabel: "このメディアで提携する",
  termsFingerprint: null,
  eligibilityFingerprint: "abc123",
  createdAt: "2026-08-21T00:00:00.000Z",
};

test("writePlan → readPlan で往復し、同じ operationId の上書きは拒否する", () => {
  withRoot((root) => {
    const plan = buildPlan(PLAN_FIELDS);
    const path = writePlan(plan, root);
    assert.ok(path.startsWith(plansDir(root)));
    assert.deepEqual(readPlan(plan.operationId, root), plan);
    // ★上書きを許すと「計画を作り直して同じ id で押す」ができてしまう
    assert.throws(() => writePlan(plan, root), /既にある/);
  });
});

test("readPlan: 無い plan は null (壊れているのと区別する)", () => {
  withRoot((root) => {
    assert.equal(readPlan("moshimo-9999-x", root), null);
  });
});

test("expirePlan: 削除ではなく改名して証拠を残す", () => {
  withRoot((root) => {
    const plan = buildPlan(PLAN_FIELDS);
    writePlan(plan, root);
    const to = expirePlan(plan.operationId, root);
    assert.match(to, /\.expired\.json$/);
    assert.ok(existsSync(to));
    assert.equal(readPlan(plan.operationId, root), null, "失効後に読めてはいけない");
    assert.equal(expirePlan(plan.operationId, root), null, "二度目は no-op");
  });
});

test("appendJournal → readJournal は operationId で絞り、順序を保つ", () => {
  withRoot((root) => {
    const base = { at: "2026-08-21T00:00:00.000Z", asp: "moshimo", siteId: "638943", programId: "6154", planSha256: "sha" };
    appendJournal(buildJournalEvent({ ...base, operationId: "op-1", event: "planned" }), root);
    appendJournal(buildJournalEvent({ ...base, operationId: "op-2", event: "planned" }), root);
    appendJournal(buildJournalEvent({ ...base, operationId: "op-1", event: "intent-recorded" }), root);
    appendJournal(buildJournalEvent({ ...base, operationId: "op-1", event: "sent" }), root);

    const events = readJournal("op-1", root);
    assert.deepEqual(events.map((e) => e.event), ["planned", "intent-recorded", "sent"]);
    assert.equal(readJournal("op-2", root).length, 1);
    // sent があるので自動再送しない (二重申請の構造的な防止)
    assert.equal(deriveOperationOutcome(events).canAutoResend, false);
  });
});

test("readJournal: 壊れた行を黙って捨てず throw する", () => {
  withRoot((root) => {
    mkdirSync(plansDir(root), { recursive: true });
    appendFileSync(journalPath(root), '{"operationId":"op-1","event":"planned"}\nこわれた行\n', "utf-8");
    assert.throws(() => readJournal("op-1", root), /壊れている/);
  });
});
