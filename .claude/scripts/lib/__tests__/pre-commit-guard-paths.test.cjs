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
 *   実例: image-pipeline policy ゲートは `apps/admin/lib/server/(actions|buzz-map-actions).ts`
 *   を trigger に持つ。apps/admin → apps/admin の改名でこれが死ぬところだった。
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

test('image-pipeline ゲートの trigger に管理画面の publisher が含まれている', () => {
  // 改名のたびに落ちるのが正しい。落ちたら trigger を新パスへ直す。
  const shell = fs.readFileSync(SHELL, 'utf8');
  const paths = collectGuardPaths(shell);
  const publishers = paths.filter((p) => /lib\/server\/(actions|buzz-map-actions)\.ts$/.test(p));
  assert.equal(publishers.length, 2, `管理画面の publisher 2 本が trigger に無い: ${paths.join(', ')}`);
  for (const p of publishers) {
    assert.ok(fs.existsSync(path.join(ROOT, p)), `${p} が実在しない`);
  }
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
    '(actions|buzz-map-actions)',
    '(actions|buzz-map-actions-RENAMED)',
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
