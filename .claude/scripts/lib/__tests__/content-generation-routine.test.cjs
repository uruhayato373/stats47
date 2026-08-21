/**
 * コンテンツ公開まわりの workflow 契約テスト。
 *
 * ★スコープ変更 (2026-08-21): 元は `ai-content-generate-daily.yml` /
 *   `blog-generate-daily.yml` という **Claude Code を CI で無人実行する日次生成ループ**の
 *   契約を固定するファイルだった。この 2 つは削除した。理由は歩留まりで、限界まで測った結果
 *   08-15〜08-18 は limit 5 に対し 5/5 出ていたのが 08-19 に 0/5 ($87.31)、08-20 に 1/5 ($21.33)
 *   まで落ちた。無人ループは対話セッションと同じ Pro/Max 利用枠を食うため、成果が出ない
 *   まま枠だけ削る形になっていた。生成の量と時期は月次計画で決めて週次で割り当てる運用へ移し、
 *   生成そのものは対話セッションが行う (`/generate-ai-content` / `/write-prepared-article`)。
 *
 * ★ここに残っているのは**削除後も生きている経路**だけ:
 *   - request file を push で受ける workflow が、結果によらず request を消費すること
 *   - `data-refresh.yml` が request 無しの push で何もしないこと
 *   - `blog-auto-publish.yml` の reconcile が改稿版も拾うこと
 *   - 実行サマリが未完了の background agent を名指しすること (backlog-loop が使い続ける)
 *
 * ファイル名と `npm run test:content-routines` は変えていない。残る対象も publish 側の
 * content routine で、CI step から参照されているため改名の利得が小さい。
 */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('data-refresh does nothing when a push carries no request file', () => {
  const doc = YAML.parse(read('.github/workflows/data-refresh.yml'));
  const step = doc.jobs.refresh.steps.find((s) => s.id === 'resolve');
  assert.ok(step?.run, 'resolve step が読めない');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-refresh-resolve-'));
  try {
    const outFile = path.join(dir, 'gh-output');
    fs.writeFileSync(outFile, '');
    // request file は置かない (削除 commit の再現)
    const stdout = execFileSync('bash', ['-c', step.run], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        EVENT_NAME: 'push',
        INPUT_METRIC: '',
        INPUT_SINCE: '',
        INPUT_ALLOW_EMPTY: '',
        INPUT_DRY_RUN: '',
        GITHUB_OUTPUT: outFile,
      },
    });
    const outputs = fs.readFileSync(outFile, 'utf8');
    assert.match(outputs, /^skip=true$/m, `request なし push で skip=true にならない: ${stdout}`);
    assert.doesNotMatch(
      outputs,
      /^dry_run=$/m,
      'dry_run が空のまま出力されている (実 push 扱いになる)',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // 本体ステップが skip ガードを持たないと、上の skip=true が意味を持たない
  for (const name of ['📊 page-data-batch (e-Stat fetch)', '☁️ Push observations to R2 (app/stats)']) {
    const s = doc.jobs.refresh.steps.find((x) => x.name === name);
    assert.ok(s, `${name} が見つからない`);
    assert.match(
      String(s.if ?? ''),
      /steps\.resolve\.outputs\.skip != 'true'/,
      `${name}: skip ガードが無い`,
    );
  }
});

/**
 * push トリガーで動く workflow は、request file を **結果によらず** 消費しなければならない。
 * 成功時しか消費しないと、失敗 run の request が develop に残り、同内容を再 push しても
 * diff が出ず paths フィルタに掛からなくなる (2026-07-31 の data-refresh で 3 日間発生)。
 */
test('every request-driven workflow consumes its request even when the run fails', () => {
  for (const workflow of [
    '.github/workflows/data-refresh.yml',
    '.github/workflows/gemini-image-run.yml',
  ]) {
    const source = read(workflow);
    const at = source.indexOf('Consume');
    assert.ok(at !== -1, `${workflow}: consume step が無い`);
    const step = source.slice(at, at + 1600);
    assert.match(
      step,
      /if:\s*\$\{\{\s*always\(\)\s*&&/,
      `${workflow}: consume が always() でない (失敗 run で request が残る)`,
    );
    assert.match(
      step,
      /git rm -q --ignore-unmatch/,
      `${workflow}: request が既に無い場合に consume 自体が落ちる`,
    );
    assert.match(step, /::error::/, `${workflow}: consume 失敗を握り潰している`);
  }
});

// backlog-loop-daily が同じ実行サマリを使うため、日次生成ループを消しても検査は要る。
test('the execution summarizer names unfinished background agents', () => {
  const source = read('.claude/scripts/lib/summarize-claude-execution.mjs');
  assert.match(source, /unfinishedAgents/);
  assert.match(source, /run_in_background: false/);
});

// blog-auto-publish の reconcile は「未公開」だけでなく「改稿版 (既 live の brushup 済み)」も
// 拾わなければならない。2026-08-03 まで all.json 未掲載だけを見ており、pruner が内容差分で
// 正しく保持する一方で publish が永久に選ばないため、改稿版が outbox に滞留していた。
// ブログ是正ループの出力は全てこの経路を通る。
test('blog auto-publish reconciles revised articles, not just unpublished ones', () => {
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/blog-auto-publish.yml'), 'utf8');

  assert.match(
    wf,
    /select-republish-slugs\.mjs/,
    'reconcile が共有セレクタを使っていない',
  );
  assert.doesNotMatch(
    wf,
    /!live\.has\(/,
    '「all.json 未掲載のみ」の旧判定が残っている (改稿版を拾えない)',
  );

  // セレクタと pruner は同じ判定モジュールを使うこと。片方だけズレると
  // 「消されないが出もしない」記事が生まれる。
  for (const rel of [
    '.claude/scripts/blog/select-republish-slugs.mjs',
    '.claude/scripts/blog/prune-published-outbox.mjs',
  ]) {
    assert.match(
      fs.readFileSync(path.join(ROOT, rel), 'utf8'),
      /lib\/outbox-r2\.mjs/,
      `${rel} が共有判定モジュールを使っていない`,
    );
  }
});
