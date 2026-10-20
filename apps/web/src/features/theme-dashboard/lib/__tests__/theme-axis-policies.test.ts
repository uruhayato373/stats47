// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveMetricAxisPolicy } from '@/lib/metric-axis-policy';

const mocks = vi.hoisted(() => ({ metadata: vi.fn(), values: vi.fn() }));
vi.mock('@stats47/ranking/server', () => ({ readRankingItemFromR2: mocks.metadata }));
vi.mock('@stats47/stats-r2/readers', () => ({ readStatsValues: mocks.values }));

describe('theme axis policy wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.metadata.mockResolvedValue({ success: true, data: { visualization: { trendDomain: { mode: 'extent', padding: 0.08 } } } });
  });

  it('reads the metric policy once when national and selected series share an ID', async () => {
    mocks.metadata.mockResolvedValue({ success: true, data: { visualization: { trendDomain: { mode: 'fixed', min: 0, max: 100 } } } });
    expect(await resolveMetricAxisPolicy([{ metricKey: 'employment-rate' }, { metricKey: 'employment-rate', area: 'national' }])).toEqual({ mode: 'fixed', min: 0, max: 100 });
    expect(mocks.metadata).toHaveBeenCalledTimes(1);
  });

  it('preserves identical fixed policies for multiple metrics', async () => {
    mocks.metadata.mockResolvedValue({ success: true, data: { visualization: { trendDomain: { mode: 'fixed', min: 0, max: 100 } } } });
    expect(await resolveMetricAxisPolicy([{ metricKey: 'total-population' }, { metricKey: 'aging-population' }])).toEqual({mode:'fixed', min:0, max:100});
  });

  it('supports an explicit chart domain without reading observations again', async () => {
    expect(await resolveMetricAxisPolicy([{ metricKey: 'employment-rate' }], { mode: 'fixed', domain: [40, 90] })).toEqual({ mode: 'fixed', min: 40, max: 90 });
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it('synchronizes the bounds from the complete observation set', async () => {
    mocks.values.mockResolvedValue({ rows: [{ value: 10 }, { value: 90 }, { value: null }] });
    expect(await resolveMetricAxisPolicy([{ metricKey: 'employment-rate' }], { mode: 'sync' })).toEqual({ mode: 'fixed', min: 3.5999999999999996, max: 96.4 });
  });

  it('sync never discards authored fixed limits', async () => {
    mocks.metadata.mockResolvedValue({ success: true, data: { visualization: { trendDomain: { mode: 'fixed', min: 0, max: 10 } } } });
    mocks.values.mockResolvedValue({ rows: [{ value: 0 }, { value: 20 }] });
    await expect(resolveMetricAxisPolicy([{ metricKey: 'employment-rate' }], {mode:'sync'})).rejects.toThrow('excludes observations');
  });

  it('rejects missing inputs rather than synchronizing a partial set', async () => {
    mocks.values.mockResolvedValueOnce({ rows: [{ value: 0 }, { value: 20 }] }).mockResolvedValueOnce(null);
    await expect(resolveMetricAxisPolicy([{ metricKey: 'employment-rate' }, { metricKey: 'unemployment-rate' }], { mode: 'sync' })).rejects.toThrow('Missing observations');
  });

  it('fails when required metric presentation is missing', async () => {
    mocks.metadata.mockResolvedValue({ success: true, data: null });
    await expect(resolveMetricAxisPolicy([{ metricKey: 'employment-rate' }])).rejects.toThrow('Missing metric presentation');
  });
});
