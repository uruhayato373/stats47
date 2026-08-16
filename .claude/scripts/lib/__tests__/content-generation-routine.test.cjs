const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
// workflow がピンしている commit SHA と一致していること。dependabot が action を上げるときは
// この定数も同じ差分で更新する (片方だけ動くと CI が落ちる = ピンが外れていないことの検査になる)。
const ACTION_SHA = 'e5758aabe98b80fec1bcbd4a51fe2e1f8935dfc3';

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
  // verify は staging(生成物) の有無を検査する (partial-publish 化で文言は理由コードへ変更)。
  assert.match(source, /no-staging|no-article/);
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
  // critic の PASS manifest を検査する (partial-publish 化で理由コード critic-not-pass に変更)。
  assert.match(source, /critic-not-pass/);
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
 * 件数は「固定費 + 1 件あたりの実測コスト × 件数」が job timeout と turn 予算に収まる必要がある。
 * 足りないと生成が途中で切れ、verify が「対象あり・生成物なし」で落ちてその回が丸ごと無駄になる。
 *
 * ★1 次式にした理由 (2026-08-06)。旧モデルは「29 分 × 件数」の比例で、limit 1 の run だけを見て
 * 固定費を 1 件分に押し込んでいた。固定費 (CLAUDE.md と rules の読み込み) と限界コストを分ければ
 * 件数を増やす判断ができる。
 *
 * ★係数は外挿せず観測された最悪レートで引く (2026-08-11 改訂)。limit 1/5 の 2 点から
 * 「1 件 8.5 分」と外挿して 12 分/件を置いた結果、limit 10 を 150 分と見積もって 240 分の
 * timeout を通してしまった。実測は 169 分と 213 分で、さらに 2 回 timeout に達している
 * (所要はバッチサイズに対して超線形で、1 次外挿は必ず下振れする)。**測っていない件数の
 * 所要を発明しない**。小さい limit では過大評価になるが、過大評価はガードを厳しくする方向。
 *
 * ★係数だけでは足りないので安全率を掛ける。history.csv に載るのは **完走した run だけ**
 * (timeout で打ち切られた job は記録ステップに到達しない)。つまり係数は「完走できた回」に
 * 当てはめた値で、同じ件数で完走できなかった回は最初から標本に入っていない。この生存者
 * バイアスの分を安全率で埋める。実際、係数を実測から引き直しただけでは limit 10 の見積もりが
 * ちょうど timeout と同値になり、**このガードは limit 10 を弾けないままだった**。
 *
 * ★何件に対して検査するか
 * **ワークフローを編集せずに到達できる最大件数**で見る。ai-content は boost 設定
 * (.claude/config/content-generation-boost.json) を develop に push するだけで
 * MAX_LIMIT まで上げられるので、不在中に上げられても予算内であることを保証する必要がある。
 * blog にはその遠隔ノブが無く、かつ **limit>1 の実測が 1 件も無い**ので、
 * 測っていない領域の予算を発明せず既定件数で見る (下の boost 非対象テストで非対称を固定する)。
 */
// CJS からは .mjs を require できない (Node 20)。定数はソースから読む。
// 逆に「値がずれたら気づけない」ので、読めなければ即失敗させる。
const MAX_LIMIT = Number(
  read('.claude/scripts/lib/content-generation-boost.mjs').match(/export const MAX_LIMIT = (\d+);/)?.[1],
);
assert.ok(MAX_LIMIT > 0, 'content-generation-boost.mjs から MAX_LIMIT を読めない');

/**
 * 見積もりに掛ける安全率。上の docblock のとおり、係数は完走した run にしか当てはめられない
 * (生存者バイアス)。実測の最悪完走が timeout の 89% を使っていたので、等号で通る見積もりは
 * 「安全」とみなさない。
 */
const MODEL_SAFETY_FACTOR = 1.25;

const ROUTINE_BUDGETS = [
  {
    workflow: '.github/workflows/ai-content-generate-daily.yml',
    // limit は gate の --default-limit が SSOT (env は gate の出力を受ける)
    limitPattern: /--default-limit (\d+)/,
    checkAt: MAX_LIMIT, // boost で遠隔から上げられる上限
    fixedMinutes: 25,
    // ★12 → 21 (2026-08-11)。旧値は limit 1/5 の実測から線形に外挿した推定で、limit 10 を
    // 150 分と見積もって 240 分の timeout を通してしまった。実測は 169・213 分と 240 分超え 2 回。
    // 所要はバッチサイズに対して超線形なので、線形モデルは**観測された最悪レート**で引く。
    // 小さい limit では過大評価になるが、過大評価はガードを厳しくする方向なので安全。
    minutesPerItem: 21,
    fixedTurns: 40,
    turnsPerItem: 8,
    overheadMinutes: 5, // npm ci + キュー再構築 + push + dispatch
  },
  {
    workflow: '.github/workflows/blog-generate-daily.yml',
    limitPattern: /LIMIT: \$\{\{ inputs\.limit \|\| '(\d+)' \}\}/,
    checkAt: null, // 既定件数で見る (limit>1 の実測が無い)
    fixedMinutes: 10,
    minutesPerItem: 35,
    fixedTurns: 40,
    turnsPerItem: 100,
    overheadMinutes: 5,
  },
];

test('daily limits stay inside the job timeout and turn budget', () => {
  for (const budget of ROUTINE_BUDGETS) {
    const { workflow, limitPattern, checkAt, overheadMinutes } = budget;
    const source = read(workflow);
    const defaultLimit = Number(source.match(limitPattern)?.[1]);
    // gate job (timeout-minutes: 5) と取り違えないよう、生成 job の最大値を取る
    const timeout = Math.max(...[...source.matchAll(/timeout-minutes: (\d+)/g)].map((m) => Number(m[1])));
    const turns = Number(source.match(/--max-turns (\d+)/)?.[1]);
    assert.ok(defaultLimit && timeout && turns, `${workflow}: limit/timeout/max-turns が読めない`);

    const limit = checkAt ?? defaultLimit;
    const neededMinutes = budget.fixedMinutes + limit * budget.minutesPerItem + overheadMinutes;
    const budgetedMinutes = Math.ceil(neededMinutes * MODEL_SAFETY_FACTOR);
    assert.ok(
      timeout >= budgetedMinutes,
      `${workflow}: limit ${limit} 件には ${neededMinutes} 分 (安全率込み ${budgetedMinutes} 分) 要るが timeout は ${timeout} 分`,
    );
    const neededTurns = budget.fixedTurns + limit * budget.turnsPerItem;
    assert.ok(
      turns >= neededTurns,
      `${workflow}: limit ${limit} 件には turn ${neededTurns} 要るが max-turns は ${turns}`,
    );

    // schedule / push は inputs 空で fallback、workflow_dispatch は input の default を使う。
    // ここがずれると手動実行だけ件数が変わる。
    const dispatchDefault = Number(
      source.match(/limit:\n\s+description:[^\n]*\n\s+required: false\n\s+default: "(\d+)"/)?.[1],
    );
    assert.equal(
      dispatchDefault,
      defaultLimit,
      `${workflow}: workflow_dispatch の既定 (${dispatchDefault}) が fallback (${defaultLimit}) と食い違う`,
    );
  }
});

/**
 * boost の配線。ここが崩れると「期間外なのに追加スロットで Claude が動く」か
 * 「設定を書いても何も起きない」のどちらかになり、どちらも不在中に気づけない。
 */
test('ai-content gates every schedule through the boost resolver', () => {
  const doc = YAML.parse(read('.github/workflows/ai-content-generate-daily.yml'));

  const gate = doc.jobs.gate;
  assert.ok(gate, 'gate job が無い');
  assert.match(
    gate.steps.map((s) => s.run ?? '').join('\n'),
    /content-generation-boost\.mjs/,
    'gate が boost resolver を呼んでいない',
  );

  // 生成 job は gate の判定に従う。ここが外れると追加スロットが常に Claude を呼ぶ。
  assert.deepEqual(doc.jobs.generate.needs, 'gate');
  assert.match(String(doc.jobs.generate.if ?? ''), /needs\.gate\.outputs\.run == 'true'/);
  assert.match(String(doc.jobs.generate.env.LIMIT), /needs\.gate\.outputs\.limit/);
  assert.match(String(doc.jobs.generate.env.DRY_RUN), /needs\.gate\.outputs\.dry_run/);
});

test('boost の追加スロットは workflow に宣言済みの cron だけを指す', () => {
  const configPath = path.join(ROOT, '.claude/config/content-generation-boost.json');
  if (!fs.existsSync(configPath)) return; // 設定なし = boost なしが通常状態

  // schema の検証は content-generation-boost.test.mjs が持つ。ここは配線だけを見る。
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const doc = YAML.parse(read('.github/workflows/ai-content-generate-daily.yml'));
  const declared = doc.on.schedule.map((s) => s.cron);

  const baseline = read('.github/workflows/ai-content-generate-daily.yml').match(
    /--baseline-cron "([^"]+)"/,
  )?.[1];
  assert.ok(declared.includes(baseline), `baseline cron "${baseline}" が on.schedule に無い`);

  for (const cron of config.aiContent.extraCrons) {
    assert.ok(declared.includes(cron), `extraCrons の "${cron}" が on.schedule に無く永久に発火しない`);
    assert.notEqual(cron, baseline, `extraCrons に baseline (${cron}) を入れない`);
  }
});

test('blog は boost の対象外のまま (月産上限は型配分 SSOT が決める)', () => {
  const configPath = path.join(ROOT, '.claude/config/content-generation-boost.json');
  if (!fs.existsSync(configPath)) return;
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.equal(raw.blog, undefined, 'blog のノブを足すなら seo-strategy.json の typeMix を先に改訂する');

  const blog = YAML.parse(read('.github/workflows/blog-generate-daily.yml'));
  assert.equal(blog.jobs.gate, undefined, 'blog に gate を足すなら本テストの前提を見直す');
});

/**
 * 2 つの routine は同じ Max 枠を使うので、実時間で重なると枠を奪い合う。
 * boost 期間中は ai-content が 1 日 4 枠を占めるため、blog の枠が衝突しやすい。
 */
test('blog の実行枠が ai-content のどの枠とも実時間で重ならない', () => {
  const aiDoc = YAML.parse(read('.github/workflows/ai-content-generate-daily.yml'));
  const blogDoc = YAML.parse(read('.github/workflows/blog-generate-daily.yml'));
  const DAY = 24 * 60;
  // 予算モデルの上限所要。★係数をここに書き写さない — 書き写した結果、上の予算モデルを
  // 実測で直しても重なり判定だけ旧係数 (12 分/件) のまま取り残されていた (2026-08-11)。
  const budgetOf = (workflow) => {
    const b = ROUTINE_BUDGETS.find((x) => x.workflow.includes(workflow));
    assert.ok(b, `${workflow} の予算モデルが無い`);
    return b;
  };
  const minutesFor = (workflow, limit) => {
    const b = budgetOf(workflow);
    return b.fixedMinutes + limit * b.minutesPerItem + b.overheadMinutes;
  };
  // 件数も workflow から読む。書き写すと件数を変えたときに重なり判定だけ古い前提で通る。
  const limitOf = (workflow) => {
    const b = budgetOf(workflow);
    const n = Number(read(b.workflow).match(b.limitPattern)?.[1]);
    assert.ok(n > 0, `${workflow}: 既定件数が読めない`);
    return b.checkAt ?? n;
  };
  const aiMinutes = minutesFor('ai-content', limitOf('ai-content'));
  const blogMinutes = minutesFor('blog', limitOf('blog'));

  const startOf = (cron) => {
    const [minute, hour] = cron.split(/\s+/);
    assert.match(hour, /^\d+$/, `時刻が固定でない cron は判定できない: ${cron}`);
    return Number(hour) * 60 + Number(minute);
  };
  const overlaps = (aStart, aLen, bStart, bLen) => {
    for (const shift of [-DAY, 0, DAY]) {
      if (aStart + shift < bStart + bLen && bStart < aStart + shift + aLen) return true;
    }
    return false;
  };

  const blogStart = startOf(blogDoc.on.schedule[0].cron);
  for (const { cron } of aiDoc.on.schedule) {
    assert.equal(
      overlaps(startOf(cron), aiMinutes, blogStart, blogMinutes),
      false,
      `ai-content (${cron}) と blog (${blogDoc.on.schedule[0].cron}) が実時間で重なる`,
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

// 「foreground で起動」だけでは足りない。Agent tool の既定は background なので、
// パラメータ名を書かないと省略され、起動しただけでターンが終わって成果 0 件になる
// (2026-08-09 の ai-content run 31342281865: 10 author を一括起動して「完了通知を待つ」と終了)。
// 散文の言い換えでは同じ取り違えが起きるので、パラメータ名そのものを prompt に固定する。
test('CI prompts name run_in_background: false and forbid ending the turn with unfinished agents', () => {
  for (const prompt of [
    '.claude/prompts/ci/ai-content-routine.md',
    '.claude/prompts/ci/blog-routine.md',
  ]) {
    const source = read(prompt);
    assert.match(source, /run_in_background: false/, `${prompt}: 既定 background を打ち消す指定が無い`);
    assert.match(source, /未完了の agent を残したままターンを終えない/, `${prompt}: ターン終了の禁止が無い`);
  }
});

// 診断側でも同じ失敗を名指しできること。prompt を破られたときに
// 「なぜ 0 件だったのか」が log から即分かる状態を保つ (是正の入口)。
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

// ★partial-publish の再発防止 (2026-08-07)。1 件でも失敗すると全件 publish しない
// オールオアナッシングで ai-content ループが停滞していた (08-05 は 4/5 生成したのに 0 件公開)。
// verify は「通過分だけ publish・失敗は drop して次回へ・公開 0 件のときだけ赤」に固定する。
test('both routines publish the passing subset instead of all-or-nothing', () => {
  const routines = [
    { workflow: '.github/workflows/ai-content-generate-daily.yml', drop: 'rm -f' },
    { workflow: '.github/workflows/blog-generate-daily.yml', drop: 'rm -rf' },
  ];
  for (const { workflow, drop } of routines) {
    const verify = YAML.parse(read(workflow)).jobs.generate.steps.find((s) => s.id === 'verify');
    assert.ok(verify, `${workflow} must have a verify step`);
    const run = verify.run;
    // 旧オールオアナッシング (GENERATED != EXPECTED で全件 fail) が復活していないこと
    assert.doesNotMatch(
      run,
      /-ne "\$EXPECTED"/,
      `${workflow}: 全件一致を要求する all-or-nothing が復活している`,
    );
    // 公開対象 0 件のときだけ run を赤くする (silent-green も防ぐ)
    assert.match(run, /"\$GENERATED" -eq 0/, `${workflow}: 0 件成功のときだけ fail にすること`);
    // 失敗アイテムは outbox から drop して publish させない
    assert.ok(run.includes(drop), `${workflow}: 失敗アイテムを drop していない (${drop})`);
  }
});

// 連続失敗キーを隔離して doomed key が毎回バッチを食い潰すのを防ぐ (ai-content のみ)。
test('ai-content quarantines keys that keep failing critic', () => {
  const verify = YAML.parse(read('.github/workflows/ai-content-generate-daily.yml'))
    .jobs.generate.steps.find((s) => s.id === 'verify').run;
  assert.match(verify, /record-generation-outcome\.mjs/, '失敗を quarantine state に記録していない');
  const queue = read('.claude/scripts/ai-content/build-ai-content-queue.mjs');
  assert.match(queue, /quarantinedKeys/, 'キューが quarantine を参照していない');
  assert.match(queue, /!quarantined\.has\(e\.rankingKey\)/, '--next が quarantine を除外していない');
});
