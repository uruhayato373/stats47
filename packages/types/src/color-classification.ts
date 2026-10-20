export type ColorClassification =
  | { method: 'continuous' }
  | { method: 'equal-interval' | 'quantile'; classes: number }
  | { method: 'threshold'; thresholds: number[] };
export function assertColorClassification(
  value: unknown
): asserts value is ColorClassification {
  const record = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);
  const classification = value;
  if (!record(classification)) throw new Error('Metric classification missing');
  const method = classification.method;
  if (method === 'continuous') {
    if (Object.keys(classification).length !== 1)
      throw new Error('Invalid continuous classification');
  } else if (method === 'equal-interval' || method === 'quantile') {
    if (
      !Number.isInteger(classification.classes) ||
      Number(classification.classes) < 2 ||
      Number(classification.classes) > 9 ||
      Object.keys(classification).some(
        (k) => !['method', 'classes'].includes(k)
      )
    )
      throw new Error('Metric classes must be 2–9');
  } else if (method === 'threshold') {
    const t = classification.thresholds;
    if (
      !Array.isArray(t) ||
      !t.length ||
      t.some(
        (v, i) =>
          typeof v !== 'number' ||
          !Number.isFinite(v) ||
          (i > 0 && v <= t[i - 1])
      ) ||
      Object.keys(classification).some(
        (k) => !['method', 'thresholds'].includes(k)
      )
    )
      throw new Error('Metric thresholds must increase');
  } else throw new Error('Unknown metric classification');
}
