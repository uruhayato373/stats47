import policy from '../../../data/correlation/selection-policy.json';

export const CORRELATION_SELECTION_POLICY = policy;
export type CorrelationDirection = keyof typeof policy.groups;
export const CORRELATION_DIRECTIONS = Object.keys(policy.groups) as CorrelationDirection[];
export type CorrelationGroups<T> = Record<CorrelationDirection, T[]>;

export function correlationDirection(score: number): CorrelationDirection | null {
  if (!Number.isFinite(score) || Math.abs(score) > 1 || score === 0) return null;
  return score > 0 ? 'positive' : 'negative';
}

/** 同率は指標ID順。入力順・locale・画面幅で採用される指標を変えない。 */
export function compareCorrelation(a: { rankingKey: string; populationAdjustedR: number }, b: { rankingKey: string; populationAdjustedR: number }): number {
  return Math.abs(b.populationAdjustedR) - Math.abs(a.populationAdjustedR)
    || (a.rankingKey < b.rankingKey ? -1 : a.rankingKey > b.rankingKey ? 1 : 0);
}

export function selectCorrelationGroups<T extends { rankingKey: string; populationAdjustedR: number }>(items: readonly T[]): CorrelationGroups<T> {
  const groups: CorrelationGroups<T> = { positive: [], negative: [] };
  const seen = new Set<string>();
  for (const item of [...items].sort(compareCorrelation)) {
    const direction = correlationDirection(item.populationAdjustedR);
    if (!direction || seen.has(item.rankingKey)) continue;
    seen.add(item.rankingKey);
    if (groups[direction].length < policy.groups[direction].limit) groups[direction].push(item);
  }
  return groups;
}
