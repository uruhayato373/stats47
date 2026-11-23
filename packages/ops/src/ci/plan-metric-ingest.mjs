#!/usr/bin/env node
/**
 * 差分から、取り込み直す候補の指標の key を決める。
 *
 * 使う場所は 2 つある。
 *   - 手元の確かめ (`npm run data:check`): origin/main から手元の作業ツリーまでに変えた指標を、
 *     書き込まない取り込み (page-data-batch --dry-run) に渡す。
 *   - デプロイの後の取り込み (deploy-workers.yml の ingest-changed-metrics job): main に入った差分で変えた指標を、
 *     設定の記録 (configHash) と比べてから data-refresh に渡す。
 *
 * 指標の定義は data/metrics/<key>.ts の 1 ファイル 1 指標で、下の階層 (policy/・quality/ など) は指標ではない。
 * 消したファイルは取り込まない (registry に無い key を渡すと page-data-batch が止まる)。
 * 正典: .claude/rules/metric-config-standards.md「取り込みの確かめと反映」
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { datasetDir } from "../../../../config/datasets.mjs";

const METRICS_DIR = datasetDir("metrics.definitions");
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const METRIC_FILE = new RegExp(`^${escapeRegExp(METRICS_DIR)}/([a-z0-9]+(?:-[a-z0-9]+)*)\\.ts$`);
const ZERO_SHA = /^0+$/;

/** 変えたパスの一覧から指標の key を取り出す (重複を除き、並べて返す) */
export function metricKeysFromPaths(paths) {
  const keys = new Set();
  for (const path of paths) {
    const match = METRIC_FILE.exec(path.trim());
    if (match) keys.add(match[1]);
  }
  return [...keys].sort();
}

/**
 * base から head までに足した・変えた指標の key。head を省くと手元の作業ツリー (未コミットを含む) と比べる。
 * base が空か 0 の SHA (新しいブランチの最初の push) のときは head の親と比べる。
 */
export function changedMetricKeys({ base, head, cwd = process.cwd(), git = runGit } = {}) {
  const from = !base || ZERO_SHA.test(base) ? `${head ?? "HEAD"}~1` : base;
  const args = ["diff", "--name-only", "--diff-filter=AMR", from];
  if (head) args.push(head);
  args.push("--", METRICS_DIR);
  const keys = metricKeysFromPaths(git(args, cwd).split(/\r?\n/));
  // 手元と比べるときだけ、未追跡の新しい指標も拾う
  if (!head) keys.push(...metricKeysFromPaths(git(["ls-files", "--others", "--exclude-standard", "--", METRICS_DIR], cwd).split(/\r?\n/)));
  return [...new Set(keys)].filter((key) => head || existsSync(`${cwd}/${METRICS_DIR}/${key}.ts`)).sort();
}

function runGit(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, head] = process.argv.slice(2);
  process.stdout.write(changedMetricKeys({ base, head }).join(","));
}
