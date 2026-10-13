import assert from 'node:assert/strict';
import test from 'node:test';
import { checkRecord, expansionStatus, suggestTargets, validateExpansion } from '../lib/reference-expansion.mjs';

const analysis = (over = {}) => ({
  id: 'book-2020-a01', sourceKey: 'book', edition: '2020', resolution: 'combined-analysis',
  metricKeys: ['m1', 'm2'], surveyIds: ['s1'], contentRoles: ['ranking', 'survey', 'theme', 'blog', 'x'], ...over,
});
const index = new Map([
  ['ranking:m1', { kind: 'ranking', published: true, rankingKeys: ['m1'] }],
  ['ranking:m2', { kind: 'ranking', published: true, rankingKeys: ['m2'] }],
  ['survey:s1', { kind: 'survey', published: true, rankingKeys: [] }],
  ['theme:t', { kind: 'theme', published: true, rankingKeys: ['m1'] }],
  ['blog:post', { kind: 'blog', published: true, rankingKeys: ['m2'] }],
  ['blog:draft', { kind: 'blog', published: false, rankingKeys: [] }],
  ['sns:7', { kind: 'sns', platform: 'x', published: true, rankingKeys: ['m1'] }],
  ['sns:8', { kind: 'sns', platform: 'instagram', published: true, rankingKeys: ['m1'] }],
]);
const rec = (over) => ({ analysis: 'book-2020-a01', channel: 'blog', status: 'done', target: 'blog:post', decidedAt: '2026-10-13', decidedBy: 't', ...over });
const states = (rows) => Object.fromEntries(rows.map((r) => [r.channel, r.state]));

test('metric channels are done when every metric / survey is on a published page; content channels need a record', () => {
  const s = states(expansionStatus([analysis()], { records: [] }, index));
  assert.equal(s.ranking, 'derived');
  assert.equal(s.survey, 'derived');
  assert.equal(s.theme, 'pending', 'm2 is not on any published theme page');
  assert.equal(s.blog, 'pending', 'a shared metric alone does not realize a blog analysis');
  assert.equal(s.x, 'pending');
});

test('records decide content channels: done > declined > planned', () => {
  const rows = expansionStatus([analysis()], { records: [rec({}), rec({ channel: 'x', status: 'declined', target: undefined, reason: 'r' })] }, index);
  const s = states(rows);
  assert.equal(s.blog, 'done');
  assert.equal(s.x, 'declined');
});

test('context-only and unresolved analyses are not production units', () => {
  assert.equal(expansionStatus([analysis({ resolution: 'context-only' })], { records: [] }, index).length, 0);
  assert.equal(expansionStatus([analysis({ resolution: 'primary-source-unavailable' })], { records: [] }, index).length, 0);
});

test('a record must match the analysis roles, the channel page kind, the SNS platform and be published when done', () => {
  const a = analysis();
  assert.deepEqual(checkRecord(rec({}), a, index), []);
  assert.match(checkRecord(rec({ channel: 'note', target: 'note:x' }), a, index).join(), /contentRoles/);
  assert.match(checkRecord(rec({ target: 'theme:t' }), a, index).join(), /ページ ID ではない/);
  assert.match(checkRecord(rec({ channel: 'x', target: 'sns:8' }), a, index).join(), /instagram の投稿/);
  assert.match(checkRecord(rec({ target: 'blog:draft' }), a, index).join(), /公開中でない/);
  assert.deepEqual(checkRecord(rec({ status: 'planned', target: 'blog:draft' }), a, index), [], 'planned may point to an unpublished page');
  assert.match(checkRecord(rec({}), undefined, index).join(), /分析企画が無い/);
});

test('done and declined cannot both exist for the same analysis × channel', () => {
  const errors = validateExpansion({ records: [rec({}), rec({ status: 'declined', target: undefined, reason: 'r' })] }, [analysis()], index);
  assert.match(errors.join(), /済みと見送りが両方/);
});

test('suggestions list published pages of the channel kind that share a metric', () => {
  assert.deepEqual(suggestTargets(analysis(), 'blog', index).map((h) => h.id), ['blog:post']);
  assert.deepEqual(suggestTargets(analysis(), 'x', index).map((h) => h.id), ['sns:7']);
});
