import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const STORE = '.claude/scripts/measurement/credential-store.mjs';

function trackedScripts() {
  return execFileSync('git', ['ls-files', '-z', '--', '.claude/scripts', 'scripts', 'packages', 'apps'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    // テストは「その語を含まないこと」を検査するために語そのものを書くので対象外 (読み口ではない)
    .filter((path) => /\.(mjs|cjs|js|ts|sh|ps1)$/.test(path) && !path.includes('/__tests__/') && !/(^|\/)tests\//.test(path));
}

// 意図: 資格情報ストアの読み口を 1 か所に保つ。別の場所で直接読むと、OS 切替・「ログへ出さない」・
// 失敗は null という約束が守られない読み口が増える。
test('OS の資格情報ストアを直接読むのは credential-store.mjs だけ', () => {
  const direct = /find-generic-password|\bCredRead\b|Get-StoredCredential|keytar/;
  const offenders = trackedScripts().filter((path) => path !== STORE && direct.test(readFileSync(`${ROOT}${path}`, 'utf8')));
  assert.deepEqual(offenders, []);
});

// 意図: 読み出した資格情報をログへ出さない。cred / credential をそのまま console や JSON に渡す書き方を止める。
test('計測ログインのスクリプトは資格情報をログや JSON に出さない', () => {
  for (const path of ['.claude/scripts/measurement/refresh-session.mjs', STORE]) {
    const src = readFileSync(`${ROOT}${path}`, 'utf8');
    assert.doesNotMatch(src, /console\.(log|error|warn)\([^)]*\b(cred|credential|password|totpSecret)\b/, path);
    assert.doesNotMatch(src, /JSON\.stringify\(\s*(cred|credential)\b/, path);
  }
});
