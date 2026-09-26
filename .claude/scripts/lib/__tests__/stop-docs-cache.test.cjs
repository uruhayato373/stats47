const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { fingerprint, readSuccess, writeSuccess } = require('../stop-docs-cache.cjs');

test('success cache detects inputs, deletion, restored mtime, config and day changes', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-stop-cache-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'docs'));
  const file = path.join(root, 'docs/a.md');
  fs.writeFileSync(file, 'before');
  const day = new Date('2026-09-14');
  const key = fingerprint(root, day);
  const cache = path.join(root, '.local/success.json');
  writeSuccess(cache, key, key);
  assert.ok(readSuccess(cache, fingerprint(root, day)));
  const stat = fs.statSync(file);
  fs.writeFileSync(file, 'after!');
  fs.utimesSync(file, stat.atime, stat.mtime);
  assert.notEqual(fingerprint(root, day), key);
  const changed = fingerprint(root, day);
  fs.unlinkSync(file);
  assert.notEqual(fingerprint(root, day), changed);
  assert.notEqual(fingerprint(root, day), fingerprint(root, new Date('2026-09-15')));
  assert.equal(readSuccess(cache, null), false);
  writeSuccess(cache, 'incomplete', null);
  assert.equal(readSuccess(cache, 'incomplete'), false);
});

test('Stop reuses only success; validator edits and failures force validation', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-stop-hook-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const run = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(run(['init', '-q']).status, 0);
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs/a.md'), 'draft');
  fs.mkdirSync(path.join(root, '.claude/scripts/lib'), { recursive: true });
  const validator = `const fs=require('fs');fs.mkdirSync('.local',{recursive:true});fs.appendFileSync('.local/runs','x');`;
  for (const name of ['governance', 'links', 'code-refs'])
    fs.writeFileSync(path.join(root, `.claude/scripts/lib/check-docs-${name}.cjs`), validator);
  const hook = path.resolve(__dirname, '../../../hooks/check-docs-on-stop.js');
  const invoke = () => spawnSync(process.execPath, [hook], {
    cwd: root, input: '{}', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
  // 検査は governance / links / code-refs の 3 本を並行で 1 回ずつ実行する
  assert.equal(invoke().status, 0);
  assert.equal(fs.readFileSync(path.join(root, '.local/runs'), 'utf8').length, 3);
  assert.equal(invoke().stdout, '');
  assert.equal(fs.readFileSync(path.join(root, '.local/runs'), 'utf8').length, 3);
  fs.writeFileSync(path.join(root, '.claude/scripts/lib/check-docs-links.cjs'), validator + 'process.exit(1)');
  assert.equal(JSON.parse(invoke().stdout).decision, 'block');
  assert.equal(JSON.parse(invoke().stdout).decision, 'block');
  assert.equal(fs.readFileSync(path.join(root, '.local/runs'), 'utf8').length, 9);
});
