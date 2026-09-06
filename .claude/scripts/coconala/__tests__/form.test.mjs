import test from 'node:test';
import assert from 'node:assert/strict';
import { fillServiceForm } from '../lib/coconala-form.mjs';

const inactivePage = (count) => ({
  evaluate: async () => false,
  locator: () => ({
    count: async () => count,
    isVisible: async () => false,
    click: async () => { throw new Error('must not click inactive controls'); },
  }),
});

test('非表示の提供形式を強制変更せずカテゴリ非適用として報告する', async () => {
  const result = await fillServiceForm(inactivePage(1), { provisionFormat: 3 });
  assert.deepEqual(result.warnings, []);
  assert.match(result.log.join('\n'), /category-inactive/);
});

test('提供形式selectorの消失をカテゴリ非適用と誤認しない', async () => {
  const result = await fillServiceForm(inactivePage(0), { provisionFormat: 3 });
  assert.match(result.warnings.join('\n'), /selector 不在/);
  assert.doesNotMatch(result.log.join('\n'), /category-inactive/);
});
