import ledger from '../../../data/metrics/summary-display/ledger.json';

/** 合計表示の判断は metrics.summary-display 台帳だけが持つ。未登録は非表示。 */
export function shouldShowMetricTotal(metricKey: string): boolean {
  return ledger.entries.some((entry) => entry.metricKey === metricKey && entry.showTotal);
}
