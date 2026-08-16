'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const {
  findPushWithoutPull,
  findPushToMain,
  auditWorkflowPushes,
  auditWorkflowMainPushes,
  auditRatchetCommitContract,
} = require('../workflow-commit-back-core.cjs');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const WORKFLOW_DIR = path.join(ROOT, '.github/workflows');

function loadWorkflows() {
  return fs
    .readdirSync(WORKFLOW_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => ({
      file: f,
      doc: yaml.load(fs.readFileSync(path.join(WORKFLOW_DIR, f), 'utf8')),
    }));
}

// ── 実ファイルに対する契約 ────────────────────────────────────────────────

test('develop へ commit-back する workflow は push の前に pull する', () => {
  const offenders = [];
  for (const { file, doc } of loadWorkflows()) {
    for (const v of auditWorkflowPushes(doc)) {
      // main 直行 push は別の未整理タスク (規約上 develop→main は PR 経由)。
      // ここでは develop への commit-back だけを守る。
      if (v.ref === 'develop') offenders.push(`${file}: ${v.step} — ${v.text}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `pull せずに push している (develop が進むと (fetch first) で必ず落ちる):\n${offenders.join('\n')}`
  );
});

test('ラチェットを持つ workflow は commit を止めず、赤は verdict で付け直す', () => {
  const problems = [];
  for (const { file, doc } of loadWorkflows()) {
    for (const p of auditRatchetCommitContract(doc)) {
      problems.push(`${file} [${p.kind}] ${p.detail}`);
    }
  }
  assert.deepEqual(problems, [], `\n${problems.join('\n')}`);
});

test('どの workflow も main へ直接 push しない (main へは PR 経由のみ)', () => {
  const offenders = [];
  for (const { file, doc } of loadWorkflows()) {
    for (const v of auditWorkflowMainPushes(doc)) {
      offenders.push(`${file}: ${v.step} — ${v.text}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `cron が main へ直接 push すると投稿/更新のたびに main/develop が分岐する ` +
      `(branch-workflow.md「main に入るものは必ず develop を先に通す」):\n${offenders.join('\n')}`
  );
});

test('blog-remediation-daily がラチェット 3 種と verdict を保持している', () => {
  const doc = yaml.load(
    fs.readFileSync(path.join(WORKFLOW_DIR, 'blog-remediation-daily.yml'), 'utf8')
  );
  const ids = doc.jobs.daily.steps.filter((s) => s.id).map((s) => s.id);
  for (const id of ['lineage_ratchet', 'value_ratchet', 'provenance_ratchet']) {
    assert.ok(ids.includes(id), `${id} が消えている (ラチェットが外された?)`);
  }
  assert.deepEqual(auditRatchetCommitContract(doc), []);
});

// ── ゲート自体の検証 (全 PASS が「何も見ていない」と区別できるように) ──────

test('[mutation] pull を消すと push-without-pull が発火する', () => {
  const bad = 'git commit -m x\ngit push origin develop\n';
  const good = 'git commit -m x\ngit pull --rebase origin develop\ngit push origin develop\n';
  assert.equal(findPushWithoutPull(bad).length, 1);
  assert.equal(findPushWithoutPull(good).length, 0);
});

test('[mutation] --autostash 付きの pull も pull として認める', () => {
  const src = 'git pull --rebase --autostash origin develop\ngit push origin develop\n';
  assert.equal(findPushWithoutPull(src).length, 0);
});

test('[mutation] --dry-run の push は対象外', () => {
  assert.equal(findPushWithoutPull('git push origin develop --dry-run\n').length, 0);
});

test('[mutation] main への push を検出する (2026-08-16 に SNS cron 4 本で実在した形)', () => {
  const bad = 'git commit -m "chore(sns): mark posted"\ngit push origin main\n';
  const found = findPushToMain(bad);
  assert.equal(found.length, 1);
  assert.equal(found[0].ref, 'main');
});

test('[mutation] develop への push は main 検査に引っかからない', () => {
  const good = 'git pull --rebase origin develop\ngit push origin develop\n';
  assert.equal(findPushToMain(good).length, 0);
});

test('[mutation] コメントアウトされた main push は検出しない', () => {
  assert.equal(findPushToMain('# git push origin main\n').length, 0);
});

test('[mutation] コメント行の pull は pull と認めない', () => {
  const src = '# git pull --rebase origin develop\ngit push origin develop\n';
  assert.equal(findPushWithoutPull(src).length, 1);
});

test('[mutation] ラチェットから continue-on-error を外すと発火する', () => {
  const doc = {
    jobs: {
      daily: {
        steps: [
          { name: 'r', id: 'value_ratchet', run: 'exit 1' },
          { name: 'commit', if: 'always()', run: 'git commit -m x' },
          {
            name: 'verdict',
            run: 'exit 1',
            env: { V: '${{ steps.value_ratchet.outcome }}' },
          },
        ],
      },
    },
  };
  const kinds = auditRatchetCommitContract(doc).map((p) => p.kind);
  assert.ok(kinds.includes('ratchet-blocks-commit'));
});

test('[mutation] commit から if: always() を外すと発火する', () => {
  const doc = {
    jobs: {
      daily: {
        steps: [
          { id: 'value_ratchet', 'continue-on-error': true, run: 'exit 1' },
          { name: 'commit', run: 'git commit -m x' },
          {
            name: 'verdict',
            run: 'exit 1',
            env: { V: '${{ steps.value_ratchet.outcome }}' },
          },
        ],
      },
    },
  };
  const kinds = auditRatchetCommitContract(doc).map((p) => p.kind);
  assert.ok(kinds.includes('commit-not-always'));
});

test('[mutation] verdict を消すと発火する (検査の無効化を防ぐ)', () => {
  const doc = {
    jobs: {
      daily: {
        steps: [
          { id: 'value_ratchet', 'continue-on-error': true, run: 'exit 1' },
          { name: 'commit', if: 'always()', run: 'git commit -m x' },
        ],
      },
    },
  };
  const kinds = auditRatchetCommitContract(doc).map((p) => p.kind);
  assert.ok(kinds.includes('missing-verdict'));
});

test('[mutation] verdict が一部のラチェットしか見ていないと発火する', () => {
  const doc = {
    jobs: {
      daily: {
        steps: [
          { id: 'a_ratchet', 'continue-on-error': true, run: 'exit 1' },
          { id: 'b_ratchet', 'continue-on-error': true, run: 'exit 1' },
          { name: 'commit', if: 'always()', run: 'git commit -m x' },
          {
            name: 'verdict',
            run: 'exit 1',
            env: { A: '${{ steps.a_ratchet.outcome }}' },
          },
        ],
      },
    },
  };
  const kinds = auditRatchetCommitContract(doc).map((p) => p.kind);
  assert.ok(kinds.includes('missing-verdict'));
});
