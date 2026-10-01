#!/usr/bin/env node
/**
 * 月次 workflow の実行結果を `.claude/state/metrics/monthly-jobs/<job>.json` に追記する (2026-10-01)。
 *
 * 背景: ctr-improvement-monthly / estat-catalog-monthly / ksj-catalog-monthly は結果を GitHub の
 * 実行サマリー (Workflow Summary) にしか残さず、月次レビューと管理画面がファイルから「走ったか・何が出たか」を
 * 判定できなかった。各 workflow の最後 (if: always()) でこれを呼び、develop へ commit する。
 * 読み手: review-cadence.mjs (月次レビューの手順「月次の自動処理」と /strategy/reviews/monthly)。
 *
 * ジョブごとに 1 ファイル・月ごとに 1 件 (同じ月の再実行は上書き)・直近 KEEP_MONTHS 件を保持する。
 * 日付入りのファイル名にしない (check-repo-hygiene の DATED_STATE_ARTIFACT)。
 *
 * Usage:
 *   node .claude/scripts/metrics/record-monthly-job.mjs --job ctr-improvement --status ok \
 *     [--summary-file /tmp/ctr/body.md] [--field max=10 ...] [--month YYYY-MM] [--run-url URL] [--ran-at ISO]
 *   --month / --run-url / --ran-at は過去の実行を GitHub の実行履歴から後追いで記録するとき用
 *   status: ok (結果あり) / skipped (入力不足などで意図どおり何もしなかった) / failed
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const STATE_DIR = ".claude/state/metrics/monthly-jobs";
export const KEEP_MONTHS = 12;
export const STATUSES = ["ok", "skipped", "failed"];
const SUMMARY_MAX = 4000;

/** JST の年月 */
export function jstMonth(now = new Date()) {
  return new Date(now.getTime() + 9 * 3_600_000).toISOString().slice(0, 7);
}

/** 既存の記録に 1 件を足す (同じ月は置き換え、新しい順、上限件数) */
export function appendRun(existing, run) {
  const runs = (existing?.runs ?? []).filter((r) => r.month !== run.month);
  return { schemaVersion: 1, job: run.job, runs: [run, ...runs].sort((a, b) => b.month.localeCompare(a.month)).slice(0, KEEP_MONTHS) };
}

function parseArgs(argv) {
  const out = { fields: {} };
  for (let i = 0; i < argv.length; i++) {
    const [k, v] = [argv[i], argv[i + 1]];
    if (k === "--field") {
      const at = v.indexOf("=");
      out.fields[v.slice(0, at)] = v.slice(at + 1);
      i++;
    } else if (k.startsWith("--")) {
      out[k.slice(2)] = v;
      i++;
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const args = parseArgs(process.argv.slice(2));
  if (!/^[a-z0-9-]+$/.test(args.job ?? "") || !STATUSES.includes(args.status)) {
    console.error(`--job <小文字とハイフン> と --status <${STATUSES.join("|")}> が必要`);
    process.exit(2);
  }
  const month = args.month ?? jstMonth();
  const summary = args["summary-file"] && existsSync(args["summary-file"]) ? readFileSync(args["summary-file"], "utf8").slice(0, SUMMARY_MAX) : null;
  const runUrl =
    args["run-url"] ??
    (process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null);
  const file = join(root, STATE_DIR, `${args.job}.json`);
  const existing = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  const run = { job: args.job, month, status: args.status, ranAt: args["ran-at"] ?? new Date().toISOString(), runUrl, fields: args.fields, summary };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(appendRun(existing, run), null, 2)}\n`);
  console.log(`recorded ${args.job} ${month} ${args.status} → ${STATE_DIR}/${args.job}.json`);
}
