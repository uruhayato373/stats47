/**
 * 週次 UI 確認の結果を記録し、通知 Issue の本文を作る。agent は構造化出力を返すだけで、
 * 記録と通知の判断はこのスクリプトが決定的に行う (agent の出力は入力と突き合わせて採否を決める)。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/record-ui-review.ts --execution <claude execution file> [--alert-out /tmp/ui-review-alert.md]
 *   tsx .claude/scripts/page-quality/record-ui-review.ts --no-review "<理由>"   (agent を実行できなかったとき)
 *
 * stdout: `alert_open=true|false` (GITHUB_OUTPUT へ追記する)
 * Exit code: 0 = 記録できた / 2 = 入力不備
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { SCREENSHOT_PREFIX } from "./lib/screenshots";
import { STATE_DIR } from "./lib/storage";
import { buildUiAlert, type ReviewInput, type ReviewReport, structuredOutput, validateReview } from "./lib/ui-report";
import type { Violation } from "./types";

const CI_DIR = ".local/ci/page-quality";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf-8")) as T) : fallback;
}

function main() {
  const input = readJson<ReviewInput>(join(CI_DIR, "review-input.json"), { generatedAt: new Date().toISOString(), pages: [] });
  const fresh = readJson<{ violations: Violation[]; firstRun: boolean }>(join(CI_DIR, "ui-new-violations.json"), {
    violations: [],
    firstRun: false,
  });

  let report: ReviewReport | null = null;
  let rejected: string[] = [];
  let reviewError: string | null = arg("--no-review") ?? null;
  const execution = arg("--execution");
  if (!reviewError) {
    if (!execution || !existsSync(execution)) reviewError = "agent の実行結果ファイルが無い";
    else if (input.pages.length === 0) reviewError = "撮影したスクショが無い";
    else {
      try {
        ({ report, rejected } = validateReview(structuredOutput(execution), input));
      } catch (e) {
        reviewError = (e as Error).message;
      }
    }
  }

  const date = input.generatedAt.slice(0, 10);
  const state = {
    generatedAt: new Date().toISOString(),
    auditGeneratedAt: input.generatedAt,
    reviewStatus: report?.status ?? "not-run",
    reviewError,
    summary: report?.summary ?? null,
    findings: report?.findings ?? [],
    rejected,
    newViolationCount: fresh.violations.length,
    firstRun: fresh.firstRun,
  };
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(join(STATE_DIR, "ui-review-latest.json"), `${JSON.stringify(state, null, 2)}\n`);

  const body = buildUiAlert({
    date,
    newViolations: fresh.violations,
    firstRun: fresh.firstRun,
    review: report,
    reviewError,
    input,
    screenshotBaseUrl: process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp",
    keyOf: (template, device) => `${SCREENSHOT_PREFIX}/${date}/${template}-${device}.png`,
  });
  const alertOut = arg("--alert-out") ?? "/tmp/ui-review-alert.md";
  if (body) {
    mkdirSync(dirname(alertOut), { recursive: true });
    writeFileSync(alertOut, `${body}\n`);
  }
  console.error(
    `[ui-review] 新規の機械検出 ${fresh.violations.length} 件 / agent 指摘 ${state.findings.length} 件 / 不採用 ${rejected.length} 件${reviewError ? ` / agent 未実行: ${reviewError}` : ""}`
  );
  console.log(`alert_open=${body ? "true" : "false"}`);
}

try {
  main();
} catch (e) {
  console.error(`[ui-review] エラー: ${(e as Error).stack ?? e}`);
  process.exit(2);
}
