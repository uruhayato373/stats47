// audit-chart-provenance.mjs の引数処理。--help でも全件監査して是正キューを書き換えていた
// (BLOG-AUDIT-PROVENANCE-HELP-01) ため、説明要求と未知の引数では何も書かないことを固定する。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { datasetDir } from '../../../../config/datasets.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const SCRIPT = path.join(HERE, '..', 'audit-chart-provenance.mjs');
const OUTPUTS = ['chart-provenance-queue.json', 'chart-provenance-LATEST.md'].map((f) =>
  path.join(ROOT, datasetDir('blog.operations'), f)
);

function snapshot() {
  return OUTPUTS.map((f) =>
    fs.existsSync(f) ? `${fs.statSync(f).mtimeMs}:${fs.readFileSync(f, 'utf8').length}` : 'absent'
  );
}

function run(args) {
  // 監査本体へ進んでしまった場合にも外部へ出ないよう、到達不能な R2 を指す
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, R2_PUBLIC_FETCH_URL: 'http://127.0.0.1:9' },
  });
}

for (const flag of ['--help', '-h']) {
  test(`${flag} は使い方を出して exit 0 で終わり、出力ファイルを書き換えない`, () => {
    const before = snapshot();
    const r = run([flag]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Usage:/);
    assert.deepEqual(snapshot(), before);
  });
}

test('未知の引数は書き込まずにエラー終了する', () => {
  const before = snapshot();
  const r = run(['--bogus']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /unknown argument: --bogus/);
  assert.deepEqual(snapshot(), before);
});

test('--limit の値が欠けていたら書き込まずにエラー終了する', () => {
  const before = snapshot();
  const r = run(['--limit']);
  assert.notEqual(r.status, 0);
  assert.deepEqual(snapshot(), before);
});
