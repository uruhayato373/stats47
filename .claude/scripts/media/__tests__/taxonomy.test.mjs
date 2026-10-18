import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalTemplate, taxonomyQuery, purposeFromEvidence } from '../lib/taxonomy.mjs';
import { resolveClassification } from '../lib/classification.mjs';
const basis = 'a'.repeat(64);
test('a ranking destination in a background filename is not a statistical image purpose', () => {
  assert.equal(purposeFromEvidence('background','population-ranking.png'),'explanation');
  assert.equal(purposeFromEvidence('svg-scatter','ranking-comparison.svg'),'relationship');
});
test('purpose and selection never silently choose a chart instead of a table', () => {
  for (const templateId of ['ranking', 'household', 'time-series', 'map']) {
    const c = resolveClassification({
      templateId,
      file: 'image.png',
      basis,
      origin: 'contract',
    });
    assert.equal(c.templateId, 'unclassified');
    assert.equal(c.status, 'pending');
  }
  const ranking = resolveClassification({
    templateId: 'ranking',
    file: 'table-1.png',
    basis,
  });
  assert.equal(ranking.templateId, 'table');
  assert.equal(ranking.purpose, 'ranking');
  assert.equal(ranking.role, 'table');
});
test('SVG and medium variants resolve to the same visual encoding', () => {
  for (const id of ['svg-bar', 'svg-bar-card', 'svg-bar-ig'])
    assert.equal(canonicalTemplate(id), 'bar');
  assert.equal(canonicalTemplate('svg-table'), 'table');
  assert.equal(canonicalTemplate('svg-map'), 'tile-map');
  assert.equal(canonicalTemplate('svg-line'), 'line');
  assert.equal(canonicalTemplate('correlation'), 'scatter');
  assert.equal(canonicalTemplate('svg-scatter'), 'scatter');
});
test('old bookmarks preserve medium and image while moving ranking into purpose', () => {
  assert.deepEqual(
    taxonomyQuery({ template: 'ranking', medium: 'compare', image: 'IMG-1' }),
    { purpose: 'ranking', medium: 'compare', image: 'IMG-1' }
  );
  assert.deepEqual(
    taxonomyQuery({ template: 'svg-bar-ig', medium: 'instagram' }),
    { template: 'bar', medium: 'instagram' }
  );
  assert.deepEqual(taxonomyQuery({ template: 'table', purpose: 'ranking' }), {
    template: 'table',
    purpose: 'ranking',
  });
});
test('an old confirmed purpose-only classification requires visual reassignment', () => {
  const record = {
    templateId: 'ranking',
    classification: {
      role: 'chart',
      basis,
      reason: '旧分類',
      updatedAt: '2026-10-16',
    },
  };
  const c = resolveClassification({ file: 'image.png', record, basis });
  assert.equal(c.status, 'stale');
  assert.equal(c.templateId, 'unclassified');
  assert.equal(c.purpose, 'ranking');
});
