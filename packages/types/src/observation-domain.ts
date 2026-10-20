import type { StatsSchema } from './stats-schema';
import {
  resolveChartDomain,
  resolveSymmetricDomain,
  stackedNumericValues,
  type NumericDomain,
  type NumericDomainPolicy,
} from './numeric-domain';
export type ObservationDomainMode =
  'minMax' | 'zeroMax' | 'symmetric' | 'stackedMax';
export function resolveObservationDomain(
  rows: readonly StatsSchema[],
  policy: NumericDomainPolicy,
  mode: ObservationDomainMode
): NumericDomain | null {
  let values = rows.map((row) => row.value);
  if (mode === 'stackedMax') {
    const groups = new Map<string, Record<string, number>>();
    for (const row of rows) {
      if (row.value === null || !Number.isFinite(row.value)) continue;
      const key = row.areaCode + ':' + row.yearCode;
      const group = groups.get(key) ?? {};
      group[row.metricKey] = row.value;
      groups.set(key, group);
    }
    values = stackedNumericValues(
      [...groups.values()],
      [...new Set(rows.map((row) => row.metricKey))]
    );
  }
  if (mode === 'symmetric') {
    const signed = values.flatMap((value) =>
      value === null ? [] : [Math.abs(value), -Math.abs(value)]
    );
    return policy.mode === 'fixed'
      ? resolveChartDomain(signed, policy)
      : resolveSymmetricDomain(signed);
  }
  return resolveChartDomain(
    values,
    mode === 'stackedMax' && policy.mode !== 'fixed'
      ? { ...policy, mode: 'zero' }
      : policy
  );
}
