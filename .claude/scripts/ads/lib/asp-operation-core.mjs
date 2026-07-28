/**
 * asp-operation-core.mjs — ASP 操作の plan / journal / lock / cron-health の純粋コア
 * ---------------------------------------------------------------------------
 * I/O なし (node:crypto のみ)。doc 42 (docs/02_実装計画/42_アフィリエイトPlaywright継続運用・
 * 安全化実装仕様.md) §6.3-6.5 / §11.2 の決定的判定を一手に持つ。
 *
 * 呼び出し側 (CLI / cron / apply スクリプト) はファイル I/O だけを行い、
 * hash・期限・再送可否・lock 回収条件・run 集約をモデルや shell に判断させない。
 *
 * テスト: .claude/scripts/ads/__tests__/asp-operation-core.test.mjs
 */
import { createHash } from "node:crypto";

// ── plan (§6.3) ──────────────────────────────────────────────────────────────

export const PLAN_SCHEMA_VERSION = 1;
/** plan の有効期限。24h を過ぎた plan では commit できない (画面が変わっている前提で作り直す)。 */
export const PLAN_TTL_MS = 24 * 60 * 60 * 1000;

/** 意味上の申請対象を構成するフィールド (これ以外は hash に入れない)。 */
const PLAN_SEMANTIC_FIELDS = [
  "action",
  "asp",
  "siteId",
  "programId",
  "programName",
  "formTargetCount",
  "applyLabel",
  "confirmLabel",
  "termsFingerprint",
  "eligibilityFingerprint",
];

/** キー順に依存しない決定的 JSON 文字列化 (ネスト対応)。 */
function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
}

/**
 * plan の意味上の申請対象から SHA-256 を決定的に算出する。
 * 時刻 (createdAt/expiresAt) と operationId は含めない — 同じ対象なら常に同じ hash。
 */
export function planPayloadSha256(fields) {
  const semantic = {};
  for (const k of PLAN_SEMANTIC_FIELDS) semantic[k] = fields[k] ?? null;
  return createHash("sha256").update(canonicalJson(semantic)).digest("hex");
}

/**
 * AffiliateOperationPlan (§6.3) を組み立てる。createdAt は呼び出し側が渡す
 * (このモジュールは Date.now() を呼ばない = テストが決定的)。
 */
export function buildPlan(fields) {
  const { createdAt } = fields;
  if (!createdAt || Number.isNaN(Date.parse(createdAt))) throw new Error("createdAt (ISO) が必須");
  for (const k of ["asp", "siteId", "programId", "applyLabel", "eligibilityFingerprint"]) {
    if (fields[k] == null || fields[k] === "") throw new Error(`plan の必須フィールド欠落: ${k}`);
  }
  const payloadSha256 = planPayloadSha256(fields);
  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    operationId: `${fields.asp}-${fields.programId}-${createdAt.replace(/[:.]/g, "-")}`,
    action: fields.action ?? "apply",
    asp: fields.asp,
    siteId: String(fields.siteId),
    programId: String(fields.programId),
    programName: fields.programName ?? "",
    formTargetCount: fields.formTargetCount ?? 1,
    applyLabel: fields.applyLabel,
    confirmLabel: fields.confirmLabel ?? null,
    termsFingerprint: fields.termsFingerprint ?? null,
    eligibilityFingerprint: fields.eligibilityFingerprint,
    createdAt,
    expiresAt: new Date(Date.parse(createdAt) + PLAN_TTL_MS).toISOString(),
    payloadSha256,
  };
}

export function isPlanExpired(plan, nowIso) {
  return Date.parse(nowIso) > Date.parse(plan.expiresAt);
}

/**
 * commit 直前の再照合 (§6.3)。同じ画面を再読込して観測した値 (observed) と plan を突合し、
 * 1 項目でも違えば押さない。期限切れも拒否。
 * @returns {{ok: boolean, reason: string}}
 */
export function validatePlanForCommit({ plan, nowIso, observed }) {
  if (isPlanExpired(plan, nowIso)) return { ok: false, reason: `plan expired (${plan.expiresAt})` };
  const mismatches = [];
  for (const k of ["siteId", "programId", "formTargetCount", "applyLabel", "confirmLabel", "termsFingerprint"]) {
    const planVal = plan[k] ?? null;
    const obsVal = observed[k] ?? null;
    if (String(planVal) !== String(obsVal)) mismatches.push(`${k}: plan=${planVal} observed=${obsVal}`);
  }
  if (mismatches.length > 0) return { ok: false, reason: `再照合不一致 → plan 失効: ${mismatches.join("; ")}` };
  return { ok: true, reason: "plan 一致 (commit 可)" };
}

// ── journal (§6.4) ───────────────────────────────────────────────────────────

export const JOURNAL_EVENTS = ["planned", "intent-recorded", "sent", "confirmed", "unknown", "aborted"];

/** journal 1 行 (NDJSON の 1 event)。必須フィールドと event 名を検証する。 */
export function buildJournalEvent({ operationId, at, asp, siteId, programId, event, planSha256, reason = null }) {
  for (const [k, v] of Object.entries({ operationId, at, asp, siteId, programId, event, planSha256 })) {
    if (v == null || v === "") throw new Error(`journal の必須フィールド欠落: ${k}`);
  }
  if (!JOURNAL_EVENTS.includes(event)) throw new Error(`不正な journal event: ${event}`);
  return { operationId, at, asp, siteId: String(siteId), programId: String(programId), event, planSha256, reason };
}

/**
 * 1 operation の event 列から現在状態を導出する。
 * 優先順位: unknown > confirmed > sent > aborted > intent-recorded > planned
 * (unknown は「押したが確定できない」— confirmed より強い停止シグナルとして扱う)。
 */
export function deriveOperationOutcome(events) {
  const names = new Set(events.map((e) => e.event));
  const state = ["unknown", "confirmed", "sent", "aborted", "intent-recorded", "planned"].find((s) => names.has(s)) ?? "none";
  return { state, canAutoResend: canAutoResend(events) };
}

/**
 * 自動再送可否 (§6.4)。`sent` または `unknown` が 1 つでもあれば false —
 * 「未申請と誤認して再申請」を構造的に防ぐ。次の一手は live reconciliation のみ。
 */
export function canAutoResend(events) {
  return !events.some((e) => e.event === "sent" || e.event === "unknown");
}

// ── lock (§6.5) ──────────────────────────────────────────────────────────────

/** stale lock とみなす age。afb は 1 run が 1 時間を超え得るため余裕を持つ。 */
export const DEFAULT_LOCK_STALE_MS = 3 * 60 * 60 * 1000;

export function buildLockPayload({ pid, hostname, startedAt, operationId }) {
  for (const [k, v] of Object.entries({ pid, hostname, startedAt, operationId })) {
    if (v == null || v === "") throw new Error(`lock の必須フィールド欠落: ${k}`);
  }
  return { pid, hostname, startedAt, operationId };
}

/**
 * stale lock の回収可否 (§6.5)。**age 超過と PID 不在の両方**を満たしたときだけ true。
 * 片方だけ (古いが生存 / 不在だが新しい) では回収しない — 人間の headed run を殺さない。
 */
export function canReclaimLock({ lock, nowIso, pidAlive, staleMs = DEFAULT_LOCK_STALE_MS }) {
  if (pidAlive) return false;
  const age = Date.parse(nowIso) - Date.parse(lock.startedAt);
  return Number.isFinite(age) && age > staleMs;
}

/** finally で消してよいのは自分の operationId の lock だけ (§6.5)。 */
export function isOwnLock(lock, operationId) {
  return lock?.operationId === operationId;
}

// ── cron result / health (§11.2) ─────────────────────────────────────────────

export const STEP_STATUSES = ["ok", "noop", "failed", "auth-required", "skipped"];
export const HEALTH_SCHEMA_VERSION = 1;

/**
 * step 結果から run 全体の status を決定的に導出する。
 * failed が 1 つでもあれば partial (全滅なら failed)。auth-required は failed が無いときだけ
 * run status になる (認証切れと実装破損を混同しない)。skipped/noop は成功扱い (§11.3)。
 */
export function aggregateRunStatus(steps) {
  for (const s of steps) {
    if (!STEP_STATUSES.includes(s.status)) throw new Error(`不正な step status: ${s.status}`);
  }
  const failed = steps.filter((s) => s.status === "failed").length;
  const auth = steps.filter((s) => s.status === "auth-required").length;
  if (failed === 0 && auth === 0) return "ok";
  if (failed === 0) return "auth-required";
  return failed === steps.length ? "failed" : "partial";
}

/** exit code への写像。ok だけが 0 — `|| echo` で握り潰さない (§11.2)。 */
export function exitCodeForStatus(status) {
  return status === "ok" ? 0 : 1;
}

/**
 * AffiliateAutomationHealth (§11.2) を組み立てる。
 * lastSuccessfulRunAt は **status=ok の run だけ**が進める (§16.3)。
 */
export function buildHealth({ runId, startedAt, finishedAt, steps, previousHealth }) {
  const status = aggregateRunStatus(steps);
  return {
    schemaVersion: HEALTH_SCHEMA_VERSION,
    runId,
    startedAt,
    finishedAt,
    status,
    steps: steps.map((s) => ({ name: s.name, status: s.status, reason: s.reason ?? null })),
    lastSuccessfulRunAt: status === "ok" ? finishedAt : (previousHealth?.lastSuccessfulRunAt ?? null),
  };
}
