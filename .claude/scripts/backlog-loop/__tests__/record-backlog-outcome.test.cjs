'use strict';

/**
 * 台帳の記録コマンドの契約。
 *
 * 1. 並行して呼んでも記録が欠けない (読む → 足す → 書くの間に他のプロセスが割り込むと、
 *    後から書いた側が先の記録を消す)
 * 2. 割当表に無い class を台帳へ入れない (class×model の成功率の集計キーが増殖する)
 *
 * 実物の台帳には書かない。BACKLOG_LEDGER_PATH で一時ファイルを渡す。
 */

const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const CLI = path.resolve(__dirname, '../record-backlog-outcome.mjs');
const PARALLEL = 24;

function tmpLedger() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-ledger-'));
  return { dir, ledgerPath: path.join(dir, 'ledger.json') };
}

function args(id, className = 'stale') {
  return [CLI, '--id', id, '--class', className, '--outcome', 'completed', '--gate-commands', 'true', '--gate-pass', '--evidence', 'テスト'];
}

function run(id, ledgerPath) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args(id), { env: { ...process.env, BACKLOG_LEDGER_PATH: ledgerPath }, stdio: 'ignore' });
    child.on('close', (code) => resolve(code));
  });
}

test('並行して記録しても 1 件も欠けない', async () => {
  const { dir, ledgerPath } = tmpLedger();
  try {
    const ids = Array.from({ length: PARALLEL }, (_, i) => `PARALLEL-RECORD-${String(i + 1).padStart(2, '0')}`);
    const codes = await Promise.all(ids.map((id) => run(id, ledgerPath)));
    assert.deepEqual(codes, ids.map(() => 0));
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    assert.deepEqual(Object.keys(ledger.items).sort(), ids);
    assert.deepEqual(fs.readdirSync(dir), ['ledger.json'], 'ロックと一時ファイルを残さない');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('割当表に無い class は記録せずに止める', () => {
  const { dir, ledgerPath } = tmpLedger();
  try {
    const result = spawnSync(process.execPath, args('UNKNOWN-CLASS-01', 'made-up-class'), {
      env: { ...process.env, BACKLOG_LEDGER_PATH: ledgerPath },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--class は .*stale/);
    assert.equal(fs.existsSync(ledgerPath), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
