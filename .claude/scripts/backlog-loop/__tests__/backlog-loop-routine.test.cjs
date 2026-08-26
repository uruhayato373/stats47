'use strict';

/**
 * backlog-loop-daily.yml の安全契約を静的に固定する。
 *
 * ai-content / blog の日次ルーチンが踏んだ事故と同じものをこのループでも踏まないようにする:
 *   - Bash 許可パターンの途中 * で gate を 1 つも実行できないまま空振り (2 晩 $10.94)
 *   - 件数だけ上げて timeout に当たり 0 件で打ち切り
 *   - action の SHA ピンが外れる
 *   - 検証より先に push してしまう
 *
 * 加えて、このループ固有の不変条件を 2 つ持つ:
 *   - **verify を通す前に push しない** (行削除の裏付けが取れないまま develop に積まない)
 *   - **Claude に git push / gh を渡さない** (外部反映は CI の step だけが行う)
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const WORKFLOW = '.github/workflows/backlog-loop-daily.yml';

// workflow 側の immutable pin と同じ commit を指す。更新時にテストも追従させる。
const ACTION_SHA = 'd0287e81bb2e7a297a825f8634e1403af70c4e93';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assertOrdered(source, labels) {
  let previous = -1;
  for (const label of labels) {
    const current = source.indexOf(label);
    assert.ok(current > previous, `${label} が routine の順序どおりに現れない`);
    previous = current;
  }
}

test('base action は SHA 固定で OAuth / MCP / full-output の安全契約を満たす', () => {
  const source = read(WORKFLOW);
  assert.doesNotThrow(() => YAML.parse(source));
  assert.match(source, new RegExp(`anthropics/claude-code-base-action@${ACTION_SHA}`));
  assert.match(source, /claude_code_oauth_token:.*CLAUDE_CODE_OAUTH_TOKEN/);
  assert.match(source, /show_full_output: "false"/);
  assert.match(source, /"disableAllHooks": true/);
  assert.match(source, /--setting-sources project/);
  assert.match(source, /--strict-mcp-config/);
  assert.match(source, /--mcp-config '\{"mcpServers":\{\}\}'/);
  assert.match(source, /prompt_file: \.claude\/prompts\/ci\/backlog-loop-routine\.md/);
});

test('run 本体は sonnet 固定 (上位モデルは Agent 委譲でだけ使う)', () => {
  const source = read(WORKFLOW);
  // base-action の --model は run 全体に効くので、ここを fable にすると
  // 全処理が上位モデルで走ってコストが跳ねる。委譲は Agent tool 側の責務。
  assert.match(source, /--model sonnet/);
  assert.doesNotMatch(source, /--model (fable|opus)/);
});

test('★Bash 許可パターンはすべて末尾 * (途中 * は実コマンドに一致しない)', () => {
  const source = read(WORKFLOW);
  const line = source.split('\n').find((l) => l.includes('--allowedTools'));
  assert.ok(line, '--allowedTools が無い');
  const patterns = [...line.matchAll(/Bash\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(patterns.length > 0, 'Bash を 1 つも許可していない');
  for (const p of patterns) {
    const wildcard = p.indexOf('*');
    if (wildcard === -1) continue;
    assert.equal(wildcard, p.length - 1, `末尾 * でない Bash 許可パターン: Bash(${p})`);
  }
});

// ACTIONS-EXPRESSION-INJECTION-01 が追っている負債と同じ形を、新しい workflow が
// 持ち込めないようにする。`run:` の本文へ ${{ }} を直接展開すると、その値に
// シェルのメタ文字が混ざった瞬間に任意コード実行になる。値は env に置き、
// 本文はシェル変数だけを参照する (data-refresh.yml が手本)。
// 既存 13 箇所の是正は別途 (この検査は本 workflow に閉じている)。
test('★run: の本文に ${{ }} を展開しない (式インジェクションの類型を持ち込まない)', () => {
  const lines = read(WORKFLOW).split('\n');
  const offenders = [];
  let inRun = false;
  for (const [i, line] of lines.entries()) {
    if (/^\s*run:\s*\|/.test(line)) {
      inRun = true;
      continue;
    }
    // 次の step / 同階層のキーに当たったら run 本文は終わり
    if (inRun && /^\s{6}- name:/.test(line)) inRun = false;
    if (inRun && /^\s{8}(env|if|uses|with|id|continue-on-error):/.test(line)) inRun = false;
    if (inRun && line.includes('${{')) offenders.push(`L${i + 1}: ${line.trim()}`);
  }
  assert.deepEqual(offenders, [], `run: 本文の式展開は env へ移す:\n${offenders.join('\n')}`);
});

test('★Claude に外部反映の手段を渡さない (push / gh / secret 読み)', () => {
  const source = read(WORKFLOW);
  const line = source.split('\n').find((l) => l.includes('--disallowedTools'));
  assert.ok(line, '--disallowedTools が無い');
  for (const forbidden of ['Bash(git push*)', 'Bash(gh *)', 'Bash(env *)', 'Read(.env*)']) {
    assert.ok(line.includes(forbidden), `disallowedTools に ${forbidden} が無い`);
  }
  assert.match(source, /WebFetch,WebSearch/);
});

test('★verify とリポジトリゲートを通してから push する', () => {
  const source = read(WORKFLOW);
  assertOrdered(source, [
    'Build queue and pick targets',
    'Process backlog entries with Claude Code',
    'Verify removals against the ledger',
    'Run repository gates before pushing',
    'Commit and push',
  ]);
  // verify は base を「Claude が触る前」に取っていること。後で取ると自分の変更が基準になり
  // 何も検出できない。
  const pick = source.slice(source.indexOf('Build queue and pick targets'));
  assert.ok(
    pick.indexOf('git rev-parse HEAD') < pick.indexOf('Process backlog entries'),
    'base SHA を Claude 実行より前に確定していない',
  );
  assert.match(source, /verify-backlog-run\.mjs/);
});

test('★execution log が無ければ verify を通さない (実行の証明)', () => {
  const source = read(WORKFLOW);
  const verify = source.slice(source.indexOf('Verify removals against the ledger'));
  assert.match(verify.slice(0, 1200), /Claude execution log が無く/);
});

test('件数が job timeout に収まる (1 次式 × 安全率 1.25)', () => {
  const source = read(WORKFLOW);
  const timeout = Number(source.match(/timeout-minutes: (\d+)/)[1]);
  const limit = Number(source.match(/LIMIT: \$\{\{ inputs\.limit \|\| '(\d+)' \}\}/)[1]);
  // ai-content の実測 (固定費 15 分 + 1 件 12 分) を暫定値として当てる。
  // 実測が取れたらここと workflow のコメントを同じ差分で更新する。
  const FIXED_MINUTES = 15;
  const MINUTES_PER_ITEM = 15;
  const needed = (FIXED_MINUTES + limit * MINUTES_PER_ITEM) * 1.25;
  assert.ok(
    needed <= timeout,
    `limit ${limit} には ${Math.ceil(needed)} 分要る (timeout ${timeout} 分)`,
  );
});

// ★Claude を CI で走らせる workflow どうしは実時間で重ねない。同じ Pro/Max 利用枠を
//   共有するため、重ねると後から走った方が枠切れで途中終了する。
//   2026-08-21 に ai-content / blog の日次生成ループを削除したので、現在この条件を満たす
//   workflow は backlog-loop だけ。**対象をファイル名で列挙せず base-action の利用で拾う**ので、
//   将来 Claude workflow を足したら自動で検査対象に入る。
test('★Claude を使う workflow どうしが実時間で重ならない (利用枠の共有)', () => {
  const dir = path.join(ROOT, '.github/workflows');
  const claudeWorkflows = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yml'))
    .map((f) => ({ file: f, source: fs.readFileSync(path.join(dir, f), 'utf8') }))
    .filter(({ source }) => source.includes('claude-code-base-action'))
    .filter(({ source }) => /- cron: "/.test(source));

  // 列挙が空 = 何も検査していない、を防ぐ (backlog-loop 自身は必ず入る)
  assert.ok(
    claudeWorkflows.some(({ file }) => file === path.basename(WORKFLOW)),
    'backlog-loop が Claude workflow として拾えていない = 列挙が壊れている',
  );

  const crons = (source) => [...source.matchAll(/- cron: "([^"]+)"/g)].map((m) => m[1]);
  const startHour = (cron) => Number(cron.split(/\s+/)[1]);
  const timeoutOf = (source) =>
    Math.max(...[...source.matchAll(/timeout-minutes: (\d+)/g)].map((m) => Number(m[1])));

  const spans = [];
  for (const { file, source } of claudeWorkflows) {
    const hours = timeoutOf(source) / 60;
    for (const cron of crons(source)) {
      const start = startHour(cron);
      spans.push({ file, cron, start, end: start + hours });
    }
  }

  for (let a = 0; a < spans.length; a += 1) {
    for (let b = a + 1; b < spans.length; b += 1) {
      if (spans[a].file === spans[b].file) continue;
      const overlaps = spans[a].start < spans[b].end && spans[b].start < spans[a].end;
      assert.ok(
        !overlaps,
        `${spans[a].file} の ${spans[a].cron} と ${spans[b].file} の ${spans[b].cron} が実時間で重なる`,
      );
    }
  }
});

test('★request は結果によらず消費する (再 push が発火しなくなるのを防ぐ)', () => {
  const source = read(WORKFLOW);
  const consume = source.slice(source.indexOf('Consume request'));
  assert.ok(consume.length > 0, 'consume step が無い');
  assert.match(source, /if: \$\{\{ always\(\) && github\.event_name == 'push' \}\}/);
  const stashAt = consume.indexOf('git stash push');
  const rebaseAt = consume.indexOf('git pull --rebase');
  assert.ok(stashAt !== -1 && stashAt < rebaseAt, 'consume が rebase 前に stash していない');
});

// ★2026-08-20 の実障害: gate を通した 2 件を ledger に completed と記録した後で
//   バックログの行を消せず、verify が gate-passed-but-not-removed で run ごと落とした。
//   push step はその前に止まるので、実装差分も ledger も丸ごと破棄された (16 分 / $16.21)。
//   順序 (消してから記録) と、消せなかったときの逃げ道 (deferred) を prompt に固定する。
test('★prompt は「行を消してから記録する」順序と、消せないときの deferred を固定している', () => {
  const prompt = read('.claude/prompts/ci/backlog-loop-routine.md');
  assertOrdered(prompt, ['### 3. 行を消す', '### 4. 結果を記録する']);
  assert.match(prompt, /completed にしない/);
  assert.match(prompt, /--outcome deferred --fail-reason cannot-edit-backlog/);
  // 逃げ道が「禁止パスを触る」方向に開かないこと (ここが開くと他の制約が全部無意味になる)
  assert.match(prompt, /`\.github\/` や routing policy を触らない/);
});

test('★prompt が排他 writer と自己昇格の境界を明示している', () => {
  const prompt = read('.claude/prompts/ci/backlog-loop-routine.md');
  for (const forbidden of [
    '.claude/todo/improvements.md',
    '.claude/memory/',
    '.claude/skills/learned/',
    '.github/',
    'backlog-routing-policy.json',
  ]) {
    assert.ok(prompt.includes(forbidden), `prompt に ${forbidden} の禁止が無い`);
  }
  // gate を実行せず completed にできないことを prompt 側でも明言している
  assert.match(prompt, /gate は宣言ではなく実行する/);
});

test('★prompt の「扱わない class」が policy の draft-pr class と一致する', () => {
  const prompt = read('.claude/prompts/ci/backlog-loop-routine.md');
  const policy = JSON.parse(read('.claude/config/backlog-routing-policy.json'));
  const draftPrClasses = Object.entries(policy.classes ?? {})
    .filter(([, v]) => v.apply === 'draft-pr')
    .map(([k]) => k);
  assert.ok(draftPrClasses.length > 0, 'draft-pr の class が policy に無い');
  for (const cls of draftPrClasses) {
    assert.ok(prompt.includes(cls), `prompt が draft-pr class ${cls} の扱いを書いていない`);
  }
});
