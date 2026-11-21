import assert from 'node:assert/strict';
import test from 'node:test';
import { SUBMITTED_VIEW, SUBMITTED_VIEW_SLUG, submittedViewUrl } from '../lib/coverage-submitted-view.mjs';

test('submitted view URL carries the verified pages value (SUBMITTED alone is HTTP 400)', () => {
  const url = new URL(submittedViewUrl('https://search.google.com/search-console/index?resource_id=sc-domain%3Astats47.jp'));
  assert.equal(url.searchParams.get('pages'), 'ALL_SUBMITTED_URLS');
  assert.equal(url.searchParams.get('resource_id'), 'sc-domain:stats47.jp');
  assert.equal(SUBMITTED_VIEW, 'ALL_SUBMITTED_URLS');
});

test('export slug matches the marker ingest uses to separate the submitted view', () => {
  assert.ok(SUBMITTED_VIEW_SLUG.endsWith('送信済みビュー'));
});
