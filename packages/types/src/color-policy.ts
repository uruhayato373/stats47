import type { ColorClassification } from './color-classification';

/** Tukey's "far out" fence: a value this many interquartile ranges past a quartile is an outlier. */
const FAR_OUT_FENCE = 3;
const SIGNED_STEPS = 3;
const CLASSES = 5;

export interface ColorPolicy {
  colorSchemeType: 'sequential' | 'diverging';
  classification: ColorClassification;
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
  const stepped = values.length >= 4 && hasFarOutValue(values);
  if (!signed) {
    return { colorSchemeType: 'sequential', classification: stepped ? { method: 'quantile', classes: CLASSES } : { method: 'continuous' } };
  }
  const thresholds = stepped ? signedThresholds(values) : null;
  return { colorSchemeType: 'diverging', classification: thresholds ? { method: 'threshold', thresholds } : { method: 'continuous' } };
}

const SIGNED_SCHEME = 'interpolateRdBu';

/**
 * A metric's colour encoding with the steps worked out from its values. Written thresholds stay as they
 * are, and a metric centred on its own reference (a price index around 100) keeps that centre.
 */
export function applyColorPolicy<T extends { colorScheme?: string | null; colorSchemeType?: string; classification?: ColorClassification; divergingMidpoint?: unknown }>(encoding: T, values: readonly number[]): T {
  if (encoding.classification?.method === 'threshold') return encoding;
  const policy = colorPolicyOf(values);
  const ownCentre = encoding.colorSchemeType === 'diverging' && encoding.divergingMidpoint !== undefined && encoding.divergingMidpoint !== 'zero';
  if (ownCentre) return values.length >= 4 && hasFarOutValue(values) ? encoding : { ...encoding, classification: { method: 'continuous' } };
  if (policy.colorSchemeType === 'diverging' && encoding.colorSchemeType !== 'diverging')
    return { ...encoding, ...policy, colorScheme: SIGNED_SCHEME, divergingMidpoint: 'zero' };
  return { ...encoding, classification: policy.classification };
}
