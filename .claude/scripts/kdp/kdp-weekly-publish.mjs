#!/usr/bin/env node
/**
 * weekly-review → weekly-plan で1冊に絞った新規パイロットを公開する専用入口。
 * 週次計画の記載だけでは承認とみなさず、対象IDと一致する --owner-approved + --commit を必須にする。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/kdp-session.mjs";
import { validateWeeklyApproval } from "./lib/kdp-weekly-approval.mjs";

const argv = process.argv.slice(2);
const getArg = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] ?? null : null;
};
const week = getArg("--week");
const id = getArg("--id");
const ownerApproved = getArg("--owner-approved");
const commit = argv.includes("--commit");

if (!week || !/^\d{4}-W\d{2}$/.test(week)) {
  console.error("ABORT: --week YYYY-Www required");
  process.exit(1);
}

// 古い計画を信じない。実行直前に listings + sales-ledger からゲートを再生成する。
execFileSync(
  "npm",
  ["run", "products:kindle:weekly", "--workspace=@stats47/product-factory", "--", "--week", week, "--write"],
  { cwd: ROOT, stdio: "inherit" },
);

const decision = JSON.parse(readFileSync(join(ROOT, ".claude/state/products/kdp-weekly-publication.json"), "utf8"));
const approval = validateWeeklyApproval(decision, { week, id, ownerApproved, commit });
if (!approval.ok) {
  console.error(`ABORT: ${approval.errors.join(" / ")}`);
  process.exit(1);
}

console.log(`[weekly-kdp] gate PASS week=${week} id=${id}; KDP preflight → verify → submit を開始`);
execFileSync(process.execPath, [join(ROOT, ".claude/scripts/kdp/kdp-publish.mjs"), "--id", id, "--commit"], {
  cwd: ROOT,
  stdio: "inherit",
});
