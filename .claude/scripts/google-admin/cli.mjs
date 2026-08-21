#!/usr/bin/env node
/**
 * cli — google-admin runner の入口。安全契約: ./README.md。
 *
 *   node .claude/scripts/google-admin/cli.mjs audit-api    # API read-only 監査 (browser 無し・CI 可)
 *   node .claude/scripts/google-admin/cli.mjs audit-ui     # Playwright residual の read-only 監査 (headed)
 *   node .claude/scripts/google-admin/cli.mjs plan         # GA4 custom dimension の作成計画 (API・read-only)
 *   node .claude/scripts/google-admin/cli.mjs apply --confirm-site stats47.jp --commit --approve <token>
 *   node .claude/scripts/google-admin/cli.mjs apply-ui --confirm-site stats47.jp --commit --approve <token>
 *   node .claude/scripts/google-admin/cli.mjs login        # 素の Chrome で初回ログイン (residual 用)
 *
 * - audit-api / plan / apply は完全 API (browser を起動しない)。schedule に載せられるのは audit-api だけ。
 * - audit-ui / apply-ui / login は headed Playwright residual (公式 API が無い GSC link / Library のみ)。
 * - GA4 custom dimension の作成は承認付き API (apply)。誤作成は自動削除できないため plan token 一致 +
 *   --confirm-site + --commit + --approve + (workflow の) protected Environment 承認をすべて要求する。
 * - screenshot / planned JSON は /tmp のみ。repo へは redact 済み summary (state/*.json) だけ保存する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditGa4Api, applyCreateCustomDimension, resolveApiPropertyId, adminEditClient, LEDGER_PATH } from "./audit-ga4-api.mjs";
import { auditGscProperty, GSC_PROPERTY } from "./audit-gsc.mjs";
import {
  planCustomDimension,
  plannedActionToken,
  requireCommit,
  decideScActions,
} from "./apply-allowlisted-settings.mjs";
import { parseDimensionLedger, LEDGER_STATUS_KINDS } from "./dimension-ledger.mjs";
import { sanitizeObject } from "./redact.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/metrics/google-admin");
const CONFIRM_SITE = "stats47.jp";

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

function saveState(name, payload) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const file = path.join(STATE_DIR, name);
  const summary = sanitizeObject({ schemaVersion: 2, generatedAt: new Date().toISOString(), ...payload });
  fs.writeFileSync(file, JSON.stringify(summary, null, 2) + "\n");
  console.log(`\nsanitized summary → ${path.relative(PROJECT_ROOT, file)}`);
}

/** 台帳から ⏳要登録 の required parameter を集める (安定順)。 */
function ledgerNeedsRegistrationParams() {
  const md = fs.readFileSync(LEDGER_PATH, "utf-8");
  const entries = parseDimensionLedger(md);
  const params = entries
    .filter((e) => e.statusKind === LEDGER_STATUS_KINDS.NEEDS_REGISTRATION)
    .flatMap((e) => e.required);
  return [...new Set(params)].sort();
}

/** mutation 前の identity 契約 (README「不変の安全契約 identity」)。 */
function identityBlockers(audit) {
  const b = [];
  if (audit.property?.status !== "ok") b.push({ code: "property-assert", detail: audit.property?.status ?? "missing" });
  if (audit.webStreams?.status !== "ok") b.push({ code: "stream-host", detail: audit.webStreams?.status ?? "missing" });
  if (audit.gsc?.present !== true) b.push({ code: "gsc-property", detail: `present=${String(audit.gsc?.present)}` });
  if (audit.adsense?.account?.status !== "ok") b.push({ code: "adsense-account", detail: audit.adsense?.account?.status ?? "missing" });
  if (audit.customDimensions?.status !== "ok") b.push({ code: "custom-dimensions-unreadable", detail: audit.customDimensions?.status ?? "missing" });
  return b;
}

/** audit inventory から GA4 dimension の plan と token を導出する (identity 未達なら token を出さない)。 */
function derivePlan(audit) {
  const cd = audit.customDimensions;
  const needsReg = ledgerNeedsRegistrationParams();
  const planResult = planCustomDimension({
    needsRegistrationParams: needsReg,
    existingParams: cd?.status === "ok" ? cd.params : [],
    existingScopeByParam: cd?.status === "ok" ? cd.scopeByParam : {},
    eventScopedCount: cd?.status === "ok" ? cd.eventScopedCount : null,
  });
  const idBlockers = identityBlockers(audit);
  const blockers = [...idBlockers, ...planResult.blockers];
  // identity 未達では作成できないので token を出さない (承認の対象を作らない)
  const token = idBlockers.length === 0 && planResult.plan
    ? plannedActionToken({ site: CONFIRM_SITE, propertyId: audit.propertyId, plan: planResult.plan })
    : null;
  return { plan: planResult.plan, noops: planResult.noops, blockers, token, idBlockers };
}

function printApiAudit(audit) {
  const s = (v) => (v === true ? "✓" : v === false ? "✗" : "?");
  console.log("\n# google-admin audit-api (API read-only)");
  console.log(`GA4 property: ${audit.propertyId ?? "(未設定)"} assert=${audit.property?.status ?? "-"}`);
  console.log(`web stream stats47.jp: ${audit.webStreams?.status ?? "-"} (webStreams=${audit.webStreams?.webStreamCount ?? "?"})`);
  console.log(`custom dimensions: ${audit.customDimensions?.status ?? "-"} count=${audit.customDimensions?.count ?? "?"} eventScoped=${audit.customDimensions?.eventScopedCount ?? "?"}`);
  console.log(`AdSense link (GA4): ${audit.adsenseLinks?.status ?? "-"} linked=${s(audit.adsenseLinks?.linked)}`);
  console.log(`GSC property (API): present=${s(audit.gsc?.present)} permission=${audit.gsc?.permissionLevel ?? "-"} (${audit.gsc?.status})`);
  console.log(`AdSense account assert: ${audit.adsense?.account?.status ?? "-"}${audit.adsense?.account?.detail ? ` (${audit.adsense.account.detail})` : ""}`);
  console.log(`AdSense ad units: ${audit.adsense?.adUnits?.units?.length ?? 0} 件 (${audit.adsense?.adUnits?.status ?? "-"})`);
  // 一部の ad client だけ失敗したときは status=ok のまま件数が欠ける。黙って緑にしない。
  for (const skipped of audit.adsense?.adUnits?.skippedClients ?? []) {
    console.log(`  ! ad client を読めなかった: ${skipped}`);
  }
  const rec = audit.dimensionReconcile;
  if (rec?.skipped) {
    console.log(`custom dimension 突合: 判定不能 (${rec.skipped})`);
  } else if (rec) {
    console.log(`custom dimension 突合: ${JSON.stringify(rec.summary)}`);
    const notable = (rec.rows ?? []).filter((r) => r.verdict !== "confirmed-registered" && r.verdict !== "verified-registered");
    for (const r of notable) console.log(`  ! ${r.param} — ${r.verdict} [台帳: ${r.ledgerStatus}]`);
  }
}

// ── modes ─────────────────────────────────────────────────────────────────────

async function runAuditApi() {
  const audit = await auditGa4Api();
  printApiAudit(audit);
  // read-only 監査は「認証不良を green に隠さない」= 主要 assert が ok でなければ非 0 で終わる。
  const problems = identityBlockers(audit).map((b) => `${b.code}:${b.detail}`);
  saveState("api-latest.json", { kind: "audit-api", audit, problems });
  if (problems.length) {
    console.log(`\n⚠️ 未達の identity assert: ${problems.join(", ")}`);
    process.exitCode = 1;
  }
  return audit;
}

async function runPlan() {
  const audit = await auditGa4Api();
  printApiAudit(audit);
  const { plan, noops, blockers, token, idBlockers } = derivePlan(audit);
  console.log("\n# plan (GA4 custom dimension)");
  if (plan) {
    console.log(`  CANDIDATE  ${JSON.stringify(plan)}`);
    if (token) {
      console.log(`  TOKEN      ${token}`);
      console.log(`  apply する場合: mode=apply --confirm-site ${CONFIRM_SITE} --commit --approve ${token} (protected Environment 承認が別途必要)`);
    } else {
      console.log("  TOKEN      (identity 未達のため未発行 — 下の blocker を解消するまで apply しない)");
    }
  } else {
    console.log("  CANDIDATE  なし (⏳要登録 かつ authored 定義があり未登録の dimension が無い)");
  }
  for (const n of noops) console.log(`  NO-OP      ${n.parameterName ?? n.action}: ${n.reason}`);
  for (const b of blockers) console.log(`  BLOCKER    ${b.code}: ${b.detail}`);
  saveState("plan-latest.json", { kind: "plan", propertyId: audit.propertyId, plan, token, noops, blockers, idBlockers, audit });
  if (blockers.length && !plan) process.exitCode = 1;
  return { audit, plan, token };
}

async function runApply(argv) {
  const audit = await auditGa4Api();
  printApiAudit(audit);
  const { plan, blockers, token } = derivePlan(audit);
  console.log("\n# apply (GA4 custom dimension)");
  if (!plan || !token || blockers.length) {
    for (const b of blockers) console.log(`  BLOCKER  ${b.code}: ${b.detail}`);
    console.log("  → 計画なし / identity 未達のため mutation を実行しない (fail closed)");
    saveState("apply-latest.json", { kind: "apply", propertyId: audit.propertyId, plan, token, blockers, applied: null, audit });
    process.exitCode = 1;
    return;
  }
  const gate = requireCommit({ argv, site: getArg("--confirm-site"), expectedSite: CONFIRM_SITE, expectedToken: token });
  if (!gate.allowed) {
    console.log(`  BLOCKED  承認ゲート: ${gate.reason}`);
    console.log(`  CANDIDATE ${JSON.stringify(plan)} TOKEN ${token}`);
    saveState("apply-latest.json", { kind: "apply", propertyId: audit.propertyId, plan, token, gate, applied: null, audit });
    process.exitCode = 1;
    return;
  }
  if (!adminEditClient()) {
    console.log("  BLOCKED  GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON が無い (Environment secret・人間工程)");
    saveState("apply-latest.json", { kind: "apply", propertyId: audit.propertyId, plan, token, applied: { status: "admin-credential-missing" }, audit });
    process.exitCode = 1;
    return;
  }
  // /tmp に planned JSON を残す (repo へは追加しない)
  const tmpDir = `/tmp/stats47-google-admin-${Date.now().toString(36)}-${process.pid}`;
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "planned-action.json"), JSON.stringify({ site: CONFIRM_SITE, propertyId: audit.propertyId, plan, token }, null, 2));
  console.log(`  → create ${plan.parameterName} (EVENT) ...`);
  const applied = await applyCreateCustomDimension(plan, { propertyId: audit.propertyId });
  console.log(`  → ${applied.status}${applied.reason ? `: ${applied.reason}` : ""}${applied.resourceName ? ` (${applied.resourceName})` : ""}`);
  saveState("apply-latest.json", { kind: "apply", propertyId: audit.propertyId, plan, token, applied, audit });
  if (applied.status !== "applied") process.exitCode = 1;
}

/** Playwright residual (GSC link / Library) の read-only 監査。 */
async function runAuditUi() {
  const { launchAdminContext, acquireLock, releaseLock } = await import("./browser-context.mjs");
  const ga4 = await import("./audit-ga4.mjs");
  const runId = `${Date.now().toString(36)}-${process.pid}`;
  const screenshotDir = path.join(`/tmp/stats47-google-admin-${runId}`, "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  acquireLock();
  let context = null;
  try {
    const launched = await launchAdminContext();
    context = launched.context;
    const page = launched.page;
    const promptLogin = () => {
      console.log("\n⏸  Google ログイン / MFA が必要です。開いている Chrome ウィンドウでログインしてください (最大 10 分待機)。\n");
    };
    const gsc = await auditGscProperty();
    const open = await ga4.openGa4(page, { screenshotDir, promptLogin });
    let audit = { gsc, ga4: { status: open.status } };
    if (open.status === "ok") {
      const propertyAssert = await ga4.assertProperty(page, { screenshotDir });
      audit.propertyAssert = propertyAssert;
      if (propertyAssert.status === "ok") {
        audit.scLinks = await ga4.auditSearchConsoleLinks(page, { screenshotDir });
        audit.library = await ga4.auditLibraryCollection(page, { screenshotDir });
      }
    }
    console.log("\n# google-admin audit-ui (Playwright residual read-only)");
    console.log(`GSC property (API): present=${gsc.present} (${gsc.status})`);
    console.log(`property assert: ${audit.propertyAssert?.status ?? "-"}`);
    console.log(`Search Console link: linked=${audit.scLinks?.linked ?? "-"} (${audit.scLinks?.status ?? "-"})`);
    console.log(`Library SC collection: has=${audit.library?.hasScCollection ?? "-"} published=${audit.library?.published ?? "-"} (${audit.library?.status ?? "-"})`);
    saveState("ui-latest.json", { kind: "audit-ui", propertyId: ga4.GA4_PROPERTY_ID, gscProperty: GSC_PROPERTY, audit });
    console.log(`\nscreenshots: ${screenshotDir} (repo へは追加しない)`);
  } finally {
    await context?.close().catch(() => {});
    releaseLock();
  }
}

/** Playwright residual の mutation (create-sc-link / publish-collection)。draft-first + 承認トークン。 */
async function runApplyUi(argv) {
  const { launchAdminContext, acquireLock, releaseLock } = await import("./browser-context.mjs");
  const ga4 = await import("./audit-ga4.mjs");
  const { applyCreateScLink, applyPublishScCollection } = await import("./apply-allowlisted-settings.mjs");
  const runId = `${Date.now().toString(36)}-${process.pid}`;
  const screenshotDir = path.join(`/tmp/stats47-google-admin-${runId}`, "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  acquireLock();
  let context = null;
  try {
    const launched = await launchAdminContext();
    context = launched.context;
    const page = launched.page;
    const promptLogin = () => console.log("\n⏸  Google ログインが必要です。Chrome ウィンドウで対応してください。\n");
    const gsc = await auditGscProperty();
    const open = await ga4.openGa4(page, { screenshotDir, promptLogin });
    if (open.status !== "ok") {
      console.log(`GA4 を開けません: ${open.status}`);
      process.exitCode = 1;
      return;
    }
    const propertyAssert = await ga4.assertProperty(page, { screenshotDir });
    if (propertyAssert.status !== "ok") {
      console.log(`property assert 失敗: ${propertyAssert.status} — mutation しない`);
      process.exitCode = 1;
      return;
    }
    const scLinks = await ga4.auditSearchConsoleLinks(page, { screenshotDir });
    const library = await ga4.auditLibraryCollection(page, { screenshotDir });
    const decision = decideScActions({ gsc, scLinks, library });

    console.log("\n# apply-ui decision (Playwright residual)");
    for (const a of decision.actions) console.log(`  ACTION   ${a}`);
    for (const n of decision.noops) console.log(`  NO-OP    ${n.action}: ${n.reason}`);
    for (const b of decision.blockers) console.log(`  BLOCKER  ${b.code}: ${b.detail}`);

    const token = plannedActionToken({ site: CONFIRM_SITE, propertyId: "sc-residual", plan: { actions: [...decision.actions].sort() } });
    const applied = [];
    if (decision.actions.length > 0) {
      console.log(`  TOKEN    ${token}`);
      const gate = requireCommit({ argv, site: getArg("--confirm-site"), expectedSite: CONFIRM_SITE, expectedToken: token });
      if (!gate.allowed) {
        console.log(`  → 実行しない (draft-first): ${gate.reason}`);
        console.log(`  実行するには: mode=apply-ui --confirm-site ${CONFIRM_SITE} --commit --approve ${token}`);
      } else {
        for (const action of decision.actions) {
          console.log(`\n→ apply-ui: ${action}`);
          let result = { status: "unknown-action" };
          if (action === "create-search-console-link") {
            result = await applyCreateScLink(page, {
              screenshotDir,
              propertyId: ga4.GA4_PROPERTY_ID,
              gotoScLinks: () => ga4.auditSearchConsoleLinks(page, { screenshotDir }),
            });
          } else if (action === "publish-search-console-collection") {
            result = await applyPublishScCollection(page, {
              screenshotDir,
              propertyId: ga4.GA4_PROPERTY_ID,
              gotoLibrary: () => ga4.auditLibraryCollection(page, { screenshotDir }),
            });
          }
          console.log(`  → ${result.status}${result.reason ? `: ${result.reason}` : ""}`);
          applied.push({ action, ...result });
          if (result.status === "mutation-unknown") break;
        }
      }
    }
    saveState("ui-apply-latest.json", { kind: "apply-ui", decision, token, applied, audit: { gsc, scLinks, library } });
    console.log(`\nscreenshots: ${screenshotDir} (repo へは追加しない)`);
  } finally {
    await context?.close().catch(() => {});
    releaseLock();
  }
}

async function runLogin() {
  const { spawn } = await import("node:child_process");
  const { PROFILE_DIR } = await import("./browser-context.mjs");
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  console.log("素の Chrome (automation 非接続) を専用プロファイルで開きます。");
  console.log("1. 開いたウィンドウで Google にログイン (stats47 のアカウント)");
  console.log("2. analytics.google.com が表示できることを確認");
  console.log("3. その Chrome ウィンドウを完全に終了 (Cmd+Q)");
  console.log("4. `npm run google-admin:audit-ui` を再実行\n");
  spawn(
    "open",
    ["-na", "Google Chrome", "--args", `--user-data-dir=${PROFILE_DIR}`, "--no-first-run", "--no-default-browser-check", "https://accounts.google.com/"],
    { detached: true, stdio: "ignore" },
  ).unref();
}

async function main() {
  const cmd = process.argv[2] ?? "audit-api";
  // audit は移行期の alias (旧: DOM audit)。UI residual へ寄せる。consumer 更新後に削除。
  const normalized = cmd === "audit" || cmd === "verify" ? "audit-ui" : cmd;

  if (normalized === "login") return runLogin();
  if (normalized === "audit-api") return void (await runAuditApi());
  if (normalized === "plan") return void (await runPlan());

  if (normalized === "apply" || normalized === "apply-ui") {
    if (getArg("--confirm-site") !== CONFIRM_SITE) {
      console.error(`${normalized} には --confirm-site ${CONFIRM_SITE} が必須 (対象 site の明示)`);
      process.exit(1);
    }
  }
  if (normalized === "apply") return runApply(process.argv);
  if (normalized === "audit-ui") return runAuditUi();
  if (normalized === "apply-ui") return runApplyUi(process.argv);

  console.error(
    "usage: cli.mjs <login|audit-api|audit-ui|plan|apply|apply-ui> [--confirm-site stats47.jp] [--commit --approve <token>]",
  );
  process.exit(1);
}

main().catch((e) => {
  console.error("[google-admin] failed:", e.message || e);
  process.exit(1);
});
