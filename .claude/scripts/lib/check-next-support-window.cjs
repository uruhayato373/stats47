#!/usr/bin/env node
"use strict";

/**
 * 導入中の Next.js の major が、OpenNext のサポート期限表で何日後に本番ビルドを止めるかを出す。
 * (NEXT-SUPPORT-WINDOW-GUARD-01)
 *
 * OpenNext は `@opennextjs/aws/dist/build/helper.js` の `NEXT_RELEASE_DATES` から、公開後 2 年を過ぎた major を拒否する。
 * 2026-10-21 00:00 UTC に、コードを変えていないのに本番デプロイが止まった (deploy run 39589689158)。
 * 期限表は自前で持たず、導入中の OpenNext の helper.js を読む (版が上がれば表も追従する)。
 *
 * 判定:
 *   残り WARN_DAYS 日以上 かつ 回避フラグ無し → 「残り N 日」だけを出して exit 0
 *   残り WARN_DAYS 日未満 (期限切れを含む)     → 警告して exit 1 (週次レビューで起票する)
 *   apps/web の build に --dangerouslyUseUnsupportedNextVersion が残っている → 毎週知らせて exit 1 (外し忘れ防止)
 *   期限表・版が読めない                       → 判定不能で exit 2
 *
 * 入口: `node .claude/scripts/lib/check-next-support-window.cjs [--now YYYY-MM-DD]`
 * 呼び出し元: .claude/scripts/management/weekly-audits/ci-health.sh (npm run weekly:audits)
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const WARN_DAYS = 60;
const SUPPORT_YEARS = 2;
const DAY_MS = 86_400_000;
const UNSUPPORTED_FLAG = "--dangerouslyUseUnsupportedNextVersion";
const DEFAULT_PATHS = {
  helper: "node_modules/@opennextjs/aws/dist/build/helper.js",
  nextPackage: "node_modules/next/package.json",
  webPackage: "apps/web/package.json",
};

/** helper.js の `const NEXT_RELEASE_DATES = { 16: "2025-10-21", ... }` を読む。 */
function parseReleaseDates(helperSource) {
  const block = helperSource.match(/NEXT_RELEASE_DATES\s*=\s*\{([^}]*)\}/);
  if (!block) return null;
  const dates = {};
  for (const match of block[1].matchAll(/(\d+)\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/g)) {
    dates[Number(match[1])] = match[2];
  }
  return Object.keys(dates).length > 0 ? dates : null;
}

/** OpenNext と同じ計算 (公開日 + 2 年、その時刻まで可) で残り日数を出す。 */
function evaluateSupportWindow({ nextVersion, releaseDates, now, hasUnsupportedFlag }) {
  const major = Number(String(nextVersion).match(/^\d+/)?.[0]);
  const released = releaseDates?.[major];
  if (!Number.isFinite(major) || !released) {
    return { status: "unknown", major, lines: [`判定不能: Next.js ${nextVersion} の major ${major} が OpenNext の期限表に無い`] };
  }
  const supportEnd = new Date(released);
  supportEnd.setFullYear(supportEnd.getFullYear() + SUPPORT_YEARS);
  const daysLeft = Math.floor((supportEnd.getTime() - now.getTime()) / DAY_MS);
  const endDate = supportEnd.toISOString().slice(0, 10);
  const lines = [`Next.js ${nextVersion} (major ${major}) のサポート終了 ${endDate}: 残り ${daysLeft} 日`];
  let status = "ok";
  if (daysLeft < WARN_DAYS) {
    status = "warn";
    lines.push(daysLeft < 0
      ? `警告: サポート期限を ${-daysLeft} 日過ぎている。OpenNext は回避フラグ無しでは本番ビルドを拒否する`
      : `警告: 残り ${WARN_DAYS} 日を切った。期限の日 (UTC) から OpenNext が本番ビルドを拒否する。次の major への移行を起票する`);
  }
  if (hasUnsupportedFlag) {
    status = "warn";
    lines.push(`警告: apps/web の build に ${UNSUPPORTED_FLAG} が残っている。移行後は外す (外し忘れ防止のため毎週知らせる)`);
  }
  return { status, major, daysLeft, endDate, lines };
}

function readText(relativeOrAbsolute) {
  return fs.readFileSync(path.resolve(ROOT, relativeOrAbsolute), "utf8");
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function main() {
  const paths = {
    helper: argValue("--helper") ?? DEFAULT_PATHS.helper,
    nextPackage: argValue("--next-package") ?? DEFAULT_PATHS.nextPackage,
    webPackage: argValue("--web-package") ?? DEFAULT_PATHS.webPackage,
  };
  const nowArg = argValue("--now");
  const now = nowArg ? new Date(nowArg) : new Date();
  let input;
  try {
    const releaseDates = parseReleaseDates(readText(paths.helper));
    if (!releaseDates) throw new Error(`NEXT_RELEASE_DATES が ${paths.helper} に見つからない`);
    const nextVersion = JSON.parse(readText(paths.nextPackage)).version;
    const scripts = Object.values(JSON.parse(readText(paths.webPackage)).scripts ?? {});
    const hasUnsupportedFlag = scripts.some((script) => typeof script === "string" && script.includes(UNSUPPORTED_FLAG));
    input = { nextVersion, releaseDates, now, hasUnsupportedFlag };
  } catch (error) {
    console.error(`判定不能: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
    return;
  }
  const result = evaluateSupportWindow(input);
  for (const line of result.lines) console.log(line);
  process.exitCode = result.status === "ok" ? 0 : result.status === "unknown" ? 2 : 1;
}

if (require.main === module) main();

module.exports = { parseReleaseDates, evaluateSupportWindow, WARN_DAYS, UNSUPPORTED_FLAG };
