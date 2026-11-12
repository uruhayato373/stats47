import data from '../../../../data/themes/japan/derived-metric-decisions.json';
import type { JapanAvailability } from "./types";

type DerivedAvailability = Extract<
  JapanAvailability,
  { status: "derived-additive" | "derived-ratio" }
>;
type UnsupportedAvailability = Extract<JapanAvailability, { status: "unsupported" }>;

interface JapanDerivedMetricDecisionBase {
  readonly metricKey: string;
  readonly themeKey: string;
  readonly observedAt: `${number}-${number}-${number}`;
  readonly evidence: readonly string[];
}

export interface AdoptedJapanDerivedMetricDecision
  extends JapanDerivedMetricDecisionBase {
  readonly verdict: "adopted";
  readonly availability: DerivedAvailability;
  /** `app/stats/<sourceMetricKey>/values.json` をrecipe入力にする。 */
  readonly sourceMetricKey: string;
}

export interface RejectedJapanDerivedMetricDecision
  extends JapanDerivedMetricDecisionBase {
  readonly verdict: "rejected";
  readonly availability: UnsupportedAvailability;
}

export type JapanDerivedMetricDecision =
  | AdoptedJapanDerivedMetricDecision
  | RejectedJapanDerivedMetricDecision;

/**
 * 全国値を都道府県から導く指標の採否 (恒久判断)。記録の正本は台帳 `themes.japan-derived-metrics`
 * (data/themes/japan/derived-metric-decisions.json + Schema。採用条件は Schema の description)。
 * 形は Schema が検査するので、ここは型を付けて export するだけ。
 */
export const JAPAN_DERIVED_METRIC_DECISIONS =
  data.decisions as unknown as readonly JapanDerivedMetricDecision[];

export function getJapanDerivedMetricDecision(
  metricKey: string,
): JapanDerivedMetricDecision | undefined {
  return JAPAN_DERIVED_METRIC_DECISIONS.find((decision) => decision.metricKey === metricKey);
}
