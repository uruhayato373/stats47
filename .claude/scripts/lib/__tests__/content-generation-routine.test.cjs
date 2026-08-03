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
