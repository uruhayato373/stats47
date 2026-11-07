#!/usr/bin/env node
/**
 * main への push で本番デプロイが要るかを差分から決める (deploy-workers.yml の scope job)。
 *
 * 確実に本番に関係しないパスだけの push を skip する。一覧に無いパスは必ずデプロイする (安全側)。
 * 差分を読めないときもデプロイする。一覧に足すときは、アプリの build と deploy の生成工程が読まないことを確かめる。
 * Workers は実行時に git のファイルを読めないので、関係するのは build 時の import と生成工程の入力だけである。
 * 正典: .claude/rules/branch-workflow.md「デプロイの要否」
 */
import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ZERO_SHA = /^0+$/;

export const SITE_INDEPENDENT = [
  /^\.agents\//,
  /^\.codex\//,
  /^\.claude\//,
  /^docs\//,
  /^contents\//,
  /^apps\/admin\//,
  /^apps\/remotion\//,
  /^data\/(?:adsense|authenticated|business|business-plan|ci|cloudflare|effect-verdict|ga4|goals|google-admin|gsc|improvement|measurement-cycle|nsm|page-quality|psi|releases|reviews|search-growth|seo|sns)\//,
  /^(?:AGENTS|CLAUDE|README)\.md$/,
];

/** 指標の生成の入力にならないパス。本番に無関係なものに、画面だけの実装を足す */
export const METADATA_INDEPENDENT = [
  ...SITE_INDEPENDENT,
  /^apps\/web\/(?:src|tests|public)\//,
  /^packages\/(?:components|ui-theme|visualization)\//,
];

const independentOf = (patterns, paths) => paths.length > 0 && paths.every((path) => patterns.some((pattern) => pattern.test(path)));

export function needsDeploy(paths) {
  return !independentOf(SITE_INDEPENDENT, paths);
}

export function needsMetricMetadata(paths) {
  return !independentOf(METADATA_INDEPENDENT, paths);
}

/** 差分の全パスを返す。読めなければ null */
export function changedPaths(base, head, run = (args) => execFileSync("git", args, { encoding: "utf8" })) {
  if (!base || !head || ZERO_SHA.test(base)) return null;
  try {
    return run(["diff", "--name-only", "-z", base, head]).split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, head] = process.argv.slice(2);
  const paths = changedPaths(base, head);
  const deploy = paths === null || needsDeploy(paths);
  const outside = paths?.filter((path) => !SITE_INDEPENDENT.some((pattern) => pattern.test(path))) ?? [];
  console.error(paths === null ? "差分を読めないのでデプロイする" : `変更 ${paths.length} 件のうち本番に関係しうるもの ${outside.length} 件: ${outside.slice(0, 10).join(" ")}`);
  process.stdout.write(`deploy=${deploy}\n`);
}
