import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeWeekRanges, fetchGa4Weekly } from '../../lib/metrics-reader.mjs';

const row = (values, channel) => ({
  metricValues: values.map(value => ({ value: String(value) })),
  ...(channel ? { dimensionValues: [{ value: channel }] } : {}),
});
const ranges = computeWeekRanges({ week: '2026-W41', now: Date.parse('2026-10-17') }).ga4;

test('Japan KPI totals use dimensionless period reports rather than adding channel rows', async () => {
  const calls = [];
  const result = await fetchGa4Weekly(ranges, { runReport: async request => {
    calls.push(request);
    if (!request.dimensionFilter) return { rows: [row([7636, 5000])] };
    const current = request.dateRanges[0].startDate === ranges.this.start;
    if (request.dimensions) return { rows: [row([5513, 6270, 4266, .68], 'Organic Search')] };
    return { rows: [row(current ? [5484, 6242, 4245] : [4872, 5651, 4021])] };
  } });
  assert.equal(result.total.thisUsers, 5484);
  assert.equal(result.total.thisSessions, 6242);
  assert.equal(result.total.thisEngagedSessions, 4245);
  assert.equal(result.total.prevUsers, 4872);
  assert.equal(result.total.prevSessions, 5651);
  assert.equal(result.total.prevEngagedSessions, 4021);
  assert.equal(result.channels[0].thisSessions, 6270);
  assert.equal(result.pollution.jpSessions, 6242);
  const totals = calls.filter(request => request.dimensionFilter && !request.dimensions);
  assert.equal(totals.length, 2);
  assert.deepEqual(totals.map(request => request.dateRanges[0]), [
    { startDate: ranges.this.start, endDate: ranges.this.end },
    { startDate: ranges.prev.start, endDate: ranges.prev.end },
  ]);
  assert.ok(totals.every(request => request.dimensionFilter.filter.stringFilter.value === 'Japan'));
});

test('missing Japan aggregate data fails instead of falling back to channel sums or zero', async () => {
  await assert.rejects(fetchGa4Weekly(ranges, { runReport: async () => ({ rows: [] }) }), /insufficient-data/);
});

test('measured zero remains valid and is distinct from missing aggregates', async () => {
  const result = await fetchGa4Weekly(ranges, { runReport: async request => ({
    rows: [row(request.dimensions ? [0, 0, 0, 0] : request.dimensionFilter ? [0, 0, 0] : [0, 0], request.dimensions ? 'Direct' : null)],
  }) });
  assert.equal(result.total.thisSessions, 0);
  assert.equal(result.total.thisEngagedSessions, 0);
});
