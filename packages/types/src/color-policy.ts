import type { ColorClassification } from './color-classification';

/** Tukey's "far out" fence: a value this many interquartile ranges past a quartile is an outlier. */
const FAR_OUT_FENCE = 3;
const SIGNED_STEPS = 3;
const CLASSES = 5;
const MIN_VALUES_FOR_FENCE = 4;
const SIGNED_SCHEME = 'interpolateRdBu';

/** The areas a colour was worked out over. The same metric can lean differently per set. */
export const COLOR_GRAINS = ['prefecture', 'municipality-merged', 'municipality-split'] as const;
export type ColorGrain = (typeof COLOR_GRAINS)[number];

export interface ColorPolicy {
  colorSchemeType: 'sequential' | 'diverging';
  classification: ColorClassification;
}

/** One row of the colour ledger (data/ranking/color-policies): the result, not the reasoning. */
export interface ColorPolicyRow extends ColorPolicy {
  metricKey: string;
  grain: ColorGrain;
  /** Set when the values overturn the metric's own scheme: one-way metrics with values on both sides of zero. */
  colorScheme?: string;
  /** The year the values came from. */
  year: string;
  areaCount: number;
}

/** What a colour decision reads from a metric's definition. */
interface AuthoredColor {
  colorScheme?: string | null;
  colorSchemeType?: string;
  classification?: ColorClassification;
  divergingMidpoint?: unknown;
}

/** Linear interpolation between order statistics; `sorted` is ascending. */
function quantile(sorted: readonly number[], p: number) {
  const at = (sorted.length - 1) * p;
  const low = Math.floor(at);
  const high = Math.min(low + 1, sorted.length - 1);
  return sorted[low] + (sorted[high] - sorted[low]) * (at - low);
}

/** True when a value lies beyond the far-out fence, so a linear colour ramp would wash out the rest. */
export function hasFarOutValue(values: readonly number[]) {
  if (values.length < MIN_VALUES_FOR_FENCE) return false;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const fence = FAR_OUT_FENCE * (q3 - q1);
  return sorted[0] < q1 - fence || sorted[sorted.length - 1] > q3 + fence;
}

const twoFigures = (value: number) => Number(value.toPrecision(2));

/** Five steps centred on zero, following the sizes of the values rather than the single largest one. */
export function signedThresholds(values: readonly number[]) {
  const sizes = values.map(Math.abs).sort((a, b) => a - b);
  const inner = twoFigures(quantile(sizes, 1 / SIGNED_STEPS));
  const outer = twoFigures(quantile(sizes, 2 / SIGNED_STEPS));
  return inner > 0 && outer > inner ? [-outer, -inner, inner, outer] : null;
}

/**
 * The colour of a value map, from the values alone. Values on both sides of zero take a diverging scheme,
 * others a sequential one. A continuous ramp is the default, and stepped classes replace it only when a
 * far-out value would leave the other areas in one colour. Two-point change maps have fixed bins of their
 * own and do not come through here.
 */
export function colorPolicyOf(values: readonly number[]): ColorPolicy {
  const signed = values.some((v) => v < 0) && values.some((v) => v > 0);
  const stepped = hasFarOutValue(values);
  if (!signed) {
    return { colorSchemeType: 'sequential', classification: stepped ? { method: 'quantile', classes: CLASSES } : { method: 'continuous' } };
  }
  const thresholds = stepped ? signedThresholds(values) : null;
  return { colorSchemeType: 'diverging', classification: thresholds ? { method: 'threshold', thresholds } : { method: 'continuous' } };
}

const hasOwnCentre = (authored: AuthoredColor) =>
  authored.colorSchemeType === 'diverging' && authored.divergingMidpoint !== undefined && authored.divergingMidpoint !== 'zero';

/** A metric's definition plus its values give one ledger row. A metric centred on its own reference keeps it. */
export function colorPolicyRow(metricKey: string, grain: ColorGrain, authored: AuthoredColor, year: string, values: readonly number[]): ColorPolicyRow {
  const base = { metricKey, grain, year, areaCount: values.length };
  if (hasOwnCentre(authored)) {
    return { ...base, colorSchemeType: 'diverging', classification: hasFarOutValue(values) ? { method: 'equal-interval', classes: CLASSES } : { method: 'continuous' } };
  }
  const policy = colorPolicyOf(values);
  const overturned = policy.colorSchemeType === 'diverging' && authored.colorSchemeType !== 'diverging';
  return { ...base, ...policy, ...(overturned ? { colorScheme: SIGNED_SCHEME } : {}) };
}

/**
 * The join of a metric's definition and its ledger row: the one presentation charts read. Thresholds written
 * in the definition win, and a metric with no row yet (no values) falls back to the continuous ramp.
 */
export function joinColorPolicy<T extends AuthoredColor>(authored: T, row?: Pick<ColorPolicyRow, 'colorSchemeType' | 'classification' | 'colorScheme'>): Omit<T, 'classification'> & { classification: ColorClassification } {
  if (authored.classification?.method === 'threshold') return { ...authored, classification: authored.classification };
  if (!row) return { ...authored, classification: { method: 'continuous' } };
  const overturned = row.colorScheme !== undefined;
  return {
    ...authored,
    classification: row.classification,
    ...(overturned ? { colorScheme: row.colorScheme, colorSchemeType: row.colorSchemeType, divergingMidpoint: 'zero' } : {}),
  };
}

/** For a chart whose values have no ledger row: an article's own data. Same decision, worked out on the spot. */
export function applyColorPolicy<T extends AuthoredColor>(authored: T, values: readonly number[]) {
  return joinColorPolicy(authored, colorPolicyRow('', 'prefecture', authored, '', values));
}
