const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const ACTION_SHA = 'e257d767763882223c40b615cbbe0d26ca75a981';

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assertOrdered(source, labels) {
  let previous = -1;
  for (const label of labels) {
    const current = source.indexOf(label);
    assert.ok(current > previous, `${label} must appear in routine order`);
    previous = current;
  }
}

// Bash の許可パターンは「末尾 * のプレフィックス一致」しか効かない。途中に * を置くと
// 実コマンドに一致せず Bash が 1 つも通らない = routine が何も検証できないまま空振りする
// (2026-08-03 に ai-content が 2 晩連続で denials 14・生成 0 件・$10.94 を消費した)。
// workflow 側は成功/失敗が翌朝まで分からないので、ここで形だけ機械的に固定する。
function extractAllowedBashPatterns(source) {
  const line = source.split('\n').find((l) => l.includes('--allowedTools'));
  assert.ok(line, '--allowedTools must be present');
  return [...line.matchAll(/Bash\(([^)]*)\)/g)].map((m) => m[1]);
}

function assertBashAllowlistIsPrefixMatchable(source) {
  const patterns = extractAllowedBashPatterns(source);
  assert.ok(patterns.length > 0, 'routine must allow at least one Bash command');
  for (const pattern of patterns) {
    const wildcard = pattern.indexOf('*');
    if (wildcard === -1) continue; // 引数なしの完全一致は有効
    assert.equal(
      wildcard,
      pattern.length - 1,
      `Bash allowlist pattern must end with * (mid-string * never matches): Bash(${pattern})`
    );
  }
}

function assertClaudeRoutine(source, promptFile) {
  assert.doesNotThrow(() => YAML.parse(source));
  assert.match(
    source,
    new RegExp(
      `anthropics/claude-code-base-action@${ACTION_SHA}`
    )
  );
  assert.match(source, /claude_code_oauth_token:.*CLAUDE_CODE_OAUTH_TOKEN/);
  assert.match(source, /show_full_output: "false"/);
  assert.match(source, new RegExp(`prompt_file: ${promptFile.replaceAll('.', '\\.')}`));
  assert.match(source, /--setting-sources project/);
  assert.match(source, /"disableAllHooks": true/);
  assert.match(source, /--tools "Read,Write,Edit,Glob,Grep,Agent,Skill,Bash"/);
  assert.doesNotMatch(source, /Glob,Grep,Task,/);
  assertBashAllowlistIsPrefixMatchable(source);
  assert.match(source, /--strict-mcp-config/);
  assert.match(source, /--mcp-config '\{"mcpServers":\{\}\}'/);
  assert.match(source, /steps\.claude\.outputs\.execution_file/);
  assert.match(source, /\.input\.subagent_type == \$agent/);
  assert.match(source, /対象あり・生成物なし|対象あり・article\.mdなし/);
  assert.match(source, /steps\.verify\.outputs\.count != '0'/);
}

test('AI-content routine invokes Claude before deterministic verification and publish', () => {
  const source = read('.github/workflows/ai-content-generate-daily.yml');
  assertClaudeRoutine(source, '.claude/prompts/ci/ai-content-routine.md');
  assertOrdered(source, [
    'Rebuild queue, pick targets, and prepare prompts',
    'Generate and review AI content with Claude Code',
    'Verify target completeness, audit, and critic PASS',
    'Rebuild queue (progress) and commit',
    'Dispatch publish-ai-content',
  ]);
  assert.match(source, /audit-ai-content\.mjs --file/);
  assert.match(source, /critic PASS manifest/);
});

test('blog routine invokes Claude before deterministic verification and publish', () => {
  const source = read('.github/workflows/blog-generate-daily.yml');
  assertClaudeRoutine(source, '.claude/prompts/ci/blog-routine.md');
  assertOrdered(source, [
    'Prepare articles',
    'Write and review articles with Claude Code',
    'Verify target completeness, gates, and critic PASS',
    'Commit outbox and push',
    'Dispatch blog-auto-publish',
  ]);
  assert.match(source, /article-factual-check\.mjs/);
  assert.match(source, /quality-gate\.mjs/);
  assert.match(source, /\^verdict:\[\[:space:\]\]\*PASS/);
  assert.doesNotMatch(source, /今日の執筆対象を Issue に出す/);
});

// 2026-08-02 run 30769885097 で実測: キュー再構築 step が tracked な state を書き換えるため
// 作業ツリーが汚れ、consume の `git pull --rebase` が
// "cannot pull with rebase: You have unstaged changes" で落ちて request が消費されずに残った。
// 残ると同内容の再 push が paths フィルタで発火しなくなるので、退避を不変条件として固定する。
test('both routines stash the dirty tree before rebasing to consume the request', () => {
  for (const workflow of [
    '.github/workflows/ai-content-generate-daily.yml',
    '.github/workflows/blog-generate-daily.yml',
  ]) {
    const source = read(workflow);
    const consume = source.slice(source.indexOf('Consume request'));
    assert.ok(consume.length > 0, `${workflow}: consume step が無い`);
    const stashAt = consume.indexOf('git stash push');
    const rebaseAt = consume.indexOf('git pull --rebase');
    assert.ok(stashAt !== -1, `${workflow}: consume が rebase 前に stash していない`);
    assert.ok(
      stashAt < rebaseAt,
      `${workflow}: stash は git pull --rebase より前でなければならない`,
    );
  }
});

/**
 * verify step の「許可外変更」チェックを、workflow から実物を抜き出して temp git repo で走らせる。
 * grep ではなく実挙動で見るのは、git の path quoting が絡む欠陥だったため
 * (パターン文字列だけ見ても正しく見えてしまう)。
 */
function extractAllowlistGate(source) {
  const errorAt = source.indexOf('::error::Claude routine の許可外変更');
  assert.ok(errorAt !== -1, '許可外変更チェックが無い');
  const caseAt = source.lastIndexOf('case "$FILE" in', errorAt);
  const patternLine = source
    .slice(caseAt, errorAt)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.endsWith(') ;;'));
  assert.ok(patternLine, '許可パターン行が読めない');
  const doneAt = source.indexOf('done < <(', errorAt);
  const command = source.slice(doneAt + 'done < <('.length, source.indexOf('\n', doneAt)).trim();
  assert.ok(command.endsWith(')'), 'done < <(...) が読めない');
  return { patterns: patternLine.replace(/\)\s*;;$/, ''), command: command.slice(0, -1) };
}

function runAllowlistGate({ patterns, command }, sampleFile) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'allowlist-gate-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: dir });
    fs.mkdirSync(path.join(dir, path.dirname(sampleFile)), { recursive: true });
    fs.writeFileSync(path.join(dir, sampleFile), 'x');
    const script = [
      'while IFS= read -r FILE; do',
      '  case "$FILE" in',
      `    ${patterns}) ;;`,
      '    *) echo "REJECT:${FILE}"; exit 1 ;;',
      '  esac',
      `done < <(${command})`,
      'echo ALLOW',
    ].join('\n');
    return execFileSync('bash', ['-c', script], { cwd: dir, encoding: 'utf8' }).trim();
  } catch (error) {
    return (error.stdout || '').trim() || 'ERROR';
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('both routines accept files they are supposed to produce', () => {
  for (const { workflow, sample } of [
    {
      workflow: '.github/workflows/ai-content-generate-daily.yml',
      sample: 'data/ai-content-staging/sample-metric.json',
    },
    {
      workflow: '.github/workflows/blog-generate-daily.yml',
      // 非 ASCII を含む出力先。git の既定 (core.quotepath=true) では 8 進エスケープされ、
      // 許可パターンに一致しなくなる (2026-08-03 run 30776544300 の実障害)。
      sample: 'docs/21_ブログ記事原稿/sample-slug/data/sample-scatter.svg',
    },
  ]) {
    const gate = extractAllowlistGate(read(workflow));
    assert.equal(
      runAllowlistGate(gate, sample),
      'ALLOW',
      `${workflow}: 自分が生成するはずのファイル (${sample}) を reject している`,
    );
  }
});

test('the allowlist gate test is sensitive to losing core.quotepath=false', () => {
  const gate = extractAllowlistGate(read('.github/workflows/blog-generate-daily.yml'));
  const withoutFix = { ...gate, command: gate.command.replace(/-c core\.quotepath=false\s*/, '') };
  assert.notEqual(
    withoutFix.command,
    gate.command,
    'blog routine が core.quotepath=false を指定していない',
  );
  assert.match(
    runAllowlistGate(withoutFix, 'docs/21_ブログ記事原稿/sample-slug/article.md'),
    /^REJECT:/,
    '指定を外しても通ってしまう = 上のテストが挙動を見ていない',
  );
});

/**
 * 件数を上げた判断を実測で検証できるよう、両 routine は run ごとのトークン実績を残す。
 * 失敗 run こそ知りたい (利用枠に当たったか) ので always()、
 * 計測が本体の成否を左右してはいけないので continue-on-error。
 */
test('both routines record token usage without gating the run', () => {
  for (const { workflow, expected } of [
    { workflow: '.github/workflows/ai-content-generate-daily.yml', expected: 'ai-content' },
    { workflow: '.github/workflows/blog-generate-daily.yml', expected: 'blog' },
  ]) {
    const doc = YAML.parse(read(workflow));
    const step = doc.jobs.generate.steps.find((s) => s.name === '📊 Record token usage');
    assert.ok(step, `${workflow}: トークン記録 step が無い`);
    assert.match(String(step.if ?? ''), /always\(\)/, `${workflow}: 失敗 run で記録されない`);
    assert.equal(step['continue-on-error'], true, `${workflow}: 計測が本体を落とす`);
    assert.match(step.run, /record-claude-usage\.mjs/, `${workflow}: 記録スクリプトを呼んでいない`);
    assert.match(
      step.run,
      new RegExp(`--workflow ${expected}\\b`),
      `${workflow}: workflow 名が ${expected} でない (CSV で区別できない)`,
    );
    // 失敗 run では verify の count が無い。0 に落として記録自体は残す
    assert.match(step.run, /steps\.verify\.outputs\.count \|\| '0'/, `${workflow}: items が解決できない`);
  }
});

/**
 * request file が無い push (= request を削除する commit) で本体を走らせてはならない。
 * push イベントに inputs は無いので、workflow_dispatch 用の分岐に落ちると
 * metric="" (全 2,295 件)・dry_run="" (≠true = 実 push) となり、
 * **ファイルを消すだけの commit が本番 R2 の全件更新を起動する**。
 * 実際の run script を取り出して走らせて確認する (条件式を目視しても気づけない類のため)。
 */
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
    '.github/workflows/ai-content-generate-daily.yml',
    '.github/workflows/blog-generate-daily.yml',
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

/**
 * 日次件数は「1 件あたりの実測コスト × 件数」が job timeout と turn 予算に収まる必要がある。
 * 足りないと生成が途中で切れ、verify が「対象あり・生成物なし」で落ちて 1 日分が丸ごと無駄になる。
 * 件数だけ上げて予算を据え置く変更をここで止める。
 * 実測値の出どころ (2026-08-03 の green run):
 *   ai-content run 30775103091 … Claude step 28分36秒 / 1 件
 *   blog       run 30777677268 … Claude step  9分29秒 / 1 件
 */
const ROUTINE_BUDGETS = [
  {
    workflow: '.github/workflows/ai-content-generate-daily.yml',
    minutesPerItem: 29,
    turnsPerItem: 60,
    overheadMinutes: 5, // npm ci + キュー再構築 + push + dispatch
  },
  {
    workflow: '.github/workflows/blog-generate-daily.yml',
    minutesPerItem: 10,
    turnsPerItem: 100,
    overheadMinutes: 5,
  },
];

test('daily limits stay inside the job timeout and turn budget', () => {
  for (const { workflow, minutesPerItem, turnsPerItem, overheadMinutes } of ROUTINE_BUDGETS) {
    const source = read(workflow);
    const limit = Number(source.match(/LIMIT: \$\{\{ inputs\.limit \|\| '(\d+)' \}\}/)?.[1]);
    const timeout = Number(source.match(/timeout-minutes: (\d+)/)?.[1]);
    const turns = Number(source.match(/--max-turns (\d+)/)?.[1]);
    assert.ok(limit && timeout && turns, `${workflow}: limit/timeout/max-turns が読めない`);

    const neededMinutes = limit * minutesPerItem + overheadMinutes;
    assert.ok(
      timeout >= neededMinutes,
      `${workflow}: limit ${limit} 件には ${neededMinutes} 分要るが timeout は ${timeout} 分`,
    );
    assert.ok(
      turns >= limit * turnsPerItem,
      `${workflow}: limit ${limit} 件には turn ${limit * turnsPerItem} 要るが max-turns は ${turns}`,
    );

    // schedule / push は inputs 空で fallback、workflow_dispatch は input の default を使う。
    // ここがずれると手動実行だけ件数が変わる。
    const dispatchDefault = Number(
      source.match(/limit:\n\s+description:[^\n]*\n\s+required: false\n\s+default: "(\d+)"/)?.[1],
    );
    assert.equal(
      dispatchDefault,
      limit,
      `${workflow}: workflow_dispatch の既定 (${dispatchDefault}) が fallback (${limit}) と食い違う`,
    );
  }
});

test('CI prompts preserve author/critic separation and prohibit external writes', () => {
  for (const prompt of [
    '.claude/prompts/ci/ai-content-routine.md',
    '.claude/prompts/ci/blog-routine.md',
  ]) {
    const source = read(prompt);
    assert.match(source, /別(の)? foreground コンテキスト/);
    assert.match(source, /R2、GitHub、git commit \/ push、Issue、Secretsへのアクセス/);
    assert.match(source, /WebFetch \/ WebSearch \/ MCP/);
  }
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
