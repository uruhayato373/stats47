import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateHashtags, requiredHashtags, HASHTAG_COUNT } from '../lib/note-hashtags.mjs';

const title = '鳥取県の家計は何にお金が偏っているか';
const text = '2024年の家計調査で鳥取市の住居費は全国平均を上回る。';
const tags = (extra = []) => ['#鳥取県', ...extra, ...Array.from({ length: HASHTAG_COUNT }, (_, i) => `#家計項目${i}`)].slice(0, HASHTAG_COUNT);

test('99 meaningful unique tags pass', () => {
  assert.deepEqual(validateHashtags(tags(['#2024年']), { title, text }), { ok: true, errors: [] });
});
test('generic note tags, wrong count, duplicates and bad format are rejected', () => {
  for (const [list, pattern] of [
    [tags(['#毎日note']), /generic/],
    [tags().slice(0, 98), /count 98/],
    [[...tags().slice(0, 98), '#鳥取県'], /duplicate/],
    [tags(['#家計 調査']), /format/],
    [tags(['#2024']), /numbers only/],
  ]) assert.match(validateHashtags(list, { title, text }).errors.join('\n'), pattern);
});
test('year tags must appear in the article; a stored file is rechecked without the body', () => {
  assert.match(validateHashtags(tags(['#2019年']), { title, text }).errors.join('\n'), /year not in article/);
  assert.equal(validateHashtags(tags(['#2019年']), { title, text: null }).ok, true);
});
test('a prefecture in the title must have its own tag', () => {
  assert.deepEqual(requiredHashtags(title), ['#鳥取県']);
  const withoutRegion = Array.from({ length: HASHTAG_COUNT }, (_, i) => `#家計項目${i}`);
  assert.match(validateHashtags(withoutRegion, { title, text }).errors.join('\n'), /missing title region: #鳥取県/);
});
test('tags that differ only in case are duplicates, because note merges them', () => {
  const list = [...tags().slice(0, 98), '#家計項目0'.replace('家計項目0', 'KAKEI'), ];
  list[97] = '#kakei';
  assert.match(validateHashtags(list, { title, text }).errors.join('\n'), /duplicate: #KAKEI/);
});
test('characters note drops are rejected before publishing', () => {
  assert.match(validateHashtags(tags(['#αモデル']), { title, text }).errors.join('\n'), /characters note drops: #αモデル/);
  assert.equal(validateHashtags(tags(['#ClaudeCode', '#e_Stat', '#生成AI']), { title, text }).ok, true);
});
