"use strict";
// develop→main の PR の先頭が [skip ci] の記録コミットになっても必須チェックが付くことの契約 (2026-10-20、PR #1161 で 2 回 BLOCKED)。
// 見張り役 (pr-skip-ci-head-guard.yml) が pull_request_target で受け、pr-quality-check.yml を workflow_dispatch で起動する。
// GITHUB_TOKEN で push された先頭では品質チェックが承認待ち (action_required) で止まるので、それを workflow_run で受けて
// 同じく起動し直す (2026-10-25、PR #1176 の先頭 569a88c44)。
// main へのマージコミットの本文に skip 指定が入ると push の run が 1 本も作られず本番デプロイが起動しないので、
// 同じ見張り役が PR の closed (merged) を受けて deploy-workers.yml を workflow_dispatch で起動する
// (2026-11-13、PR #1257 の squash bd6f1bb35。本文に develop の記録コミットの件名が並んだ)。
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "../../../..");
const GUARD_PATH = path.join(ROOT, ".github/workflows/pr-skip-ci-head-guard.yml");
const QUALITY_PATH = path.join(ROOT, ".github/workflows/pr-quality-check.yml");
const guardText = fs.readFileSync(GUARD_PATH, "utf8");
const guard = yaml.load(guardText);
const qualityText = fs.readFileSync(QUALITY_PATH, "utf8");
const quality = yaml.load(qualityText);
const DEPLOY_PATH = path.join(ROOT, ".github/workflows/deploy-workers.yml");
const deployText = fs.readFileSync(DEPLOY_PATH, "utf8");
const deploy = yaml.load(deployText);

test("見張り役は [skip ci] で止まらない pull_request_target で main 向け PR の更新を受ける", () => {
  const on = guard.on.pull_request_target;
  assert.ok(on, "pull_request_target が無い (pull_request だと [skip ci] で発火しない)");
  assert.deepEqual(on.branches, ["main"]);
  assert.ok(on.types.includes("synchronize"), "先頭の更新 (synchronize) を受ける");
});

test("見張り役は PR のコードを checkout せず、起動に必要な権限だけを持つ", () => {
  assert.doesNotMatch(guardText, /actions\/checkout/, "pull_request_target で PR のコードを実行しない");
  assert.deepEqual(guard.permissions, { actions: "write", contents: "read", "pull-requests": "read" });
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

test("承認待ちで完了した品質チェックを workflow_run で受ける", () => {
  const on = guard.on.workflow_run;
  assert.ok(on, "workflow_run が無い (GITHUB_TOKEN の push では pull_request_target の run が作られない)");
  assert.deepEqual(on.workflows, [quality.name], "品質チェックの workflow 名と一致させる");
  assert.deepEqual(on.types, ["completed"]);
});

test("起動し直すのは pull_request 由来・承認待ち・develop・同じリポジトリの run だけ", () => {
  const job = guard.jobs["redispatch-approval-required"];
  assert.ok(job, "承認待ちを起動し直す job が無い");
  for (const condition of [
    "github.event_name == 'workflow_run'",
    "github.event.workflow_run.event == 'pull_request'",
    "github.event.workflow_run.conclusion == 'action_required'",
    "github.event.workflow_run.head_branch == 'develop'",
    "github.event.workflow_run.head_repository.full_name == github.repository",
  ]) assert.ok(job.if.includes(condition), condition);
  // workflow_dispatch で起動した run は event が pull_request ではないので、起動し直しが連鎖しない
  assert.doesNotMatch(job.if, /workflow_dispatch/);
});

test("承認待ちの run が今の PR の先頭のときだけ、PR 番号と base の SHA を渡して起動する", () => {
  const run = guard.jobs["redispatch-approval-required"].steps.map((step) => step.run ?? "").join("\n");
  assert.match(run, /pulls\?state=open&base=main&head=\$\{REPO%%\/\*\}:develop/, "open な develop→main の PR を探す");
  assert.match(run, /if \[ "\$PR_HEAD" != "\$HEAD_SHA" \]; then/, "古い先頭の承認待ちでは起動しない");
  assert.match(run, /gh workflow run pr-quality-check\.yml --repo "\$REPO" --ref develop -f pr_number="\$PR_NUMBER" -f base_sha="\$BASE_SHA"/);
});

// --- main へのマージコミットが skip 指定を含むときの本番デプロイ ---

// 見張り役の step を、gh の代わりに呼び出しを記録するだけのコマンドを置いて実際に動かす。
// gh api にはマージコミットの本文として message を返させる。
function runMergeGuard(message) {
  const job = guard.jobs["deploy-after-skip-ci-merge"];
  assert.ok(job, "マージコミットの skip 指定を見てデプロイを起動する job が無い");
  const script = job.steps.map((step) => step.run ?? "").join("\n");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-skip-ci-merge-"));
  try {
    fs.writeFileSync(path.join(dir, "message.txt"), message);
    fs.writeFileSync(
      path.join(dir, "gh"),
      '#!/usr/bin/env bash\nprintf \'%s\\n\' "$*" >> "$FAKE_GH_DIR/calls.log"\nif [ "$1" = "api" ]; then cat "$FAKE_GH_DIR/message.txt"; fi\n',
      { mode: 0o755 },
    );
    const result = spawnSync("bash", ["-e", "-c", script], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${dir}${path.delimiter}${process.env.PATH}`,
        FAKE_GH_DIR: dir,
        GH_TOKEN: "dummy",
        REPO: "owner/repo",
        PR_NUMBER: "1257",
        MERGE_SHA: "bd6f1bb358644d82b785fb923f4bd542cb1a3925",
      },
    });
    const logPath = path.join(dir, "calls.log");
    const calls = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8").trim().split("\n") : [];
    return { result, calls };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const DEPLOY_DISPATCH = "workflow run deploy-workers.yml --repo owner/repo --ref main";
const shellAvailable = process.platform !== "win32";

test("見張り役は main 向け PR の closed も受け、マージされたときだけデプロイの job を動かす", () => {
  assert.ok(guard.on.pull_request_target.types.includes("closed"), "closed を受けないとマージを知れない");
  const job = guard.jobs["deploy-after-skip-ci-merge"];
  assert.ok(job, "マージコミットの skip 指定を見てデプロイを起動する job が無い");
  assert.ok(job.if.includes("github.event.action == 'closed'"), "PR の更新では動かさない");
  assert.ok(job.if.includes("github.event.pull_request.merged == true"), "マージせず閉じた PR では動かさない");
  const step = job.steps.find((candidate) => candidate.env?.MERGE_SHA);
  assert.equal(step.env.MERGE_SHA, "${{ github.event.pull_request.merge_commit_sha }}", "PR の先頭ではなく main に入ったコミットを見る");
});

test("品質チェックの起動し直しは closed では動かない (マージ済みの PR の品質チェックを起動しない)", () => {
  assert.ok(guard.jobs.redispatch.if.includes("github.event.action != 'closed'"));
});

test("skip 判定の正規表現は 2 つの job で同じ", () => {
  const patterns = [...guardText.matchAll(/grep -qiE '([^']+)'/g)].map((match) => match[1]);
  assert.equal(patterns.length, 2);
  assert.equal(patterns[0], patterns[1]);
});

test("squash の本文に取り込んだコミットの skip 指定が並ぶと、本番デプロイを main で起動する", { skip: !shellAvailable }, () => {
  // 2026-11-13 の bd6f1bb35 の本文の形 (件名の後に、取り込んだコミットの件名が箇条書きで並ぶ)
  const message = [
    "release: 広告配置の仕上げ（市区町村・分野・調査・一覧・検索・比較）と計測の配線 (#1257)",
    "",
    "* chore(seo): record seven-day keyword observations [skip ci]",
    "",
    "* feat(areas): 市区町村のページを章立てにし、章の切れ目に記事内広告、関連記事にインフィード広告を置く",
    "",
    "Co-Authored-By: Claude <noreply@anthropic.com>",
  ].join("\n");
  const { result, calls } = runMergeGuard(message);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(calls.filter((call) => call.startsWith("api ")), [
    "api repos/owner/repo/commits/bd6f1bb358644d82b785fb923f4bd542cb1a3925 --jq .commit.message",
  ]);
  assert.deepEqual(calls.filter((call) => call.startsWith("workflow ")), [DEPLOY_DISPATCH]);
});

test("マージコミットに skip 指定が無ければ起動しない (push のデプロイと二重にしない)", { skip: !shellAvailable }, () => {
  for (const message of [
    "release: 広告配置の仕上げ (#1257)\n\n* feat(areas): 市区町村のページを章立てにする\n\n* fix: skip ci-only branch when empty",
    "Merge pull request #1257 from owner/develop\n\nrelease: 広告配置の仕上げ",
  ]) {
    const { result, calls } = runMergeGuard(message);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(calls.filter((call) => call.startsWith("workflow ")), [], message);
  }
});

test("本番デプロイは workflow_dispatch で起動でき、そのときは範囲の判定を飛ばして必ずデプロイする", () => {
  assert.ok("workflow_dispatch" in deploy.on, "deploy-workers.yml が workflow_dispatch を受けない");
  assert.ok(deploy.on.push.branches.includes("main"), "通常の push の起動は残す");
  assert.match(deployText, /if \[ "\$GITHUB_EVENT_NAME" = "workflow_dispatch" \]; then\n\s+echo "deploy=true" >> "\$GITHUB_OUTPUT"/);
});
