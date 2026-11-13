import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { datasetPath } from '../../../../config/datasets.mjs';
import {
  validateHashtags, requiredHashtags, readApprovedHashtags, writeHashtagRecord, HASHTAG_COUNT, HASHTAG_FILE, HASHTAG_MODEL,
} from '../lib/note-hashtags.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

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

// The table holds only what the generator decided; title / URL / series come from the article ledger.
const record = (extra = []) => ({ tags: tags(extra), sourceSha256: 'a'.repeat(64), model: HASHTAG_MODEL, generatedAt: '2026-11-12T00:00:00.000Z' });
function fixtureRoot({ hashtags = {}, articles = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'note-hashtags-'));
  for (const [id, doc] of [['note.hashtags', { hashtags }], ['note.articles', { articles }]]) {
    fs.mkdirSync(path.dirname(path.join(root, datasetPath(id))), { recursive: true });
    fs.writeFileSync(path.join(root, datasetPath(id)), `${JSON.stringify(doc, null, 2)}\n`);
  }
  return root;
}
const article = { key: 'tottori-kakei', title, noteUrl: 'https://note.com/stats47/n/n1' };

test('writing one article rewrites the whole table sorted by article key, without copied article fields', () => {
  const root = fixtureRoot({ hashtags: { 'z-last': record(), 'a-first': record() } });
  writeHashtagRecord(root, 'm-middle', { ...record(), title: 'copied', noteUrl: 'copied' });
  const text = fs.readFileSync(path.join(root, HASHTAG_FILE), 'utf8');
  const table = JSON.parse(text);
  assert.deepEqual(Object.keys(table.hashtags), ['a-first', 'm-middle', 'z-last']);
  assert.deepEqual(Object.keys(table.hashtags['m-middle']), ['tags', 'sourceSha256', 'model', 'generatedAt']);
  assert.equal(text, `${JSON.stringify(table, null, 2)}\n`);
  assert.throws(() => writeHashtagRecord(root, '../escape', record()), /invalid slug/);
});
test('approved tags are checked against the article ledger: its URL for identity, its title for required regions', () => {
  const root = fixtureRoot({ hashtags: { [article.key]: record() }, articles: [article] });
  assert.deepEqual(readApprovedHashtags(root, article.key, { noteUrl: article.noteUrl }), record().tags);
  assert.throws(() => readApprovedHashtags(root, article.key, { noteUrl: 'https://note.com/stats47/n/other' }), /identity mismatch/);
  assert.throws(() => readApprovedHashtags(root, 'not-proposed', { noteUrl: article.noteUrl }), /hashtags missing/);
  const regionless = fixtureRoot({ hashtags: { [article.key]: { ...record(), tags: tags().map((t) => (t === '#鳥取県' ? '#家計項目X' : t)) } }, articles: [article] });
  assert.throws(() => readApprovedHashtags(regionless, article.key, { noteUrl: article.noteUrl }), /missing title region: #鳥取県/);
});
test('the repository table is sorted by article key and keeps no copies of the article ledger', () => {
  const { hashtags } = JSON.parse(fs.readFileSync(path.join(ROOT, HASHTAG_FILE), 'utf8'));
  const keys = Object.keys(hashtags);
  assert.deepEqual(keys, [...keys].sort());
  for (const key of keys) assert.deepEqual(Object.keys(hashtags[key]), ['tags', 'sourceSha256', 'model', 'generatedAt'], key);
});
