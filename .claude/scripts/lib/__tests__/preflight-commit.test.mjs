import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  COMMIT_GATES,
  PR_GATES,
  REGISTRY_NETWORK_GATES,
  partitionRegistryGates,
  resolveInvocation,
  runGates,
  stagedWebScoped,
} from "../preflight-commit.mjs";

test("空いた枠を再利用し、同時数を守り、例外後も残りのゲートを検査する", async () => {
  let releaseFirst;
  const blocked = new Promise((resolve) => { releaseFirst = resolve; });
  const started = [];
  let active = 0;
  let maximum = 0;
  const gates = [0, 1, 2, 3].map((index) => ({ name: String(index), run: async () => {
    started.push(index);
    maximum = Math.max(maximum, ++active);
    try {
      if (index === 0) await blocked;
      if (index === 2) { releaseFirst(); throw new Error("probe failure"); }
      return { ok: true };
    } finally { active--; }
  } }));
  const results = await runGates(gates, false, 2);
  assert.equal(maximum, 2);
  assert.deepEqual(started, [0, 1, 2, 3]);
  assert.deepEqual(results.map((r) => r.result.ok), [true, true, false, true]);
  assert.match(results[2].result.output, /probe failure/);
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const PREFLIGHT = path.join(ROOT, ".claude/scripts/lib/preflight-commit.mjs");

test("Windowsではnpm/npxのCLI本体をNodeから直接実行する", () => {
  const options = {
    platform: "win32",
    npmExecPath: "C:\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
    nodeExecPath: "C:\\nodejs\\node.exe",
  };
  assert.deepEqual(resolveInvocation("npm", ["run", "x"], options), {
    command: "C:\\nodejs\\node.exe",
    args: ["C:\\nodejs\\node_modules\\npm\\bin\\npm-cli.js", "run", "x"],
  });
  assert.deepEqual(resolveInvocation("npx", ["tsx", "x.ts"], options), {
    command: "C:\\nodejs\\node.exe",
    args: ["C:\\nodejs\\node_modules\\npm\\bin\\npx-cli.js", "tsx", "x.ts"],
  });
  assert.deepEqual(resolveInvocation("npm", ["run", "x"], { platform: "linux" }), {
    command: "npm",
    args: ["run", "x"],
  });
});

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
test("--pr は registry に無い手書き生成物ゲートについて PR CI (Static Gates 系) と同じコマンドを指す", () => {
  const src = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/lib/preflight-commit.mjs"),
    "utf8"
  );
  const workflow = fs.readFileSync(
    path.join(ROOT, ".github/workflows/pr-quality-check.yml"),
    "utf8"
  );

  // ここに残るのは quality-gates.json に登録の無い生成/検証スクリプトだけ
  // (checker 命名規則に乗らない npm run validate:* / generate:* 系)。
  // 登録済みの checker (card-census 等) は registry 由来の自動照合テストへ移した
  // (CI-SPEED-PREFLIGHT-PR-REGISTRY-01 恒久案、2026-09-24)。
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
    "audit-affiliate-compliance.ts",
    "audit-affiliate-relevance.ts",
  ];
  for (const command of shared) {
    assert.ok(src.includes(command), `preflight --pr が ${command} を失っている`);
    assert.ok(workflow.includes(command), `CI が ${command} を失っている (ローカルとドリフト)`);
  }
});

test("--pr は GATES ではなく PR_GATES ベースの選択を使う (commit 用の 3 ゲートに退行させない)", () => {
  const src = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/lib/preflight-commit.mjs"),
    "utf8"
  );
  assert.match(src, /pr \? prSelected : GATES/);
  assert.match(src, /const prSelected = withNetwork \? \[\.\.\.PR_GATES, \.\.\.REGISTRY_NETWORK_GATES/);
  // 集約表示・件数表示が gates 変数を見ていること (GATES 直参照に戻すと --pr の件数が嘘になる)
  assert.ok(!/\$\{GATES\.length\}/.test(src), "件数表示が GATES 固定に戻っている");
});

test("--pr は共通レール変更の独立した3ガードを registry 経由でまとめて実行する", () => {
  const names = PR_GATES.map((gate) => gate.name);
  for (const id of ["card-census", "ad-placement", "accessibility-static"]) {
    assert.ok(names.includes(id), `${id} がPRの事前検査から外れている`);
  }
});

/**
 * CI-SPEED-PREFLIGHT-PR-REGISTRY-01 恒久案 (2026-09-24)。
 *
 * ★このテストが守る契約: --pr は quality-gates.json の
 * `blocking:true かつ trigger に pull_request を含み networkOrSecrets:"none"` な gate を
 * **全件**含む。手書き一覧に戻す (= registry から漏らす) と落ちる。
 * PR_GATES は実際に `partitionRegistryGates(実 registry)` から組まれているため、
 * registry 側にだけ gate を足しても・PR_GATES 側の組み立てロジックだけを壊しても、
 * どちらの drift でもこのテストが落ちる (期待値をテスト側で独立に再計算しているため)。
 */
test("--pr は registry の trigger:pull_request かつ networkOrSecrets:none な blocking gate を全件含む", () => {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, ".claude/config/quality-gates.json"), "utf8"),
  );
  const expected = registry.gates.filter(
    (gate) =>
      gate.blocking === true &&
      Array.isArray(gate.trigger) &&
      gate.trigger.includes("pull_request") &&
      gate.networkOrSecrets === "none" &&
      // 所要時間を測る gate は並列 preflight から外し、CI の単独 step だけで測る
      gate.id !== "runtime-budget",
  );
  assert.ok(expected.length >= 20, `registry fixture が薄すぎる (${expected.length} 件) — quality-gates.json の読み込み自体が壊れていないか確認`);
  const names = new Set(PR_GATES.map((gate) => gate.name));
  for (const gate of expected) {
    assert.ok(names.has(gate.id), `registry gate ${gate.id} (trigger:pull_request, networkOrSecrets:none) が --pr に無い`);
  }
});

test("--pr は所要時間を測る runtime-budget を並列実行に混ぜない (自分の並列負荷で予算を超える)", () => {
  const names = new Set(PR_GATES.map((gate) => gate.name));
  assert.ok(!names.has("runtime-budget"), "runtime-budget が並列の --pr に入っている");
  const workflow = fs.readFileSync(path.join(ROOT, ".github/workflows/pr-quality-check.yml"), "utf8");
  assert.match(workflow, /run: node \.claude\/scripts\/lib\/check-runtime-budget\.cjs/, "CI の単独 step が無いと予算検査がどこでも走らなくなる");
});

test("--pr は networkOrSecrets が none でない registry gate を既定で実行しない (--with-network で opt-in)", () => {
  const prNames = new Set(PR_GATES.map((gate) => gate.name));
  for (const gate of REGISTRY_NETWORK_GATES) {
    assert.ok(!prNames.has(gate.id), `network 要の registry gate ${gate.id} が既定の --pr に紛れ込んでいる`);
  }
  // docs-links は networkOrSecrets:"scheduled-network" の実例。opt-in セットに入っていること。
  assert.ok(REGISTRY_NETWORK_GATES.some((gate) => gate.id === "docs-links"), "docs-links が --with-network opt-in セットに無い");
});

test("[mutation] partitionRegistryGates は gate の追加/削除に追従する (registry 側 drift の検出)", () => {
  const fixture = {
    gates: [
      { id: "a", blocking: true, trigger: ["pull_request"], networkOrSecrets: "none" },
      { id: "b", blocking: true, trigger: ["pull_request"], networkOrSecrets: "network-and-secrets" },
      { id: "c", blocking: true, trigger: ["schedule"], networkOrSecrets: "none" },
      { id: "d", blocking: false, trigger: ["pull_request"], networkOrSecrets: "none" },
      { id: "affiliate-compliance", blocking: true, trigger: ["pull_request"], networkOrSecrets: "network-and-secrets" },
    ],
  };
  const before = partitionRegistryGates(fixture);
  assert.deepEqual(before.offline.map((g) => g.id), ["a"]);
  // b は network 扱いで opt-in セットに入るが、affiliate-compliance は手書きゲートに一本化するため除外される
  assert.deepEqual(before.network.map((g) => g.id), ["b"]);

  // registry から "a" を削除 (= drift の再現) すると offline から即座に消える
  const mutated = { gates: fixture.gates.filter((gate) => gate.id !== "a") };
  const after = partitionRegistryGates(mutated);
  assert.deepEqual(after.offline.map((g) => g.id), []);
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

/**
 * PRECOMMIT-STAGED-SCOPE-01: working tree 全体を走査する UI 契約ゲートは、staged に apps/web/src の
 * TS/TSX が無い commit (docs だけ等) では走らせない。別セッションの unstaged な未登録 *Card が
 * 無関係な commit を止めていたため。staged に対象がある commit では従来どおり実行する。
 */
test("commit-static: staged に apps/web/src の TS/TSX が無ければ working tree 走査ゲートを skip する", async () => {
  let ran = 0;
  const gate = stagedWebScoped(
    { name: "Card Census", run: async () => { ran += 1; return { ok: false, output: "unstaged probe" }; } },
    async () => [],
  );
  const result = await gate.run();
  assert.equal(result.skipped, true);
  assert.equal(result.ok, true);
  assert.equal(ran, 0, "staged が空なのに走査ゲートが実行された");
});

test("commit-static: staged に apps/web/src の TS/TSX があれば従来どおり実行し、失敗を伝える", async () => {
  const gate = stagedWebScoped(
    { name: "Card Census", run: async () => ({ ok: false, output: "unregistered card" }) },
    async () => ["src/components/ProbeCard.tsx"],
  );
  const result = await gate.run();
  assert.equal(result.ok, false);
  assert.notEqual(result.skipped, true);
});

test("commit-static: staged 範囲に縛るのは card-census / ad-placement だけ (repository-hygiene 等は全体検査のまま)", () => {
  assert.deepEqual(
    COMMIT_GATES.filter((gate) => gate.stagedWebScoped).map((gate) => gate.name).sort(),
    ["ad-placement", "card-census"],
  );
  const src = fs.readFileSync(PREFLIGHT, "utf8");
  const prGates = src.slice(src.indexOf("const PR_GATES = ["), src.indexOf("const GATES = ["));
  assert.ok(!/stagedWebScoped/.test(prGates), "--pr のゲートまで staged 範囲に縛られている (CI と同じ全体走査を保つ)");
});
