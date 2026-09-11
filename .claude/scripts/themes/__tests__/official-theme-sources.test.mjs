import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractDx } from '../ingest-local-government-dx.mjs';
import { extractFurusato, extractDeductions } from '../ingest-furusato-donations.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');
const starts = [...Array.from({ length: 22 }, (_, i) => 7 + 6 * i), ...Array.from({ length: 8 }, (_, i) => 295 + 6 * i)];
function sheet(edition, override = () => undefined) {
  return { getRow: (r) => ({ getCell: (c) => ({ value: (() => {
    const replacement = override(r, c);
    if (replacement !== undefined) return replacement;
    if (r === 1 && c === 1) return edition === 5 ? '令和４年度実績' : '令和5年度実績';
    if (r === 6) return ({ 25: '地方税申告手続（eLTAX）', 115: '職員採用試験申込', 21: '自動車税環境性能割', 343: '転出届【市区町村のみ】', 349: '来庁予定【市区町村のみ】' })[c];
    const pref = prefectures[r - (edition === 5 ? 9 : 8)];
    if (!pref) return null;
    if (c === 2) return pref.prefCode + (edition === 5 ? '0' : '');
    if (c === 4) return pref.prefName;
    if (edition === 5) {
      if (starts.includes(c)) return '有';
      if (starts.some((start) => start + 1 === c)) return '済';
      if ([28, 118].includes(c)) return '100';
      if ([29, 119].includes(c)) return '30';
      if ([30, 120].includes(c)) return 0.3;
    } else {
      if (c === 23) return 100;
      if ([24, 25].includes(c)) return 30;
    }
    return null;
  })() }) }) };
}

test('原表ごとの率スケールと5桁地域コードを維持する', () => {
  const series = extractDx(sheet(5), sheet(6));
  assert.equal(series.size, 8);
  for (const rows of series.values()) {
    assert.equal(rows.length, 47);
    assert.equal(rows[0].areaCode, '01000');
  }
  assert.equal(series.get('prefectural-eltax-online-application-rate')[0].value, 30);
  assert.equal(series.get('prefectural-auto-environment-tax-online-application-rate')[0].value, 30);
  assert.equal(series.get('prefectural-dx-applicable-procedure-count')[0].value, 30);
});

test('公開年で原表の利用実績年度を上書きしない', () => {
  assert.throws(() => extractDx(sheet(5, (r, c) => r === 1 && c === 1 ? '令和５年度実績' : undefined), sheet(6)), /Observation year/);
});

test('オンライン申請件数の欠測や率不一致を0に置き換えない', () => {
  assert.throws(() => extractDx(sheet(5, (r, c) => r === 9 && c === 29 ? null : undefined), sheet(6)), /Missing source value/);
  assert.throws(() => extractDx(sheet(5, (r, c) => r === 9 && c === 29 ? '' : undefined), sheet(6)), /Missing source value/);
  assert.throws(() => extractDx(sheet(5), sheet(6, (r, c) => r === 8 && c === 25 ? 31 : undefined)));
});

test('オンライン化状況の未回答を未実施とみなさない', () => {
  assert.throws(() => extractDx(sheet(5, (r, c) => r === 9 && c === 7 ? null : undefined), sheet(6)), /Unknown applicability/);
});

test('ふるさと納税の調査年度と受入年度・課税年度を混同しない', () => {
  assert.throws(() => extractFurusato(sheet(5), sheet(5), new Map()));
  assert.throws(() => extractDeductions(sheet(5), new Map()));
});
