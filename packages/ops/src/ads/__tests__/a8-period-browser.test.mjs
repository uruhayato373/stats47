import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRequestedPeriod, probePeriodForm } from '../fetch-a8-ui-csv.mjs';

const form = { kind: 'month', modeButtonLabel: '月指定', modeButtonRole: 'tab', start: { name: 'start', placeholder: '開始月' }, end: { name: 'end', placeholder: '終了月' }, applyButtonLabel: '絞り込む' };

test('A8 selects the observed month tab before applying the requested CSV period', async () => {
  let selected = false, applyCount = 1;
  const values = {};
  const page = {
    getByRole(role, { name }) {
      if (name === '月指定') {
        assert.equal(role, 'tab');
        return { count: async () => 1, click: async () => { selected = true; } };
      }
      assert.equal(role, 'button');
      assert.equal(name, '絞り込む');
      return { count: async () => applyCount, click: async () => {} };
    },
    locator(selector) {
      const key = selector.includes('開始月') ? 'start' : 'end';
      assert.match(selector, /:visible$/);
      return { count: async () => selected ? 1 : 0, fill: async value => { values[key] = value; }, inputValue: async () => values[key] };
    },
    waitForLoadState: async () => {}, waitForTimeout: async () => {},
  };
  const cfg = { a8: { periodForm: { 'program-detail': form } } };
  const contract = await applyRequestedPeriod(page, cfg, 'program-detail', '2026-10', '2026-10-17');
  assert.equal(contract.expectedPeriod.raw, '202610-202610');
  assert.deepEqual(values, { start: '2026年10月', end: '2026年10月' });
  applyCount = 2;
  await assert.rejects(applyRequestedPeriod(page, cfg, 'program-detail', '2026-10', '2026-10-17'), /一意でない/);
});

test('period diagnostics omit hidden/password fields and non-period values', async () => {
  const element = (type, name, value) => ({ tagName: 'INPUT', value, parentElement: null, getAttribute: key => ({ type, name }[key] ?? null), getBoundingClientRect: () => ({ width: 100, height: 20, top: 0 }) });
  const fields = [element('hidden', '_csrf', 'fixture-private-csrf'), element('password', 'password', 'fixture-private-password'), element('text', 'keywords', 'fixture-private-search'), element('text', 'start', '2026年10月')];
  const originalDocument = globalThis.document;
  const page = {
    goto: async () => {}, waitForTimeout: async () => {}, url: () => 'http://a8-fixture.test/report/site',
    evaluate: async fn => {
      globalThis.document = { querySelectorAll: selector => selector === 'input, select' ? fields : [] };
      try { return fn(); } finally { globalThis.document = originalDocument; }
    },
  };
  const probe = await probePeriodForm(page, { browser: { timeoutMs: 5000 }, a8: { baseUrl: 'http://a8-fixture.test', reports: { test: { path: '/report/site' } } } }, 'test');
  const text = JSON.stringify(probe);
  for (const secret of ['fixture-private-csrf', 'fixture-private-password', 'fixture-private-search']) assert.ok(!text.includes(secret));
  assert.ok(probe.fields.every(field => !['hidden', 'password'].includes(field.type)));
  assert.equal(probe.fields.find(field => field.name === 'start').value, '2026年10月');
});
