#!/usr/bin/env node
/**
 * Git 管理する定期計測の「生 snapshot」だけを固定世代へ縮小する。
 *
 * 長期比較の SSOT は各ディレクトリの history.csv / LATEST.md。生 snapshot は直近の
 * デバッグ入力だけを残し、古い世代は Git 履歴から復元できる。キューや投稿台帳など
 * 状態を持つ JSON は対象にしない。
 */
import { readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

export const RETENTION_POLICIES = Object.freeze({
  psi: {
    directory: ".claude/state/metrics/psi",
    pattern: /^psi-batch-\d{4}-\d{2}-\d{2}T[\d-]+\.json$/,
    keep: 1,
  },
  gsc: {
    directory: ".claude/state/metrics/gsc/url-inspection",
    pattern: /^\d{4}-\d{2}-\d{2}\.csv$/,
    keep: 7,
  },
  cloudflare: {
    directory: ".claude/state/metrics/cloudflare/snapshots",
    pattern: /^\d{4}-\d{2}-\d{2}\.json$/,
    keep: 30,
  },
});

export function selectSnapshotsToPrune(files, pattern, keep) {
  if (!Number.isSafeInteger(keep) || keep < 1) {
    throw new Error(`keep は1以上の整数が必要です: ${keep}`);
  }
  const snapshots = files.filter((file) => pattern.test(file)).sort();
  return snapshots.slice(0, Math.max(0, snapshots.length - keep));
}

export function pruneScope(scope, { dryRun = false, root = PROJECT_ROOT } = {}) {
  const policy = RETENTION_POLICIES[scope];
  if (!policy) throw new Error(`不明な scope: ${scope}`);
  const directory = resolve(root, policy.directory);
  const files = readdirSync(directory);
  const targets = selectSnapshotsToPrune(files, policy.pattern, policy.keep);
  if (!dryRun) {
    for (const file of targets) rmSync(resolve(directory, file));
  }
  return {
    scope,
    directory: policy.directory,
    keep: policy.keep,
    removed: targets,
  };
}

function parseArgs(argv) {
  const scopeIndex = argv.indexOf("--scope");
  const scope = scopeIndex >= 0 ? argv[scopeIndex + 1] : "all";
  if (
    scope !== "all" &&
    !Object.prototype.hasOwnProperty.call(RETENTION_POLICIES, scope)
  ) {
    throw new Error(`--scope は all/psi/gsc/cloudflare のいずれかです: ${scope}`);
  }
  return { scope, dryRun: argv.includes("--dry-run") };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scopes =
    args.scope === "all" ? Object.keys(RETENTION_POLICIES) : [args.scope];
  for (const scope of scopes) {
    const result = pruneScope(scope, { dryRun: args.dryRun });
    console.log(
      `[state-retention] ${scope}: keep=${result.keep} removed=${result.removed.length}` +
        (args.dryRun ? " (dry-run)" : ""),
    );
    for (const file of result.removed) console.log(`  ${file}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
