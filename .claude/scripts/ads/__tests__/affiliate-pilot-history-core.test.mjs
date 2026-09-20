import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aggregatePilotExperimentMetrics,
  buildAffiliatePilotObservation,
  parseAffiliateExperimentHistory,
} from '../lib/affiliate-pilot-history-core.mjs';

const header = 'date,days,experiment_id,variant_id,impressions,clicks,ctr\n';

test('非重複の週次variant履歴をpilot開始日以後で累積する', () => {
  const rows = parseAffiliateExperimentHistory(
    `${header}2026-09-19,7,old,A,99,9,0.1\n2026-09-26,7,pilot,discovery,600,4,0.01\n2026-10-03,7,pilot,discovery,500,6,0.01\n2026-10-03,7,pilot,decision,900,10,0.01\n`
  );
  assert.deepEqual(
    aggregatePilotExperimentMetrics({
      rows,
      experimentId: 'pilot',
      startedAt: '2026-09-20',
    }),
    [
      { variantId: 'decision', impressions: 900, clicks: 10 },
      { variantId: 'discovery', impressions: 1100, clicks: 10 },
    ]
  );
});

test('成果は露出停止後の成熟日までをpilot開始日ぴったりのASP窓が覆った場合だけ成熟扱いにする', () => {
  const plan = {
    startedAt: '2026-09-20',
    exposureEndedAt: '2026-10-18',
    outcomeMaturityDays: 30,
    variantIds: ['discovery', 'decision'],
    variantProgramRefs: { discovery: 'moshimo:2228', decision: 'moshimo:6722' },
    confounds: [],
  };
  const outcomeSources = [
    {
      programRefPrefix: 'moshimo:',
      status: 'ready',
      periodFrom: '2026-09-20',
      periodTo: '2026-11-17',
      revenueByProgramRef: { 'moshimo:2228': 1000, 'moshimo:6722': 2000 },
    },
  ];
  const observation = buildAffiliatePilotObservation({
    plan,
    experimentMetrics: [
      { variantId: 'discovery', impressions: 1200, clicks: 12 },
    ],
    outcomeSources,
    nowIso: '2026-11-17T12:00:00Z',
  });
  assert.equal(observation.maturityDate, '2026-11-17');
  assert.equal(observation.variants[0].outcomesMature, true);
  assert.equal(observation.variants[0].confirmedRevenueYen, 1000);

  const contaminated = buildAffiliatePilotObservation({
    plan,
    experimentMetrics: [],
    outcomeSources: [{ ...outcomeSources[0], periodFrom: '2026-09-19' }],
    nowIso: '2026-11-17T12:00:00Z',
  });
  assert.equal(contaminated.variants[0].outcomesMature, false);
});
