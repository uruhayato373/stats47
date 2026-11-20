import test from 'node:test';
import assert from 'node:assert/strict';

import {
  completeMoshimoRecords,
  evaluateMoshimoOutcomeGate,
  parseCountAndYen,
  parseMoshimoPromotionRows,
} from '../lib/moshimo-report-core.mjs';

test('件数・金額セルとプロモーション行を決定的に正規化する', () => {
  assert.deepEqual(parseCountAndYen('1 件 1,234 円'), { count: 1, yen: 1234 });
  const records = parseMoshimoPromotionRows([
    {
      programId: '7494',
      programName: 'AI鬼管理',
      cells: [
        'AI鬼管理',
        '',
        '4',
        '1 件 0 円',
        '2 件 8,000 円',
        '1 件 4,000 円',
        '25.0%',
        '50.0%',
        '0.0円',
      ],
    },
  ]);
  assert.deepEqual(records, [
    {
      programId: '7494',
      programRef: 'moshimo:7494',
      programName: 'AI鬼管理',
      impressions: 4,
      clicks: 1,
      clickRevenueYen: 0,
      conversions: 2,
      grossRevenueYen: 8000,
      approved: 1,
      revenueYen: 4000,
    },
  ]);
});

test('完全レポートに行が無いapproved案件を確認済みzeroとして補う', () => {
  const records = completeMoshimoRecords(
    [
      {
        programId: '55',
        programRef: 'moshimo:55',
        programName: '楽天',
        impressions: 2,
        clicks: 1,
        conversions: 0,
        approved: 0,
        revenueYen: 0,
      },
    ],
    [
      { programId: '55', programName: '楽天' },
      { programId: '1863', programName: '食べチョク' },
    ]
  );
  assert.equal(records.length, 2);
  assert.equal(records[0].programRef, 'moshimo:55');
  assert.equal(records[0].observedInReport, true);
  assert.equal(records[1].programRef, 'moshimo:1863');
  assert.equal(records[1].revenueYen, 0);
  assert.equal(records[1].observedInReport, false);
});

test('stats47 site scopeと10日鮮度をgateする', () => {
  const state = {
    schemaVersion: 1,
    updatedAt: '2026-09-20T00:00:00.000Z',
    source: { site: 'stats47', siteId: '638943' },
    coverage: { complete: true },
    records: [],
  };
  assert.equal(
    evaluateMoshimoOutcomeGate(state, '2026-09-29T00:00:00.000Z').status,
    'ready'
  );
  assert.equal(
    evaluateMoshimoOutcomeGate(state, '2026-10-01T00:00:00.000Z').status,
    'blocked'
  );
  assert.deepEqual(
    evaluateMoshimoOutcomeGate(
      { ...state, source: { site: 'doboku-note', siteId: '672381' } },
      '2026-09-20T00:00:00.000Z'
    ).reasons,
    ['moshimo-site-scope-invalid']
  );
});
