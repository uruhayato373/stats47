// 週次監査 (npm run weekly:audits) の契約。2026-10-26 に CI の週次監査 11 本を週次レビューへ移したとき、
// 旧 workflow のテストが見ていた「検査の失敗を握りつぶさずに伝える」を、台本 (weekly-audits/<id>.sh) の側で固定する。
// 台本は偽の npm / npx / node / gh を PATH に置いて実際に走らせ、どれか 1 つが落ちたら exit 1 になることを確かめる。
import assert from "node:assert/strict";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const DIR = ".claude/scripts/management/weekly-audits";
const runner = readFileSync(join(ROOT, ".claude/scripts/management/run-weekly-audits.mjs"), "utf8");
const script = (id) => readFileSync(join(ROOT, DIR, `${id}.sh`), "utf8");

// 偽のコマンド: 呼ばれた引数を calls.log に残し、引数に FAIL_ON を含むときだけ失敗する
const FAKE = `#!/usr/bin/env bash
echo "$(basename "$0") $*" >> "$CALLS"
if [ -n "\${FAIL_ON:-}" ] && [[ "$*" == *"$FAIL_ON"* ]]; then exit 1; fi
if [ "$(basename "$0")" = gh ]; then
  case "$1 $2" in
    "run list") [ -n "\${GH_NO_RUN:-}" ] || echo 123 ;;
    "run download") while [ $# -gt 0 ]; do [ "$1" = --dir ] && { mkdir -p "$2"; echo '{}' > "$2/affiliate-portfolio-latest.json"; }; shift; done ;;
  esac
fi
if [ "$(basename "$0")" = node ] && [ "$1" = -e ]; then echo 0; fi
exit 0
`;

function runScript(id, env = {}) {
  const root = mkdtempSync(join(tmpdir(), "weekly-audits-"));
  try {
    mkdirSync(join(root, DIR), { recursive: true });
    copyFileSync(join(ROOT, DIR, `${id}.sh`), join(root, DIR, `${id}.sh`));
    const bin = join(root, "bin");
    mkdirSync(bin);
    for (const name of ["npm", "npx", "node", "gh"]) {
      writeFileSync(join(bin, name), FAKE);
      chmodSync(join(bin, name), 0o755);
    }
    const calls = join(root, "calls.log");
    writeFileSync(calls, "");
    const result = spawnSync("bash", [join(root, DIR, `${id}.sh`)], {
      env: { ...process.env, ...env, PATH: `${bin}:${process.env.PATH}`, CALLS: calls, TMPDIR: root },
      encoding: "utf8",
      timeout: 20_000,
    });
    return { status: result.status, out: `${result.stdout}${result.stderr}`, calls: readFileSync(calls, "utf8") };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("入口の一覧と台本のファイルが 1 対 1 で、台本は失敗を pipefail で拾う", () => {
  const ids = [...runner.matchAll(/\{ id: "([a-z0-9-]+)"/g)].map((m) => m[1]).sort();
  const files = readdirSync(join(ROOT, DIR)).filter((f) => f.endsWith(".sh")).map((f) => f.replace(/\.sh$/, "")).sort();
  assert.deepEqual(ids, files);
  for (const id of ids) {
    assert.match(script(id), /^set -uo pipefail$/m, `${id}: pipefail が無い`);
    assert.match(script(id), /^cd "\$\(dirname "\$0"\)\/\.\.\/\.\.\/\.\.\/\.\."$/m, `${id}: リポジトリの根へ移っていない`);
  }
  // consistency は他の監査が書き終えた文書を検査するので最後に置く
  assert.equal(ids.length, 11);
  assert.match(runner, /\{ id: "consistency"[^\n]*\n\];/);
  // 時間制限では台本の子の node までグループごと止める (bash だけ止めると後続の監査が始まらない)
  assert.match(runner, /detached: true/);
  assert.match(runner, /process\.kill\(-child\.pid, "SIGTERM"\)/);
});

test("出典監査: 全 validator が通れば exit 0、どれか 1 つでも落ちれば exit 1", () => {
  const ok = runScript("provenance");
  assert.equal(ok.status, 0, ok.out);
  for (const check of ["validate:config", "validate:catalog", "validate:area-databook", "validate:prefecture-statistics",
    "validate:open-data-catalog", "check:prefecture-statistics-links", "check:open-data-links", "check-japan-zue-evidence-inventory"]) {
    assert.match(ok.calls, new RegExp(check.replace(/[.:]/g, "\\$&")), `${check} を実行していない`);
    const ng = runScript("provenance", { FAIL_ON: check });
    assert.equal(ng.status, 1, `${check} の失敗が伝わらない`);
  }
});

test("ランキング整合: 公開データ契約・計算型 ranking・再取り込みキューのどれが落ちても exit 1", () => {
  assert.equal(runScript("ranking-integrity").status, 0);
  for (const failOn of ["audit:public-data-contract", "verify-calculated-rankings", "audit-reingest-queue", "audit-ranking-data-integrity"]) {
    assert.equal(runScript("ranking-integrity", { FAIL_ON: failOn }).status, 1, `${failOn} の失敗が伝わらない`);
  }
});

test("CI の健全性: 監査がどれか 1 つでも異常なら exit 1。成果物が無くても認証付き計測の検査は走る", () => {
  assert.equal(runScript("ci-health").status, 0);
  for (const failOn of ["audit-workflow-health", "audit-r2-freshness", "check-affiliate-portfolio-freshness", "audit-superseded-dispatches", "measurement/health.mjs"]) {
    assert.equal(runScript("ci-health", { FAIL_ON: failOn }).status, 1, `${failOn} の異常が伝わらない`);
  }
  const noArtifact = runScript("ci-health", { GH_NO_RUN: "1" });
  assert.equal(noArtifact.status, 1, "アフィリエイトの成果物が無いのに通った");
  assert.match(noArtifact.calls, /measurement\/health\.mjs --check/, "成果物が無いと認証付き計測の検査が飛ぶ");
  // 手動の backfill の成果物で週次の成功を偽装しない
  assert.match(script("ci-health"), /gh run list --workflow affiliate-ga4-weekly\.yml --event schedule --status success/);
});

test("ブログ是正キュー: 縮小専用ラチェット 3 種と散布図の検査を持ち、増えた queue は HEAD に戻す", () => {
  const src = script("blog-remediation");
  for (const name of ["lineage", "value", "provenance"]) assert.match(src, new RegExp(`^ratchet ${name} `, "m"), `${name} ラチェットが無い`);
  assert.match(src, /git checkout -- "\$@"/, "増えた queue を基準に残してしまう");
  assert.match(src, /rerender-scatter-canonical\.mts --probe-only --require-canonical --verify-sources \|\| failed\+=/);
  assert.match(src, /exit 1; fi\s*$/, "ラチェットの失敗が終了コードに伝わらない");
});
