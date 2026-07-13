#!/usr/bin/env node
/**
 * Stop hook: 会話終了時に「週次レビューの実行漏れ」を促す (CI ガードの二重化)。
 *
 * weekly-cadence-guard.yml (月曜 cron) が Issue で拾うのに加え、セッション作業中にも
 * 気づけるようにする。ただし low-noise 設計:
 *   - 通知対象は **未作成の週次レビュー** のみ (完了済み週の振り返り漏れ = 今回の失敗モード)。
 *     当週の週次計画の未作成は週頭は正常なので対象外。
 *   - 1 日 1 回まで (同日 2 回目以降は黙る)。
 *   - stop_hook_active なら無限ループ防止で即終了。
 * 決定的 (LLM 呼ばない)。欠落が無ければ黙る。
 *
 * 出力: 欠落があれば JSON { decision:"block", reason } を stdout。Stop hook は exit 0 必須。
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function main() {
  const input = readStdin();
  if (input.stop_hook_active) process.exit(0); // 無限ループ防止

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const stateDir = path.join(PROJECT_ROOT, ".claude", "state", "cadence");
  const nudgeFile = path.join(stateDir, "last-nudge.txt");

  // 1 日 1 回まで
  try {
    if (fs.existsSync(nudgeFile) && fs.readFileSync(nudgeFile, "utf8").trim() === today) {
      process.exit(0);
    }
  } catch {
    /* 読めなければ続行 */
  }

  // 検知スクリプトを JSON で実行
  const script = path.join(PROJECT_ROOT, ".claude/scripts/management/check-weekly-cadence.mjs");
  let result;
  try {
    const out = execFileSync("node", [script, "--json"], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      timeout: 10000,
    });
    result = JSON.parse(out);
  } catch {
    process.exit(0); // 検知に失敗しても作業は止めない
  }

  const missing = result.missingReviews || [];
  if (missing.length === 0) process.exit(0); // レビュー欠落なし → 黙る

  // 同日再通知を抑止するため今日の日付を記録
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(nudgeFile, today + "\n");
  } catch {
    /* 記録できなくても通知は出す */
  }

  const list = missing.map((w) => `  - ${w} → \`/weekly-review ${w}\``).join("\n");
  const reason = [
    `⚠️ 週次レビューが ${missing.length} 週分未作成です (完了済み週の振り返り漏れ)。`,
    list,
    "",
    "実測メトリクスは NSM snapshot と .claude/state/metrics/*/history.csv に残っています",
    "(後追いでも実証ベースで書けます)。埋めない場合は「後で」と伝えてください (本日は再通知しません)。",
  ].join("\n");

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

main();
