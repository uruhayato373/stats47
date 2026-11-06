import { joinColorPolicy, type ColorGrain, type ColorPolicyRow, type MetricPresentation } from '@stats47/types';

import ledger from '../../../data/ranking/color-policies/policies.json';
import type { VisualizationConfig } from './types';

const rows = new Map((ledger.policies as ColorPolicyRow[]).map((row) => [`${row.metricKey}|${row.grain}`, row]));

export const colorPolicyRowOf = (metricKey: string, grain: ColorGrain) => rows.get(`${metricKey}|${grain}`);

/**
 * The colour a chart of this metric uses: the metric's definition joined with its ledger row. Definitions
 * hold what a person decides (hue, reference value) and the ledger what the values decide (steps). Every
 * medium reads this, so a metric looks the same on the site, in note and on SNS.
 */
export function metricPresentation(metric: { key: string; visualization: VisualizationConfig }, grain: ColorGrain = 'prefecture'): MetricPresentation {
  return joinColorPolicy(metric.visualization, colorPolicyRowOf(metric.key, grain));
}
