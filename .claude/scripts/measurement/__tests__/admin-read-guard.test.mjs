import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { allowOwnerRequest, checkBashCommand, checkBrowserInput } from '../admin-read-guard.mjs';

// 意図 (2026-10-20 オーナー判断): ログインが要る計測は木曜に Mac が記録する。セッションは記録から判断し、
// 管理画面を読むためにブラウザを開かない。投稿・申請・出品と、オーナーが会話で頼んだ取得は止めない。
const withRoot = (fn) => {
  const root = mkdtempSync(join(tmpdir(), 'stats47-admin-read-'));
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
};

test('browser MCP: reading admin pages is denied with the records to read instead', () => withRoot((root) => {
  for (const url of ['https://pub.a8.net/a8v2/media/memberAction.do', 'https://affiliate.rakuten.co.jp/report/summary',
    'https://note.com/dashboard', 'https://kdpreports.amazon.co.jp/dashboard', 'https://search.google.com/search-console?resource_id=sc-domain:stats47.jp',
    'https://analytics.google.com/analytics/web/', 'https://adsense.google.com/adsense/u/0/']) {
    const reason = checkBrowserInput({ url }, { root });
    assert.match(reason ?? '', /data\//, url);
    assert.match(reason, /recorded-measurement-first\.md/);
  }
  // 一括操作の中の URL も見る
  assert.ok(checkBrowserInput({ actions: [{ name: 'navigate', input: { url: 'https://note.com/dashboard' } }] }, { root }));
}));

test('browser MCP: publishing, applying and local previews are not blocked', () => withRoot((root) => {
  for (const url of ['https://note.com/notes/new', 'https://note.com/stats47/n/n1234', 'https://kdp.amazon.co.jp/ja_JP/bookshelf',
    'https://affiliate.rakuten.co.jp/link/', 'http://localhost:3000/ranking', 'https://stats47.jp/blog/x', 'https://x.com/i/account_analytics']) {
    assert.equal(checkBrowserInput({ url }, { root }), null, url);
  }
  assert.equal(checkBrowserInput(null, { root }), null);
}));

test('Bash: running a reader script or browser-use on an admin page is denied; mentioning it is not', () => withRoot((root) => {
  for (const command of ['node .claude/scripts/ads/fetch-a8-ui-csv.mjs --month 2026-10', 'cd /x && node .claude/scripts/ads/rakuten-report.mjs',
    'npx -y tsx .claude/skills/ads/scout-asp/scripts/a8-browser.ts check-approval', 'npm run note:metrics:fetch',
    'node .claude/scripts/measurement/collect-local.mjs --main-root ~/stats47 a8', 'node .claude/scripts/kdp/kdp-reports-probe.mjs',
    'browser-use --profile x open https://note.com/dashboard']) {
    assert.ok(checkBashCommand(command, { root }), command);
  }
  for (const command of ['grep -n fetch-a8-ui-csv.mjs .claude/skills/ads/a8-report/SKILL.md', "echo 'node .claude/scripts/ads/rakuten-report.mjs'",
    'npx -y tsx .claude/skills/ads/scout-asp/scripts/a8-browser.ts apply --id 1', 'browser-use open https://note.com/notes/new',
    'node .claude/scripts/metrics/gsc-query.mjs --dims query', 'node --test .claude/scripts/measurement/__tests__/admin-read-guard.test.mjs']) {
    assert.equal(checkBashCommand(command, { root }), null, command);
  }
}));

test('the owner request passes for 60 minutes and is logged; the env prefix passes one command', () => withRoot((root) => {
  const now = Date.parse('2026-10-22T10:00:00Z');
  assert.ok(checkBrowserInput({ url: 'https://note.com/dashboard' }, { root, now }));
  allowOwnerRequest('note のダッシュボードを見て確かめて', { root, now });
  assert.equal(checkBrowserInput({ url: 'https://note.com/dashboard' }, { root, now: now + 59 * 60000 }), null);
  assert.ok(checkBrowserInput({ url: 'https://note.com/dashboard' }, { root, now: now + 61 * 60000 }), 'expired');
  assert.throws(() => allowOwnerRequest('  ', { root, now }), /引用/);
  assert.equal(checkBashCommand('STATS47_OWNER_REQUESTED=1 node .claude/scripts/ads/rakuten-report.mjs', { root, now: now + 2 * 3600000 }), null);
}));

test('both hooks deny through the real stdin contract and pass unreadable input', () => {
  const run = (hook, payload) => execFileSync(process.execPath, [resolve(hook)], { input: payload, encoding: 'utf8' });
  const deny = (out) => JSON.parse(out).hookSpecificOutput.permissionDecision;
  assert.equal(deny(run('.claude/hooks/pre-browser-admin-read.mjs', JSON.stringify({ tool_name: 'mcp__Claude_Browser__navigate', tool_input: { url: 'https://pub.a8.net/' } }))), 'deny');
  assert.equal(run('.claude/hooks/pre-browser-admin-read.mjs', 'not json'), '');
  assert.equal(deny(run('.claude/hooks/pre-bash-safety.js', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'node .claude/scripts/ads/affiliate-status.mjs' } }))), 'deny');
  assert.equal(run('.claude/hooks/pre-bash-safety.js', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls data/affiliate' } })), '');
});
