import { describe, expect, it } from 'vitest';

import ledger from '../../../../data/metrics/summary-display/ledger.json';
import { shouldShowMetricTotal } from '../metric-summary-display';

describe('指標の合計表示台帳', () => {
  it('人口と確認済みの件数は表示し、日照時間と未登録の指標は表示しない', () => {
    expect(shouldShowMetricTotal('total-population')).toBe(true);
    expect(shouldShowMetricTotal('port-count')).toBe(true);
    expect(shouldShowMetricTotal('annual-sunshine-duration')).toBe(false);
    expect(shouldShowMetricTotal('unreviewed-count')).toBe(false);
  });

  it('同じ指標への矛盾する指定を許さず、すべての判断に理由を残す', () => {
    expect(new Set(ledger.entries.map((entry) => entry.metricKey)).size).toBe(ledger.entries.length);
    expect(ledger.entries.every((entry) => entry.reason.trim().length > 0 && typeof entry.showTotal === 'boolean')).toBe(true);
  });
});
