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
