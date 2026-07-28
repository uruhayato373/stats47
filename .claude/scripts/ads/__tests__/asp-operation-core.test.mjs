/**
 * asp-operation-core.mjs の pure unit テスト (doc 42 §16.1)。
 * plan hash / 期限 / journal 再送禁止 / lock 回収条件 / cron 集約と health を検証する。
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PLAN_TTL_MS,
  planPayloadSha256,
  buildPlan,
  isPlanExpired,
  validatePlanForCommit,
  buildJournalEvent,
  deriveOperationOutcome,
  canAutoResend,
  buildLockPayload,
  canReclaimLock,
  DEFAULT_LOCK_STALE_MS,
  aggregateRunStatus,
  buildHealth,
  exitCodeForStatus,
} from "../lib/asp-operation-core.mjs";

const BASE = {
  action: "apply",
  asp: "moshimo",
  siteId: "638943",
  programId: "6154",
  programName: "テスト案件",
  formTargetCount: 1,
  applyLabel: "提携申請する",
  confirmLabel: "このメディアで提携する",
  termsFingerprint: "tf-1",
  eligibilityFingerprint: "ef-1",
};
const T0 = "2026-07-29T00:00:00.000Z";

// ── plan hash ────────────────────────────────────────────────────────────────
test("plan payload: フィールド順が違っても同じ hash", () => {
  const a = planPayloadSha256(BASE);
  const shuffled = {
    eligibilityFingerprint: "ef-1",
    programId: "6154",
    asp: "moshimo",
    confirmLabel: "このメディアで提携する",
    action: "apply",
    termsFingerprint: "tf-1",
    applyLabel: "提携申請する",
    siteId: "638943",
    formTargetCount: 1,
    programName: "テスト案件",
  };
  assert.equal(a, planPayloadSha256(shuffled));
});

test("plan payload: program / site / terms の変更で hash が変わる", () => {
  const base = planPayloadSha256(BASE);
  assert.notEqual(base, planPayloadSha256({ ...BASE, programId: "9999" }));
  assert.notEqual(base, planPayloadSha256({ ...BASE, siteId: "984453" }));
  assert.notEqual(base, planPayloadSha256({ ...BASE, termsFingerprint: "tf-2" }));
});

test("plan payload: createdAt / operationId は hash に影響しない", () => {
  const p1 = buildPlan({ ...BASE, createdAt: T0 });
  const p2 = buildPlan({ ...BASE, createdAt: "2026-07-29T05:00:00.000Z" });
  assert.equal(p1.payloadSha256, p2.payloadSha256);
  assert.notEqual(p1.operationId, p2.operationId);
});

// ── plan 期限 / commit 前再照合 ──────────────────────────────────────────────
test("expired plan は commit できない", () => {
  const plan = buildPlan({ ...BASE, createdAt: T0 });
  const past = new Date(Date.parse(T0) + PLAN_TTL_MS + 1).toISOString();
  assert.equal(isPlanExpired(plan, past), true);
  const r = validatePlanForCommit({ plan, nowIso: past, observed: BASE });
  assert.equal(r.ok, false);
  assert.match(r.reason, /expired/);
});

test("commit 前再照合: 1 項目でも違えば拒否", () => {
  const plan = buildPlan({ ...BASE, createdAt: T0 });
  const now = new Date(Date.parse(T0) + 1000).toISOString();
  assert.equal(validatePlanForCommit({ plan, nowIso: now, observed: BASE }).ok, true);
  for (const [key, val] of [
    ["siteId", "984453"],
    ["programId", "9999"],
    ["formTargetCount", 2],
    ["applyLabel", "一括提携申請へ"],
    ["termsFingerprint", "tf-CHANGED"],
  ]) {
    const r = validatePlanForCommit({ plan, nowIso: now, observed: { ...BASE, [key]: val } });
    assert.equal(r.ok, false, `${key} 差異で拒否されるべき`);
    assert.ok(r.reason.includes(key), `reason に ${key} を含む: ${r.reason}`);
  }
});

// ── journal ──────────────────────────────────────────────────────────────────
function ev(operationId, event, at = T0) {
  return buildJournalEvent({
    operationId,
    at,
    asp: "moshimo",
    siteId: "638943",
    programId: "6154",
    event,
    planSha256: "abc",
    reason: null,
  });
}

test("journal: sent がある operation は自動再送不可", () => {
  const events = [ev("op1", "planned"), ev("op1", "intent-recorded"), ev("op1", "sent")];
  assert.equal(canAutoResend(events), false);
  assert.equal(deriveOperationOutcome(events).state, "sent");
});

test("journal: unknown がある operation は自動再送不可", () => {
  const events = [ev("op1", "planned"), ev("op1", "intent-recorded"), ev("op1", "sent"), ev("op1", "unknown")];
  assert.equal(canAutoResend(events), false);
  assert.equal(deriveOperationOutcome(events).state, "unknown");
});

test("journal: planned / aborted のみなら再 plan 可能", () => {
  assert.equal(canAutoResend([ev("op1", "planned"), ev("op1", "aborted")]), true);
});

test("journal: 不正な event 名は throw", () => {
  assert.throws(() => ev("op1", "clicked"), /event/);
});

test("journal: 必須フィールド欠落は throw", () => {
  assert.throws(
    () => buildJournalEvent({ operationId: "op1", event: "planned" }),
    /(at|asp|siteId|programId)/,
  );
});

// ── lock ─────────────────────────────────────────────────────────────────────
test("lock: 生存 PID の lock は age に関係なく奪わない", () => {
  const lock = buildLockPayload({ pid: 123, hostname: "mac", startedAt: T0, operationId: "op1" });
  const old = new Date(Date.parse(T0) + DEFAULT_LOCK_STALE_MS * 10).toISOString();
  assert.equal(canReclaimLock({ lock, nowIso: old, pidAlive: true }), false);
});

test("lock: 片方の条件だけでは回収しない (age のみ / PID 不在のみ)", () => {
  const lock = buildLockPayload({ pid: 123, hostname: "mac", startedAt: T0, operationId: "op1" });
  const fresh = new Date(Date.parse(T0) + 1000).toISOString();
  const old = new Date(Date.parse(T0) + DEFAULT_LOCK_STALE_MS + 1).toISOString();
  assert.equal(canReclaimLock({ lock, nowIso: old, pidAlive: true }), false, "古いが PID 生存");
  assert.equal(canReclaimLock({ lock, nowIso: fresh, pidAlive: false }), false, "PID 不在だが新しい");
  assert.equal(canReclaimLock({ lock, nowIso: old, pidAlive: false }), true, "両方満たせば回収");
});

// ── cron result / health ─────────────────────────────────────────────────────
test("cron: 全 step ok/noop/skipped なら ok・exit 0", () => {
  const steps = [
    { name: "check-approval", status: "ok", reason: null },
    { name: "select", status: "noop", reason: null },
    { name: "harvest", status: "skipped", reason: "profile-in-use" },
  ];
  assert.equal(aggregateRunStatus(steps), "ok");
  assert.equal(exitCodeForStatus("ok"), 0);
});

test("cron: 1 step 失敗で partial・exit 非 0 (握り潰さない)", () => {
  const steps = [
    { name: "check-approval", status: "ok", reason: null },
    { name: "harvest", status: "failed", reason: "selector drift" },
  ];
  assert.equal(aggregateRunStatus(steps), "partial");
  assert.notEqual(exitCodeForStatus("partial"), 0);
});

test("cron: auth-required は failed と区別され成功にならない", () => {
  const steps = [{ name: "check-approval", status: "auth-required", reason: "session expired" }];
  assert.equal(aggregateRunStatus(steps), "auth-required");
  assert.notEqual(exitCodeForStatus("auth-required"), 0);
});

test("health: lastSuccessfulRunAt は全成功時だけ進む", () => {
  const okSteps = [{ name: "a", status: "ok", reason: null }];
  const badSteps = [{ name: "a", status: "failed", reason: "x" }];
  const h1 = buildHealth({ runId: "r1", startedAt: T0, finishedAt: T0, steps: okSteps, previousHealth: null });
  assert.equal(h1.lastSuccessfulRunAt, T0);
  const t1 = "2026-07-30T00:00:00.000Z";
  const h2 = buildHealth({ runId: "r2", startedAt: t1, finishedAt: t1, steps: badSteps, previousHealth: h1 });
  assert.equal(h2.status, "failed");
  assert.equal(h2.lastSuccessfulRunAt, T0, "失敗 run では前回成功時刻を保持");
});
