/**
 * 週次 UI 検査の指摘キュー (`.claude/state/page-quality/ui-findings-queue.json`) を操作する。
 * 検査 → 起票 → 修正 → 本番確認のループの入口 (判定は lib/ui-findings.ts の純粋関数)。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/ui-findings.ts --sync --run <週次の latest.json> --review <ui-review-latest.json>
 *       [--main-deployed-at <ISO>] [--dry-run]                     # 週次 CI: キュー更新 + UI-FIX-* カード起票
 *   tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed|--mark-by-design|--mark-owner <key|@file> --note "<理由>" [--card <ID>]
 *   tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled <batch file>   # UI-FIX-* カードの completion gate
 *   tsx .claude/scripts/page-quality/ui-findings.ts --list [--status pending]
 *
 * 正典: .claude/rules/page-quality-standards.md「UI 指摘のループ」
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import type { AuditRun } from "./types";
import { PROJECT_ROOT } from "./lib/thresholds";
import {
  type AgentFinding,
  BATCH_DIR,
  batchPath,
  findUnhandled,
  insertCards,
  observeFindings,
  planUiCards,
  staleBatchFiles,
  syncFindings,
  type UiFinding,
  type UiFindingStatus,
} from "./lib/ui-findings";

const require = createRequire(join(PROJECT_ROOT, "package.json"));
const { parseBacklog } = require("./.claude/scripts/lib/backlog-lib.cjs") as {
  parseBacklog: (text: string) => Array<{ id?: string }>;
};

const QUEUE_PATH = join(PROJECT_ROOT, ".claude/state/page-quality/ui-findings-queue.json");
const BACKLOG_PATH = join(PROJECT_ROOT, ".claude/todo/backlog.md");
const SCREENSHOT_BASE_URL = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

interface QueueFile {
  generatedAt: string;
  auditAt: string | null;
  findings: UiFinding[];
}

const arg = (flag: string) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());

function loadQueue(): QueueFile {
  return existsSync(QUEUE_PATH)
    ? (JSON.parse(readFileSync(QUEUE_PATH, "utf8")) as QueueFile)
    : { generatedAt: new Date().toISOString(), auditAt: null, findings: [] };
}

function saveQueue(queue: QueueFile): void {
  mkdirSync(join(PROJECT_ROOT, ".claude/state/page-quality"), { recursive: true });
  const findings = [...queue.findings].sort((a, b) => a.key.localeCompare(b.key));
  writeFileSync(QUEUE_PATH, `${JSON.stringify({ ...queue, generatedAt: new Date().toISOString(), findings }, null, 2)}\n`);
}

const openCardIds = () =>
  parseBacklog(readFileSync(BACKLOG_PATH, "utf8"))
    .map((card) => card.id)
    .filter((id): id is string => Boolean(id));

function readKeys(spec: string): string[] {
  return spec.startsWith("@")
    ? readFileSync(spec.slice(1), "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [spec];
}

function sync(): void {
  const runPath = arg("--run");
  const reviewPath = arg("--review");
  if (!runPath || !existsSync(runPath)) throw new Error(`--run の週次結果が無い: ${runPath}`);
  const run = JSON.parse(readFileSync(runPath, "utf8")) as AuditRun;
  const review =
    reviewPath && existsSync(reviewPath)
      ? (JSON.parse(readFileSync(reviewPath, "utf8")) as { reviewStatus?: string; findings?: AgentFinding[] })
      : { reviewStatus: "not-run", findings: [] };
  const agentReviewed = review.reviewStatus === "reviewed" || review.reviewStatus === "no-issues";

  const queue = loadQueue();
  const openIds = openCardIds();
  const { queue: findings, counts } = syncFindings(queue.findings, observeFindings(run, agentReviewed ? review.findings ?? [] : []), {
    today: today(),
    auditAt: run.generated_at,
    mainDeployedAt: arg("--main-deployed-at") ?? null,
    openCardIds: openIds,
    agentReviewed,
  });
  const cards = planUiCards({ queue: findings, openIds, today: today(), screenshotBaseUrl: SCREENSHOT_BASE_URL });

  const tally = (status: UiFindingStatus) => findings.filter((f) => f.status === status).length;
  const summary =
    `[ui-findings] 新規 ${counts.added} / 再オープン ${counts.reopened} / 消えた ${counts.resolved} / ` +
    `修正を本番で確認 ${counts.confirmedFixed} → pending ${tally("pending")} / fixed ${tally("fixed")} / ` +
    `owner ${tally("owner")} / by-design ${tally("by-design")}` +
    `${agentReviewed ? "" : " (Claude の確認なし: Claude の指摘は据え置き)"}`;
  if (process.argv.includes("--dry-run")) {
    for (const card of cards) console.log(`${card.markdown}\n`);
    console.log(`${summary} / 起票予定 ${cards.length} 枚`);
    return;
  }

  saveQueue({ ...queue, auditAt: run.generated_at, findings });
  const { text, inserted } = insertCards(readFileSync(BACKLOG_PATH, "utf8"), cards);
  const batchDir = join(PROJECT_ROOT, BATCH_DIR);
  mkdirSync(batchDir, { recursive: true });
  for (const card of cards.filter((c) => inserted.includes(c.id))) {
    writeFileSync(join(PROJECT_ROOT, batchPath(card.id)), `${card.keys.join("\n")}\n`);
  }
  if (inserted.length) writeFileSync(BACKLOG_PATH, text);
  const stale = staleBatchFiles(readdirSync(batchDir), [...openIds, ...inserted]);
  for (const name of stale) rmSync(join(batchDir, name));
  console.log(`${summary} / 起票 ${inserted.length} 枚${inserted.length ? ` (${inserted.join(", ")})` : ""} / 完了 batch 削除 ${stale.length}`);
}

function mark(status: "fixed" | "by-design" | "owner", spec: string): void {
  const note = arg("--note")?.trim();
  if (!note) throw new Error("--note に何を変えたか / 理由を書く");
  // 担当カードの無い owner は誰も拾わず、ループが閉じない。判断を求めるカードを起票してから紐付ける
  if (status === "owner" && !arg("--card")) throw new Error("--mark-owner には担当カードの ID (--card) が要る");
  const queue = loadQueue();
  const keys = readKeys(spec);
  const missing = keys.filter((key) => !queue.findings.some((f) => f.key === key));
  if (missing.length) throw new Error(`queue に無い key: ${missing.slice(0, 5).join(", ")}`);
  const now = new Date().toISOString();
  const card = arg("--card") ?? null;
  const findings = queue.findings.map((f) =>
    keys.includes(f.key)
      ? {
          ...f,
          status,
          note,
          fixed_at: status === "fixed" ? now : f.fixed_at,
          resolved_at: status === "fixed" ? null : today(),
          resolved_by: status === "fixed" ? null : status,
          card: status === "owner" ? card : f.card,
        }
      : f,
  );
  saveQueue({ ...queue, findings });
  console.log(`[ok] ${keys.length} 件 → ${status}`);
}

function assertHandled(file: string): void {
  const keys = readKeys(`@${file}`);
  if (!keys.length) throw new Error(`${file} に key が無い`);
  const unhandled = findUnhandled(loadQueue().findings, keys);
  if (unhandled.length) {
    console.error(`[fail] 未処理 ${unhandled.length}/${keys.length} 件 (pending のまま、または理由 note 無し):`);
    for (const key of unhandled) console.error(`   ${key}`);
    process.exit(1);
  }
  console.log(`[ok] ${keys.length} 件すべて処理済み`);
}

function main(): void {
  if (process.argv.includes("--sync")) return sync();
  const assertFile = arg("--assert-handled");
  if (assertFile) return assertHandled(assertFile);
  for (const [flag, status] of [
    ["--mark-fixed", "fixed"],
    ["--mark-by-design", "by-design"],
    ["--mark-owner", "owner"],
  ] as const) {
    const spec = arg(flag);
    if (spec) return mark(status, spec);
  }
  if (process.argv.includes("--list")) {
    const status = arg("--status");
    for (const f of loadQueue().findings.filter((x) => !status || x.status === status)) {
      console.log(`${f.status}\t${f.key}\t${f.detail.split("\n")[0]}`);
    }
    return;
  }
  throw new Error("--sync / --mark-* / --assert-handled / --list のどれかを指定する");
}

try {
  main();
} catch (error) {
  console.error(`[ui-findings] ${(error as Error).message}`);
  process.exit(2);
}
