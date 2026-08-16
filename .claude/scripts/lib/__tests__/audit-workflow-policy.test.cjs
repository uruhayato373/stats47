const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const AUDITOR = path.join(
  ROOT,
  '.claude/scripts/lib/audit-workflow-policy.cjs'
);

function run(source, args = []) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'stats47-workflow-policy-')
  );
  const auditor = path.join(
    root,
    '.claude/scripts/lib/audit-workflow-policy.cjs'
  );
  const workflow = path.join(root, '.github/workflows/test.yml');
  fs.mkdirSync(path.dirname(auditor), { recursive: true });
  fs.mkdirSync(path.dirname(workflow), { recursive: true });
  fs.copyFileSync(AUDITOR, auditor);
  fs.writeFileSync(workflow, source);
  const result = spawnSync(process.execPath, [auditor, '--json', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NODE_PATH: path.join(ROOT, 'node_modules') },
  });
  fs.rmSync(root, { recursive: true, force: true });
  return { ...result, output: JSON.parse(result.stdout) };
}

test('明示policyとSHA pinを受理する', () => {
  const result = run(`
name: test
on: { pull_request: {} }
permissions: { contents: read }
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@0123456789012345678901234567890123456789
`);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output.findings, 0);
});

test('暗黙permissions・timeout欠落・tag pinを報告する', () => {
  const result = run(`
name: test
on: { pull_request: {} }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
  const codes = result.output.details.map((finding) => finding.code);
  assert.ok(codes.includes('PERMISSIONS_IMPLICIT'));
  assert.ok(codes.includes('JOB_NO_TIMEOUT'));
  assert.ok(codes.includes('ACTION_NOT_SHA_PINNED'));
  assert.equal(result.status, 0, 'report-only must not fail');
});

test('--strictはfindingがあれば1を返す', () => {
  const result = run(
    `
name: test
on: { workflow_dispatch: {} }
jobs:
  test:
    runs-on: ubuntu-latest
    steps: []
`,
    ['--strict']
  );
  assert.equal(result.status, 1);
});

test('画像automationのforce・prefix push・best effort・専用lockを拒否する', () => {
  const result = run(`
name: image
on: { workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: image-only, cancel-in-progress: false }
jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: bad
        continue-on-error: true
        run: |
          FLAGS=(--type ranking --force)
          npx tsx apps/web/scripts/generate-ogp-images.ts "\${FLAGS[@]}"
          npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/ranking || true
`);
  const codes = result.output.details.map((finding) => finding.code);
  assert.ok(codes.includes('IMAGE_FORCE_IN_AUTOMATION'));
  assert.ok(codes.includes('IMAGE_PREFIX_PUSH'));
  assert.ok(codes.includes('IMAGE_WRITE_BEST_EFFORT'));
  assert.ok(codes.includes('R2_IMAGE_PUSH_WITHOUT_EXACT_PLAN'));
});

test('fingerprint差分 + exact plan + shared lockを受理する', () => {
  const result = run(`
name: image
on: { workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: r2-write, cancel-in-progress: false }
jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: generate
        run: npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking
      - name: publish
        run: npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts --plan .local/image-generation-publish-plan-ranking.json
`);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output.findings, 0);
});

/**
 * SCRIPT_RUN_WITHOUT_INSTALL 用。auditor は実ファイルを走査して「依存を持つスクリプト」を
 * 求めるので、workflow だけでなくスクリプト実体も一時 repo に置く必要がある。
 */
function runWithScripts(source, files, args = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-install-gate-'));
  const auditor = path.join(root, '.claude/scripts/lib/audit-workflow-policy.cjs');
  const workflow = path.join(root, '.github/workflows/test.yml');
  fs.mkdirSync(path.dirname(auditor), { recursive: true });
  fs.mkdirSync(path.dirname(workflow), { recursive: true });
  fs.copyFileSync(AUDITOR, auditor);
  fs.writeFileSync(workflow, source);
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  const result = spawnSync(process.execPath, [auditor, '--json', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NODE_PATH: path.join(ROOT, 'node_modules') },
  });
  fs.rmSync(root, { recursive: true, force: true });
  const parsed = JSON.parse(result.stdout);
  const details = (parsed.details || []).filter(
    (d) => d.code === 'SCRIPT_RUN_WITHOUT_INSTALL'
  );
  return { ...result, output: parsed, installFindings: details };
}

const WF_HEADER = `name: t
on: { workflow_dispatch: {} }
permissions: { contents: read }
jobs:
  j:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
`;

test('[mutation] 相対 import の 1 段先に外部依存があると npm ci 欠落を検出する', () => {
  // 2026-08-16 の実障害の形: entry は node: と相対 import しか持たないが、
  // 1 段先が googleapis を import する。浅い走査では捕まらない。
  const { installFindings } = runWithScripts(
    WF_HEADER +
      `      - run: node .claude/scripts/metrics/__tests__/x.test.mjs\n`,
    {
      '.claude/scripts/metrics/__tests__/x.test.mjs':
        'import test from "node:test";\nimport { f } from "../fetch.mjs";\n',
      '.claude/scripts/metrics/fetch.mjs': 'import { google } from "googleapis";\nexport const f = 1;\n',
    }
  );
  assert.equal(installFindings.length, 1, '再帰的に依存を辿って検出する');
  assert.match(installFindings[0].message, /npm ci が無い/);
});

test('[mutation] glob 指定でも展開して検出する (実障害は node --test <glob> だった)', () => {
  const { installFindings } = runWithScripts(
    WF_HEADER +
      `      - run: node --test .claude/scripts/metrics/__tests__/*.test.mjs\n`,
    {
      '.claude/scripts/metrics/__tests__/a.test.mjs': 'import { google } from "googleapis";\n',
    }
  );
  assert.equal(installFindings.length, 1, 'glob を展開しないと空振りする');
});

test('npm ci があれば検出しない', () => {
  const { installFindings } = runWithScripts(
    WF_HEADER +
      `      - run: npm ci\n` +
      `      - run: node .claude/scripts/x.mjs\n`,
    { '.claude/scripts/x.mjs': 'import { google } from "googleapis";\n' }
  );
  assert.deepEqual(installFindings, []);
});

test('依存の無いスクリプト (node: と相対のみ) は install 不要とみなす', () => {
  const { installFindings } = runWithScripts(
    WF_HEADER + `      - run: node .claude/scripts/y.mjs\n`,
    {
      '.claude/scripts/y.mjs': 'import fs from "node:fs";\nimport { z } from "./z.mjs";\n',
      '.claude/scripts/z.mjs': 'import path from "node:path";\nexport const z = 1;\n',
    }
  );
  assert.deepEqual(installFindings, [], '実在 13 workflow を誤検知しないための条件');
});

test('heredoc / echo 内の手順書きは「実行」とみなさない', () => {
  // Issue 本文に `npx tsx <path>` と書いてあるだけの workflow を誤検知しないこと。
  // 実装時に internal-link-audit-weekly / ksj-catalog-monthly の 2 本で実際に踏んだ。
  const { installFindings } = runWithScripts(
    WF_HEADER +
      `      - run: |\n` +
      `          cat <<'EOF' > /tmp/body.md\n` +
      `          npx tsx .claude/scripts/dep.ts --apply\n` +
      `          EOF\n` +
      `          echo "手順: node .claude/scripts/dep.ts"\n`,
    { '.claude/scripts/dep.ts': 'import { google } from "googleapis";\n' }
  );
  assert.deepEqual(installFindings, []);
});

test('blog画像のdirect applyを拒否し、audit-onlyはpublisher不要', () => {
  const bad = run(`
name: blog image
on: { workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: blog-only, cancel-in-progress: false }
jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --apply
`);
  const codes = bad.output.details.map((finding) => finding.code);
  assert.ok(codes.includes('IMAGE_DIRECT_APPLY'));
  assert.ok(codes.includes('R2_IMAGE_PUSH_WITHOUT_EXACT_PLAN'));

  const audit = run(`
name: blog image audit
on: { pull_request: {} }
permissions: { contents: read }
jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --audit
`);
  assert.equal(audit.status, 0, audit.stderr);
  assert.equal(audit.output.findings, 0);
});

test('画像publisherはgeneratorと同じjobの後続stepでなければならない', () => {
  const result = run(`
name: image ordering
on: { workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: r2-write, cancel-in-progress: false }
jobs:
  separate-publisher:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts --plan .local/other.json
  publisher-before-generator:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts --plan .local/before.json
      - run: npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking
  generator-with-unrelated-publisher:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx apps/web/scripts/generate-blog-thumbnails.ts --slug example
`);
  const missing = result.output.details.filter(
    (finding) => finding.code === 'R2_IMAGE_PUSH_WITHOUT_EXACT_PLAN'
  );
  assert.equal(missing.length, 2, JSON.stringify(result.output.details));
});

test('画像publisherのbest-effortとplan optionalを拒否する', () => {
  const result = run(`
name: unsafe image publisher
on: { workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: r2-write, cancel-in-progress: false }
jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking
      - name: optional plan
        continue-on-error: true
        run: |
          PLAN=.local/plan.json
          [ -f "$PLAN" ] && npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts --plan "$PLAN" || true
      - name: successful missing-plan skip
        run: |
          PLAN=.local/plan.json
          if [ ! -f "$PLAN" ]; then exit 0; fi
          npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts --plan "$PLAN"
`);
  const codes = result.output.details.map((finding) => finding.code);
  assert.ok(codes.includes('IMAGE_PUBLISH_BEST_EFFORT'));
  assert.ok(codes.includes('IMAGE_PUBLISH_PLAN_OPTIONAL'));
  assert.equal(
    codes.filter((code) => code === 'R2_IMAGE_PUSH_WITHOUT_EXACT_PLAN').length,
    0,
    JSON.stringify(result.output.details)
  );
});

test('blog SVG再生成のapp/blog prefix pushを拒否する', () => {
  const bad = run(`
name: blog svg
on: { workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: r2-write, cancel-in-progress: false }
jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx .claude/scripts/blog/generate-article-charts.ts --slug example
      - run: npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/blog
`);
  const codes = bad.output.details.map((finding) => finding.code);
  assert.ok(codes.includes('GENERATED_ASSET_PREFIX_PUSH'));
  assert.ok(codes.includes('GENERATED_ASSET_NO_EXACT_PUBLISHER'));

  const exact = run(`
name: blog svg
on: { workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: r2-write, cancel-in-progress: false }
jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - run: npx tsx .claude/scripts/blog/generate-article-charts.ts --slug example
      - run: npx tsx packages/r2-storage/src/scripts/push-exact-r2-assets.ts --key app/blog/example/chart.svg
`);
  assert.equal(exact.status, 0, exact.stderr);
  assert.equal(exact.output.findings, 0);
});
