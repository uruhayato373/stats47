/** Authored limits use observation units, before display conversion. */
export type NumericDomainPolicy =
  | { mode: 'extent'; padding?: number }
  | { mode: 'zero'; padding?: number }
  | { mode: 'fixed'; min: number; max: number };

/** Truncated bar axes must expose their bounds and the omitted zero baseline. */
export type BarDomainPolicy = NumericDomainPolicy;
export const DEFAULT_BAR_DOMAIN = {
  mode: 'extent',
} as const satisfies BarDomainPolicy;

export type NumericDomain = [number, number];
export type NumericValue = number | null | undefined;

/** Which population supplies values is independent of the numeric range policy. */
export type YAxisConfig =
  | { mode: 'auto' | 'sync'; domain?: never }
  | { mode: 'fixed'; domain: NumericDomain };

export function selectNumericDomainPolicy(
  policies: readonly NumericDomainPolicy[],
  fallback: NumericDomainPolicy
): NumericDomainPolicy {
  if (!policies.length) return fallback;
  const first = policies[0];
  const same = policies.every(
    (p) =>
      p.mode === first.mode &&
      (p.mode === 'fixed' && first.mode === 'fixed'
        ? p.min === first.min && p.max === first.max
        : p.mode !== 'fixed' &&
          first.mode !== 'fixed' &&
          (p.padding ?? 0) === (first.padding ?? 0))
  );
  if (!same)
    throw new Error(
      'Conflicting axis policies: supply an explicit chart policy or separate axes'
    );
  return first;
}

/** Renderers consume the resolved domain verbatim, without nice() or a second extent. */
export function resolveChartDomain(
  values: readonly NumericValue[],
  policy: NumericDomainPolicy,
  domain?: NumericDomain
): NumericDomain | null {
  if (domain) {
    if (
      policy.mode === 'fixed' &&
      (domain[0] !== policy.min || domain[1] !== policy.max)
    )
      throw new Error('Resolved axis conflicts with fixed policy');
    const fixed = { mode: 'fixed', min: domain[0], max: domain[1] } as const;
    return resolveBarDomain(values, fixed);
  }
  return resolveBarDomain(values, policy);
}

export function numericSeriesValues(
  rows: readonly Record<string, unknown>[],
  keys: readonly string[]
): number[] {
  return rows.flatMap((row) =>
    keys.flatMap((key) => {
      const value = row[key];
      return typeof value === 'number' && Number.isFinite(value) ? [value] : [];
    })
  );
}

export function resolveSeriesDomain(
  rows: readonly Record<string, unknown>[],
  keys: readonly string[],
  policy: NumericDomainPolicy,
  zeroBaseline = false
): NumericDomain | undefined {
  const effective =
    zeroBaseline && policy.mode !== 'fixed'
      ? { ...policy, mode: 'zero' as const }
      : policy;
  const domain = resolveChartDomain(numericSeriesValues(rows, keys), effective);
  if (zeroBaseline && domain && (domain[0] > 0 || domain[1] < 0))
    throw new Error('Bar domain must include zero');
  return domain ?? undefined;
}

/** Each row contributes separate positive/negative totals; missing values contribute neither. */
export function stackedNumericValues(
  rows: readonly Record<string, unknown>[],
  keys: readonly string[]
): number[] {
  return rows.flatMap((row) => {
    const values = numericSeriesValues([row], keys);
    return values.length
      ? [
          values.reduce((s, v) => s + Math.min(0, v), 0),
          values.reduce((s, v) => s + Math.max(0, v), 0),
        ]
      : [];
  });
}

export function resolveSymmetricDomain(
  values: readonly NumericValue[],
  midpoint = 0
): NumericDomain | null {
  const domain = resolveNumericDomain(values, { mode: 'extent' });
  if (!domain) return null;
  if (!Number.isFinite(midpoint)) throw new Error('Invalid axis midpoint');
  const radius = Math.max(
    Math.abs(domain[0] - midpoint),
    Math.abs(domain[1] - midpoint)
  );
  return [midpoint - radius, midpoint + radius];
}

/** Only presentation changes here: observation values and authored limits retain their units. */
export function scaleNumericDomain(
  domain: NumericDomain,
  factor: number
): NumericDomain {
  if (!Number.isFinite(factor) || factor <= 0)
    throw new Error('Display factor must be positive and finite');
  return [domain[0] * factor, domain[1] * factor];
}

/** Shared bar-axis policy; reject clipping instead of changing authored fixed limits. */
export function resolveBarDomain(
  values: readonly (number | null | undefined)[],
  policy: BarDomainPolicy = DEFAULT_BAR_DOMAIN
): [number, number] | null {
  const domain = resolveNumericDomain(values, policy);
  if (!domain) return null;
  const stats = summarizeNumericValues(values)!;
  const tolerance =
    Number.EPSILON * Math.max(1, Math.abs(domain[0]), Math.abs(domain[1])) * 16;
  if (stats.min < domain[0] - tolerance || stats.max > domain[1] + tolerance)
    throw new Error('Bar domain excludes observations');
  return domain;
}

/** Finite, present observations only; national aggregates belong to a separate series. */
export function summarizeNumericValues(
  values: readonly (number | null | undefined)[]
) {
  const sorted = values
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const mean = sorted.reduce((sum, value) => sum + value, 0) / count;
  const middle = Math.floor(count / 2);
  const median =
    count % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return { count, min, max, mean, median, sorted };
}

export function resolveNumericDomain(
  values: readonly (number | null | undefined)[],
  policy: NumericDomainPolicy
): [number, number] | null {
  if (!isNumericDomainPolicy(policy))
    throw new Error('Invalid numeric domain policy');
  const stats = summarizeNumericValues(values);
  if (!stats) return null;
  if (policy.mode === 'fixed') {
    if (
      !Number.isFinite(policy.min) ||
      !Number.isFinite(policy.max) ||
      policy.min >= policy.max
    )
      throw new Error('Invalid fixed numeric domain');
    return [policy.min, policy.max];
  }
  let min = policy.mode === 'zero' ? Math.min(0, stats.min) : stats.min;
  let max = policy.mode === 'zero' ? Math.max(0, stats.max) : stats.max;
  if (policy.mode === 'zero' && min === 0 && max === 0) return [0, 1];
  const span = max - min || Math.max(Math.abs(min) * 0.02, 1);
  if (min === max) {
    min -= span / 2;
    max += span / 2;
  }
  const padding = (policy.padding ?? 0) * span;
  if (!Number.isFinite(padding) || padding < 0)
    throw new Error('Invalid numeric domain padding');
  return [
    policy.mode === 'zero' && min === 0 ? 0 : min - padding,
    policy.mode === 'zero' && max === 0 ? 0 : max + padding,
  ];
}

export function isNumericDomainPolicy(v: unknown): v is NumericDomainPolicy {
  const record = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

  if (!record(v)) return false;
  if (v.mode === 'fixed')
    return (
      typeof v.min === 'number' &&
      typeof v.max === 'number' &&
      Number.isFinite(v.min) &&
      Number.isFinite(v.max) &&
      v.min < v.max &&
      Object.keys(v).every((k) => ['mode', 'min', 'max'].includes(k))
    );
  return (
    ['extent', 'zero'].includes(String(v.mode)) &&
    (v.padding === undefined ||
      (typeof v.padding === 'number' &&
        Number.isFinite(v.padding) &&
        v.padding >= 0)) &&
    Object.keys(v).every((k) => ['mode', 'padding'].includes(k))
  );
}

export function isYAxisConfig(v: unknown): v is YAxisConfig {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const value = v as Record<string, unknown>;
  if (Object.keys(value).some((key) => !['mode', 'domain'].includes(key)))
    return false;
  if (value.mode === 'auto' || value.mode === 'sync')
    return value.domain === undefined;
  return (
    value.mode === 'fixed' &&
    Array.isArray(value.domain) &&
    value.domain.length === 2 &&
    isNumericDomainPolicy({
      mode: 'fixed',
      min: value.domain[0],
      max: value.domain[1],
    })
  );
}
