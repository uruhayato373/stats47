#!/usr/bin/env node
/**
 * push の前に、変更に関係するテストだけを走らせる (.husky/pre-push)。
 *
 * PR の CI で落ちると、直して走り直すまで 10 分以上待つ。手元の 1 分で見つかるものはここで止める。
 * 全件は CI が持つので、ここは関係するものだけを選ぶ。対象が多すぎるときは CI に任せて通す。
 * 止めずに push するときは git push --no-verify。
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const MAX_NODE_TESTS = 40;
const MAX_VITEST_FILES = 30;
const MIN_STEM = 4;
const WORKSPACES = ["apps/admin", "apps/web"];

const stemOf = (path) => basename(path).replace(/\.test\.[cm]?[jt]s$/, "").replace(/\.[^.]+$/, "");

/** 変更したファイルと名前が重なる node --test のテストを選ぶ (config/domains.json → check-domains.test.cjs) */
export function selectNodeTests(changed, tests) {
  const stems = [...new Set(changed.map(stemOf))].filter((stem) => stem.length >= MIN_STEM);
  return tests.filter((test) => {
    const name = stemOf(test);
    return changed.includes(test) || stems.some((stem) => name.includes(stem) || stem.includes(name));
  });
}

/** workspace ごとの、vitest related に渡すソースを返す */
export function selectVitestSources(changed, workspace) {
  return changed
    .filter((path) => path.startsWith(`${workspace}/`) && /\.(?:ts|tsx)$/.test(path))
    .map((path) => path.slice(workspace.length + 1));
}

function listNodeTests() {
  const dir = join(ROOT, ".claude/scripts");
  return readdirSync(dir, { recursive: true })
    .map((entry) => join(".claude/scripts", String(entry)).split("\\").join("/"))
    .filter((path) => /__tests__\/[^/]+\.test\.[cm]js$/.test(path));
}

function changedSinceRemote() {
  const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  const base = git(["merge-base", "HEAD", "origin/develop"]);
  return git(["diff", "--name-only", base, "HEAD"]).split("\n").filter(Boolean);
}

function run(label, command, args, cwd = ROOT) {
  console.log(`▶ ${label}`);
  const { status } = spawnSync(command, args, { cwd, stdio: "inherit" });
  return status === 0;
}

function main() {
  if (process.env.CI) return 0;
  const changed = changedSinceRemote().filter((path) => existsSync(join(ROOT, path)));
  const nodeTests = selectNodeTests(changed, listNodeTests());
  let ok = true;
  if (nodeTests.length > MAX_NODE_TESTS) console.log(`関係するテストが ${nodeTests.length} 件あるので CI に任せる`);
  else if (nodeTests.length) ok = run(`スクリプトのテスト ${nodeTests.length} 件`, "node", ["--test", ...nodeTests]) && ok;
  for (const workspace of WORKSPACES) {
    const sources = selectVitestSources(changed, workspace);
    if (sources.length === 0) continue;
    if (sources.length > MAX_VITEST_FILES) console.log(`${workspace} の変更が ${sources.length} 件あるので CI に任せる`);
    else ok = run(`${workspace} の関係するテスト`, "npx", ["vitest", "related", "--run", "--passWithNoTests", ...sources], join(ROOT, workspace)) && ok;
  }
  if (!ok) console.error(`❌ テストが失敗しました。${relative(ROOT, fileURLToPath(import.meta.url))} を飛ばすときは git push --no-verify`);
  return ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
