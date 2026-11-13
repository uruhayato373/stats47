import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { verifyIngestReport } from '../verify-external-ingest.mjs';

/**
 * R2 へ上げる直前の検査が、壊れた値・報告と違うファイル・想定外の場所を通さないことを守る。
 * この検査が素通りすると、取り込みの報告は PASS のまま、47 県そろわない値や別の場所のファイルが本番の R2 に出る。
 */
const require = createRequire(import.meta.url);
const prefectures = require('../../lib/prefectures.cjs').PREFECTURES;
const sha = (text) => createHash('sha256').update(text).digest('hex');

const KEY = 'app/stats/health-checkup-smoking-rate/values.json';

function payload(overrides = {}) {
  const rows = prefectures.map((p, i) => ({
    areaCode: p.prefCode, areaName: p.prefName, yearCode: '2023', yearName: '2023年度', value: 20 + i / 10, unit: '％',
  }));
  return {
    metricKey: 'health-checkup-smoking-rate',
    entityKind: 'prefecture',
    rows,
    meta: { generatedAt: '2026-11-13T00:00:00.000Z', rowCount: rows.length, areaCount: 47, yearRange: ['2023', '2023'], recipe: { configHash: 'abc' } },
    ...overrides,
  };
}

/** 中身から報告と読み出し関数を組み立てる。reportOverrides で報告だけを差し替える */
function staged(body, reportOverrides = {}, key = KEY) {
  const content = JSON.stringify(body);
  const report = { status: 'PASS', localStaged: true, metrics: 1, files: [{ key, sha256: sha(content) }], ...reportOverrides };
  return { report, read: () => content };
}

test('47 都道府県そろった値と、それを指す報告なら、上げるキーを返す', () => {
  const { report, read } = staged(payload());

  assert.deepEqual(verifyIngestReport(report, read), [KEY]);
});

test('取り込みが PASS でない・手元に書いていない報告は通さない', () => {
  const ok = staged(payload());

  assert.throws(() => verifyIngestReport({ ...ok.report, status: 'FAIL' }, ok.read), /not PASS/);
  assert.throws(() => verifyIngestReport({ ...ok.report, localStaged: false }, ok.read), /did not stage/);
  assert.throws(() => verifyIngestReport({ ...ok.report, files: [] }, ok.read), /no files/);
});

test('報告のハッシュと手元のファイルの中身が違えば通さない', () => {
  const { report } = staged(payload());
  const tampered = JSON.stringify(payload({ rows: payload().rows.map((r) => ({ ...r, value: r.value * 2 })) }));

  assert.throws(() => verifyIngestReport(report, () => tampered), /differs from the ingest report/);
});

test('観測値の都道府県の値以外の場所は上げない', () => {
  for (const key of [
    'app/ranking/health-checkup-smoking-rate/values.json',
    'app/stats/health-checkup-smoking-rate/cities.json',
    'app/stats/../home/featured.json',
    'gis/mlit-ksj/N03/values.json',
  ]) {
    const { report, read } = staged(payload(), {}, key);
    assert.throws(() => verifyIngestReport(report, read), /outside app\/stats/, key);
  }
});

test('ファイルの中の指標キーが置き場と違えば通さない', () => {
  const { report, read } = staged(payload({ metricKey: 'health-checkup-daily-drinking-rate' }));

  assert.throws(() => verifyIngestReport(report, read), /metricKey mismatch/);
});

test('47 県そろわない・同じ県が 2 行ある値は通さない', () => {
  const full = payload();
  const missing = staged({ ...full, rows: full.rows.slice(0, 46), meta: { ...full.meta, rowCount: 46 } });
  const duplicated = staged({ ...full, rows: [...full.rows.slice(0, 46), full.rows[0]] });

  assert.throws(() => verifyIngestReport(missing.report, missing.read), /47 prefectures required/);
  assert.throws(() => verifyIngestReport(duplicated.report, duplicated.read), /duplicate prefecture/);
});

test('数値でない値・県でない地域コード・4 桁でない年は通さない', () => {
  const full = payload();
  const withRow = (row) => staged({ ...full, rows: [{ ...full.rows[0], ...row }, ...full.rows.slice(1)] });

  for (const [row, pattern] of [
    [{ value: null }, /non-finite value/],
    [{ value: Number.NaN }, /non-finite value/],
    [{ areaCode: '00000' }, /invalid prefecture code/],
    [{ areaCode: '13101' }, /invalid prefecture code/],
    [{ yearCode: '2023100000' }, /yearCode must be 4 digits/],
  ]) {
    const { report, read } = withRow(row);
    assert.throws(() => verifyIngestReport(report, read), pattern);
  }
});

test('取得レシピの無い値は通さない (R2 の値が指標定義より古いことを追えなくなる)', () => {
  const full = payload();
  const { report, read } = staged({ ...full, meta: { ...full.meta, recipe: undefined } });

  assert.throws(() => verifyIngestReport(report, read), /recipe is missing/);
});
