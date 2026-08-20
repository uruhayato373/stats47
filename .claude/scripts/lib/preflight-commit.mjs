#!/usr/bin/env node
/**
 * commit 前の高速プリフライト — blocker を「一度に全部」出す。
 *
 * ★なぜ要るか (2026-08-20 の実測):
 *   pre-commit フックは直列 all-or-nothing で 2 分超かかる。blocker が 1 つ出ると
 *   全体が abort するので、「直す → 再実行 → 次の blocker が出る」を繰り返すことになる。
 *   実際に develop のマージで 3 サイクル・十数分を検査待ちに使った。3 つの blocker は
 *   最初から同時に存在していたので、並列に 1 回走らせれば 1 サイクルで済んだ。
 *
 * ★このスクリプトは pre-commit の代替ではない。
 *   pre-commit が持つ深い検査 (型チェック・docs governance・画像 pipeline 等) は
 *   ここには無い。ここにあるのは「速くて・決定的で・実際によく引っかかる」3 つだけ。
 *   通ったからといって commit が通る保証はしない (逆に、ここで落ちれば確実に落ちる)。
 *
 * ★失敗しても止まらない: 全ゲートを最後まで走らせて結果をまとめて出す。
 *   これが本スクリプトの存在理由なので、fail-fast へ変えてはならない。
 *
 * 使い方:
 *   node .claude/scripts/lib/preflight-commit.mjs          # staged ファイルを対象
 *   node .claude/scripts/lib/preflight-commit.mjs --all    # リポジトリ全体を lint
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

// ★2 つの root を混同しない (2026-08-20 に自テストが実バグとして検出した):
//   REPO_ROOT = チェッカー本体の在り処。**必ずこのファイルの位置から解決する**
//               (cwd 由来にすると実行ディレクトリ次第で壊れる)。
//   SCAN_ROOT = 検査対象。CLAUDE_PROJECT_DIR で差し替えられる (テスト・別チェックアウト用)。
// 両者を 1 変数にすると、CLAUDE_PROJECT_DIR を設定した瞬間に自分のチェッカーを見失い、
// 「チェッカーが落ちた」を「違反を検出した」と取り違える (実際にそう動いていた)。
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const SCAN_ROOT = process.env.CLAUDE_PROJECT_DIR || REPO_ROOT;
const WEB_DIR = path.join(SCAN_ROOT, "apps", "web");
const checker = (name) => path.join(REPO_ROOT, ".claude/scripts/lib", name);

const GREEN = "[0;32m";
const RED = "[0;31m";
const YELLOW = "[1;33m";
const DIM = "[2m";
const NC = "[0m";

/** 実行して {ok, output} を返す。throw しない (1 つの失敗で他を止めないため)。 */
async function tryRun(command, args, options = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: SCAN_ROOT,
      maxBuffer: 32 * 1024 * 1024,
      ...options,
    });
    return { ok: true, output: `${stdout}${stderr}` };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? ""}` };
  }
}

/** staged な apps/web の TS/TSX を返す。--all なら null (= 全体 lint)。 */
async function stagedWebFiles() {
  const { ok, output } = await tryRun("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"]);
  if (!ok) return [];
  return output
    .split(/\r?\n/)
    .filter((line) => /^apps\/web\/src\/.*\.(ts|tsx)$/.test(line))
    .map((line) => line.replace(/^apps\/web\//, ""));
}

async function eslintGate(all) {
  if (all) {
    const result = await tryRun("npm", ["run", "lint"]);
    return { ...result, hint: "cd apps/web && npx eslint <file> --fix" };
  }
  const files = await stagedWebFiles();
  if (files.length === 0) {
    return { ok: true, output: "staged な apps/web/src の TS/TSX なし", skipped: true };
  }
  const result = await tryRun("npx", ["eslint", ...files], { cwd: WEB_DIR });
  return { ...result, hint: `cd apps/web && npx eslint ${files[0]} --fix` };
}

const GATES = [
  {
    name: "ESLint",
    why: "import/order・no-duplicate-imports・set-state-in-effect 等",
    run: (all) => eslintGate(all),
  },
  {
    name: "Env Registry",
    why: "新規 process.env は .claude/config/env-registry.json への登録が必須",
    run: () => tryRun("node", [checker("check-env-registry.cjs")]),
    hint: "検出された変数名を .claude/config/env-registry.json の variables へ追加する",
  },
  {
    name: "Maintenance Debt",
    why: "無根拠 TODO / 削除条件のない legacy / 永続 D1 runtime の新規増加",
    run: () => tryRun("node", [checker("check-maintenance-debt.cjs"), "--baseline"]),
    hint: "実修正 (期限・削除条件を書く / backlog 化) か、誤検知ならチェッカー側のルール修正",
  },
];

async function main() {
  const all = process.argv.includes("--all");
  const started = Date.now();

  console.log(`${GREEN}🚀 プリフライト — ${GATES.length} ゲートを並列実行${NC}${all ? " (--all)" : ""}\n`);

  // ★並列。1 つ落ちても他を止めない (まとめて出すのが本スクリプトの目的)。
  const results = await Promise.all(
    GATES.map(async (gate) => ({ gate, result: await gate.run(all) })),
  );

  const failed = [];
  for (const { gate, result } of results) {
    if (result.skipped) {
      console.log(`${DIM}⊘ ${gate.name} — ${result.output}${NC}`);
    } else if (result.ok) {
      console.log(`${GREEN}✅ ${gate.name}${NC}`);
    } else {
      console.log(`${RED}❌ ${gate.name}${NC} ${DIM}(${gate.why})${NC}`);
      failed.push({ gate, result });
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (failed.length === 0) {
    console.log(`\n${GREEN}✅ プリフライト通過 (${elapsed}s)${NC}`);
    console.log(`${DIM}※ pre-commit の深い検査 (型 / docs / 画像 pipeline) はここには無い。${NC}`);
    return;
  }

  console.log(`\n${RED}✗ ${failed.length} / ${GATES.length} ゲートが失敗 (${elapsed}s)${NC}`);
  for (const { gate, result } of failed) {
    console.log(`\n${YELLOW}── ${gate.name} ──${NC}`);
    const lines = result.output.split(/\r?\n/).filter(Boolean);
    lines.slice(0, 25).forEach((line) => console.log(`  ${line}`));
    if (lines.length > 25) console.log(`  ${DIM}… 他 ${lines.length - 25} 行${NC}`);
    const hint = result.hint ?? gate.hint;
    if (hint) console.log(`  ${YELLOW}💡 ${hint}${NC}`);
  }
  console.log(`\n${YELLOW}上記を全部直してから commit すると、pre-commit の再実行サイクルを節約できる。${NC}`);
  process.exitCode = 1;
}

// ESM のエントリポイント判定は pathToFileURL 経由 (Windows で文字列連結は必ず不一致になる。
// 正典: .claude/rules/local-environment.md「file:// URL を文字列連結しない」)。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
