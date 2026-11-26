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

/**
 * 一覧の中で「同じもの」とみなす単位。方針が dedupeByTitle なら題名 (同じ題名の指標が 2 回並ぶのを防ぐ)、
 * 題名を持たない入力と方針が無効のときは指標のキー。選定と、生成の候補の上限管理が同じ関数を使う。
 */
export function correlationIdentity(item: { rankingKey: string; title?: string | null }): string {
  return policy.dedupeByTitle && item.title ? `title:${item.title}` : `key:${item.rankingKey}`;
}

/** 地域の単位が違う組か (片方だけが県庁所在市の値)。家計調査の品目が県全体の指標の一覧を埋めていた (2026-11-26) */
export function isCrossGrainPair(aIsCapitalCityValue: boolean, bIsCapitalCityValue: boolean): boolean {
  return policy.excludeCrossGrain && aIsCapitalCityValue !== bIsCapitalCityValue;
}

/** ほぼ同じデータの組か (同じ主出典の調査で、score が閾値以上。訪問者数と同じ調査の回答数など) */
export function isNearDuplicatePair(sharesPrimarySurvey: boolean, score: number): boolean {
  return sharesPrimarySurvey && Math.abs(score) >= policy.nearDuplicate.sameSurveyMinAbsR;
}

export function selectCorrelationGroups<T extends { rankingKey: string; populationAdjustedR: number; title?: string | null }>(items: readonly T[]): CorrelationGroups<T> {
  const groups: CorrelationGroups<T> = { positive: [], negative: [] };
  const seen = new Set<string>();
  for (const item of [...items].sort(compareCorrelation)) {
    const direction = correlationDirection(item.populationAdjustedR);
    const identity = correlationIdentity(item);
    if (!direction || seen.has(identity)) continue;
    seen.add(identity);
    if (groups[direction].length < policy.groups[direction].limit) groups[direction].push(item);
  }
  return groups;
}
