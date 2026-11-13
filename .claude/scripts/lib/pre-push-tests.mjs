#!/usr/bin/env node
/**
 * push の前に、変更に関係するテストと、文書の変更なら docs:check を走らせる (.husky/pre-push)。
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

// 文書ガバナンス (npm run docs:check) の対象。apps/web/scripts/pre-commit-checks.sh の STAGED_DOCS と同じ範囲に保つ。
const DOCS_CHECK_PATHS =
  /^(docs\/|\.claude\/todo\/|data\/business\/(domain-stances|domains)\.json$|CLAUDE\.md$|AGENTS\.md$|\.claude\/(config\/docs-governance\.json|rules\/docs-vs-issues\.md|skills\/management\/maintain-docs\/|scripts\/lib\/check-docs-(governance|links)\.cjs|scripts\/lib\/__tests__\/check-docs-(governance|links)\.test\.cjs)|package\.json$)/;

/** 変更に文書ガバナンスの対象が含まれるか。pre-commit を通らずに入った backlog の DG057 違反を push の前に止める */
export function needsDocsCheck(changed) {
  return changed.some((path) => DOCS_CHECK_PATHS.test(path));
}

const stemOf = (path) => basename(path).replace(/\.test\.[cm]?[jt]s$/, "").replace(/\.[^.]+$/, "");

/** 変更したファイルと名前が重なる node --test のテストを選ぶ (data/business/domains.json → check-domains.test.cjs) */
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
  // Windows の npx は npx.cmd で、shell なしでは起動できず status が null になる (出力なしで失敗扱いになっていた。2026-11-12)
  const { status, error } = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (error) console.error(`起動に失敗: ${command} (${error.message})`);
  return status === 0;
}

function main() {
  if (process.env.CI) return 0;
  const changed = changedSinceRemote().filter((path) => existsSync(join(ROOT, path)));
  const nodeTests = selectNodeTests(changed, listNodeTests());
  let ok = true;
  if (nodeTests.length > MAX_NODE_TESTS) console.log(`関係するテストが ${nodeTests.length} 件あるので CI に任せる`);
  // .ts を require するスクリプトがある。型を外せない Node (22.14 など) でも CI と同じ結果になるよう tsx を通す (2026-11-12)
  else if (nodeTests.length) ok = run(`スクリプトのテスト ${nodeTests.length} 件`, "node", ["--import", "tsx", "--test", ...nodeTests]) && ok;
  for (const workspace of WORKSPACES) {
    const sources = selectVitestSources(changed, workspace);
    if (sources.length === 0) continue;
    if (sources.length > MAX_VITEST_FILES) console.log(`${workspace} の変更が ${sources.length} 件あるので CI に任せる`);
    else ok = run(`${workspace} の関係するテスト`, "npx", ["vitest", "related", "--run", "--passWithNoTests", ...sources], join(ROOT, workspace)) && ok;
  }
  if (needsDocsCheck(changed)) ok = run("文書ガバナンス (npm run docs:check)", "npm", ["run", "docs:check"]) && ok;
  if (!ok) console.error(`❌ 検査が失敗しました。${relative(ROOT, fileURLToPath(import.meta.url))} を飛ばすときは git push --no-verify`);
  return ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
