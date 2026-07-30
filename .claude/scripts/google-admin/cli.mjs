#!/usr/bin/env node
/**
 * cli — google-admin runner の入口。安全契約: ./README.md。
 *
 *   node .claude/scripts/google-admin/cli.mjs audit              # read-only 監査 (既定)
 *   node .claude/scripts/google-admin/cli.mjs apply --confirm-site stats47.jp
 *   node .claude/scripts/google-admin/cli.mjs verify             # 設定後の再監査 (= audit)
 *
 * - headed 専用 (cron/CI へ載せない)。login/MFA はユーザー操作を待つ (突破しない)。
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
  plannedActionToken,
  requireCommit,
} from "./apply-allowlisted-settings.mjs";
import {
  auditAdSenseAccount,
  auditAdUnits,
  expectedAdSenseAccount,
} from "./audit-adsense.mjs";
import { loadCodeAdSlots } from "../metrics/lib/code-ad-slots.mjs";
import { probeAdSenseUnitsPage } from "./probe-adsense.mjs";
import {
  parseDimensionLedger,
  requiredDimensionParams,
  reconcileDimensions,
} from "./dimension-ledger.mjs";
import { sanitizeObject } from "./redact.mjs";

const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/metrics/google-admin");
const STATE_FILE = path.join(STATE_DIR, "latest.json");
// adsense-inventory は API only の別 run なので、DOM audit の latest.json を上書きしない
const ADSENSE_INVENTORY_STATE_FILE = path.join(STATE_DIR, "adsense-inventory-latest.json");
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

/** 台帳 §2 の「登録が要るパラメータ」一覧を読む (GA4 実データとの突合に使う)。 */
function readLedgerRequiredParams() {
  try {
    const md = fs.readFileSync(LEDGER_FILE, "utf-8");
    const entries = parseDimensionLedger(md);
    return { entries, params: requiredDimensionParams(entries) };
  } catch {
    return { entries: [], params: [] };
  }
}

/** GA4 に ad_impression 実データがあるという既知の観測。台帳の実測記録から判定。 */
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
  const ledger = readLedgerRequiredParams();
  out.customDimensions = await auditCustomDimensions(page, { screenshotDir, knownParams: ledger.params });
  out.dimensionReconcile =
    out.customDimensions?.status === "ok"
      ? reconcileDimensions(ledger.entries, out.customDimensions.observedParams ?? [])
      : { rows: [], summary: {}, skipped: out.customDimensions?.status ?? "unknown" };
  out.library = await auditLibraryCollection(page, { screenshotDir });

  // AdSense は API を一次ソースにする (DOM 非依存 = selector drift の影響を受けない)
  out.adsenseAccount = await auditAdSenseAccount();
  let codeSlots = [];
  try {
    codeSlots = loadCodeAdSlots().slots;
  } catch (e) {
    out.codeSlotsError = String(e.message ?? e).slice(0, 200);
  }
  out.adUnits = await auditAdUnits({
    codeSlots,
    accountId: out.adsenseAccount?.accountId ?? null,
  });
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
  console.log(`AdSense account assert: ${audit.adsenseAccount?.status ?? "-"}${audit.adsenseAccount?.detail ? ` (${audit.adsenseAccount.detail})` : ""}`);
  const au = audit.adUnits;
  console.log(
    `AdSense ad units: ${au?.units?.length ?? 0} 件 desired=${au?.desired?.length ?? 0} コード側 slot=${au?.codeSlots?.length ?? 0} (${au?.status ?? "-"})`,
  );
  if (au?.status === "ok" && Array.isArray(au.units)) {
    for (const u of au.units) {
      console.log(`  - ${u.displayName} slot=${u.slotId || "(不明)"} state=${u.state || "-"}`);
    }
  }

  // 台帳 (analytics-event-standards.md §2) と GA4 実データの突合
  const rec = audit.dimensionReconcile;
  if (rec?.skipped) {
    console.log(`custom dimension 突合: 判定不能 (custom definitions audit ${rec.skipped})`);
  } else if (rec) {
    console.log(`custom dimension 突合: ${JSON.stringify(rec.summary)}`);
    const notable = (rec.rows ?? []).filter(
      (r) => r.verdict !== "confirmed-registered" && r.verdict !== "verified-registered",
    );
    for (const r of notable) {
      console.log(`  ! ${r.param} (${r.events.join("/")}) — ${r.verdict} [台帳: ${r.ledgerStatus}]`);
    }
    if (notable.length === 0) console.log("  すべて登録済みを確認 (台帳の ❓ は解消できる)");
  }
}

function saveState(kind, audit, decision, applied, approvalToken = null, file = STATE_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const summary = sanitizeObject({
    schemaVersion: 1,
    kind,
    generatedAt: new Date().toISOString(),
    propertyId: GA4_PROPERTY_ID,
    gscProperty: GSC_PROPERTY,
    audit,
    decision: decision ?? null,
    applied: applied ?? null,
    approvalToken: approvalToken ?? null,
  });
  fs.writeFileSync(file, JSON.stringify(summary, null, 2) + "\n");
  console.log(`\nsanitized summary → ${path.relative(PROJECT_ROOT, file)}`);
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
  if (cmd === "adsense-inventory") {
    // API のみの read-only 検査 (browser を起動しない = 無人 cron に載せられる)。
    // DOM を読む audit は headed 実行が要るので人間が `google-admin:audit` を回す。
    const account = await auditAdSenseAccount();
    let codeSlots = [];
    let codeSlotsError = null;
    try {
      codeSlots = loadCodeAdSlots().slots;
    } catch (e) {
      codeSlotsError = String(e.message ?? e).slice(0, 200);
    }
    const adUnits = await auditAdUnits({ codeSlots, accountId: account.accountId ?? null });
    console.log("\n# adsense-inventory (API read-only)");
    console.log(`account assert: ${account.status}${account.detail ? ` (${account.detail})` : ""}`);
    if (codeSlotsError) console.log(`code slots: 読み取り失敗 (${codeSlotsError})`);
    console.log(`ad units: ${adUnits.units?.length ?? 0} 件 (${adUnits.status}) desired=${adUnits.desired?.length ?? 0}`);
    for (const u of adUnits.units ?? []) {
      console.log(`  - ${u.displayName} slot=${u.slotId || "(不明)"} state=${u.state || "-"}`);
    }
    saveState(
      "adsense-inventory",
      { adsenseAccount: account, adUnits, codeSlotsError },
      null,
      null,
      null,
      ADSENSE_INVENTORY_STATE_FILE,
    );
    // 認証不足・アカウント不一致は失敗として返す (無人 cron が沈黙しないように)
    const ok = account.status === "ok" && adUnits.status === "ok";
    if (!ok) process.exit(1);
    return;
  }
  if (!["audit", "apply", "verify", "adsense-probe"].includes(cmd)) {
    console.error(
      "usage: cli.mjs <login|audit|apply|verify|adsense-probe|adsense-inventory> " +
        "[--confirm-site stats47.jp] [--commit --approve <token>]",
    );
    process.exit(1);
  }
  if (cmd === "apply" && getArg("--confirm-site") !== CONFIRM_SITE) {
    console.error(`apply には --confirm-site ${CONFIRM_SITE} が必須 (対象 site の明示)`);
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

    // read-only probe: DOM 構造を dump するだけ (mutation 経路を持たない)
    if (cmd === "adsense-probe") {
      const r = await probeAdSenseUnitsPage(page, { runId, screenshotDir });
      console.log(`\n# adsense-probe: ${r.status}`);
      if (r.outFile) console.log(`dump → ${r.outFile} (counts: ${JSON.stringify(r.counts)})`);
      if (r.detail) console.log(`detail: ${r.detail}`);
      console.log("この dump を読んでから applyCreateAdUnit のセレクタを書く (実機を見ずに書かない)。");
      return;
    }

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
      adUnits: audit.adUnits ?? { status: "missing" },
      adsenseAccount: audit.adsenseAccount ?? { status: "missing" },
    };
    const decision =
      audit.propertyAssert?.status === "ok" ? decideActions(inventory) : { actions: [], noops: [], blockers: [{ code: "property-assert-failed", detail: audit.propertyAssert?.status ?? audit.ga4?.status ?? "unknown" }] };

    console.log("\n# decision");
    for (const a of decision.actions) console.log(`  APPLY   ${a}`);
    for (const p of decision.plan ?? []) console.log(`  PLAN    ${JSON.stringify(p)}`);
    for (const n of decision.noops) console.log(`  NO-OP   ${n.action}: ${n.reason}`);
    for (const b of decision.blockers) console.log(`  BLOCKER ${b.code}: ${b.detail}`);

    // ad unit mutation の承認トークン (計画そのものに対する承認)
    const approvalToken = plannedActionToken({
      site: CONFIRM_SITE,
      accountId: audit.adsenseAccount?.accountId ?? expectedAdSenseAccount() ?? "",
      actions: decision.actions,
      plan: decision.plan ?? [],
    });
    const unitActions = decision.actions.filter((a) => a === "create-ad-unit" || a === "rename-ad-unit");
    if (unitActions.length > 0) {
      console.log(`\n# approval (ad unit mutation)`);
      console.log(`  approvalToken: ${approvalToken}`);
      console.log(
        `  実行するには: npm run google-admin:apply -- --confirm-site ${CONFIRM_SITE} --commit --approve ${approvalToken}`,
      );
    }

    let applied = null;
    if (cmd === "apply" && decision.actions.length > 0) {
      applied = [];
      // planned action JSON を /tmp に保存 (README「mutation手順」)
      fs.writeFileSync(
        path.join(tmpDir, "planned-actions.json"),
        JSON.stringify(
          { site: CONFIRM_SITE, propertyId: GA4_PROPERTY_ID, actions: decision.actions, plan: decision.plan ?? [], approvalToken },
          null,
          2,
        ),
      );
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
        // 未知 action で result 未定義のままクラッシュしないよう初期化する
        let result = { status: "unknown-action", reason: `dispatch 未定義の action: ${action}` };
        if (action === "create-search-console-link") {
          result = await applyCreateScLink(page, { screenshotDir, gotoScLinks: navHelpers.gotoScLinks });
        } else if (action === "publish-search-console-collection") {
          result = await applyPublishScCollection(page, { screenshotDir, gotoLibrary: navHelpers.gotoLibrary });
        } else if (action === "create-ad-id-dimension") {
          result = await applyCreateAdIdDimension(page, { screenshotDir, gotoCustomDimensions: navHelpers.gotoCustomDimensions });
        } else if (action === "create-ad-unit" || action === "rename-ad-unit") {
          // ad unit は不可逆寄りなので --commit + --approve <token> を追加で要求する
          const gate = requireCommit({
            argv: process.argv,
            site: getArg("--confirm-site"),
            expectedSite: CONFIRM_SITE,
            expectedToken: approvalToken,
          });
          if (!gate.allowed) {
            result = { status: "blocked", reason: `承認ゲート: ${gate.reason}` };
          } else {
            // ★ 実機 probe (adsense-probe) の dump でセレクタを確定してから実装する。
            //    推測で書くと「動いたように見えて別要素を操作する」事故になるため、
            //    ここは意図的に未実装のまま停止する。
            result = {
              status: "not-implemented",
              reason: "adsense-probe の dump でセレクタを確定してから実装する (実機を見ずに書かない)",
            };
          }
        }
        console.log(`  → ${result.status}${result.reason ? `: ${result.reason}` : ""}`);
        applied.push({ action, ...result });
        if (result.status === "mutation-unknown") break; // 盲目的に続行しない
      }
    }

    saveState(cmd, audit, decision, applied, approvalToken);
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
