import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const PREFLIGHT = path.join(ROOT, ".claude/scripts/lib/preflight-commit.mjs");

/**
 * ★このテストが守る唯一の契約: **ゲートが落ちたら preflight も落ちる**。
 *
 * 常に exit 0 を返す preflight は「ゲートが無い」より悪い (通ったと誤認させる)。
 * 集計ロジックはこのスクリプトの自作部分なので、ここだけを固定する
 * (個々のゲートの検出力は各 checker 自身のテストが持つ)。
 */
function runPreflight(projectDir) {
  return spawnSync(process.execPath, [PREFLIGHT], {
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
}

/**
 * 一時プロジェクト。git repo ではないので ESLint ゲートは対象なしで skip される。
 *
 * env registry は「レジストリ本体が無い」だけで落ちるので、空のレジストリを必ず置く
 * (置かないと全ケースが赤くなり、Maintenance Debt の検出力を測れない)。
 */
function tempProject(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-preflight-"));
  const seeded = {
    ".claude/config/env-registry.json": `${JSON.stringify({ version: 1, variables: [] }, null, 2)}\n`,
    ...files,
  };
  for (const [rel, content] of Object.entries(seeded)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

test("違反が無ければ exit 0 で通過する", (t) => {
  const root = tempProject({ "apps/web/src/clean.ts": "export const OK = 1;\n" });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const result = runPreflight(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /プリフライト通過/);
});

test("[mutation] ゲートが落ちたら exit 1 になる (常に 0 を返す退行を止める)", (t) => {
  // 「期限」「削除条件」等の境界語を含めない = 本当に未境界な legacy 行。
  // (これらの語を書くと checker が正しく除外するため、probe として成立しない)
  const marker = "leg" + "acy";
  const root = tempProject({
    "apps/web/src/debt.ts": `/` + `/ ${marker}: この分岐はいずれ消す\nexport const X = 1;\n`,
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const result = runPreflight(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /Maintenance Debt/);
  assert.match(result.stdout, /ゲートが失敗/);
});

test("1 つ落ちても他のゲートを最後まで走らせる (fail-fast にしない)", (t) => {
  const marker = "leg" + "acy";
  const root = tempProject({
    "apps/web/src/debt.ts": `/` + `/ ${marker}: この分岐はいずれ消す\nexport const X = 1;\n`,
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const result = runPreflight(root);
  // 落ちた Maintenance Debt だけでなく、通った Env Registry の結果も出ていること。
  // (fail-fast に変えるとこの行が消え、blocker を一度に出すという目的が失われる)
  assert.match(result.stdout, /Env Registry/, result.stdout);
});

/**
 * --pr モードの契約 (2026-09-06 追加)。
 *
 * このモードの価値は「CI と同じ判定を push 前に 1 回で出す」ことなので、
 * ローカルと CI がドリフトした瞬間に無意味になる。実行は重い (~70s・要ネットワーク) ため、
 * ここでは**両者が同じコマンドを指していること**を静的に固定する。
 */
test("--pr のゲートは PR CI (Static Gates) と同じコマンドを指す", () => {
  const src = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/lib/preflight-commit.mjs"),
    "utf8"
  );
  const workflow = fs.readFileSync(
    path.join(ROOT, ".github/workflows/pr-quality-check.yml"),
    "utf8"
  );

  // 母集団が変わると連鎖して古くなる生成物。2026-09-06 の 8 往復の実測が出典。
  const shared = [
    "build:registry",
    "validate:config",
    "validate:years",
    "validate:polarity",
    "validate:catalog",
    "generate:catalog",
    "generate-theme-dependency-mirror.ts",
    "generate-unit-semantics-mirror.ts",
    "validate:area-databook",
    "validate:topics",
    "audit-survey-taxonomy.ts",
    "generate-sitemap-blog-entries.ts",
    "generate-known-tag-keys.ts",
    "generate-ranking-prominence.ts",
  ];
  for (const command of shared) {
    assert.ok(src.includes(command), `preflight --pr が ${command} を失っている`);
    assert.ok(workflow.includes(command), `CI が ${command} を失っている (ローカルとドリフト)`);
  }
});

test("--pr は GATES ではなく PR_GATES を使う (commit 用の 3 ゲートに退行させない)", () => {
  const src = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/lib/preflight-commit.mjs"),
    "utf8"
  );
  assert.match(src, /const gates = pr \? PR_GATES : GATES;/);
  // 集約表示・件数表示が gates 変数を見ていること (GATES 直参照に戻すと --pr の件数が嘘になる)
  assert.ok(!/\$\{GATES\.length\}/.test(src), "件数表示が GATES 固定に戻っている");
});

test("--pr は main が develop 非経由で進んだ状態を検出する", () => {
  const src = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/lib/preflight-commit.mjs"),
    "utf8"
  );
  assert.ok(src.includes("main 先行チェック"), "main 先行チェックが消えている");
  // commit 数ではなく内容差分で判定する (cron の state 書き戻しで毎回赤くしない)
  assert.ok(
    src.includes('"--name-only"') && src.includes(".claude/state/"),
    "main 先行チェックが内容差分ベースでなくなっている"
  );
});

test("main先行の差分はdevelopだけのcommitを数えず、mainだけの変更を検出する", (t) => {
  const source = fs.readFileSync(PREFLIGHT, "utf8");
  assert.match(source, /"origin\/develop\.\.\.origin\/main"/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-main-ahead-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git("init", "-q");
  git("config", "user.name", "Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("-c", "core.hooksPath=/dev/null", "commit", "--allow-empty", "-qm", "base");
  const base = git("rev-parse", "HEAD");
  git("update-ref", "refs/remotes/origin/main", base);
  fs.writeFileSync(path.join(dir, "develop.txt"), "develop-only");
  git("add", "develop.txt");
  git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "develop");
  git("update-ref", "refs/remotes/origin/develop", git("rev-parse", "HEAD"));
  assert.equal(git("diff", "--name-only", "origin/develop...origin/main"), "");
  git("checkout", "--detach", base);
  fs.writeFileSync(path.join(dir, "main.txt"), "main-only");
  git("add", "main.txt");
  git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "main");
  git("update-ref", "refs/remotes/origin/main", git("rev-parse", "HEAD"));
  assert.equal(git("diff", "--name-only", "origin/develop...origin/main"), "main.txt");
});
