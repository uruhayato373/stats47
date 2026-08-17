/**
 * sync-snapshots の run.sh が「1 task 失敗しても成功分を push してから赤にする」契約を守ることを固定する。
 *
 * なぜ要るか (2026-08-17 の障害):
 *   `ranking-values` は 2,244 件を書き切った**後**の検証で exit 1 していた。旧 run.sh はそこで
 *   即 exit したため末尾の push に到達せず、生成済み snapshot が runner ごと破棄され、
 *   `app/ranking/<key>/values.json` が 6 日間 site-wide で凍結した。
 *
 * 実際の失敗 run を待たずに検証するため、PATH 先頭に fake `npx` を置いて run.sh の
 * 制御フローだけを走らせる (実際の exporter も R2 も動かさない)。
 *
 * ★このテスト自身の感度も固定する: 末尾に「push より前で exit 1 する」旧ロジックを注入した
 *   run.sh を作り、そこでは push が呼ばれないことを assert する。片方だけだと
 *   「何も見ていないのに緑」と区別が付かない。
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const SCRIPT_DIR = path.join(ROOT, ".claude/skills/db/sync-snapshots");
const RUN_SH = path.join(SCRIPT_DIR, "run.sh");

/** PATH 先頭に置く fake npx。呼び出しを 1 行ずつ記録し、指定パターンを含む呼び出しだけ失敗する。 */
function makeShimDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-snapshots-contract-"));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const log = path.join(dir, "calls.log");
  fs.writeFileSync(
    path.join(bin, "npx"),
    [
      "#!/usr/bin/env bash",
      'printf "%s\\n" "$*" >> "$SHIM_LOG"',
      'if [ -n "$SHIM_FAIL_PATTERN" ] && [[ "$*" == *"$SHIM_FAIL_PATTERN"* ]]; then',
      '  echo "fake failure: $SHIM_FAIL_PATTERN" >&2',
      "  exit 1",
      "fi",
      "exit 0",
      "",
    ].join("\n"),
    { mode: 0o755 },
  );
  return { dir, bin, log };
}

function runRunSh({ script = RUN_SH, failPattern = "", args = [] } = {}) {
  const shim = makeShimDir();
  try {
    const res = spawnSync("bash", [script, ...args], {
      cwd: ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${shim.bin}${path.delimiter}${process.env.PATH ?? ""}`,
        SHIM_LOG: shim.log,
        SHIM_FAIL_PATTERN: failPattern,
        // CI=true で run.sh の push 経路を通す (ローカル実行では push をスキップする分岐がある)
        CI: "true",
        GITHUB_ACTIONS: "",
        ALLOW_LOCAL_R2_WRITE: "",
      },
    });
    const calls = fs.existsSync(shim.log)
      ? fs.readFileSync(shim.log, "utf8").split("\n").filter(Boolean)
      : [];
    return { status: res.status, stdout: res.stdout ?? "", calls };
  } finally {
    fs.rmSync(shim.dir, { recursive: true, force: true });
  }
}

/** 末尾の全体 push (--prefix なしの diff-push-r2) の呼び出し位置。無ければ -1。 */
function finalPushIndex(calls) {
  return calls.findIndex((c) => c.includes("diff-push-r2.ts") && !c.includes("--prefix"));
}

test("1 task が失敗しても、末尾の push を実行してから exit 1 する", () => {
  const { status, stdout, calls } = runRunSh({
    failPattern: "generate-ranking-values.ts",
  });

  assert.equal(status, 1, "失敗した task があるので run は赤でなければならない");

  const failedAt = calls.findIndex((c) => c.includes("generate-ranking-values.ts"));
  assert.ok(failedAt >= 0, "失敗させた task が呼ばれていない (task 名の drift)");

  const pushAt = finalPushIndex(calls);
  assert.ok(
    pushAt >= 0,
    "失敗があると末尾の push に到達していない = 成功分の snapshot が捨てられる",
  );
  assert.ok(pushAt > failedAt, "push は失敗 task より後に実行されなければならない");

  assert.match(stdout, /R2 push/, "push 区間のログが出ていない");
  assert.match(stdout, /失敗した task: .*ranking-values/, "失敗 task 名が最後に報告されていない");
});

test("全 task 成功なら exit 0 で push まで到達する", () => {
  const { status, calls } = runRunSh();
  assert.equal(status, 0);
  assert.ok(finalPushIndex(calls) >= 0, "成功時に push が呼ばれていない");
});

test("--dry-run では R2 push を呼ばない", () => {
  const { status, calls } = runRunSh({ args: ["--dry-run"] });
  assert.equal(status, 0);
  assert.equal(
    calls.filter((c) => c.includes("diff-push-r2.ts")).length,
    0,
    "dry-run なのに push が呼ばれた",
  );
});

test("sync job の timeout は末尾 push を含む実測所要時間を上回る", () => {
  // 2026-08-17 実測 (完走した run 32020891418): 生成 33m07s + push 24m44s
  // (14,033 件 / 9.45 files/s) = sync job 全体 58m01s。
  // 45 分だと push が 9,416/14,033 で cancel され (run 32006827498)、書けた snapshot の
  // 1/3 が届かないまま破棄される。run.sh 側の「失敗しても push する」修正では、
  // push 自体が殺されるのでこの打ち切られ方は救えない。
  // 床を 90 にしてあるのは 58 分に安全率を掛けても収まるため (58 × 1.25 = 72.5)。
  const yml = fs.readFileSync(path.join(ROOT, ".github/workflows/sync-snapshots.yml"), "utf8");
  const syncJob = yml.split(/^  sync-ranking-keys:/m)[0].split(/^  sync:/m)[1] ?? "";
  const m = syncJob.match(/^\s*timeout-minutes:\s*(\d+)/m);
  assert.ok(m, "sync job の timeout-minutes が読めない");
  assert.ok(
    Number(m[1]) >= 90,
    `sync job の timeout-minutes=${m[1]} は実測 58 分に対して余裕が無い (90 分以上にすること)`,
  );
});

test("旧ロジック (push より前で exit 1) を注入すると push が呼ばれなくなる = 検査が効いている", () => {
  const source = fs.readFileSync(RUN_SH, "utf8");
  const marker = '  echo "   → 成功した task の出力は下の push で反映してから exit 1 する (下記の理由)"';
  assert.ok(
    source.includes(marker),
    "run.sh の失敗報告ブロックが変わった。mutation の注入点を更新すること",
  );
  const mutated = source.replace(marker, `${marker}\n  exit 1`);
  assert.notEqual(mutated, source);

  // PROJECT_ROOT を BASH_SOURCE から解決するので、同じディレクトリに置かないと解決先がずれる
  const mutantPath = path.join(SCRIPT_DIR, `run.mutant-${process.pid}.sh`);
  fs.writeFileSync(mutantPath, mutated, { mode: 0o755 });
  try {
    const { status, calls } = runRunSh({
      script: mutantPath,
      failPattern: "generate-ranking-values.ts",
    });
    assert.equal(status, 1);
    assert.equal(
      finalPushIndex(calls),
      -1,
      "旧ロジックでも push が呼ばれている = このテストは何も検査していない",
    );
  } finally {
    fs.rmSync(mutantPath, { force: true });
  }
});
