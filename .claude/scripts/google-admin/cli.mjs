#!/usr/bin/env node
/**
 * cli — google-admin runner の入口 (doc41 §6.1)。
 *
 *   node .claude/scripts/google-admin/cli.mjs audit              # read-only 監査 (既定)
 *   node .claude/scripts/google-admin/cli.mjs apply --confirm-site stats47.jp
 *   node .claude/scripts/google-admin/cli.mjs verify             # 設定後の再監査 (= audit)
 *
 * - headed 専用 (cron/CI へ載せない・§5.1)。login/MFA はユーザー操作を待つ (突破しない)。
 * - apply は allowlist 3 action のみ (decideActions が決定・denylist は実行経路が存在しない)。
 * - screenshot / planned JSON は /tmp/stats47-google-admin-<run-id>/ のみ。
 *   repo へは redact 済み summary (.claude/state/metrics/google-admin/latest.json) だけ保存する。
 */
import fs from "node:fs";
import path from "node:path";
import { acquireLock, releaseLock, launchAdminContext, PROJECT_ROOT } from "./browser-context.mjs";
import { auditGscProperty, GSC_PROPERTY } from "./audit-gsc.mjs";
import {
  GA4_PROPERTY_ID,
  openGa4,
  assertProperty,
  auditWebStreams,
  auditSearchConsoleLinks,
  auditAdSenseLinks,
  auditCustomDimensions,
  auditLibraryCollection,
} from "./audit-ga4.mjs";
import {
  decideActions,
  applyCreateScLink,
  applyPublishScCollection,
  applyCreateAdIdDimension,
} from "./apply-allowlisted-settings.mjs";
import { sanitizeObject } from "./redact.mjs";

const STATE_FILE = path.join(PROJECT_ROOT, ".claude/state/metrics/google-admin/latest.json");
const LEDGER_FILE = path.join(PROJECT_ROOT, ".claude/rules/analytics-event-standards.md");
const CONFIRM_SITE = "stats47.jp";

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

/** 台帳の ad_id 状態 (⏳要登録 か) を読む。 */
function readLedgerAdIdStatus() {
  try {
    const md = fs.readFileSync(LEDGER_FILE, "utf-8");
    const line = md.split("\n").find((l) => l.includes("`ad_id`") && l.includes("|"));
    if (!line) return "unknown";
    if (line.includes("要登録")) return "要登録";
    if (line.includes("登録済")) return "登録済";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/** GA4 に ad_impression 実データがあるという既知の観測 (doc41 §5.2)。台帳の実測記録から判定。 */
function ga4AdImpressionObserved() {
  try {
    const md = fs.readFileSync(LEDGER_FILE, "utf-8");
    return md.includes("adSourceName") && md.includes("3,346");
  } catch {
    return false;
  }
}

async function runAudit(page, screenshotDir, promptLogin) {
  const out = { propertyId: GA4_PROPERTY_ID, gscProperty: GSC_PROPERTY };
  out.gsc = await auditGscProperty();
  const open = await openGa4(page, { screenshotDir, promptLogin });
  if (open.status !== "ok") {
    out.ga4 = { status: open.status };
    return out;
  }
  out.propertyAssert = await assertProperty(page, { screenshotDir });
  if (out.propertyAssert.status !== "ok") return out; // property 不一致は以降を読まない (fail closed)
  out.webStreams = await auditWebStreams(page, { screenshotDir });
  out.scLinks = await auditSearchConsoleLinks(page, { screenshotDir });
  out.adsenseLinks = await auditAdSenseLinks(page, { screenshotDir });
  out.customDimensions = await auditCustomDimensions(page, { screenshotDir });
  out.library = await auditLibraryCollection(page, { screenshotDir });
  return out;
}

function printAudit(audit) {
  const s = (v) => (v === true ? "✓" : v === false ? "✗" : "?");
  console.log("\n# google-admin audit");
  console.log(`GA4 property: ${audit.propertyId} assert=${audit.propertyAssert?.status ?? "-"}`);
  console.log(`GSC property (API): present=${s(audit.gsc?.present)} permission=${audit.gsc?.permissionLevel ?? "-"} (${audit.gsc?.status})`);
  console.log(`web stream stats47.jp: ${s(audit.webStreams?.hasStats47Stream)} (${audit.webStreams?.status ?? "-"})`);
  console.log(`Search Console link: linked=${s(audit.scLinks?.linked)} (${audit.scLinks?.status ?? "-"})`);
  console.log(`AdSense link: linked=${s(audit.adsenseLinks?.linked)} pub=${audit.adsenseLinks?.publisherId ?? "-"} (${audit.adsenseLinks?.status ?? "-"})`);
  console.log(`custom dimension ad_id: ${s(audit.customDimensions?.hasAdId)} (${audit.customDimensions?.status ?? "-"})`);
  console.log(`Library SC collection: has=${s(audit.library?.hasScCollection)} published=${s(audit.library?.published)} (${audit.library?.status ?? "-"})`);
}

function saveState(kind, audit, decision, applied) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const summary = sanitizeObject({
    schemaVersion: 1,
    kind,
    generatedAt: new Date().toISOString(),
    propertyId: GA4_PROPERTY_ID,
    gscProperty: GSC_PROPERTY,
    audit,
    decision: decision ?? null,
    applied: applied ?? null,
  });
  fs.writeFileSync(STATE_FILE, JSON.stringify(summary, null, 2) + "\n");
  console.log(`\nsanitized summary → ${path.relative(PROJECT_ROOT, STATE_FILE)}`);
}

async function main() {
  const cmd = process.argv[2] ?? "audit";
  if (cmd === "login") {
    // Google がヘッドフル Playwright (CDP) でのサインインを拒否する場合の初回ログイン経路。
    // CDP を一切つけない素の Chrome を専用プロファイルで開く — 人間が通常どおりログインし、
    // ウィンドウを閉じてから audit を再実行する (このプロセスは起動して案内するだけ)。
    const { spawn } = await import("node:child_process");
    const { PROFILE_DIR } = await import("./browser-context.mjs");
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
    console.log("素の Chrome (automation 非接続) を専用プロファイルで開きます。");
    console.log("1. 開いたウィンドウで Google にログイン (stats47 のアカウント)");
    console.log("2. analytics.google.com が表示できることを確認");
    console.log("3. その Chrome ウィンドウを完全に終了 (Cmd+Q)");
    console.log("4. `npm run google-admin:audit` を再実行\n");
    spawn("open", ["-na", "Google Chrome", "--args", `--user-data-dir=${PROFILE_DIR}`, "--no-first-run", "--no-default-browser-check", "https://accounts.google.com/"], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (!["audit", "apply", "verify"].includes(cmd)) {
    console.error("usage: cli.mjs <login|audit|apply|verify> [--confirm-site stats47.jp]");
    process.exit(1);
  }
  if (cmd === "apply" && getArg("--confirm-site") !== CONFIRM_SITE) {
    console.error(`apply には --confirm-site ${CONFIRM_SITE} が必須 (対象 site の明示・§6.1)`);
    process.exit(1);
  }

  const runId = `${Date.now().toString(36)}-${process.pid}`;
  const tmpDir = `/tmp/stats47-google-admin-${runId}`;
  const screenshotDir = path.join(tmpDir, "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });

  acquireLock();
  let context = null;
  try {
    const launched = await launchAdminContext();
    context = launched.context;
    const page = launched.page;
    const promptLogin = () => {
      console.log("\n⏸  Google ログイン / MFA が必要です。開いている Chrome ウィンドウでログインしてください。");
      console.log("   ログイン完了を自動検知して続行します (最大 10 分待機・自動入力はしません)。\n");
    };

    const audit = await runAudit(page, screenshotDir, promptLogin);
    printAudit(audit);

    const inventory = {
      gsc: audit.gsc,
      scLinks: audit.scLinks ?? { status: "missing" },
      adsenseLinks: audit.adsenseLinks ?? { status: "missing" },
      customDimensions: audit.customDimensions ?? { status: "missing" },
      library: audit.library ?? { status: "missing" },
      ledger: { adIdStatus: readLedgerAdIdStatus() },
      ga4AdImpressionObserved: ga4AdImpressionObserved(),
    };
    const decision =
      audit.propertyAssert?.status === "ok" ? decideActions(inventory) : { actions: [], noops: [], blockers: [{ code: "property-assert-failed", detail: audit.propertyAssert?.status ?? audit.ga4?.status ?? "unknown" }] };

    console.log("\n# decision");
    for (const a of decision.actions) console.log(`  APPLY   ${a}`);
    for (const n of decision.noops) console.log(`  NO-OP   ${n.action}: ${n.reason}`);
    for (const b of decision.blockers) console.log(`  BLOCKER ${b.code}: ${b.detail}`);

    let applied = null;
    if (cmd === "apply" && decision.actions.length > 0) {
      applied = [];
      // planned action JSON を /tmp に保存 (§6.6-4)
      fs.writeFileSync(path.join(tmpDir, "planned-actions.json"), JSON.stringify({ site: CONFIRM_SITE, propertyId: GA4_PROPERTY_ID, actions: decision.actions }, null, 2));
      const navHelpers = {
        gotoScLinks: async () => {
          const r = await auditSearchConsoleLinks(page, { screenshotDir });
          return r;
        },
        gotoLibrary: async () => {
          const r = await auditLibraryCollection(page, { screenshotDir });
          return r;
        },
        gotoCustomDimensions: async () => {
          const r = await auditCustomDimensions(page, { screenshotDir });
          return r;
        },
      };
      for (const action of decision.actions) {
        console.log(`\n→ apply: ${action}`);
        let result;
        if (action === "create-search-console-link") {
          result = await applyCreateScLink(page, { screenshotDir, gotoScLinks: navHelpers.gotoScLinks });
        } else if (action === "publish-search-console-collection") {
          result = await applyPublishScCollection(page, { screenshotDir, gotoLibrary: navHelpers.gotoLibrary });
        } else if (action === "create-ad-id-dimension") {
          result = await applyCreateAdIdDimension(page, { screenshotDir, gotoCustomDimensions: navHelpers.gotoCustomDimensions });
        }
        console.log(`  → ${result.status}${result.reason ? `: ${result.reason}` : ""}`);
        applied.push({ action, ...result });
        if (result.status === "mutation-unknown") break; // 盲目的に続行しない (§6.6)
      }
    }

    saveState(cmd, audit, decision, applied);
    console.log(`\nscreenshots: ${screenshotDir} (repo へは追加しない)`);
  } finally {
    await context?.close().catch(() => {});
    releaseLock();
  }
}

main().catch((e) => {
  console.error("[google-admin] failed:", e.message || e);
  releaseLock();
  process.exit(1);
});
