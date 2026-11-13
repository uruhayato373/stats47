// ルート package.json の npm script が使う実行ツールを、ルート自身が宣言していることを固定する。
// workspace からの巻き上げで偶然解決している状態は、workspace 側の依存整理で突然壊れるため。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../../../..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const declared = { ...pkg.dependencies, ...pkg.devDependencies };

// コマンド先頭の `tsx ...` と `node --import tsx` の両方を tsx の利用とみなす
const TSX_USAGE = /(?:^|&&\s*|\|\|\s*|;\s*)tsx\s|--import[ =]tsx\b/;

test('tsx を使うルートの npm script がある限り、ルートの dependencies に tsx がある', () => {
  const users = Object.entries(pkg.scripts)
    .filter(([, command]) => TSX_USAGE.test(command))
    .map(([name]) => name);
  assert.ok(users.length > 0, 'tsx を使う script が見つからない (検出式が壊れている)');
  assert.ok(
    declared.tsx,
    `ルート package.json が tsx を宣言していない (使用: ${users.slice(0, 5).join(', ')} ほか ${users.length} 件)`
  );
});

test('engines.node は .nvmrc の major と矛盾しない', () => {
  const nvmMajor = Number(fs.readFileSync(path.join(ROOT, '.nvmrc'), 'utf8').trim().split('.')[0]);
  const min = Number(/>=\s*(\d+)/.exec(pkg.engines.node)?.[1]);
  assert.equal(min, nvmMajor);
});
