const assert = require('node:assert/strict');
const fs = require('node:fs');
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
