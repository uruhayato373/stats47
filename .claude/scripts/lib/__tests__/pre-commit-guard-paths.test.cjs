'use strict';

/**
 * pre-commit のトリガー regex に埋まった「具体パス」が実在することを固定する。
 *
 * ★なぜ要るか (2026-08-18)。`apps/web/scripts/pre-commit-checks.sh` は
 *   `git diff --cached --name-only | grep -E '<巨大 regex>'` で「この commit は
 *   何を検査すべきか」を決める。regex にファイルパスが直接埋まっているため、
 *   **ファイルを rename すると grep が何にもマッチしなくなり、対応するゲートが
 *   無言で無効化される**。commit は緑のまま通り、壊れたのは検査の側なので誰も気づけない。
 *
 *   実例: image-pipeline policy ゲートは実際の publisher を trigger に持つ。
 *   publisher の移動時に trigger を更新し忘れるとゲートが死ぬところだった。
 *   同種のゲートは他にも 9 本ある (docs governance / dispatch freshness / unit semantics 等)。
 *
 *   `image-pipeline-source-policy.test.ts` は実ファイルを読むので**ファイル移動自体**は
 *   赤くなるが、それは policy の中身を見るテストであって**ゲートの配線**は誰も見ていない。
 *   このテストがその穴を埋める。
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SHELL = path.join(ROOT, 'apps/web/scripts/pre-commit-checks.sh');

/**
 * 実在しなくてよいパスと、その理由。
 * 「たまたま今無い」ものを黙って許すと、このテストは何も守らなくなる。
 * 追加するときは必ず理由を書く。
 */
const ALLOWED_ABSENT = {
  'data/workflow-dispatch-requests.json':
    'cloud セッションが作り CI が git rm で消費する一時ファイル。不在が通常状態',
};

/** `grep -E '<regex>'` の単一引用符内を取り出す (行継続 \ をまたぐものを含む) */
function extractTriggerRegexes(shell) {
  const out = [];
  const re = /grep -E\s*\\?\s*\n?\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(shell))) out.push(m[1]);
  return out;
}

/** トップレベルの `|` で分割する (入れ子の括弧は跨がない) */
function splitAlternatives(inner) {
  const alts = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (c === '\\') { i += 1; continue; }
    if (c === '(') depth += 1;
    else if (c === ')') depth -= 1;
    else if (c === '|' && depth === 0) { alts.push(inner.slice(last, i)); last = i + 1; }
  }
  alts.push(inner.slice(last));
  return alts;
}

/** 交替 `(a|b)` と省略可 `(a)?` を展開して、regex を平文候補の配列にする */
function expandAlternations(pattern, cap = 50000) {
  let out = [''];
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '\\') {
      const lit = pattern.slice(i, i + 2);
      out = out.map((s) => s + lit);
      i += 2;
      continue;
    }
    if (ch === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < pattern.length && depth > 0) {
        if (pattern[j] === '\\') { j += 2; continue; }
        if (pattern[j] === '(') depth += 1;
        else if (pattern[j] === ')') depth -= 1;
        j += 1;
      }
      const inner = pattern.slice(i + 1, j - 1);
      const optional = pattern[j] === '?';
      const expanded = splitAlternatives(inner).flatMap((a) => expandAlternations(a, cap));
      const choices = optional ? expanded.concat(['']) : expanded;
      const next = [];
      for (const prefix of out) {
        for (const c of choices) {
          next.push(prefix + c);
          if (next.length > cap) return next; // 病的な展開は打ち切る (このテストは網羅が目的ではない)
        }
      }
      out = next;
      i = optional ? j + 1 : j;
      continue;
    }
    out = out.map((s) => s + ch);
    i += 1;
  }
  return out;
}

/**
 * 展開結果のうち「具体的なファイルパス」だけを拾う。
 * `.*` や文字クラスが残るものはパターンなので対象外。
 * 末尾が拡張子でも `.ts` のように stem が無いものは、拡張子の交替 `\.(ts|tsx)$` の
 * 残骸なので落とす。
 */
function concretePaths(branches) {
  const paths = [];
  for (const b of branches) {
    const p = b.replace(/^\^/, '').replace(/\$$/, '').replace(/\\\./g, '.');
    if (/[*+?[\]{}|()^$\\]/.test(p)) continue;
    if (!/[^/.][^/]*\.[a-z0-9]+$/i.test(p)) continue;
    paths.push(p);
  }
  return paths;
}

function collectGuardPaths(shell) {
  const seen = new Set();
  for (const regex of extractTriggerRegexes(shell)) {
    for (const p of concretePaths(expandAlternations(regex))) seen.add(p);
  }
  return [...seen].sort();
}

// ── 実ファイルに対する契約 ────────────────────────────────────────────────

test('pre-commit のトリガー regex に埋まった具体パスがすべて実在する', () => {
  const shell = fs.readFileSync(SHELL, 'utf8');
  const paths = collectGuardPaths(shell);

  // 収集が壊れていたら (regex 抽出の失敗など) このテストは何も見ていないのと同じ
  assert.ok(paths.length >= 30, `具体パスを ${paths.length} 件しか集めていない = 収集が壊れている`);

  const missing = paths.filter(
    (p) => !(p in ALLOWED_ABSENT) && !fs.existsSync(path.join(ROOT, p)),
  );
  assert.deepEqual(
    missing,
    [],
    'pre-commit の trigger が実在しないパスを指している = そのゲートは無言で無効化されている:\n' +
      missing.join('\n'),
  );
});

test('image-pipeline ゲートの trigger に現行の buzz-map publisher が含まれている', () => {
  // 管理画面は read-only。書き込みを担う CLI の移動時に落ちるのが正しい。
  const shell = fs.readFileSync(SHELL, 'utf8');
  const paths = collectGuardPaths(shell);
  const publisher = '.claude/scripts/sns/prepare-buzz-map-batch.ts';
  assert.ok(paths.includes(publisher), `現行 publisher が trigger に無い: ${paths.join(', ')}`);
  assert.ok(fs.existsSync(path.join(ROOT, publisher)), `${publisher} が実在しない`);
});

// ── ゲート自体の検証 (全 PASS が「何も見ていない」と区別できるように) ──────

test('[mutation] 存在しないパスを trigger に混ぜると検出する', () => {
  // ★shell の文字列を置換する形で変異させない。抽出パスは入れ子の交替から組み立てるので
  //   原文に連続して現れず、置換が no-op になって「検出できた」と誤って緑になる
  //   (2026-08-18 に実際に踏んだ)。合成 regex を同じ抽出経路へ通して判定する。
  const synthetic = '^apps/nowhere/lib/server/(actions|buzz-map-actions)\\.ts$';
  const paths = concretePaths(expandAlternations(synthetic));
  assert.equal(paths.length, 2, '交替が展開されていない');
  const missing = paths.filter((p) => !fs.existsSync(path.join(ROOT, p)));
  assert.equal(missing.length, 2, '不在パスを見逃した = このテストは無意味');
});

test('[mutation] 交替 (a|b) の片側だけが壊れても検出する', () => {
  const shell = fs.readFileSync(SHELL, 'utf8').replace(
    'prepare-buzz-map-batch\\.ts',
    'prepare-buzz-map-batch-RENAMED\\.ts',
  );
  const missing = collectGuardPaths(shell).filter(
    (p) => !(p in ALLOWED_ABSENT) && !fs.existsSync(path.join(ROOT, p)),
  );
  assert.ok(missing.length > 0, '交替の片側の欠落を見逃した');
});

test('[mutation] パターン (.* を含む枝) は具体パスとして拾わない', () => {
  // 拾ってしまうと `apps/web/.*\.ts` のような枝が「不在」判定になり、誤検知だらけになる
  const branches = expandAlternations('^apps/web/.*\\.(ts|tsx)$');
  assert.deepEqual(concretePaths(branches), []);
});

test('[mutation] 拡張子の交替だけの残骸 (.ts) を具体パスにしない', () => {
  assert.deepEqual(concretePaths(['.ts', '.tsx']), []);
  assert.deepEqual(concretePaths(['CLAUDE.md']), ['CLAUDE.md']);
});

// ── 段ごとの所要時間 (CI-SPEED-PRECOMMIT-TRIM-01) ─────────────────────────
//
// ★なぜ要るか (2026-10-29 の実測)。pre-commit が所要時間を出すのは
//   `preflight-commit.mjs --commit-static` の中だけで、他の段 (型・docs・metric 契約・
//   画像 pipeline・note の台帳) は重くても記録に残らなかった。どれを削るかを決める材料が
//   無いので、全区間をどれかの段に入れ、終了時に重い順の内訳を必ず出す。

const { spawnSync } = require('node:child_process');

const TIMER = path.join(ROOT, 'apps/web/scripts/pre-commit-stage-timer.sh');
const HUSKY = path.join(ROOT, '.husky/pre-commit');

function runShell(shellName, script) {
  return spawnSync(shellName, ['-c', script], { encoding: 'utf8', env: { ...process.env, TIMER } });
}

/** `stage "名前"` の行で区切り、段ごとの検査コマンドの起動数を数える (コメントと echo の行は数えない) */
function stageInvocations(shell) {
  const stages = [{ name: '(最初の stage より前)', count: 0 }];
  for (const line of shell.split('\n')) {
    const trimmed = line.trim();
    const started = trimmed.match(/^stage "([^"]+)"/);
    if (started) stages.push({ name: started[1], count: 0 });
    if (trimmed.startsWith('#') || /^echo /.test(trimmed)) continue;
    const invocations = trimmed.match(/(^|[\s(!;&|])(npm run|npm audit|npx|node)\s+(?!-e\b)/g) ?? [];
    stages[stages.length - 1].count += invocations.length;
  }
  return stages;
}

for (const shellName of ['bash', 'sh']) {
  test(`[timer/${shellName}] 段の所要時間を重い順に出し、0.1 秒未満の段はまとめる`, () => {
    const result = runShell(shellName, [
      '. "$TIMER"',
      'stage "軽い段"',
      'stage "重い段"',
      'sleep 0.6',
      'stage "中くらいの段"',
      'sleep 0.15',
      'stage "もう 1 つの軽い段"',
      'stage_summary',
    ].join('\n'));
    assert.equal(result.status, 0, result.stderr);
    const lines = result.stdout.split('\n').filter(Boolean);
    const heavy = lines.findIndex((line) => /^\s+\d+\.\ds\s+重い段$/.test(line));
    const middle = lines.findIndex((line) => /^\s+\d+\.\ds\s+中くらいの段$/.test(line));
    assert.ok(heavy > 0, `重い段の行が無い:\n${result.stdout}`);
    assert.ok(middle > heavy, `重い順に並んでいない:\n${result.stdout}`);
    assert.match(result.stdout, /他 2 段は 0\.1 秒未満/);
    assert.doesNotMatch(result.stdout, /s\s+軽い段$/m, '0.1 秒未満の段を 1 行ずつ出すと内訳が埋もれる');
    assert.match(result.stdout, /^\s+\d+\.\ds\s+合計$/m);
  });

  test(`[timer/${shellName}] 検査が落ちて途中で終わっても内訳を出し、終了コードを変えない`, () => {
    const result = runShell(shellName, [
      'set -e',
      '. "$TIMER"',
      'trap stage_summary EXIT',
      'stage "落ちる段"',
      'sleep 0.15',
      'false',
      'stage "到達しない段"',
    ].join('\n'));
    assert.equal(result.status, 1, '内訳の出力が終了コードを 0 に変えると、落ちた commit が通る');
    assert.match(result.stdout, /\d+\.\ds\s+落ちる段/);
    assert.doesNotMatch(result.stdout, /到達しない段/);
  });
}

test('pre-commit-checks.sh は終了時に必ず内訳を出し、最初の検査より前に段を始める', () => {
  const shell = fs.readFileSync(SHELL, 'utf8');
  assert.match(shell, /^\. "\$SCRIPT_DIR\/pre-commit-stage-timer\.sh"$/m);
  assert.match(shell, /^trap stage_summary EXIT$/m, 'exit 1 の経路でも内訳を出すために EXIT trap で呼ぶ');
  const stages = stageInvocations(shell);
  assert.equal(stages[0].count, 0, '最初の stage より前で検査を起動している = その時間はどの段にも入らない');
  assert.ok(stages.length > 20, `段が ${stages.length - 1} 個しか無い = 抽出が壊れている`);
});

test('pre-commit-checks.sh は 1 つの段で検査コマンドを 1 本しか起動しない', () => {
  // 2 本を 1 つの段に入れると、内訳を見てもどちらが重いのか分からない
  // (metric 契約の 3 本と note の台帳の 4 本が 1 つの if に連結されていた)。
  const shared = stageInvocations(fs.readFileSync(SHELL, 'utf8')).filter((stage) => stage.count > 1);
  assert.deepEqual(shared, [], '検査を足すときは stage "名前" で段を切る');
});

test('.husky/pre-commit が後段 (ui-theme:lyra:test) の所要時間も出す', () => {
  const husky = fs.readFileSync(HUSKY, 'utf8');
  const lyra = husky.indexOf('npm run --silent ui-theme:lyra:test');
  const staged = husky.search(/^stage "/m);
  assert.ok(staged > 0 && staged < lyra, 'lyra の検査の前に stage を呼んでいない');
  assert.match(husky, /^\. apps\/web\/scripts\/pre-commit-stage-timer\.sh$/m);
});

test('[mutation] 1 つの段に検査コマンドが 2 本あると検出する', () => {
  const stages = stageInvocations([
    'stage "A"',
    'if ! (cd "$ROOT" && npm run a && npm run b); then',
    '  echo "npm run a を確認"',
    'fi',
    'stage "B"',
    '# node x.cjs',
    'node "$ROOT/x.cjs" > /tmp/x.json || cat /tmp/x.json | node -e "process.stdin"',
  ].join('\n'));
  assert.deepEqual(stages.map((stage) => stage.count), [0, 2, 1]);
});
