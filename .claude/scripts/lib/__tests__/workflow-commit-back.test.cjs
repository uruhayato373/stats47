'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');
const { spawnSync } = require('node:child_process');
const { tmpdir } = require('node:os');

const {
  findPushWithoutPull,
  findPushToMain,
  auditWorkflowPushes,
  auditWorkflowMainPushes,
  auditRatchetCommitContract,
  findStalePrExistenceGuard,
  auditWorkflowPrGuards,
  findForeignTreeRestore,
  auditWorkflowForeignTreeRestores,
} = require('../workflow-commit-back-core.cjs');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const WORKFLOW_DIR = path.join(ROOT, '.github/workflows');

// 実 workflow の shell を fixture 上で実行する。R2 書込・生成・本文ゲートだけを stub 化し、
// 既知の背景不足 (20) とメタデータだけが古い背景 (21) は次の slug へ進み、未知の失敗は公開を止めることを検証する。
for (const thumbnailExit of [20, 21, 1]) {
  test(`blog publish: thumbnail exit ${thumbnailExit} の公開境界`, () => {
    const dir = fs.mkdtempSync(path.join(tmpdir(), 'stats47-blog-publish-test-'));
    try {
      const doc = yaml.load(fs.readFileSync(path.join(WORKFLOW_DIR, 'blog-auto-publish.yml'), 'utf8'));
      const step = doc.jobs['auto-publish'].steps.find((s) => s.name.includes('Gate + Stage'));
      for (const slug of ['missing', 'ready']) {
        const draft = path.join(dir, 'contents/blog', slug);
        fs.mkdirSync(draft, { recursive: true });
        fs.writeFileSync(path.join(draft, 'article.md'), '---\npublished: true\npublishedAt: 2026-09-07\n---\n本文\n');
      }
      fs.writeFileSync(path.join(dir, 'env'), '');
      fs.writeFileSync(path.join(dir, 'summary'), '');
      const stubs = `
node() { return 0; }
npx() {
  local script="$2" slug="$4"
  if [ "$2" = --tsconfig ]; then
    [ "$3" = apps/web/scripts/tsconfig.ogp.json ] || return 97
    script="$4"; slug="$6"
  fi
  case "$script" in
    *generate-blog-thumbnails.ts)
      if [ "$slug" = missing ]; then return ${thumbnailExit}; fi
      test -f "$BLOG_DIR/ready/article.md" || return 99
      mkdir -p .local
      printf '{}' > .local/image-generation-publish-plan-blog.json
      ;;
    *push-generated-image-set.ts|*diff-push-r2.ts)
      printf '%s\\n' "$*" >> "$PUBLISH_LOG"
      ;;
    *) return 98 ;;
  esac
}
`;
      const result = spawnSync('bash', ['-e', '-c', stubs + step.run.replaceAll('${{ steps.detect.outputs.slugs }}', 'missing ready')], {
        cwd: dir,
        encoding: 'utf8',
        env: { ...process.env, TARGET_SLUGS: 'missing ready', GITHUB_ENV: path.join(dir, 'env'), GITHUB_STEP_SUMMARY: path.join(dir, 'summary'), PUBLISH_LOG: path.join(dir, 'published') },
      });
      const skips = thumbnailExit === 20 || thumbnailExit === 21;
      assert.equal(result.status, skips ? 0 : 1, result.stdout + result.stderr);
      // 末尾の app/blog 一括 sync にも未完成記事を混入させない。
      assert.equal(fs.existsSync(path.join(dir, '.local/r2/app/blog/missing')), false);
      if (skips) {
        assert.match(fs.readFileSync(path.join(dir, 'published'), 'utf8'), /--prefix app\/blog\/ready/);
        assert.match(fs.readFileSync(path.join(dir, 'env'), 'utf8'), /PUBLISHED= ready/);
        assert.match(fs.readFileSync(path.join(dir, 'env'), 'utf8'), /SKIPPED= missing/);
        assert.match(fs.readFileSync(path.join(dir, 'summary'), 'utf8'), thumbnailExit === 20 ? /missing.*背景未生成/ : /missing.*背景のメタデータが古い/);
      } else {
        assert.equal(fs.existsSync(path.join(dir, 'published')), false);
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

// ── ブログの公開と snapshot の同期は、記事台帳・ページの索引・指標の逆引きまで書き戻す ──────────
// (BLOG-LEDGER-PUBLISH-SYNC-01) 公開の書き戻しが known-tag-keys だけを進めると data/content/pages/tag.json と
// 食い違い、develop の content:check が落ちた (2026-11-13)。ページの索引を進めて逆引きを作り直さないと
// metrics:check も落ちる。実 workflow の shell を、origin を持つ fixture の git リポジトリで実行して確かめる。

// git hook の中でテストが走ると GIT_DIR / GIT_INDEX_FILE が引き継がれ、fixture ではなく本体の索引を触る。
// 利用者の署名設定や hook も持ち込まない。
function isolatedGitEnv(extra) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  return { ...env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', ...extra };
}

function makeWritebackFixture(files) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'stats47-writeback-test-'));
  const work = path.join(dir, 'work');
  const git = (cwd, ...args) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8', env: isolatedGitEnv() });
    assert.equal(result.status, 0, `git ${args.join(' ')}\n${result.stdout}${result.stderr}`);
    return result.stdout;
  };
  fs.mkdirSync(work);
  git(dir, 'init', '-q', '--bare', '-b', 'develop', 'origin.git');
  git(work, 'init', '-q', '-b', 'develop');
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(work, file)), { recursive: true });
    fs.writeFileSync(path.join(work, file), '初期\n');
  }
  git(work, 'add', '.');
  git(work, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-q', '-m', 'init');
  git(work, 'remote', 'add', 'origin', path.join(dir, 'origin.git'));
  git(work, 'push', '-q', 'origin', 'develop');
  return {
    dir,
    work,
    /** origin の develop の先頭コミットが変えたファイル。書き戻しが push まで届いたことも同時に確かめる */
    pushedFiles: () =>
      git(path.join(dir, 'origin.git'), 'show', '--name-only', '--format=', 'develop').split('\n').filter(Boolean).sort(),
    originHead: () => git(path.join(dir, 'origin.git'), 'rev-parse', 'develop').trim(),
  };
}

const BLOG_LEDGER = 'data/blog/ledger/articles.json';
const CONTENT_INDEX = ['data/content/entities.json', 'data/content/pages/blog.json', 'data/content/pages/tag.json'];
const METRIC_INDEX = 'data/metrics/index/linkage-000.json';
const TAG_KEYS = 'apps/web/src/config/known-tag-keys.ts';
const SITEMAP_BLOG = 'apps/web/src/config/sitemap-blog-entries.ts';
// content:sync は SNS の投稿台帳から作る外部公開物の索引も書く。書き戻しには含めないので作業ツリーに残る
const EXTERNAL_INDEX = 'data/content/external.json';

// 生成器の stub。content:sync は実物と同じ順 (台帳 → ページの索引) で書き、FAIL=content なら台帳を書いた後で落ちる。
const DERIVED_GENERATOR_STUBS = `
node() { return 0; }
npx() {
  printf 'npx %s\\n' "$*" >> "$CALL_LOG"
  case "$2" in
    scripts/generate-sitemap-blog-entries.ts) echo 'sitemap を作り直した' >> src/config/sitemap-blog-entries.ts ;;
    scripts/generate-known-tag-keys.ts) echo 'タグのキーを作り直した' >> src/config/known-tag-keys.ts ;;
    *) return 98 ;;
  esac
}
npm() {
  printf 'npm %s [NODE_OPTIONS=%s]\\n' "$*" "\${NODE_OPTIONS:-}" >> "$CALL_LOG"
  case "$*" in
    'run content:sync -- --from-r2')
      grep -q 'タグのキーを作り直した' ${TAG_KEYS} || return 96
      echo '台帳を進めた' >> ${BLOG_LEDGER}
      if [ "$FAIL" = content ]; then return 1; fi
      for f in ${CONTENT_INDEX.join(' ')} ${EXTERNAL_INDEX}; do echo '索引を進めた' >> "$f"; done
      ;;
    'run metrics:build-index')
      if [ "$FAIL" = index ]; then return 1; fi
      grep -q '索引を進めた' data/content/pages/blog.json || return 95
      echo '逆引きを作り直した' >> ${METRIC_INDEX}
      ;;
    *) return 98 ;;
  esac
}
`;

function runBlogCleanupStep(fail) {
  const fixture = makeWritebackFixture([
    'contents/blog/ready/article.md',
    TAG_KEYS,
    SITEMAP_BLOG,
    BLOG_LEDGER,
    ...CONTENT_INDEX,
    EXTERNAL_INDEX,
    METRIC_INDEX,
  ]);
  const doc = yaml.load(fs.readFileSync(path.join(WORKFLOW_DIR, 'blog-auto-publish.yml'), 'utf8'));
  const step = doc.jobs['auto-publish'].steps.find((s) => s.name.includes('Remove published drafts'));
  const before = fixture.originHead();
  const result = spawnSync('bash', ['-e', '-c', DERIVED_GENERATOR_STUBS + step.run], {
    cwd: fixture.work,
    encoding: 'utf8',
    env: isolatedGitEnv({ PUBLISHED: ' ready', FAIL: fail, CALL_LOG: path.join(fixture.dir, 'calls') }),
  });
  const calls = fs.existsSync(path.join(fixture.dir, 'calls')) ? fs.readFileSync(path.join(fixture.dir, 'calls'), 'utf8') : '';
  return { fixture, result, before, calls, output: result.stdout + result.stderr };
}

test('blog publish: 書き戻しが記事台帳・ページの索引・指標の逆引きを同じコミットで進める', () => {
  const { fixture, result, before, calls, output } = runBlogCleanupStep('');
  try {
    assert.equal(result.status, 0, output);
    // R2 の一覧を読む経路は server 専用の module を通るので react-server の条件が要る
    assert.match(calls, /npm run content:sync -- --from-r2 \[NODE_OPTIONS=.*--conditions react-server/, calls);
    // 書き戻しに含めない生成物が作業ツリーに残っていても push まで届く (pull --rebase は汚れた作業ツリーで止まる)
    assert.notEqual(fixture.originHead(), before, `書き戻しが origin に届いていない\n${output}`);
    assert.deepEqual(
      fixture.pushedFiles(),
      [SITEMAP_BLOG, TAG_KEYS, 'contents/blog/ready/article.md', BLOG_LEDGER, ...CONTENT_INDEX, METRIC_INDEX].sort(),
      output
    );
  } finally {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('blog publish: 索引の作り直しが途中で落ちても、書きかけの台帳を載せずに outbox の掃除は書き戻す', () => {
  const { fixture, result, calls, output } = runBlogCleanupStep('content');
  try {
    assert.equal(result.status, 0, output);
    assert.match(output, /::warning::.*索引/);
    assert.doesNotMatch(calls, /metrics:build-index/, 'ページの索引が進んでいないのに逆引きを作り直している');
    assert.deepEqual(fixture.pushedFiles(), [SITEMAP_BLOG, TAG_KEYS, 'contents/blog/ready/article.md'].sort(), output);
  } finally {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('blog publish: 逆引きの作り直しだけが落ちたら、台帳と索引は書き戻して逆引きの失敗を知らせる', () => {
  const { fixture, result, output } = runBlogCleanupStep('index');
  try {
    assert.equal(result.status, 0, output);
    assert.match(output, /::warning::.*逆引き/);
    assert.deepEqual(
      fixture.pushedFiles(),
      [SITEMAP_BLOG, TAG_KEYS, 'contents/blog/ready/article.md', BLOG_LEDGER, ...CONTENT_INDEX].sort(),
      output
    );
  } finally {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('sync-snapshots: ページの索引を作り直した後に指標の逆引きも作り直し、逆引きだけの差分も develop へ書き戻す', () => {
  const doc = yaml.load(fs.readFileSync(path.join(WORKFLOW_DIR, 'sync-snapshots.yml'), 'utf8'));
  const steps = doc.jobs['sync-ranking-keys'].steps;
  const regenerate = steps.find((s) => String(s.name).includes('Regenerate known')).run;
  const contentSyncAt = regenerate.indexOf('npm run content:sync -- --from-r2');
  assert.ok(contentSyncAt >= 0, 'content:sync が無い');
  assert.ok(
    regenerate.indexOf('npm run metrics:build-index') > contentSyncAt,
    'ページの索引を作り直した後に metrics:build-index を呼んでいない (記事の指標が変わった回の後で metrics:check が落ちる)'
  );

  const keyFiles = [
    'packages/ranking/src/config/known-ranking-keys.ts',
    'apps/web/src/config/sitemap-ranking-keys.ts',
    TAG_KEYS,
    'apps/web/src/config/unpublished-blog-slugs.ts',
    SITEMAP_BLOG,
  ];
  const fixture = makeWritebackFixture([
    ...keyFiles,
    BLOG_LEDGER,
    ...CONTENT_INDEX,
    'packages/data-configs/src/prominence/ranking-prominence.generated.ts',
    METRIC_INDEX,
  ]);
  try {
    const before = fixture.originHead();
    fs.appendFileSync(path.join(fixture.work, METRIC_INDEX), '逆引きを作り直した\n');
    fs.writeFileSync(path.join(fixture.dir, 'summary'), '');
    const record = steps.find((s) => String(s.name).includes('Record keys on develop'));
    const result = spawnSync('bash', ['-e', '-c', record.run], {
      cwd: fixture.work,
      encoding: 'utf8',
      env: isolatedGitEnv({ GITHUB_STEP_SUMMARY: path.join(fixture.dir, 'summary') }),
    });
    const output = result.stdout + result.stderr;
    assert.equal(result.status, 0, output);
    assert.notEqual(fixture.originHead(), before, `逆引きだけの差分が書き戻されていない\n${output}`);
    assert.deepEqual(fixture.pushedFiles(), [METRIC_INDEX], output);
  } finally {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  }
});

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

// ブログ是正キューのラチェット 3 種は、2026-10-26 に週次レビューへ移した台本 blog-remediation.sh が持つ
// (.claude/scripts/management/__tests__/weekly-audits.test.mjs)。

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

// ── PR 存在判定 (gh pr view は CLOSED も拾う) ──────────────────────────────

test('PR の存在判定に gh pr view を使わない (CLOSED を拾って PR が二度と作られない)', () => {
  const offenders = [];
  for (const { file, doc } of loadWorkflows()) {
    for (const v of auditWorkflowPrGuards(doc)) {
      offenders.push(`${file}: ${v.step} — ${v.text}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `gh pr view は CLOSED / MERGED も exit 0 で拾うため存在判定に使えない。\n` +
      `gh pr list --head "$B" --state open --json number --jq 'length' を使う:\n` +
      offenders.join('\n'),
  );
});

// ── ゲート自体の検証 ──────────────────────────────────────────────────────

test('[mutation] 旧バグ形 (if ! gh pr view) を検出する — 2026-08-18 に sync-snapshots で実在した形', () => {
  const run = [
    'BRANCH="chore/ranking-keys-sync"',
    'git push -f origin "$BRANCH"',
    'if ! gh pr view "$BRANCH" --json number >/dev/null 2>&1; then',
    '  gh pr create --base main --head "$BRANCH" --title t --body b || true',
    'fi',
  ].join('\n');
  const found = findStalePrExistenceGuard(run);
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 3);
});

test('[mutation] 修正形 (gh pr list --state open) は違反にしない', () => {
  const run = [
    'OPEN_PRS=$(gh pr list --head "$BRANCH" --state open --json number --jq \'length\')',
    'if [ "$OPEN_PRS" -eq 0 ]; then',
    '  gh pr create --base main --head "$BRANCH" --title t --body b || true',
    'fi',
  ].join('\n');
  assert.deepEqual(findStalePrExistenceGuard(run), []);
});

test('[mutation] コメント内の gh pr view は検出しない', () => {
  const run = '          # ★gh pr view "$BRANCH" は CLOSED も拾うので使わない';
  assert.deepEqual(findStalePrExistenceGuard(run), []);
});

test('[mutation] 読み取り目的の gh pr view (代入) は検出しない', () => {
  const run = 'NUM=$(gh pr view "$BRANCH" --json number -q .number)';
  assert.deepEqual(findStalePrExistenceGuard(run), []);
});

// ── 別 ref の作業ツリーで develop を上書きしない (2026-10-04 e45f5a0ee) ─────────

test('develop へ切り替えた後に、退避した別 ref のファイルをコピーで戻さない', () => {
  const offenders = [];
  for (const { file, doc } of loadWorkflows()) {
    for (const v of auditWorkflowForeignTreeRestores(doc)) {
      offenders.push(`${file}: ${v.step} — ${v.text}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `退避元は develop ではない作業ツリーなので、develop に先行する他 workflow の更新を古い版で巻き戻す。\n` +
      `develop を checkout してその上で生成する:\n${offenders.join('\n')}`
  );
});

test('共有 state を書く計測 workflow は develop を checkout して、その上で生成する', () => {
  // PSI と URL 検査は 2026-10-26 から fetch-metrics-weekly.yml の job (checkout が job ごとにある)
  for (const file of ['fetch-metrics-weekly.yml', 'cloudflare-usage-daily.yml']) {
    const doc = yaml.load(fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8'));
    const refs = Object.values(doc.jobs).flatMap((job) =>
      (job.steps || [])
        .filter((s) => String(s.uses || '').startsWith('actions/checkout@'))
        .map((s) => s.with && s.with.ref)
    );
    assert.ok(refs.length > 0, `${file}: checkout が無い`);
    assert.deepEqual([...new Set(refs)], ['develop'], `${file}: checkout ref が develop ではない`);
  }
});

// 2026-10-04 まで fetch-metrics-weekly にあった形 (退避 step と切替 step が別)。
const LEGACY_FETCH_METRICS = [
  'mkdir -p /tmp/metrics-publish/state\ncp -r .claude/state/metrics/. /tmp/metrics-publish/state 2>/dev/null || true\n',
  [
    'git reset --hard HEAD',
    'git clean -fd',
    'git fetch origin develop',
    'git checkout develop',
    'git pull --rebase origin develop',
    'mkdir -p .claude/state/metrics',
    'cp -r /tmp/metrics-publish/state/. .claude/state/metrics/ 2>/dev/null || true',
  ].join('\n'),
];

test('[mutation] 旧 fetch-metrics-weekly の退避→切替→上書きコピーを検出する', () => {
  const found = findForeignTreeRestore(LEGACY_FETCH_METRICS);
  assert.equal(found.length, 1);
  assert.equal(found[0].stepIndex, 1);
  assert.match(found[0].text, /\/tmp\/metrics-publish\/state/);
});

test('[mutation] 切替と復元が別 step でも検出する (退避先が $RUNNER_TEMP でも同じ)', () => {
  const found = findForeignTreeRestore([
    'git checkout develop\ngit pull --rebase origin develop\n',
    'cp -r "$RUNNER_TEMP/psi-publish/"* data/psi/\n',
  ]);
  assert.equal(found.length, 1);
  assert.equal(found[0].stepIndex, 1);
});

test('[mutation] 旧 deploy-workers の improvement-log 書き戻しを検出する', () => {
  const run = [
    'cp "$f" "/tmp/improvement-log-stash/$f"',
    'git checkout -- .claude/skills/analytics/',
    'git fetch origin develop',
    'git checkout develop',
    'cp -r /tmp/improvement-log-stash/.claude/* .claude/ 2>/dev/null || true',
  ].join('\n');
  assert.equal(findForeignTreeRestore([run]).length, 1);
});

test('[mutation] develop を checkout して生成する形は違反にしない', () => {
  const run = 'npm run psi-audit:digest\ngit add data/psi\ngit commit -m x\ngit pull --rebase --autostash origin develop\ngit push origin develop\n';
  assert.deepEqual(findForeignTreeRestore([run]), []);
});

test('[mutation] 作業ツリーを持ったまま切り替える形 (sns-metrics-weekly) は違反にしない', () => {
  const run = 'git fetch origin develop\ngit checkout develop\ngit pull --rebase origin develop\ngit add "$SNAPSHOT_DIR"\n';
  assert.deepEqual(findForeignTreeRestore([run]), []);
});

test('[mutation] 切替後に /tmp へ書き出すコピーと、切替前の復元は違反にしない', () => {
  assert.deepEqual(findForeignTreeRestore(['git checkout develop\ncp report.md /tmp/report/\n']), []);
  assert.deepEqual(findForeignTreeRestore(['cp -r /tmp/cache/. .local/\ngit checkout develop\n']), []);
});

test('[mutation] パス単位の checkout とコメント行は切替と見なさない', () => {
  assert.deepEqual(findForeignTreeRestore(['git checkout develop -- package.json\ncp /tmp/x/a .claude/a\n']), []);
  assert.deepEqual(findForeignTreeRestore(['# git checkout develop\ncp /tmp/x/a .claude/a\n']), []);
  assert.equal(findForeignTreeRestore(['git checkout develop\n# cp /tmp/x/a .claude/a\ncp /tmp/x/a .claude/a\n']).length, 1);
});

// CI artifact は「読み手が要る間だけ」置く。retention 未指定は GitHub 既定の 90 日で、
// 誰も読まない検証出力が四半期残る。上限 30 日、それを超える例外は理由付きで allowlist に置く。
const ARTIFACT_RETENTION_MAX_DAYS = 30;
const ARTIFACT_RETENTION_ALLOWLIST = {
  'pr-quality-check.yml': { 'coverage-report': 90 }, // coverage 推移を四半期で比較する
};

function collectArtifactUploads(workflowFile, dir = WORKFLOW_DIR) {
  const doc = yaml.load(fs.readFileSync(path.join(dir, workflowFile), 'utf8'));
  const uploads = [];
  for (const job of Object.values(doc.jobs ?? {})) {
    for (const step of job.steps ?? []) {
      if (!String(step.uses ?? '').startsWith('actions/upload-artifact@')) continue;
      uploads.push({ name: step.with?.name ?? '(unnamed)', retention: step.with?.['retention-days'] });
    }
  }
  return uploads;
}

function auditArtifactRetention(dir, allowlist = ARTIFACT_RETENTION_ALLOWLIST) {
  const violations = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
    for (const upload of collectArtifactUploads(file, dir)) {
      const allowed = allowlist[file]?.[upload.name];
      if (upload.retention === undefined) violations.push(`${file}: ${upload.name} retention-days 未指定`);
      else if (Number(upload.retention) > (allowed ?? ARTIFACT_RETENTION_MAX_DAYS))
        violations.push(`${file}: ${upload.name} retention-days=${upload.retention}`);
    }
  }
  return violations;
}

test('upload-artifact は retention-days を明示し 30 日以内に収める (allowlist 以外)', () => {
  assert.deepEqual(auditArtifactRetention(WORKFLOW_DIR), []);
});

test('[mutation] retention 未指定と 31 日超を検出する', () => {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'stats47-artifact-retention-'));
  const original = WORKFLOW_DIR;
  const file = path.join(dir, 'probe.yml');
  fs.writeFileSync(
    file,
    [
      'jobs:',
      '  a:',
      '    steps:',
      '      - uses: actions/upload-artifact@v7',
      '        with:',
      '          name: no-retention',
      '      - uses: actions/upload-artifact@v7',
      '        with:',
      '          name: too-long',
      '          retention-days: 31',
      '      - uses: actions/upload-artifact@v7',
      '        with:',
      '          name: fine',
      '          retention-days: 7',
    ].join('\n')
  );
  assert.deepEqual(auditArtifactRetention(dir, {}), [
    'probe.yml: no-retention retention-days 未指定',
    'probe.yml: too-long retention-days=31',
  ]);
  // allowlist に載せた組だけが上限を超えられる
  assert.deepEqual(auditArtifactRetention(dir, { 'probe.yml': { 'too-long': 31 } }), [
    'probe.yml: no-retention retention-days 未指定',
  ]);
  fs.rmSync(dir, { recursive: true, force: true });
  assert.equal(WORKFLOW_DIR, original);
});

