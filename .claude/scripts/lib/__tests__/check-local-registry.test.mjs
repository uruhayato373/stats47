import assert from 'node:assert/strict';
import test from 'node:test';
import { auditLocalRefs } from '../check-local-registry.mjs';

const config = {
  localRegistry: [{ pattern: 'playwright-*-profile', kind: 'auth', why: 'ログイン済みブラウザ' }],
  cachePaths: ['apps/web/.next/cache', { path: '.local/ci/*', ageDays: 14 }],
  protectedPaths: ['.local/affiliate-status'],
};

test('台帳に無い .local の置き場を書くコードを止める (一回きりの作業出力が溜まった 2026-11-08 の再発防止)', () => {
  const files = [{ path: '.claude/scripts/x/probe.mjs', text: "const out = join(ROOT, '.local/probe-run/result.json');" }];
  assert.deepEqual(auditLocalRefs(files, config), [{ path: '.claude/scripts/x/probe.mjs', name: 'probe-run' }]);
});

test('cachePaths・localRegistry・protectedPaths に載る名前は通す', () => {
  const files = [
    { path: 'a.mjs', text: "'.local/ci/catalog.json' '.local/playwright-x-profile' '.local/affiliate-status/a.json'" },
    { path: '.agents/skills/a/SKILL.md', text: '画像は `.local/ci/x` に置く。' },
  ];
  assert.deepEqual(auditLocalRefs(files, config), []);
});

test('テンプレート・説明用の書き方・テスト・文末の句点は名前に数えない', () => {
  const files = [
    { path: 'a.mjs', text: 'join(root, `.local/${name}`); // .local/<id>/ に書く' },
    { path: 'b/__tests__/c.test.mjs', text: "'.local/unregistered-in-test'" },
    { path: 'd.ts', text: '/** One local review from .local/ci. */' },
    { path: 'apps/admin/x.ts', text: "path.join(root, 'apps/admin/.local/next-dev')" },
  ];
  assert.deepEqual(auditLocalRefs(files, config), []);
});

test('SKILL.md やエージェント定義に書かれた新しい置き場も止める', () => {
  const files = [{ path: '.claude/agents/foo.md', text: '結果は `.local/foo-scratch/` に保存する。' }];
  assert.deepEqual(auditLocalRefs(files, config), [{ path: '.claude/agents/foo.md', name: 'foo-scratch' }]);
});
