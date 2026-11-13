import assert from 'node:assert/strict';
import test from 'node:test';
import { SUBMITTED_VIEW, SUBMITTED_VIEW_SLUG, submittedViewUrl } from '../export-coverage-playwright.mjs';

test('submitted view URL carries the verified pages value (SUBMITTED alone is HTTP 400)', () => {
  const url = new URL(submittedViewUrl('https://search.google.com/search-console/index?resource_id=sc-domain%3Astats47.jp'));
  assert.equal(url.searchParams.get('pages'), 'ALL_SUBMITTED_URLS');
  assert.equal(url.searchParams.get('resource_id'), 'sc-domain:stats47.jp');
  assert.equal(SUBMITTED_VIEW, 'ALL_SUBMITTED_URLS');
});

test('export slug matches the marker ingest uses to separate the submitted view', async () => {
  const { readFileSync } = await import('node:fs');
  const py = readFileSync(new URL('../ingest-gsc-export.py', import.meta.url), 'utf8');
  assert.match(py, new RegExp(`SUBMITTED_MARKER = "${SUBMITTED_VIEW_SLUG.slice(3)}"`));
  assert.ok(SUBMITTED_VIEW_SLUG.endsWith('送信済みビュー'));
});
