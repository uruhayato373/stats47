"use strict";
// develop→main の PR の先頭が [skip ci] の記録コミットになっても必須チェックが付くことの契約 (2026-10-20、PR #1161 で 2 回 BLOCKED)。
// 見張り役 (pr-skip-ci-head-guard.yml) が pull_request_target で受け、pr-quality-check.yml を workflow_dispatch で起動する。
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "../../../..");
const GUARD_PATH = path.join(ROOT, ".github/workflows/pr-skip-ci-head-guard.yml");
const QUALITY_PATH = path.join(ROOT, ".github/workflows/pr-quality-check.yml");
const guardText = fs.readFileSync(GUARD_PATH, "utf8");
const guard = yaml.load(guardText);
const qualityText = fs.readFileSync(QUALITY_PATH, "utf8");
const quality = yaml.load(qualityText);

test("見張り役は [skip ci] で止まらない pull_request_target で main 向け PR の更新を受ける", () => {
  const on = guard.on.pull_request_target;
  assert.ok(on, "pull_request_target が無い (pull_request だと [skip ci] で発火しない)");
  assert.deepEqual(on.branches, ["main"]);
  assert.ok(on.types.includes("synchronize"), "先頭の更新 (synchronize) を受ける");
});

test("見張り役は PR のコードを checkout せず、起動に必要な権限だけを持つ", () => {
  assert.doesNotMatch(guardText, /actions\/checkout/, "pull_request_target で PR のコードを実行しない");
  assert.deepEqual(guard.permissions, { actions: "write", contents: "read" });
  const job = guard.jobs.redispatch;
  assert.match(job.if, /head\.repo\.full_name == github\.repository/, "フォークの PR では動かない");
  assert.match(job.if, /head\.ref == 'develop'/);
});

test("skip 判定は先頭コミットの [skip ci] 系の指定だけに反応する", () => {
  const pattern = guardText.match(/grep -qiE '([^']+)'/)[1];
  const re = new RegExp(pattern, "i");
  for (const message of [
    "chore(metrics): authenticated measurement status [skip ci]",
    "chore(threads): record posted permalinks [ci skip]",
    "chore: x [no ci]",
    "chore: x [skip actions]",
    "chore: x [actions skip]",
  ]) assert.ok(re.test(message), message);
  for (const message of [
    "docs(rules): note that the authenticated measurement record can take the PR head",
    "fix: skip ci-only branch when empty",
  ]) assert.ok(!re.test(message), message);
});

test("見張り役は品質チェックを develop で PR 番号と base の SHA を渡して起動する", () => {
  assert.match(guardText, /gh workflow run pr-quality-check\.yml --repo "\$REPO" --ref develop -f pr_number="\$PR_NUMBER" -f base_sha="\$BASE_SHA"/);
});

test("品質チェックは workflow_dispatch でも PR の値を inputs から受け取って動く", () => {
  const inputs = quality.on.workflow_dispatch.inputs;
  assert.equal(inputs.pr_number.required, true);
  assert.equal(inputs.base_sha.required, true);
  assert.ok(quality.on.pull_request, "通常の pull_request の起動は残す");
  // pull_request のイベント値を単独で参照する箇所が残ると、workflow_dispatch では空文字になり差分の基点が壊れる
  const bare = qualityText.match(/\$\{\{ github\.event\.pull_request\.(?:base\.sha|head\.sha|number) \}\}/g) ?? [];
  assert.deepEqual(bare, [], "inputs への切り替え (|| inputs.x / || github.sha) が無い参照");
  assert.equal(quality.jobs["quality-check"].name, "Code Quality Check", "必須チェックの名前を変えない");
});
