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
